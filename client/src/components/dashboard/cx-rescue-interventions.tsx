import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BulkInterventionSelector from "./bulk-intervention-selector";

interface CXRescueInterventionsProps {
  onNewIntervention: () => void;
}

export default function CXRescueInterventions({ onNewIntervention }: CXRescueInterventionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showBulkSelector, setShowBulkSelector] = useState(false);
  
  const { data: interventions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/interventions"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const completeInterventionMutation = useMutation({
    mutationFn: async (interventionId: number) => {
      return apiRequest("PATCH", `/api/interventions/${interventionId}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    },
    onMutate: async (interventionId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/interventions"] });
      const previous = queryClient.getQueryData<any[]>(["/api/interventions"]);
      queryClient.setQueryData<any[]>(["/api/interventions"], (old) =>
        (old || []).map((i: any) => (i.id === interventionId ? { ...i, status: "completed", completedAt: new Date().toISOString() } : i))
      );
      return { previous } as { previous?: any[] };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["/api/interventions"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, taskIds }: { action: string; taskIds: string[] }) => {
      const response = await apiRequest("POST", "/api/interventions/bulk", {
        taskIds,
        action,
        notes: `Bulk ${action} action applied`
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Action Complete",
        description: `${data.updated} interventions updated successfully.`,
      });
      setSelectedTasks([]);
      setBulkAction("");
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message || "Failed to apply bulk action",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(interventions?.map((i: any) => i.id.toString()) || []);
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedTasks.length === 0) return;
    bulkActionMutation.mutate({ action: bulkAction, taskIds: selectedTasks });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">CX Rescue Playbook - Active Interventions</h3>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? user.name : `User ${userId}`;
  };

  const getUserEmail = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? user.email : `user${userId}@example.com`;
  };

  const getUserRisk = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    if (!user) return { risk: "0", level: "low" };
    
    const risk = parseFloat(user.churnRisk);
    let level = "low";
    if (risk >= 80) level = "high";
    else if (risk >= 50) level = "medium";
    
    return { risk: `${risk}%`, level };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const formatDueDate = (date: string | null) => {
    if (!date) return "No due date";
    
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return "Due today";
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return "Due tomorrow";
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  return (
    <>
      <Card className="shadow-sm border border-gray-200 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">CX Rescue Playbook - Active Interventions</h3>
          <div className="flex items-center gap-4">
            {selectedTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedTasks.length} selected</span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="escalate">Escalate</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? "Applying..." : "Apply"}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowBulkSelector(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Bulk Apply
              </Button>
              <Button onClick={onNewIntervention} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Intervention
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                  <Checkbox
                    checked={selectedTasks.length === interventions?.length && interventions?.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all interventions"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Risk Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Intervention</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">CSM</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Next Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interventions?.map((intervention: any) => {
                const userRisk = getUserRisk(intervention.customerId);
                
                return (
                  <tr key={intervention.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <Checkbox
                        checked={selectedTasks.includes(intervention.id.toString())}
                        onCheckedChange={(checked) => handleSelectTask(intervention.id.toString(), checked as boolean)}
                        aria-label={`Select intervention ${intervention.id}`}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{getUserName(intervention.customerId)}</p>
                        <p className="text-sm text-gray-600">{getUserEmail(intervention.customerId)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`${getRiskStyle(userRisk.level)} font-medium`}>
                        {userRisk.risk} {userRisk.level}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">{intervention.type}</p>
                      <p className="text-xs text-gray-600">{intervention.description}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusStyle(intervention.status)}>
                        {intervention.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">{intervention.assignedCsm}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{intervention.nextAction}</p>
                      <p className="text-xs text-gray-600">{formatDueDate(intervention.dueDate)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button className="text-primary hover:text-primary/80">
                          <i className="fas fa-eye"></i>
                        </button>
                        {intervention.status === "active" && (
                          <button 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => completeInterventionMutation.mutate(intervention.id)}
                            disabled={completeInterventionMutation.isPending}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-700">
                          <i className="fas fa-edit"></i>
                        </button>
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

    {/* Bulk Intervention Selector Modal */}
    {showBulkSelector && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-6xl">
          <BulkInterventionSelector onClose={() => setShowBulkSelector(false)} />
        </div>
      </div>
    )}
    </>
  );
}
