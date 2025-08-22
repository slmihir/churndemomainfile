import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ColumnHelp } from "@/components/ui/column-help";
import { HoverCopy } from "@/lib/tooltips";
import { Textarea } from "@/components/ui/textarea";

export default function Customers() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [csvText, setCsvText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { toast } = useToast();
  const query = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Get ML predictions for all customers
  const { data: mlPredictions, isLoading: mlLoading } = useQuery({
    queryKey: ["/api/ml/batch-predict", (customers as any[])?.map((c: any) => c.id)],
    queryFn: async () => {
      if (!(customers as any[])?.length) return { predictions: [] };
      const customerIds = (customers as any[]).map((c: any) => c.id);
      const response = await apiRequest("POST", "/api/ml/batch-predict", { customerIds });
      return response.json();
    },
    enabled: !!(customers as any[])?.length,
  });

  // Get RCA data for selected customer
  const { data: rcaData, isLoading: rcaLoading } = useQuery({
    queryKey: ["/rca", selectedCustomer?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/rca/${selectedCustomer.id}?problems=premium_increase&problems=claim_denied&problems=service_issues`);
      return response.json();
    },
    enabled: !!selectedCustomer?.id,
  });

  // Helper function to get ML churn risk for a customer
  const getMLChurnRisk = (customerId: number): number => {
    const prediction = mlPredictions?.predictions?.find((p: any) => p.customerId === customerId);
    return prediction ? (prediction.churnProbability * 100) : 0;
  };

  // Helper function to get ML risk level for a customer
  const getMLRiskLevel = (customerId: number): string => {
    const prediction = mlPredictions?.predictions?.find((p: any) => p.customerId === customerId);
    return prediction?.riskLevel || 'unknown';
  };

  const predictChurnMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest("POST", "/api/v1/churn/predict", { customerId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Churn Prediction Complete",
        description: `Customer has ${data.churnProbability}% churn risk (${data.riskLevel} risk)`,
      });
      // Invalidate queries to refresh the ML predictions
      query.invalidateQueries({ queryKey: ["/api/ml/batch-predict"] });
    },
  });

  const filteredCustomers = (customers as any[])?.filter((customer: any) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Use ML predictions for risk filtering, fallback to static data if ML not loaded
    const risk = mlPredictions ? getMLChurnRisk(customer.id) : parseFloat(customer.churnRisk);
    const matchesRisk = riskFilter === "all" ||
                       (riskFilter === "high" && risk >= 80) ||
                       (riskFilter === "medium" && risk >= 50 && risk < 80) ||
                       (riskFilter === "low" && risk < 50);
    
    return matchesSearch && matchesRisk;
  }) || [];

  const getRiskLevel = (risk: number) => {
    if (risk >= 80) return { level: "High", style: "bg-red-100 text-red-800" };
    if (risk >= 50) return { level: "Medium", style: "bg-yellow-100 text-yellow-800" };
    return { level: "Low", style: "bg-green-100 text-green-800" };
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatMRR = (mrr: string) => {
    return `$${parseFloat(mrr).toLocaleString()}`;
  };

  // reuse the same query client instance

  const importSheet = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/import/customers/google-sheets", { sheetUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Import complete", description: "Google Sheet imported successfully." });
      query.invalidateQueries({ queryKey: ["/api/customers"] });
      setSheetUrl("");
    },
    onError: (e: any) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const importCsv = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/import/customers/csv", { csv: csvText });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Import complete", description: "CSV imported successfully." });
      query.invalidateQueries({ queryKey: ["/api/customers"] });
      setCsvText("");
    },
    onError: (e: any) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const exportCsv = () => {
    const headers = [
      "name","email","company","plan","mrr","signupDate","lastLogin","healthScore","churnRisk","npsScore","supportTickets"
    ];
    const rows = filteredCustomers.map((c: any) => [
      c.name,
      c.email,
      c.company,
      c.plan,
      c.mrr,
      new Date(c.signupDate).toISOString(),
      c.lastLogin ? new Date(c.lastLogin).toISOString() : "",
      c.healthScore,
      c.churnRisk,
      c.npsScore ?? "",
      c.supportTickets,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCustomerDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Customer Management
              {mlLoading && (
                <span className="ml-3 text-sm text-blue-600 font-normal">
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Loading ML predictions...
                </span>
              )}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search customers, companies, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv}>
                <i className="fas fa-file-csv mr-2" /> Export CSV
              </Button>
            </div>

            {/* Importers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import from Google Sheets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Paste Google Sheet link (view access)"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => importSheet.mutate()} disabled={!sheetUrl || importSheet.isPending}>
                      {importSheet.isPending ? "Importing..." : "Import Sheet"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import CSV</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Paste CSV contents here (first row headers)"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="h-24"
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => importCsv.mutate()} disabled={!csvText || importCsv.isPending}>
                      {importCsv.isPending ? "Importing..." : "Import CSV"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer List ({filteredCustomers.length} customers)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">Customer
                          <ColumnHelp title={HoverCopy.customerTitle} body={HoverCopy.customerBody} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">Plan
                          <ColumnHelp title={HoverCopy.planTitle} body={HoverCopy.planBody} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">
                          MRR
                          <ColumnHelp title={HoverCopy.mrrTitle} body={HoverCopy.mrrBody} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">Health Score
                          <ColumnHelp title={HoverCopy.healthTitle} body={HoverCopy.healthBody} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">Churn Risk
                          <ColumnHelp title={HoverCopy.pChurnTitle} body={HoverCopy.pChurnBody("v1")} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <div className="inline-flex items-center">Last Login
                          <ColumnHelp title={HoverCopy.lastLoginTitle} body={HoverCopy.lastLoginBody} />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer: any) => {
                      // Use ML predictions for display, fallback to static data
                      const mlRisk = mlPredictions ? getMLChurnRisk(customer.id) : parseFloat(customer.churnRisk);
                      const riskInfo = getRiskLevel(mlRisk);
                      
                      return (
                        <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.email}</p>
                              <p className="text-xs text-gray-500">{customer.company}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">{customer.plan}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium">{formatMRR(customer.mrr)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`font-medium ${getHealthScoreColor(customer.healthScore)}`}>
                              {customer.healthScore}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={riskInfo.style}>
                              {mlRisk.toFixed(1)}% {riskInfo.level}
                              {mlPredictions && (
                                <span className="ml-1 text-xs opacity-75">(ML)</span>
                              )}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {customer.lastLogin ? formatDate(customer.lastLogin) : "Never"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCustomerDetails(customer)}
                              >
                                <i className="fas fa-eye mr-1"></i>
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => predictChurnMutation.mutate(customer.id)}
                                disabled={predictChurnMutation.isPending}
                              >
                                <i className="fas fa-chart-line mr-1"></i>
                                Predict
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Customer Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details: {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="rca">Root Causes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Company</label>
                        <p className="text-gray-900">{selectedCustomer.company}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Plan</label>
                        <p className="text-gray-900">{selectedCustomer.plan}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Signup Date</label>
                        <p className="text-gray-900">{formatDate(selectedCustomer.signupDate)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue & Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</label>
                        <p className="text-2xl font-bold text-green-600">{formatMRR(selectedCustomer.mrr)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Login</label>
                        <p className="text-gray-900">
                          {selectedCustomer.lastLogin ? formatDate(selectedCustomer.lastLogin) : "Never"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Status</label>
                        <Badge className={selectedCustomer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {selectedCustomer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="risk" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Churn Risk</label>
                        <p className={`text-2xl font-bold ${
                          parseFloat(selectedCustomer.churnRisk) >= 80 ? "text-red-600" :
                          parseFloat(selectedCustomer.churnRisk) >= 50 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {selectedCustomer.churnRisk}%
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Health Score</label>
                        <p className={`text-xl font-medium ${getHealthScoreColor(selectedCustomer.healthScore)}`}>
                          {selectedCustomer.healthScore}%
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">NPS Score</label>
                        <p className="text-gray-900">{selectedCustomer.npsScore || "Not available"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Support Tickets</label>
                        <p className="text-gray-900">{selectedCustomer.supportTickets}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="rca" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Root Cause Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rcaLoading ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    ) : rcaData?.items ? (
                      <div className="space-y-6">
                        {rcaData.items.map((item: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                              {item.problem.replace(/_/g, ' ')}
                            </h4>
                            
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-600 mb-2">Likely Causes:</h5>
                              <ul className="space-y-1">
                                {item.likely_causes.map((cause: string, causeIndex: number) => (
                                  <li key={causeIndex} className="text-sm text-gray-700 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {item.domain_overlays && item.domain_overlays.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-600 mb-2">Domain Insights:</h5>
                                <ul className="space-y-1">
                                  {item.domain_overlays.map((overlay: string, overlayIndex: number) => (
                                    <li key={overlayIndex} className="text-sm text-gray-700 flex items-start">
                                      <span className="text-green-500 mr-2">•</span>
                                      {overlay}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No root cause analysis available for this customer.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}