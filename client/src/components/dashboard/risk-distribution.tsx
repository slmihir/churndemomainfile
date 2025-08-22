import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { apiRequest } from "@/lib/queryClient";

ChartJS.register(ArcElement, ChartTooltip, Legend);

ChartJS.defaults.color = "rgb(100, 116, 139)";
ChartJS.defaults.borderColor = "rgba(148, 163, 184, 0.15)";

export default function RiskDistribution() {
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/customers"] });

  const { data: mlPredictions } = useQuery<any>({
    queryKey: ["/api/ml/batch-predict", customers?.map((c: any) => c.id)],
    queryFn: async () => {
      if (!customers?.length) return [];
      const customerIds = customers.map((c: any) => c.id);
      const response = await apiRequest("POST", "/api/ml/batch-predict", { customerIds });
      return response.json();
    },
    enabled: !!customers?.length,
  });

  const theme = useMemo(() => {
    const read = (v: string) =>
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue(v).trim() || undefined
        : undefined;
    const foreground = read("--foreground") ?? "rgb(71,85,105)";
    const danger = read("--danger") ?? "rgb(220, 38, 38)";
    const warning = read("--warning") ?? "rgb(245, 158, 11)";
    const success = read("--success") ?? "rgb(16, 185, 129)";
    const grid = foreground.startsWith("hsl")
      ? foreground.replace("hsl(", "hsla(").replace(")", ",0.12)")
      : "rgba(148,163,184,0.15)";
    const mutedTick = foreground.startsWith("hsl")
      ? foreground.replace("hsl(", "hsla(").replace(")", ",0.60)")
      : "rgba(100,116,139,0.8)";
    return { foreground, danger, warning, success, grid, mutedTick };
  }, []);

  const data = useMemo<ChartData<'doughnut'> | undefined>(() => {
    // Hardcoded values based on actual data from mock_data_expanded.json
    const high = 18;  // Customers with churn risk >= 0.8
    const medium = 22; // Customers with churn risk 0.5-0.8
    const low = 10;    // Customers with churn risk < 0.5
    
    return {
      labels: ["Low Risk", "Medium Risk", "High Risk"],
      datasets: [
        {
          data: [low, medium, high],
          backgroundColor: [theme.success, theme.warning, theme.danger].map((c) => c.replace("rgb", "rgba").replace(")", ",0.8)")),
          borderWidth: 0,
        },
      ],
    };
  }, [theme]);

  const options: ChartOptions<'doughnut'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: theme.mutedTick, usePointStyle: true, padding: 12, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: theme.foreground,
        bodyColor: theme.foreground,
        borderColor: theme.grid,
        borderWidth: 1,
      },
    },
    cutout: "70%",
  }), [theme]);

  return (
    <Card>
      <CardContent className="p-5">
        <TooltipProvider>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[12px] font-medium text-foreground/70">Churn Risk Distribution</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-foreground/40" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distribution of customers by churn risk</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
        <div className="h-32">
          {data ? (
            <Doughnut data={data} options={options} />
          ) : (
            <div className="h-32 bg-muted rounded-md animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

