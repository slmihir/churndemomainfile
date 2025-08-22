import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Clock, Users, DollarSign, TrendingDown, TrendingUp, Activity, Shield, Zap, CheckCircle } from "lucide-react";

interface RiskAlertsProps {
  onLaunchPlaybook: () => void;
}

interface RiskAlertItem {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  createdAt: string;
  isRead?: boolean;
  type?: string;
  userCount?: number;
  revenueImpact?: number;
  urgency?: string;
}

export default function RiskAlerts({ onLaunchPlaybook }: RiskAlertsProps) {
  const queryClient = useQueryClient();
  
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: interventions } = useQuery<any[]>({
    queryKey: ["/api/interventions"],
  });

  // Generate comprehensive real-time alerts
  const generateRealTimeAlerts = () => {
    const alerts: RiskAlertItem[] = [];
    
    if (!users || !interventions) return alerts;

    const now = new Date();
    const highRiskUsers = users.filter((u: any) => parseFloat(u.churnRisk) >= 80);
    const overdueInterventions = interventions.filter((i: any) => 
      i.status === 'active' && new Date(i.dueDate) < now
    );
    const recentInterventions = interventions.filter((i: any) => 
      new Date(i.createdAt) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );

    // High-risk user alerts
    if (highRiskUsers.length > 0) {
      alerts.push({
        id: Date.now() + 1,
        title: `High Risk User Alert`,
        description: `${highRiskUsers.length} users with >80% churn risk detected`,
        severity: "critical",
        createdAt: new Date().toISOString(),
        type: "high_risk_users",
        userCount: highRiskUsers.length,
        revenueImpact: highRiskUsers.reduce((sum: number, u: any) => sum + parseFloat(u.mrr), 0),
        urgency: "immediate"
      });
    }

    // Overdue interventions
    if (overdueInterventions.length > 0) {
      alerts.push({
        id: Date.now() + 2,
        title: `Intervention SLA Breach`,
        description: `${overdueInterventions.length} interventions past due date`,
        severity: "high",
        createdAt: new Date().toISOString(),
        type: "sla_breach",
        userCount: overdueInterventions.length,
        urgency: "urgent"
      });
    }

    // Recent intervention success
    if (recentInterventions.length > 0) {
      const successfulInterventions = recentInterventions.filter((i: any) => i.status === 'completed');
      if (successfulInterventions.length > 0) {
        alerts.push({
          id: Date.now() + 3,
          title: `Intervention Success`,
          description: `${successfulInterventions.length} interventions completed successfully in last 24h`,
          severity: "low",
          createdAt: new Date().toISOString(),
          type: "intervention_success",
          userCount: successfulInterventions.length,
          urgency: "low"
        });
      }
    }

    // Revenue impact alerts
    const totalMRR = users.reduce((sum: number, u: any) => sum + parseFloat(u.mrr), 0);
    const atRiskMRR = highRiskUsers.reduce((sum: number, u: any) => sum + parseFloat(u.mrr), 0);
    const riskPercentage = (atRiskMRR / totalMRR) * 100;

    if (riskPercentage > 15) {
      alerts.push({
        id: Date.now() + 4,
        title: `Revenue Risk Alert`,
        description: `${riskPercentage.toFixed(1)}% of total MRR at risk ($${atRiskMRR.toLocaleString()})`,
        severity: "high",
        createdAt: new Date().toISOString(),
        type: "revenue_risk",
        revenueImpact: atRiskMRR,
        urgency: "high"
      });
    }

    // User behavior alerts
    const inactiveUsers = users.filter((u: any) => 
      !u.lastLogin || new Date(u.lastLogin) < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );

    if (inactiveUsers.length > users.length * 0.2) {
      alerts.push({
        id: Date.now() + 5,
        title: `User Engagement Drop`,
        description: `${inactiveUsers.length} users inactive for 30+ days`,
        severity: "medium",
        createdAt: new Date().toISOString(),
        type: "engagement_drop",
        userCount: inactiveUsers.length,
        urgency: "medium"
      });
    }

    // System performance alerts
    const avgHealthScore = users.reduce((sum: number, u: any) => sum + (u.healthScore || 0), 0) / users.length;
    if (avgHealthScore < 60) {
      alerts.push({
        id: Date.now() + 6,
        title: `Low Health Score Trend`,
        description: `Average user health score dropped to ${avgHealthScore.toFixed(1)}%`,
        severity: "medium",
        createdAt: new Date().toISOString(),
        type: "health_score",
        urgency: "medium"
      });
    }

    // Payment failure alerts
    const paymentIssues = users.filter((u: any) => 
      u.supportTickets && u.supportTickets > 3
    );

    if (paymentIssues.length > 0) {
      alerts.push({
        id: Date.now() + 7,
        title: `Payment Issues Detected`,
        description: `${paymentIssues.length} users with multiple support tickets`,
        severity: "high",
        createdAt: new Date().toISOString(),
        type: "payment_issues",
        userCount: paymentIssues.length,
        urgency: "high"
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
    });
  };

  const alerts = (alertsData as any)?.alerts || generateRealTimeAlerts();

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadAlerts = alerts?.filter((alert: RiskAlertItem) => !alert.isRead) || [];
      await Promise.all(
        unreadAlerts.map((alert: any) =>
          apiRequest("PATCH", `/api/alerts/${alert.id}/read`)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Risk Alerts</h3>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "high":
        return "border-orange-200 bg-orange-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-green-200 bg-green-50";
    }
  };

  const getSeverityIcon = (type: string, severity: string) => {
    switch (type) {
      case "high_risk_users":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "sla_breach":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "intervention_success":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "revenue_risk":
        return <DollarSign className="h-4 w-4 text-red-600" />;
      case "engagement_drop":
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case "health_score":
        return <Activity className="h-4 w-4 text-yellow-600" />;
      case "payment_issues":
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Zap className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>;
    }
  };

  const getActionButton = (type: string, severity: string) => {
    switch (type) {
      case "high_risk_users":
        return "Launch Rescue";
      case "sla_breach":
        return "Review SLA";
      case "revenue_risk":
        return "Revenue Recovery";
      case "engagement_drop":
        return "Engagement Boost";
      case "payment_issues":
        return "Payment Recovery";
      default:
        return severity === "critical" ? "Launch CX Rescue" : "Take Action";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const criticalAlerts = alerts.filter((a: RiskAlertItem) => a.severity === "critical").length;
  const highAlerts = alerts.filter((a: RiskAlertItem) => a.severity === "high").length;

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Risk Alerts</h3>
            {(criticalAlerts > 0 || highAlerts > 0) && (
              <div className="flex gap-2">
                {criticalAlerts > 0 && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {criticalAlerts} Critical
                  </Badge>
                )}
                {highAlerts > 0 && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {highAlerts} High
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Mark all read
          </Button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {alerts?.slice(0, 8).map((alert: RiskAlertItem) => (
            <div key={alert.id} className={`group flex items-start gap-3 rounded-lg border p-4 ${getSeverityStyle(alert.severity)}`}>
                               <div className="mt-1">
                   {getSeverityIcon(alert.type || '', alert.severity)}
                 </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-500">{formatTimeAgo(alert.createdAt)}</p>
                      {alert.userCount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{alert.userCount} users</span>
                        </div>
                      )}
                      {alert.revenueImpact && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">${alert.revenueImpact.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getSeverityBadge(alert.severity)}
                                         <Button
                       variant="ghost"
                       size="sm"
                       className="text-gray-700 hover:text-gray-900"
                       onClick={onLaunchPlaybook}
                     >
                       {getActionButton(alert.type || '', alert.severity)}
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {alerts?.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600 font-medium">All systems operating normally</p>
              <p className="text-sm text-gray-500 mt-2">No risk alerts at this time</p>
            </div>
          )}
        </div>
        
        {alerts?.length > 8 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Showing 8 of {alerts.length} alerts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
