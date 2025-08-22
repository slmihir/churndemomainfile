import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Users, PlayCircle, DollarSign, ArrowDownRight, ArrowUpRight } from "lucide-react";
import RiskDistribution from "./risk-distribution";

export default function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-12 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Overall Churn Risk",
      value: `${metrics?.churnRisk || 0}%`,
      change: `${metrics?.churnChange || 0}%`,
      changeType: (metrics?.churnChange ?? 0) < 0 ? "positive" : "negative",
      changeLabel: "vs last month",
      icon: AlertTriangle,
      color: 'var(--danger)',
              tooltip: "Average churn probability across users"
    },
    {
              title: "Users at Risk",
      value: metrics?.customersAtRisk || 0,
      change: `+${metrics?.riskChange || 0}`,
      changeType: "negative",
      changeLabel: "since yesterday",
      icon: Users,
      color: 'var(--warning)',
              tooltip: "Users with high churn risk"
    },
    {
      title: "Active Interventions",
      value: metrics?.activeInterventions || 0,
      change: `${metrics?.successRate || 0}%`,
      changeType: "neutral",
      changeLabel: "success rate",
      icon: PlayCircle,
      color: 'var(--primary)',
      tooltip: "Ongoing retention efforts in progress"
    },
    {
      title: "Revenue Saved",
      value: `$${metrics?.revenueSaved || 0}K`,
      change: `+${metrics?.revenueIncrease || 0}%`,
      changeType: "positive",
      changeLabel: "this quarter",
      icon: DollarSign,
      color: 'var(--success)',
      tooltip: "Revenue protected through interventions"
    },
  ] as const;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.changeType === "positive";
          const isNegative = metric.changeType === "negative";
          return (
              <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[12px] font-medium text-foreground/70">{metric.title}</p>
                        <p className="mt-1 text-[28px] font-semibold tracking-[-0.01em] text-foreground">{metric.value}</p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground/70">
                          {isPositive && <ArrowDownRight size={14} style={{ color: "var(--success)" }} />}
                          {isNegative && <ArrowUpRight size={14} style={{ color: "var(--danger)" }} />}
                          <span>{metric.change}</span>
                          <span className="text-foreground/50">{metric.changeLabel}</span>
                        </span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                        <Icon size={18} style={{ color: (metric as any).color }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {/* 5th element - Churn Risk Distribution */}
        <div className="lg:col-span-1">
          <RiskDistribution />
        </div>
      </div>
    </TooltipProvider>
  );
}
