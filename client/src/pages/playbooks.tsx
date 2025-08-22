import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CXRescueInterventions from "@/components/dashboard/cx-rescue-interventions";

export default function Playbooks() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    type: "Executive Check-in",
    priority: "medium",
    assignedCsm: "Sarah Chen",
    description: "",
    nextAction: "",
    notes: "",
  });
  

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interventions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/interventions"],
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const createInterventionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/interventions", {
        customerId: parseInt(data.customerId),
        type: data.type,
        priority: data.priority,
        assignedCsm: data.assignedCsm,
        description: data.description,
        nextAction: data.nextAction,
        notes: data.notes,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({
        title: "Playbook Created",
        description: "New intervention has been successfully created.",
      });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateInterventionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/interventions/${id}`, updates);
    },
    onMutate: async ({ id, updates }: { id: number; updates: any }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/interventions"] });
      const previous = queryClient.getQueryData<any[]>(["/api/interventions"]);
      queryClient.setQueryData<any[]>(["/api/interventions"], (old) => {
        if (!old) return old as any;
        return old.map((i: any) => (i.id === id ? { ...i, ...updates } : i));
      });
      return { previous } as { previous?: any[] };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/interventions"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
    onSuccess: () => {
      toast({
        title: "Playbook Updated",
        description: "Intervention has been successfully updated.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      type: "Executive Check-in",
      priority: "medium",
      assignedCsm: "Sarah Chen",
      description: "",
      nextAction: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }
    createInterventionMutation.mutate(formData);
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer ? customer.name : `Customer ${customerId}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "fas fa-exclamation-triangle text-red-500";
      case "medium":
        return "fas fa-minus-circle text-yellow-500";
      case "low":
        return "fas fa-info-circle text-blue-500";
      default:
        return "fas fa-circle text-gray-500";
    }
  };

  const getPlaybookIcon = (type: string) => {
    switch (type) {
      case "Executive Check-in":
        return "fas fa-user-tie";
      case "Product Training":
        return "fas fa-graduation-cap";
      case "Payment Recovery":
        return "fas fa-credit-card";
      case "Special Offer":
        return "fas fa-gift";
      case "Support Escalation":
        return "fas fa-headset";
      case "Engagement Boost":
        return "fas fa-rocket";
      default:
        return "fas fa-play-circle";
    }
  };

  const playbookTemplates = [
    {
      id: 1,
      name: "CX Rescue",
      description: "High-touch intervention for critical churn risk customers",
      icon: "fas fa-life-ring",
      color: "red",
      successRate: 85,
      avgDuration: "3-5 days",
      steps: ["Executive outreach", "Root cause analysis", "Custom solution", "Follow-up"],
    },
    {
      id: 2,
      name: "Payment Recovery",
      description: "Automated workflow for payment failures and billing issues",
      icon: "fas fa-credit-card",
      color: "orange",
      successRate: 72,
      avgDuration: "1-2 days",
      steps: ["Payment notification", "Personal outreach", "Payment assistance", "Success tracking"],
    },
    {
      id: 3,
      name: "Engagement Boost",
      description: "Re-engagement campaign for inactive customers",
      icon: "fas fa-rocket",
      color: "blue",
      successRate: 68,
      avgDuration: "1 week",
      steps: ["Usage analysis", "Feature training", "Success milestones", "Regular check-ins"],
    },
    {
      id: 4,
      name: "Product Training",
      description: "Comprehensive onboarding for underutilized features",
      icon: "fas fa-graduation-cap",
      color: "green",
      successRate: 78,
      avgDuration: "2 weeks",
      steps: ["Feature audit", "Training sessions", "Implementation support", "Performance review"],
    },
  ];

  const interventionTypes = [
    "Executive Check-in",
    "Product Training",
    "Special Offer",
    "Support Escalation",
    "Payment Recovery",
    "Engagement Boost",
  ];

  const csms = [
    "Sarah Chen",
    "Mike Johnson",
    "Lisa Wang",
    "David Kim",
    "Emma Thompson",
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Retention Playbooks</h1>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i>
                Create Intervention
              </Button>
            </div>
            <p className="text-gray-600">Automated and manual intervention workflows to reduce customer churn</p>
          </div>

          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="cx-rescue">CX Rescue</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              {/* Playbook Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {playbookTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-${template.color}-100 rounded-lg flex items-center justify-center`}>
                          <i className={`${template.icon} text-${template.color}-600 text-xl`}></i>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {template.successRate}% success
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <div className="text-xs text-gray-500">
                        <p>Duration: {template.avgDuration}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              {/* Active Interventions */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Interventions ({interventions?.filter((i: any) => i.status === 'active').length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interventions?.filter((i: any) => i.status === 'active').map((intervention: any) => (
                      <div key={intervention.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className={`${getPlaybookIcon(intervention.type)} text-blue-600`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-gray-900">{intervention.type}</h3>
                                <i className={getPriorityIcon(intervention.priority)}></i>
                                <Badge className={getStatusStyle(intervention.status)}>
                                  {intervention.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                Customer: <span className="font-medium">{getCustomerName(intervention.customerId)}</span>
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                CSM: <span className="font-medium">{intervention.assignedCsm}</span>
                              </p>
                              <p className="text-sm text-gray-600">{intervention.description}</p>
                              {intervention.nextAction && (
                                <p className="text-sm text-blue-600 mt-2">
                                  Next: {intervention.nextAction}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPlaybook(intervention)}
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateInterventionMutation.mutate({
                                id: intervention.id,
                                updates: { status: "completed", completedAt: new Date().toISOString() }
                              })}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              {/* Completed Interventions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Completions ({interventions?.filter((i: any) => i.status === 'completed').length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interventions?.filter((i: any) => i.status === 'completed').slice(0, 5).map((intervention: any) => (
                      <div key={intervention.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-check text-green-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{intervention.type}</p>
                            <p className="text-sm text-gray-600">{getCustomerName(intervention.customerId)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{intervention.assignedCsm}</p>
                          <p className="text-xs text-gray-500">
                            {intervention.completedAt && new Date(intervention.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              {/* Create Intervention Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Intervention</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Customer</Label>
                      <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} - {customer.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Intervention Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interventionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="csm">Assigned CSM</Label>
                      <Select value={formData.assignedCsm} onValueChange={(value) => setFormData({ ...formData, assignedCsm: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {csms.map((csm) => (
                            <SelectItem key={csm} value={csm}>
                              {csm}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the intervention..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="nextAction">Next Action</Label>
                      <Input
                        id="nextAction"
                        value={formData.nextAction}
                        onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                        placeholder="What's the next step?"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any specific notes or context..."
                        className="h-20"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createInterventionMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {createInterventionMutation.isPending ? "Creating..." : "Create Intervention"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cx-rescue" className="space-y-6">
              {/* CX Rescue Interventions */}
              <CXRescueInterventions onNewIntervention={() => setIsCreateOpen(true)} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Intervention Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Intervention</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - {customer.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Intervention Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interventionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="csm">Assigned CSM</Label>
              <Select value={formData.assignedCsm} onValueChange={(value) => setFormData({ ...formData, assignedCsm: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {csms.map((csm) => (
                    <SelectItem key={csm} value={csm}>
                      {csm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the intervention..."
              />
            </div>

            <div>
              <Label htmlFor="nextAction">Next Action</Label>
              <Input
                id="nextAction"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                placeholder="What's the next step?"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any specific notes or context..."
                className="h-20"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInterventionMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createInterventionMutation.isPending ? "Creating..." : "Create Intervention"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Intervention Modal */}
      <Dialog open={!!selectedPlaybook} onOpenChange={(open) => { if (!open) setSelectedPlaybook(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Intervention Details</DialogTitle>
          </DialogHeader>
          {selectedPlaybook && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedPlaybook.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1 inline-flex">
                    <Badge className={getStatusStyle(selectedPlaybook.status)}>{selectedPlaybook.status}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{getCustomerName(selectedPlaybook.customerId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned CSM</p>
                  <p className="font-medium text-gray-900">{selectedPlaybook.assignedCsm}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedPlaybook.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium text-gray-900">{selectedPlaybook.dueDate ? new Date(selectedPlaybook.dueDate).toLocaleString() : '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-sm text-gray-900">{selectedPlaybook.description || '—'}</p>
              </div>
              {selectedPlaybook.nextAction && (
                <div>
                  <p className="text-sm text-gray-600">Next Action</p>
                  <p className="text-sm text-gray-900">{selectedPlaybook.nextAction}</p>
                </div>
              )}
              {selectedPlaybook.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900">{selectedPlaybook.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedPlaybook(null)}>Close</Button>
                {selectedPlaybook.status !== 'completed' && (
                  <Button onClick={() => {
                    updateInterventionMutation.mutate(
                      { id: selectedPlaybook.id, updates: { status: 'completed', completedAt: new Date().toISOString() } },
                      {
                        onSuccess: () => setSelectedPlaybook(null),
                      }
                    );
                  }}>Mark Completed</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}