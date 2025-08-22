import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function APIEndpoints() {
  const [lastResponse, setLastResponse] = useState<string>("");

  const callEndpoint = useMutation({
    mutationFn: async (endpoint: { method: string; path: string }) => {
      if (endpoint.method === "GET") {
        const res = await fetch(endpoint.path);
        return res.json();
      }
      const res = await apiRequest(endpoint.method, endpoint.path, { customerId: 1 });
      return res.json();
    },
    onSuccess: (data) => {
      setLastResponse(JSON.stringify(data, null, 2));
    },
  });
  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/churn/predict",
      description: "Real-time churn prediction for customer ID",
      responseTime: "~45ms",
      successRate: "99.8%",
      status: "active",
    },
    {
      method: "GET",
      path: "/api/v1/causes/explain",
      description: "SHAP-based churn cause explanation",
      responseTime: "~120ms",
      successRate: "99.5%",
      status: "active",
    },
    {
      method: "POST",
      path: "/api/v1/playbooks/trigger",
      description: "Trigger automated retention playbook",
      responseTime: "~85ms",
      successRate: "98.9%",
      status: "active",
    },
  ];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">API Endpoints</h3>
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-gray-600">
                  {endpoint.method} {endpoint.path}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  <i className="fas fa-circle text-green-500 text-xs mr-1"></i>
                  Active
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{endpoint.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                Response time: {endpoint.responseTime} | Success rate: {endpoint.successRate}
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => callEndpoint.mutate(endpoint)} disabled={callEndpoint.isPending}>
                  <i className="fas fa-play mr-2"></i>
                  {callEndpoint.isPending ? "Calling..." : "Test"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="outline" className="w-full" onClick={() => window.open("/APPLICATION_ARCHITECTURE.md", "_blank") }>
            <i className="fas fa-code mr-2"></i>
            View API Documentation
          </Button>
          {lastResponse && (
            <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto max-h-48">
{lastResponse}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
