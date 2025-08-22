import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import ChurnChart from "@/components/dashboard/churn-chart";
import RetentionTrends from "@/components/dashboard/retention-trends";
import ChurnCauses from "@/components/dashboard/churn-causes";
import ProblemIntake from "@/components/dashboard/problem-intake";
import InterventionAnalytics from "@/components/dashboard/intervention-analytics";

import APIEndpoints from "@/components/dashboard/api-endpoints";
import MLInsights from "@/components/dashboard/ml-insights";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <MetricsGrid />

          {/* Main Dashboard Grid */}
          <div className="mb-8">
            {/* Retention Trends - Full Width */}
            <RetentionTrends />
          </div>

          {/* ML Insights Section */}
          <div className="mb-8">
            <MLInsights />
          </div>

          {/* Intervention Success Analytics */}
          <div className="mb-8">
            <InterventionAnalytics />
          </div>

          {/* Problem Intake & Prioritization */}
          <div className="mb-8">
            <ProblemIntake />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChurnChart />
            <ChurnCauses />
          </div>

          <div className="mt-6">
            <APIEndpoints />
          </div>
        </main>
      </div>
    </div>
  );
}
