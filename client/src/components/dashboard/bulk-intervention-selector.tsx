import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Target, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BulkInterventionSelectorProps {
  onClose: () => void;
}

export default function BulkInterventionSelector({ onClose }: BulkInterventionSelectorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [interventionType, setInterventionType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: mlPredictions } = useQuery({
    queryKey: ["/api/ml/batch-predict", users?.map((u: any) => u.id)],
    queryFn: async () => {
      if (!users?.length) return { predictions: [] };
      const userIds = users.map((u: any) => u.id);
      const response = await apiRequest("POST", "/api/ml/batch-predict", { customerIds: userIds });
      return response.json();
    },
    enabled: !!users?.length,
  });

  const applyBulkInterventionMutation = useMutation({
    mutationFn: async ({ userIds, interventionType }: { userIds: number[]; interventionType: string }) => {
      const response = await apiRequest("POST", "/api/interventions/bulk-apply", {
        userIds,
        interventionType,
        notes: `Bulk intervention: ${interventionType} applied to ${userIds.length} users`
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Intervention Applied",
        description: `Successfully applied ${interventionType} to ${data.updated} users.`,
      });
      setSelectedUsers([]);
      setInterventionType("");
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Intervention Failed",
        description: error.message || "Failed to apply bulk intervention",
        variant: "destructive",
      });
    },
  });

  const getMLChurnRisk = (userId: number): number => {
    const prediction = mlPredictions?.predictions?.find((p: any) => p.customerId === userId);
    return prediction ? parseFloat(prediction.churnProbability) : 0;
  };

  const getMLRiskLevel = (userId: number): string => {
    const prediction = mlPredictions?.predictions?.find((p: any) => p.customerId === userId);
    return prediction?.riskLevel || 'low';
  };

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const risk = mlPredictions ? getMLChurnRisk(user.id) : parseFloat(user.churnRisk);
    const matchesRisk = riskFilter === "all" || 
                       (riskFilter === "high" && risk >= 80) ||
                       (riskFilter === "medium" && risk >= 50 && risk < 80) ||
                       (riskFilter === "low" && risk < 50);
    
    return matchesSearch && matchesRisk;
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((u: any) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleApplyBulkIntervention = () => {
    if (!interventionType || selectedUsers.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select an intervention type and at least one user.",
        variant: "destructive",
      });
      return;
    }
    
    applyBulkInterventionMutation.mutate({
      userIds: selectedUsers,
      interventionType
    });
  };

  const getRiskStyle = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const interventionTypes = [
    { value: "agent_retention_call", label: "Agent Retention Call", cost: 200, successRate: 72 },
    { value: "personalized_policy_review", label: "Personalized Policy Review", cost: 150, successRate: 65 },
    { value: "premium_adjustment_offer", label: "Premium Adjustment Offer", cost: 300, successRate: 58 },
    { value: "claims_expedite_service", label: "Claims Expedite Service", cost: 250, successRate: 78 },
    { value: "loyalty_rewards_program", label: "Loyalty Rewards Program", cost: 180, successRate: 62 },
    { value: "policy_bundle_consultation", label: "Policy Bundle Consultation", cost: 220, successRate: 68 },
    { value: "executive_account_review", label: "Executive Account Review", cost: 400, successRate: 85 },
    { value: "digital_platform_training", label: "Digital Platform Training", cost: 120, successRate: 45 },
    { value: "dedicated_claims_manager", label: "Dedicated Claims Manager", cost: 350, successRate: 80 },
    { value: "risk_assessment_appeal", label: "Risk Assessment Appeal", cost: 180, successRate: 55 },
    { value: "payment_plan_restructure", label: "Payment Plan Restructure", cost: 100, successRate: 88 },
    { value: "coverage_gap_analysis", label: "Coverage Gap Analysis", cost: 160, successRate: 70 },
  ];

  const selectedIntervention = interventionTypes.find(i => i.value === interventionType);
  const totalCost = selectedIntervention ? selectedIntervention.cost * selectedUsers.length : 0;
  const expectedSuccess = selectedIntervention ? Math.round(selectedIntervention.successRate * selectedUsers.length / 100) : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Bulk Intervention Selector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high">High Risk Only</SelectItem>
              <SelectItem value="medium">Medium Risk Only</SelectItem>
              <SelectItem value="low">Low Risk Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Selection */}
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">
                  {selectedUsers.length} of {filteredUsers.length} users selected
                </span>
              </div>
              <Badge variant="outline">
                {filteredUsers.filter((u: any) => {
                  const risk = mlPredictions ? getMLChurnRisk(u.id) : parseFloat(u.churnRisk);
                  return risk >= 80;
                }).length} High Risk
              </Badge>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredUsers.map((user: any) => {
              const risk = mlPredictions ? getMLChurnRisk(user.id) : parseFloat(user.churnRisk);
              const riskLevel = mlPredictions ? getMLRiskLevel(user.id) : 
                               risk >= 80 ? 'high' : risk >= 50 ? 'medium' : 'low';
              const isSelected = selectedUsers.includes(user.id);
              
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 border-b hover:bg-gray-50">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.company}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getRiskStyle(riskLevel)} font-medium`}>
                          {risk.toFixed(1)}% {riskLevel}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">${user.mrr}/month</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intervention Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Select Intervention Type</h3>
          <Select value={interventionType} onValueChange={setInterventionType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose intervention type..." />
            </SelectTrigger>
            <SelectContent>
              {interventionTypes.map((intervention) => (
                <SelectItem key={intervention.value} value={intervention.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{intervention.label}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ${intervention.cost} • {intervention.successRate}% success
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedIntervention && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{selectedIntervention.label}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Cost per User</p>
                  <p className="font-semibold text-blue-900">${selectedIntervention.cost}</p>
                </div>
                <div>
                  <p className="text-blue-700">Success Rate</p>
                  <p className="font-semibold text-blue-900">{selectedIntervention.successRate}%</p>
                </div>
                <div>
                  <p className="text-blue-700">Expected Success</p>
                  <p className="font-semibold text-blue-900">{expectedSuccess} of {selectedUsers.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Analysis */}
        {selectedUsers.length > 0 && selectedIntervention && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Cost Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Total Investment:</span>
                <span className="font-semibold">${totalCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Users Targeted:</span>
                <span className="font-semibold">{selectedUsers.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyBulkIntervention}
            disabled={!interventionType || selectedUsers.length === 0 || applyBulkInterventionMutation.isPending}
          >
            {applyBulkInterventionMutation.isPending ? "Applying..." : `Apply to ${selectedUsers.length} Users`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
