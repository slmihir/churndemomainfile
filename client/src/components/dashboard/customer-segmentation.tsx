import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ClusterSummary = {
  cluster_id: number;
  count: number;
  percentage: number;
  avg_churn_probability?: number;
  high_risk_count?: number;
  high_risk_percentage?: number;
  avg_mrr?: number;
  avg_age?: number;
  primary_gender?: string;
  primary_region?: string;
};

type SegmentationData = {
  clusters: ClusterSummary[];
  message?: string;
};

export default function CustomerSegmentation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCluster, setSelectedCluster] = useState<ClusterSummary | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isViewingMembers, setIsViewingMembers] = useState(false);
  const [isApplyingIntervention, setIsApplyingIntervention] = useState(false);
  const [interventionType, setInterventionType] = useState("agent_retention_call");

  // Get segmentation summary
  const { data: segmentation, isLoading, error } = useQuery<SegmentationData>({
    queryKey: ["/segments/summary"],
    retry: 1,
  });

  // Get cluster members when viewing
  const { data: clusterMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/customers/by-segment", selectedCluster?.cluster_id],
    queryFn: async () => {
      if (!selectedCluster) return null;
      const response = await apiRequest("GET", `/customers/by-segment/${selectedCluster.cluster_id}?limit=50`);
      return response.json();
    },
    enabled: isViewingMembers && !!selectedCluster,
  });

  // Train segmentation mutation
  const trainMutation = useMutation({
    mutationFn: async (k: number = 5) => {
      const response = await apiRequest("POST", `/segments/train?k=${k}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Segmentation Training Complete", description: "Customer segments have been updated." });
      setIsTraining(false);
    },
    onError: (error: any) => {
      toast({ title: "Training Failed", description: error.message, variant: "destructive" });
      setIsTraining(false);
    },
  });

  // Assign clusters mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/segments/assign");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cluster Assignment Complete", description: "All customers have been assigned to segments." });
      queryClient.invalidateQueries({ queryKey: ["/segments/summary"] });
      setIsAssigning(false);
    },
    onError: (error: any) => {
      toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
      setIsAssigning(false);
    },
  });

  // Calculate estimated costs for insurance-specific interventions
  const calculateInterventionCost = (intervention: string, clusterSize: number) => {
    const baseCosts = {
      agent_retention_call: 200,
      personalized_policy_review: 150,
      premium_adjustment_offer: 300,
      claims_expedite_service: 250,
      loyalty_rewards_program: 180,
      policy_bundle_consultation: 220,
      executive_account_review: 400,
      digital_platform_training: 120,
      dedicated_claims_manager: 350,
      risk_assessment_appeal: 180,
      payment_plan_restructure: 100,
      coverage_gap_analysis: 160,
    };
    return (baseCosts[intervention as keyof typeof baseCosts] || 150) * clusterSize;
  };

  const calculateExpectedBenefit = (intervention: string, clusterSize: number, avgMrr: number) => {
    const successRates = {
      agent_retention_call: 0.72,
      personalized_policy_review: 0.65,
      premium_adjustment_offer: 0.58,
      claims_expedite_service: 0.78,
      loyalty_rewards_program: 0.62,
      policy_bundle_consultation: 0.68,
      executive_account_review: 0.85,
      digital_platform_training: 0.45,
      dedicated_claims_manager: 0.80,
      risk_assessment_appeal: 0.55,
      payment_plan_restructure: 0.88,
      coverage_gap_analysis: 0.70,
    };
    const retentionMonths = 24; // Insurance customers typically have longer retention periods
    return (successRates[intervention as keyof typeof successRates] || 0.6) * clusterSize * avgMrr * retentionMonths;
  };

  // Apply intervention to cluster mutation
  const applyInterventionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCluster) throw new Error("No cluster selected");
      const cost = calculateInterventionCost(interventionType, selectedCluster.count);
      const expectedBenefit = calculateExpectedBenefit(interventionType, selectedCluster.count, selectedCluster.avg_mrr || 0);
      
      const response = await apiRequest("POST", "/interventions/cluster-apply", {
        cluster_id: selectedCluster.cluster_id,
        intervention_type: interventionType,
        priority: 2,
        notes: `Bulk intervention applied to cluster ${selectedCluster.cluster_id}`,
        estimated_cost: cost,
        expected_benefit: expectedBenefit
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Intervention Applied", 
        description: `Created ${data.interventions_created} interventions for cluster ${selectedCluster?.cluster_id}` 
      });
      setIsApplyingIntervention(false);
      setSelectedCluster(null);
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
    onError: (error: any) => {
      toast({ title: "Intervention Failed", description: error.message, variant: "destructive" });
      setIsApplyingIntervention(false);
    },
  });

  const handleTrainSegmentation = () => {
    setIsTraining(true);
    trainMutation.mutate(5); // Default to 5 clusters
  };

  const handleAssignClusters = () => {
    setIsAssigning(true);
    assignMutation.mutate();
  };

  const handleViewMembers = (cluster: ClusterSummary) => {
    setSelectedCluster(cluster);
    setIsViewingMembers(true);
  };

  const handleApplyIntervention = (cluster: ClusterSummary) => {
    setSelectedCluster(cluster);
    setIsApplyingIntervention(true);
  };

  const getRiskColor = (avgChurnProb?: number) => {
    if (!avgChurnProb) return "bg-gray-100 text-gray-800";
    if (avgChurnProb >= 0.7) return "bg-red-100 text-red-800";
    if (avgChurnProb >= 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !segmentation?.clusters?.length) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {segmentation?.message || "No customer segments available. Train segmentation model first."}
            </p>
            <div className="space-x-2">
              <Button 
                onClick={handleTrainSegmentation} 
                disabled={isTraining}
                className="bg-primary hover:bg-primary/90"
              >
                {isTraining ? "Training..." : "Train Segmentation"}
              </Button>
              <Button 
                onClick={handleAssignClusters} 
                disabled={isAssigning}
                variant="outline"
              >
                {isAssigning ? "Assigning..." : "Assign Clusters"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Segmentation</CardTitle>
            <div className="space-x-2">
              <Button 
                onClick={handleTrainSegmentation} 
                disabled={isTraining}
                size="sm"
                variant="outline"
              >
                {isTraining ? "Training..." : "Retrain"}
              </Button>
              <Button 
                onClick={handleAssignClusters} 
                disabled={isAssigning}
                size="sm"
                variant="outline"
              >
                {isAssigning ? "Assigning..." : "Reassign"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segmentation.clusters.map((cluster) => (
                <div key={cluster.cluster_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Cluster {cluster.cluster_id}</h4>
                    <Badge className={getRiskColor(cluster.avg_churn_probability)}>
                      {cluster.avg_churn_probability ? `${(cluster.avg_churn_probability * 100).toFixed(1)}% risk` : "Unknown"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{cluster.count} ({cluster.percentage.toFixed(1)}%)</span>
                    </div>
                    
                    {cluster.avg_mrr && (
                      <div className="flex justify-between">
                        <span>Avg MRR:</span>
                        <span className="font-medium">${cluster.avg_mrr.toFixed(0)}</span>
                      </div>
                    )}
                    
                    {cluster.high_risk_count !== undefined && (
                      <div className="flex justify-between">
                        <span>High Risk:</span>
                        <span className="font-medium">{cluster.high_risk_count} ({cluster.high_risk_percentage?.toFixed(1)}%)</span>
                      </div>
                    )}
                    
                    {cluster.primary_gender && (
                      <div className="flex justify-between">
                        <span>Primary Gender:</span>
                        <span className="font-medium capitalize">{cluster.primary_gender}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" onClick={() => handleViewMembers(cluster)}>
                      View Members
                    </Button>
                    <Button size="sm" onClick={() => handleApplyIntervention(cluster)}>
                      Apply Intervention
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* View Members Modal */}
      <Dialog open={isViewingMembers} onOpenChange={setIsViewingMembers}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cluster {selectedCluster?.cluster_id} Members</DialogTitle>
          </DialogHeader>
          
          {isLoadingMembers ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {clusterMembers?.customers?.map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${customer.mrr}</p>
                    <p className="text-sm text-gray-600">Health: {customer.healthScore}%</p>
                  </div>
                </div>
              ))}
              {clusterMembers?.total === 0 && (
                <p className="text-center py-4 text-gray-600">No customers in this cluster</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Intervention Modal */}
      <Dialog open={isApplyingIntervention} onOpenChange={setIsApplyingIntervention}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Apply Bulk Intervention to Cluster {selectedCluster?.cluster_id}
              <Badge variant="outline">{selectedCluster?.count || 0} customers</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cluster Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Cluster Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customers:</span> {selectedCluster?.count || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">Avg MRR:</span> ${selectedCluster?.avg_mrr?.toFixed(0) || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">High Risk:</span> {selectedCluster?.high_risk_count || 0} ({selectedCluster?.high_risk_percentage?.toFixed(1)}%)
                </div>
                <div>
                  <span className="text-muted-foreground">Total MRR:</span> ${((selectedCluster?.avg_mrr || 0) * (selectedCluster?.count || 0)).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Intervention Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Intervention Type</label>
              <Select value={interventionType} onValueChange={setInterventionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent_retention_call">
                    <div className="flex flex-col">
                      <span>Agent Retention Call</span>
                      <span className="text-xs text-muted-foreground">Personal agent outreach for high-value customers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="personalized_policy_review">
                    <div className="flex flex-col">
                      <span>Policy Review</span>
                      <span className="text-xs text-muted-foreground">Comprehensive coverage assessment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium_adjustment_offer">
                    <div className="flex flex-col">
                      <span>Premium Adjustment</span>
                      <span className="text-xs text-muted-foreground">Competitive pricing review and offers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="claims_expedite_service">
                    <div className="flex flex-col">
                      <span>Priority Claims Processing</span>
                      <span className="text-xs text-muted-foreground">Fast-track claims handling</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="loyalty_rewards_program">
                    <div className="flex flex-col">
                      <span>Loyalty Rewards</span>
                      <span className="text-xs text-muted-foreground">Exclusive rewards and benefits program</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="policy_bundle_consultation">
                    <div className="flex flex-col">
                      <span>Bundle Consultation</span>
                      <span className="text-xs text-muted-foreground">Multi-policy savings assessment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="executive_account_review">
                    <div className="flex flex-col">
                      <span>Executive Review</span>
                      <span className="text-xs text-muted-foreground">Senior management account assessment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dedicated_claims_manager">
                    <div className="flex flex-col">
                      <span>Dedicated Claims Manager</span>
                      <span className="text-xs text-muted-foreground">Personal claims specialist assignment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Breakdown */}
            {selectedCluster && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  Cost Analysis
                  <Badge variant="secondary">ROI Calculation</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-red-700">Investment</div>
                    <div className="text-lg font-bold text-red-700">
                      ${calculateInterventionCost(interventionType, selectedCluster.count).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${calculateInterventionCost(interventionType, 1)} per customer
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-green-700">Expected Benefit</div>
                    <div className="text-lg font-bold text-green-700">
                      ${calculateExpectedBenefit(interventionType, selectedCluster.count, selectedCluster.avg_mrr || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      12-month retention value
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-blue-700">Expected ROI</div>
                    <div className="text-lg font-bold text-blue-700">
                      {selectedCluster.avg_mrr && selectedCluster.count ? (
                        ((calculateExpectedBenefit(interventionType, selectedCluster.count, selectedCluster.avg_mrr) - 
                          calculateInterventionCost(interventionType, selectedCluster.count)) / 
                         calculateInterventionCost(interventionType, selectedCluster.count) * 100).toFixed(0)
                      ) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Return on investment
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Rate Information */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Expected Success Rate</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">Historical Performance</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ 
                        width: `${({
                          agent_retention_call: 72,
                          personalized_policy_review: 65,
                          premium_adjustment_offer: 58,
                          claims_expedite_service: 78,
                          loyalty_rewards_program: 62,
                          policy_bundle_consultation: 68,
                          executive_account_review: 85,
                          digital_platform_training: 45,
                          dedicated_claims_manager: 80,
                          risk_assessment_appeal: 55,
                          payment_plan_restructure: 88,
                          coverage_gap_analysis: 70,
                        } as Record<string, number>)[interventionType] || 60}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {({
                    agent_retention_call: 72,
                    personalized_policy_review: 65,
                    premium_adjustment_offer: 58,
                    claims_expedite_service: 78,
                    loyalty_rewards_program: 62,
                    policy_bundle_consultation: 68,
                    executive_account_review: 85,
                    digital_platform_training: 45,
                    dedicated_claims_manager: 80,
                    risk_assessment_appeal: 55,
                    payment_plan_restructure: 88,
                    coverage_gap_analysis: 70,
                  } as Record<string, number>)[interventionType] || 60}%
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsApplyingIntervention(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => applyInterventionMutation.mutate()} 
                disabled={applyInterventionMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {applyInterventionMutation.isPending ? "Applying..." : `Apply to All ${selectedCluster?.count || 0} Customers`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
