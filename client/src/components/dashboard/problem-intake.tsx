import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProblemIntake() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form state
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("5000");
  const [offers, setOffers] = useState<string[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(true);

  // Demo data query
  const { data: demo, isLoading: isDemoLoading, error: demoError } = useQuery({
    queryKey: ["/problems/demo-load"],
    queryFn: async () => {
      // For now, return mock data since the endpoint doesn't exist yet
      return {
        problems: ["poor_product_adoption", "payment_issues", "support_dissatisfaction", "feature_gaps", "competitor_switching"],
        offers: ["discount_10", "free_month", "premium_features", "dedicated_support", "training_package"]
      };
    },
    retry: 1
  });

  // Validation function
  const validateForm = () => {
    const errors: string[] = [];
    
    if (selectedProblems.length === 0) {
      errors.push("Please select at least one problem to address");
    }
    
    const budgetNum = Number(budget);
    if (!budget || budgetNum <= 0) {
      errors.push("Budget must be a positive number");
    } else if (budgetNum < 1000) {
      errors.push("Budget should be at least $1,000 for effective interventions");
    } else if (budgetNum > 100000) {
      errors.push("Budget seems unusually high - please verify the amount");
    }
    
    setValidationErrors(errors);
    setIsFormValid(errors.length === 0);
    return errors.length === 0;
  };

  const intakeMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Form validation failed");
      }
      const payload = { problems: selectedProblems, budget: Number(budget), offers };
      const res = await apiRequest("POST", "/problems/intake", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Problem Intake Saved",
        description: `Successfully saved ${selectedProblems.length} problems with $${budget} budget`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save",
        description: error.message || "Please check your inputs and try again",
        variant: "destructive",
      });
    },
  });

  const prioritize = useMutation({
    mutationFn: async () => {
      if (selectedProblems.length === 0) {
        throw new Error("Please select problems first");
      }
      const res = await apiRequest("GET", `/problems/prioritize?${selectedProblems.map((p) => `problems=${encodeURIComponent(p)}`).join("&")}`);
      return res.json();
    },
    onError: (error: any) => {
      toast({
        title: "Prioritization Failed",
        description: error.message || "Unable to prioritize problems",
        variant: "destructive",
      });
    },
  });

  const analyze = useMutation({
    mutationFn: async () => {
      if (selectedProblems.length === 0) {
        throw new Error("Please select problems first");
      }
      const res = await apiRequest("POST", "/problems/analyze", { problems: selectedProblems });
      return res.json();
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to analyze root causes",
        variant: "destructive",
      });
    },
  });

  const suggest = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Form validation failed");
      }
      const res = await apiRequest("POST", "/problems/interventions", { problems: selectedProblems, budget: Number(budget), offers });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Interventions Generated",
        description: "AI has suggested interventions based on your criteria",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Suggestion Failed",
        description: error.message || "Unable to generate intervention suggestions",
        variant: "destructive",
      });
    },
  });

  const applyBulk = useMutation({
    mutationFn: async () => {
      if (!suggest.data?.recommendations?.length) {
        throw new Error("No interventions to apply");
      }
      const interventions = suggest.data.recommendations.map((r: any) => ({
        type: r.type,
        title: `${r.problem} - ${r.type}`,
        customerId: undefined,
        cost: r.cost,
        expectedBenefit: r.benefit
      }));
      const res = await apiRequest("POST", "/problems/apply-bulk", { interventions });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Interventions Applied",
        description: `Successfully created ${data.applied || suggest.data?.recommendations?.length} interventions`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Unable to apply interventions",
        variant: "destructive",
      });
    },
  });

  const manualInterventionMutation = useMutation({
    mutationFn: async () => {
      if (!manualTitle.trim()) {
        throw new Error("Title is required");
      }
      const res = await apiRequest("POST", "/problems/manual-intervention", { 
        title: manualTitle.trim(), 
        notes: manualNotes.trim() 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Manual Intervention Added",
        description: "Your custom intervention has been created",
      });
      setManualTitle("");
      setManualNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create",
        description: error.message || "Unable to create manual intervention",
        variant: "destructive",
      });
    },
  });

  const toggle = (arr: string[], val: string) => (arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  // Effect to validate form on changes
  React.useEffect(() => {
    if (selectedProblems.length > 0 || budget) {
      validateForm();
    }
  }, [selectedProblems, budget]);

  if (isDemoLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Problem Intake & Prioritization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (demoError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Problem Intake & Prioritization</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              Unable to load problem categories. Please refresh the page or contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Problem Intake & Prioritization
          {!isFormValid && <AlertCircle className="h-5 w-5 text-destructive" />}
          {isFormValid && selectedProblems.length > 0 && <CheckCircle className="h-5 w-5 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please fix the following issues:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              Select Problems
              <span className="text-xs text-muted-foreground">({selectedProblems.length} selected)</span>
            </p>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-2 border rounded-lg">
              {(demo?.problems || []).map((p: string) => (
                <Badge 
                  key={p} 
                  variant={selectedProblems.includes(p) ? "default" : "outline"} 
                  onClick={() => setSelectedProblems(toggle(selectedProblems, p))} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {p.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
              {demo?.problems?.length === 0 && (
                <span className="text-sm text-muted-foreground">No problems available</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              Budget
              <DollarSign className="h-4 w-4" />
            </p>
            <Input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)} 
              min={1}
              max={1000000}
              placeholder="Enter budget amount"
              className={validationErrors.some(e => e.includes("Budget")) ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum $1,000 recommended</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              Available Offers
              <span className="text-xs text-muted-foreground">({offers.length} selected)</span>
            </p>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-2 border rounded-lg">
              {(demo?.offers || []).map((o: string) => (
                <Badge 
                  key={o} 
                  variant={offers.includes(o) ? "default" : "outline"} 
                  onClick={() => setOffers(toggle(offers, o))} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {o.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
              {demo?.offers?.length === 0 && (
                <span className="text-sm text-muted-foreground">No offers available</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            disabled={!isFormValid || intakeMutation.isPending} 
            onClick={() => intakeMutation.mutate()}
            className="flex items-center gap-2"
          >
            {intakeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {intakeMutation.isPending ? "Saving..." : "Save Intake"}
          </Button>
          <Button 
            variant="outline" 
            disabled={!selectedProblems.length || prioritize.isPending} 
            onClick={() => prioritize.mutate()}
            className="flex items-center gap-2"
          >
            {prioritize.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            {prioritize.isPending ? "Prioritizing..." : "Prioritize"}
          </Button>
          <Button 
            variant="outline" 
            disabled={!selectedProblems.length || analyze.isPending} 
            onClick={() => analyze.mutate()}
            className="flex items-center gap-2"
          >
            {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            {analyze.isPending ? "Analyzing..." : "Analyze Causes"}
          </Button>
          <Button 
            variant="outline" 
            disabled={!isFormValid || suggest.isPending} 
            onClick={() => suggest.mutate()}
            className="flex items-center gap-2"
          >
            {suggest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            {suggest.isPending ? "Generating..." : "Suggest Interventions"}
          </Button>
        </div>

        {prioritize.data && (
          <div>
            <p className="text-sm font-medium mb-2">Top Priorities</p>
            <div className="space-y-2">
              {prioritize.data.priorities.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between border rounded p-3">
                  <span className="font-medium capitalize">{p.problem.replace(/_/g, " ")}</span>
                  <span className="text-sm">Urgency {p.urgency} · Impact {p.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyze.data && (
          <div>
            <p className="text-sm font-medium mb-2">Root Causes</p>
            <div className="space-y-4">
              {analyze.data.items.map((it: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold capitalize">{it.problem.replace(/_/g, " ")}</p>
                  <p className="text-sm mt-1">Likely Causes:</p>
                  <ul className="list-disc list-inside text-sm">
                    {it.likely_causes.map((c: string, i: number) => (<li key={i}>{c}</li>))}
                  </ul>
                  {it.domain_overlays?.length ? (
                    <>
                      <p className="text-sm mt-2">Insurance Insights:</p>
                      <ul className="list-disc list-inside text-sm">
                        {it.domain_overlays.map((c: string, i: number) => (<li key={i}>{c}</li>))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {suggest.data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Suggested Interventions</p>
              <div className="text-sm text-muted-foreground">
                Total Cost: ${suggest.data.recommendations?.reduce((sum: number, r: any) => sum + (r.cost || 0), 0).toLocaleString() || 0} | 
                Expected Benefit: ${suggest.data.recommendations?.reduce((sum: number, r: any) => sum + (r.benefit || 0), 0).toLocaleString() || 0}
              </div>
            </div>
            <div className="space-y-3">
              {suggest.data.recommendations?.map((r: any, idx: number) => {
                const roi = r.cost > 0 ? ((r.benefit - r.cost) / r.cost * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium capitalize text-lg">
                          {r.problem?.replace(/_/g, " ")} · {r.type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{r.notes}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Cost: ${r.cost?.toLocaleString() || 0}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Benefit: ${r.benefit?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ROI: {roi}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => {
                  suggest.reset();
                }}
              >
                Clear Results
              </Button>
              <Button 
                onClick={() => applyBulk.mutate()} 
                disabled={applyBulk.isPending || !suggest.data?.recommendations?.length}
                className="flex items-center gap-2"
              >
                {applyBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {applyBulk.isPending ? "Applying..." : `Apply All ${suggest.data.recommendations?.length || 0} Interventions`}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            Manual Intervention
            <span className="text-xs text-muted-foreground">Create custom intervention</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input 
              placeholder="Title (e.g., Priority retention call)" 
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className={!manualTitle && manualInterventionMutation.isError ? "border-destructive" : ""}
            />
            <Textarea 
              placeholder="Notes and action items" 
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="md:col-span-2 min-h-[80px]" 
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-muted-foreground">
              {manualTitle.length}/100 characters
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setManualTitle("");
                  setManualNotes("");
                }}
                disabled={!manualTitle && !manualNotes}
              >
                Clear
              </Button>
              <Button 
                size="sm"
                onClick={() => manualInterventionMutation.mutate()}
                disabled={!manualTitle.trim() || manualInterventionMutation.isPending}
                className="flex items-center gap-2"
              >
                {manualInterventionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {manualInterventionMutation.isPending ? "Adding..." : "Add Manual Intervention"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


