import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Ensure Chart.js doesn't use black defaults
ChartJS.defaults.color = 'rgb(100, 116, 139)';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.15)';

interface ChurnChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill?: boolean;
  }[];
}

export default function ChurnChart() {
  const { data: chartData, isLoading } = useQuery<ChurnChartData>({
    queryKey: ["/api/dashboard/chart-data"],
  });

  const themeColors = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        foreground: 'rgb(71, 85, 105)',
        grid: 'rgba(148, 163, 184, 0.15)',
        danger: 'rgb(220, 38, 38)',
        dangerBg: 'rgba(220, 38, 38, 0.08)'
      };
    }
    const readVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const foreground = readVar('--foreground') || 'rgb(71, 85, 105)';
    const danger = readVar('--danger') || 'rgb(220, 38, 38)';
    // Convert HSL to RGBA for a soft area fill; fall back to rgba
    const dangerBg = danger.startsWith('hsl') ? danger.replace('hsl(', 'hsla(').replace(')', ', 0.08)') : 'rgba(220, 38, 38, 0.08)';
    const grid = foreground.startsWith('hsl') ? foreground.replace('hsl(', 'hsla(').replace(')', ', 0.12)') : 'rgba(148, 163, 184, 0.15)';
    return { foreground, grid, danger, dangerBg };
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: themeColors.foreground.startsWith('hsl') ? themeColors.foreground.replace('hsl(', 'hsla(').replace(')', ', 0.60)') : 'rgba(100, 116, 139, 0.8)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: themeColors.grid },
        border: { display: false },
        ticks: {
          color: themeColors.foreground.startsWith('hsl') ? themeColors.foreground.replace('hsl(', 'hsla(').replace(')', ', 0.60)') : 'rgba(100, 116, 139, 0.8)',
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
    elements: {
      line: { tension: 0.35, borderWidth: 2 },
      point: { radius: 0, hitRadius: 8, hoverRadius: 3 },
    },
  };

  const styledData = useMemo(() => {
    if (!chartData) return undefined;
    return {
      labels: chartData.labels,
      datasets: chartData.datasets.map((ds) => ({
        ...ds,
        borderColor: themeColors.danger,
        backgroundColor: themeColors.dangerBg,
        fill: true,
      })),
    } as ChartData<'line'>;
  }, [chartData, themeColors]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Churn Risk Over Time</h3>
          </div>
          <div className="h-64 bg-muted rounded-md animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Churn Risk Over Time</h3>
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-64">
          {styledData && <Line data={styledData} options={options} />}
        </div>
      </CardContent>
    </Card>
  );
}
