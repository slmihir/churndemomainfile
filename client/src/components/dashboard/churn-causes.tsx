import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type CausesResponse = { causes: Array<{ name: string; description: string; impact: number; category: string; icon: string }>; responseTime?: number };

export default function ChurnCauses() {
  const { data: causesData, isLoading } = useQuery<CausesResponse>({
    queryKey: ["/api/v1/causes/explain"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-6">Top Churn Root Causes</h3>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const causes = causesData?.causes || [];

  const getIconColor = (impact: number) => {
    if (impact >= 30) return "text-foreground/80 bg-muted";
    if (impact >= 25) return "text-foreground/80 bg-muted";
    return "text-foreground/80 bg-muted";
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 30) return "text-danger";
    if (impact >= 25) return "text-warning";
    return "text-foreground";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-6">Top Churn Root Causes</h3>
        <div className="space-y-4">
          {causes.map((cause: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${getIconColor(cause.impact)}`}>
                  <i className={`${cause.icon} text-sm`}></i>
                </div>
                <div>
                  <p className="font-medium text-foreground">{cause.name}</p>
                  <p className="text-sm text-foreground/70">{cause.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${getImpactColor(cause.impact)}`}>
                  {cause.impact}%
                </p>
                <p className="text-xs text-foreground/60">Impact</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
