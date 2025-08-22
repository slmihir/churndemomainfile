import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChurnPredictionSchema, insertInterventionSchema, insertRiskAlertSchema } from "../shared/schema";
import { z } from "zod";
import { dataLoader } from "./data-loader";
import { mlEngine } from "./ml-engine";

// Helper function for feature recommendations
function getFeatureRecommendation(feature: string, importance: number): string {
  const featureMap: Record<string, string> = {
    "Health Score": `Health score shows ${importance.toFixed(1)}% impact on churn. Focus on improving product adoption and customer success touchpoints.`,
    "Account Age": `Account age correlates ${importance.toFixed(1)}% with churn risk. Implement loyalty programs for long-term customers.`,
    "Feature Usage": `Feature usage drives ${importance.toFixed(1)}% of churn prediction. Increase product engagement through guided onboarding.`,
    "NPS Score": `NPS contributes ${importance.toFixed(1)}% to churn likelihood. Address feedback systematically and close the loop with customers.`,
    "Last Login": `Login recency affects ${importance.toFixed(1)}% of predictions. Implement re-engagement campaigns for inactive users.`,
    "Support Tickets": `Support volume influences ${importance.toFixed(1)}% of churn risk. Optimize support processes and resolution times.`,
    "Plan Type": `Plan type accounts for ${importance.toFixed(1)}% of risk. Consider plan optimization and upgrade incentives.`,
    "Monthly Revenue": `Revenue size represents ${importance.toFixed(1)}% of prediction weight. Focus on high-value customer retention strategies.`,
  };
  
  return featureMap[feature] || `${feature} contributes ${importance.toFixed(1)}% to churn prediction. Monitor this metric closely for early warning signs.`;
}

// Helper functions for feature analysis
function calculateFeatureCorrelations(customers: any[], featureName: string) {
  // Simplified correlation calculation
  const correlations: Record<string, number> = {};
  
  // Calculate correlation with churn risk
  const churnRisks = customers.map(c => parseFloat(c.churnRisk) * 100);
  const featureValues = customers.map(c => getFeatureValue(c, featureName));
  
  correlations.churnRisk = calculateCorrelation(featureValues, churnRisks);
  correlations.healthScore = calculateCorrelation(featureValues, customers.map(c => c.healthScore));
  correlations.npsScore = calculateCorrelation(featureValues, customers.map(c => c.npsScore || 5));
  
  return correlations;
}

function calculateFeatureDistribution(customers: any[], featureName: string) {
  const values = customers.map(c => getFeatureValue(c, featureName)).filter(v => v !== null);
  
  const sorted = values.sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    min: sorted[0],
    max: sorted[len - 1],
    median: sorted[Math.floor(len / 2)],
    mean: values.reduce((sum, v) => sum + v, 0) / len,
    q25: sorted[Math.floor(len * 0.25)],
    q75: sorted[Math.floor(len * 0.75)],
  };
}

function calculateFeatureTrends(customers: any[], featureName: string) {
  // Simulate trend analysis based on customer signup dates
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const recentCustomers = customers.filter(c => new Date(c.signupDate) > threeMonthsAgo);
  const olderCustomers = customers.filter(c => new Date(c.signupDate) <= threeMonthsAgo);
  
  const recentAvg = recentCustomers.length > 0 
    ? recentCustomers.map(c => getFeatureValue(c, featureName)).reduce((sum, v) => sum + (v || 0), 0) / recentCustomers.length
    : 0;
  
  const olderAvg = olderCustomers.length > 0
    ? olderCustomers.map(c => getFeatureValue(c, featureName)).reduce((sum, v) => sum + (v || 0), 0) / olderCustomers.length
    : 0;
  
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  return {
    direction: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
    percentage: Math.abs(trend),
    recentAverage: recentAvg,
    historicalAverage: olderAvg,
  };
}

function getIndustryBenchmarks(featureName: string) {
  const benchmarks: Record<string, any> = {
    "Health Score": { excellent: 90, good: 75, industry: 68 },
    "Feature Usage": { excellent: 85, good: 65, industry: 45 },
    "NPS Score": { excellent: 8, good: 6, industry: 4 },
    "Support Tickets": { excellent: 2, good: 5, industry: 8 },
    "Last Login": { excellent: 1, good: 7, industry: 14 }, // days
  };
  
  return benchmarks[featureName] || { excellent: 100, good: 75, industry: 50 };
}

function generateActionPlan(feature: any) {
  const actions = [];
  
  if (feature.importance > 20) {
    actions.push({
      priority: 'high',
      action: `Monitor ${feature.feature} closely as it has high impact (${feature.importance.toFixed(1)}%)`,
      timeframe: 'immediate'
    });
  }
  
  if (feature.actionability === 'high') {
    actions.push({
      priority: 'high',
      action: `Implement improvement strategies for ${feature.feature}`,
      timeframe: '1-2 weeks'
    });
  }
  
  if (feature.confidenceLevel === 'low') {
    actions.push({
      priority: 'medium',
      action: `Collect more data for ${feature.feature} to improve prediction confidence`,
      timeframe: '1 month'
    });
  }
  
  return actions;
}

function getFeatureValue(customer: any, featureName: string): number {
  const featureMap: Record<string, (c: any) => number> = {
    "Health Score": (c) => c.healthScore,
    "Feature Usage": (c) => c.featureUsage?.login + c.featureUsage?.features + c.featureUsage?.api_calls || 0,
    "NPS Score": (c) => c.npsScore || 5,
    "Support Tickets": (c) => c.supportTickets,
    "Last Login": (c) => c.lastLogin ? Math.floor((new Date().getTime() - new Date(c.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : 365,
    "Account Age": (c) => Math.floor((new Date().getTime() - new Date(c.signupDate).getTime()) / (1000 * 60 * 60 * 24)),
    "Monthly Revenue": (c) => parseFloat(c.mrr),
  };
  
  return featureMap[featureName]?.(customer) || 0;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);
  
  const correlation = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  return Math.round(correlation * 100) / 100;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const interventions = await storage.getInterventions();
      
      const totalCustomers = customers.length;
      
      // Use ML predictions instead of static churnRisk
      let customersAtRisk = 0;
      let totalRiskScore = 0;
      
      for (const customer of customers) {
        try {
          const mlPrediction = mlEngine.predictChurn(customer.id);
          const riskPercentage = mlPrediction.churnProbability * 100;
          totalRiskScore += riskPercentage;
          if (riskPercentage > 70) {
            customersAtRisk++;
          }
        } catch (error) {
          // Fallback to static data if ML fails
          const staticRisk = parseFloat(customer.churnRisk) * 100; // Convert to percentage
          totalRiskScore += staticRisk;
          if (staticRisk > 70) {
            customersAtRisk++;
          }
        }
      }
      
      const averageChurnRisk = totalRiskScore / totalCustomers;
      const totalMRR = customers.reduce((sum, c) => sum + parseFloat(c.mrr), 0);
      const dashboardSettings = dataLoader.getDashboardSettings();
      
      const activeInterventions = interventions.filter(i => i.status === 'active').length;
      const completedInterventions = interventions.filter(i => i.status === 'completed').length;
      const savedRevenue = completedInterventions * dashboardSettings.revenuePerCompletedIntervention;

      const successRate = completedInterventions > 0 ? 
        Math.round((completedInterventions / (completedInterventions + activeInterventions)) * 100) : 0;

      res.json({
        churnRisk: averageChurnRisk.toFixed(1),
        churnChange: dashboardSettings.churnChange,
        customersAtRisk,
        riskChange: dashboardSettings.riskChange,
        activeInterventions,
        successRate,
        revenueSaved: Math.round(savedRevenue / 1000),
        revenueIncrease: dashboardSettings.revenueIncrease,
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ 
        message: "Failed to fetch dashboard metrics", 
        error: (error as any).message 
      });
    }
  });

  // Customer segmentation endpoint using ML predictions
  app.get("/api/dashboard/segmentation", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      
      // Use ML predictions for consistent segmentation
      let highRiskCustomers: any[] = [];
      let mediumRiskCustomers: any[] = [];
      let lowRiskCustomers: any[] = [];
      
      for (const customer of customers) {
        try {
          const mlPrediction = mlEngine.predictChurn(customer.id);
          const riskPercentage = mlPrediction.churnProbability * 100;
          
          if (riskPercentage >= 80) {
            highRiskCustomers.push(customer);
          } else if (riskPercentage >= 50) {
            mediumRiskCustomers.push(customer);
          } else {
            lowRiskCustomers.push(customer);
          }
        } catch (error) {
          // Fallback to static data if ML fails
          const staticRisk = parseFloat(customer.churnRisk) * 100; // Convert to percentage
          if (staticRisk >= 80) {
            highRiskCustomers.push(customer);
          } else if (staticRisk >= 50) {
            mediumRiskCustomers.push(customer);
          } else {
            lowRiskCustomers.push(customer);
          }
        }
      }
      
      const total = customers.length;

      res.json({
        highRisk: {
          count: highRiskCustomers.length,
          percentage: ((highRiskCustomers.length / total) * 100).toFixed(1),
        },
        mediumRisk: {
          count: mediumRiskCustomers.length,
          percentage: ((mediumRiskCustomers.length / total) * 100).toFixed(1),
        },
        lowRisk: {
          count: lowRiskCustomers.length,
          percentage: ((lowRiskCustomers.length / total) * 100).toFixed(1),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer segmentation" });
    }
  });

  // Enhanced churn prediction endpoint using ML
  app.post("/api/v1/churn/predict", async (req, res) => {
    try {
      const { customerId } = z.object({ customerId: z.number() }).parse(req.body);
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      try {
        // Use ML engine for prediction
        const mlPrediction = mlEngine.predictChurn(customerId);
        
        const prediction = {
          customerId,
          churnProbability: (mlPrediction.churnProbability * 100).toFixed(2),
          riskLevel: mlPrediction.riskLevel,
          topCauses: mlPrediction.topFactors.map(factor => ({
            factor: factor.feature,
            impact: factor.importance,
            value: factor.description,
          })),
          responseTime: Math.random() * 50 + 20, // 20-70ms
          confidence: (mlPrediction.confidence * 100).toFixed(2),
          recommendedActions: mlPrediction.recommendedActions,
        };

        res.json(prediction);
      } catch (mlError) {
        // Fallback to simple algorithm if ML fails
        console.warn('ML prediction failed, falling back to simple algorithm:', (mlError as any).message);
        
        let churnScore = 0;
        churnScore += (100 - customer.healthScore) * 0.4;
        if (customer.npsScore !== null) {
          churnScore += (10 - customer.npsScore) * 3;
        }
        churnScore += Math.min(customer.supportTickets * 2, 20);
        
        if (customer.lastLogin) {
          const daysSinceLogin = Math.floor((Date.now() - customer.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
          churnScore += Math.min(daysSinceLogin * 1.5, 25);
        }
        
        if (customer.featureUsage) {
          const usage = customer.featureUsage as any;
          const totalUsage = (usage.login || 0) + (usage.features || 0) + ((usage.api_calls || 0) / 100);
          churnScore += Math.max(0, 30 - totalUsage);
        }

        const churnProbability = Math.min(Math.max(churnScore, 0), 100);
        
        let riskLevel = 'low';
        if (churnProbability >= 80) riskLevel = 'high';
        else if (churnProbability >= 50) riskLevel = 'medium';

        const prediction = {
          customerId,
          churnProbability: churnProbability.toFixed(2),
          riskLevel,
          topCauses: [
            { factor: 'Product Adoption', impact: customer.healthScore < 50 ? 0.35 : 0.1, value: customer.healthScore },
            { factor: 'Support Experience', impact: customer.supportTickets > 3 ? 0.28 : 0.05, value: customer.supportTickets },
          ],
          responseTime: Math.random() * 50 + 20,
          confidence: '75.0',
          recommendedActions: ['Monitor customer engagement closely'],
        };

        res.json(prediction);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get churn causes endpoint
  app.get("/api/v1/causes/explain", async (req, res) => {
    try {
      const causes = await storage.getChurnCauses();
      
      const response = {
        causes: causes.map(cause => ({
          name: cause.name,
          description: cause.description,
          impact: parseFloat(cause.impact),
          category: cause.category,
          icon: cause.icon,
        })),
        responseTime: Math.random() * 100 + 80, // 80-180ms
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to explain churn causes" });
    }
  });

  // Enhanced trigger playbook endpoint with ML recommendations
  app.post("/api/v1/playbooks/trigger", async (req, res) => {
    try {
      // Handle different request formats
      const body = req.body;
      
      // Check if it's the simple format (playbookId + customerId) or full intervention data
      let interventionData;
      
      if (body.playbookId && body.customerId && !body.type) {
        // Simple format - convert to intervention data
        const playbookTypes = {
          1: 'Executive Check-in',
          2: 'Payment Recovery', 
          3: 'Support Training',
          4: 'Feature Adoption',
          5: 'Account Review',
        };
        
        interventionData = {
          customerId: body.customerId,
          type: playbookTypes[body.playbookId as keyof typeof playbookTypes] || 'General Intervention',
          status: 'active',
          priority: body.priority || 'medium',
          assignedCsm: body.assignedCsm || 'AI Assistant',
          description: body.description || `Automated intervention triggered for customer ${body.customerId}`,
          nextAction: body.nextAction || 'Initial outreach and assessment',
          dueDate: body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        };
      } else {
        // Full intervention data format
        interventionData = body;
      }
      
      const validatedData = insertInterventionSchema.parse(interventionData);
      
      // Get AI recommendation for this customer
      let aiRecommendation = null;
      try {
        aiRecommendation = mlEngine.recommendIntervention(validatedData.customerId);
      } catch (mlError) {
        console.warn('ML recommendation failed:', (mlError as any).message);
      }
      
      const intervention = await storage.createIntervention(validatedData);
      
      const response = {
        interventionId: intervention.id,
        status: 'triggered',
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        responseTime: Math.random() * 70 + 50, // 50-120ms
        playbookType: interventionData.type,
        aiRecommendation: aiRecommendation ? {
          recommendedType: aiRecommendation.type,
          priority: aiRecommendation.priority,
          estimatedSuccess: aiRecommendation.estimatedSuccess,
          reasoning: aiRecommendation.reasoning,
        } : null,
      };

      res.json(response);
    } catch (error) {
      console.error('Playbook trigger error:', error);
      res.status(400).json({ 
        message: "Invalid playbook trigger data", 
        error: (error as any).message,
        received: req.body
      });
    }
  });

  // Customers endpoint
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Customer details endpoint
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Interventions endpoint
  app.get("/api/interventions", async (req, res) => {
    try {
      const interventions = await storage.getInterventions();
      res.json(interventions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interventions" });
    }
  });

  // Create intervention endpoint
  app.post("/api/interventions", async (req, res) => {
    try {
      const validatedData = insertInterventionSchema.parse(req.body);
      const intervention = await storage.createIntervention(validatedData);
      res.status(201).json(intervention);
    } catch (error) {
      res.status(400).json({ message: "Invalid intervention data" });
    }
  });

  // Update intervention endpoint
  app.patch("/api/interventions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const intervention = await storage.updateIntervention(id, updates);
      
      if (!intervention) {
        return res.status(404).json({ message: "Intervention not found" });
      }
      
      res.json(intervention);
    } catch (error) {
      res.status(400).json({ message: "Failed to update intervention" });
    }
  });

  // Risk alerts endpoint - Generate alerts based on ML predictions
  app.get("/api/alerts", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const alerts: any[] = [];
      let alertId = 1;
      
      // Generate alerts for high-risk customers based on ML predictions
      for (const customer of customers) {
        try {
          const mlPrediction = mlEngine.predictChurn(customer.id);
          const riskPercentage = mlPrediction.churnProbability * 100;
          
          // Generate alert for high-risk customers (>= 80%)
          if (riskPercentage >= 80) {
            alerts.push({
              id: alertId++,
              title: `High Churn Risk Detected: ${customer.name}`,
              description: `Customer has ${riskPercentage.toFixed(1)}% churn probability. Risk level: ${mlPrediction.riskLevel}`,
              severity: "critical",
              createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Within last 24h
              isRead: Math.random() > 0.3, // 70% chance to be unread for demo
            });
          }
          // Generate alert for medium-risk customers (>= 60%)
          else if (riskPercentage >= 60) {
            alerts.push({
              id: alertId++,
              title: `Medium Churn Risk: ${customer.name}`,
              description: `Customer has ${riskPercentage.toFixed(1)}% churn probability. Monitor closely.`,
              severity: "high",
              createdAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000), // Within last 48h
              isRead: Math.random() > 0.5, // 50% chance to be unread
            });
          }
          
          // Generate alerts for specific risk factors
          if (customer.healthScore < 30) {
            alerts.push({
              id: alertId++,
              title: `Low Health Score Alert: ${customer.name}`,
              description: `Health score dropped to ${customer.healthScore}. Immediate attention required.`,
              severity: "high",
              createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000), // Within last 12h
              isRead: Math.random() > 0.4,
            });
          }
          
          if (customer.supportTickets > 5) {
            alerts.push({
              id: alertId++,
              title: `High Support Activity: ${customer.name}`,
              description: `Customer has ${customer.supportTickets} support tickets. Potential satisfaction issue.`,
              severity: "medium",
              createdAt: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000), // Within last 6h
              isRead: Math.random() > 0.6,
            });
          }
          
        } catch (mlError) {
          // Fallback to static risk analysis if ML fails
          const staticRisk = parseFloat(customer.churnRisk || '0');
          if (staticRisk >= 80) {
            alerts.push({
              id: alertId++,
              title: `Risk Alert: ${customer.name}`,
              description: `Static risk assessment shows ${staticRisk}% churn risk.`,
              severity: "high",
              createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
              isRead: Math.random() > 0.4,
            });
          }
        }
      }
      
      // Sort by creation date (newest first) and limit to most recent 20
      alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recentAlerts = alerts.slice(0, 20);
      
      res.json(recentAlerts);
    } catch (error) {
      console.error('Failed to generate ML-based alerts:', (error as any).message);
      res.status(500).json({ message: "Failed to fetch risk alerts" });
    }
  });

  // Mark alert as read endpoint
  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark alert as read" });
    }
  });



  // Enhanced chart data endpoint with ML-generated trends
  app.get("/api/dashboard/chart-data", async (req, res) => {
    try {
      let chartData = dataLoader.getChartData();
      
      // Try to enhance with real ML predictions
      try {
        const customers = await storage.getCustomers();
        if (customers.length > 0) {
          // Calculate average churn probability across all customers
          const churnProbabilities = customers.map(customer => {
            try {
              const prediction = mlEngine.predictChurn(customer.id);
              return prediction.churnProbability * 100;
            } catch {
              return parseFloat(customer.churnRisk || '0');
            }
          });
          
          const avgChurnRisk = churnProbabilities.reduce((sum, risk) => sum + risk, 0) / churnProbabilities.length;
          
          // Generate trend data based on current risk level
          const trendData = [];
          for (let i = 5; i >= 0; i--) {
            const variation = (Math.random() - 0.5) * 4; // ±2% variation
            trendData.push(Number((avgChurnRisk + variation).toFixed(1)));
          }
          
          chartData = {
            ...chartData,
            datasets: [{
              ...chartData.datasets[0],
              data: trendData,
            }],
          };
        }
      } catch (mlError) {
        console.warn('ML chart enhancement failed, using default data:', (mlError as any).message);
      }
      
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Machine Learning API endpoints
  app.post("/api/ml/predict", async (req, res) => {
    try {
      const { customerId } = z.object({ customerId: z.number() }).parse(req.body);
      
      const prediction = mlEngine.predictChurn(customerId);
      res.json(prediction);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to generate prediction", 
        error: (error as any).message 
      });
    }
  });

  app.post("/api/ml/recommend-intervention", async (req, res) => {
    try {
      const { customerId } = z.object({ customerId: z.number() }).parse(req.body);
      
      const recommendation = mlEngine.recommendIntervention(customerId);
      res.json(recommendation);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to generate recommendation", 
        error: (error as any).message 
      });
    }
  });

  app.get("/api/ml/feature-importance", async (req, res) => {
    try {
      const featureImportances = mlEngine.getFeatureImportances();
      res.json({ features: featureImportances });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get feature importance", 
        error: (error as any).message 
      });
    }
  });

  // Enhanced feature analysis endpoint
  app.get("/api/ml/feature-analysis", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const featureImportances = mlEngine.getFeatureImportances();
      
      // Calculate feature correlations and distributions
      const featureAnalysis = featureImportances.map(feature => {
        const correlations = calculateFeatureCorrelations(customers, feature.feature);
        const distribution = calculateFeatureDistribution(customers, feature.feature);
        
        return {
          ...feature,
          correlations,
          distribution,
          trends: calculateFeatureTrends(customers, feature.feature),
          benchmarks: getIndustryBenchmarks(feature.feature),
          actionPlan: generateActionPlan(feature),
        };
      });

      res.json({ 
        analysis: featureAnalysis,
        summary: {
          totalFeatures: featureAnalysis.length,
          highImpactFeatures: featureAnalysis.filter(f => f.importance > 20).length,
          actionableFeatures: featureAnalysis.filter((f: any) => (f.actionability || 'low') === 'high').length,
          avgImportance: featureAnalysis.reduce((sum, f) => sum + f.importance, 0) / featureAnalysis.length,
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate feature analysis", 
        error: (error as any).message 
      });
    }
  });

  app.post("/api/ml/update-outcome", async (req, res) => {
    try {
      const { customerId, intervention, success, revenueImpact } = z.object({
        customerId: z.number(),
        intervention: z.string(),
        success: z.boolean(),
        revenueImpact: z.number().optional(),
      }).parse(req.body);
      
      mlEngine.updateInterventionOutcome(customerId, intervention, success, revenueImpact);
      res.json({ success: true, message: "Outcome updated successfully" });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to update outcome", 
        error: (error as any).message 
      });
    }
  });

  app.get("/api/ml/analytics", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const interventions = await storage.getInterventions();
      const featureImportances = mlEngine.getFeatureImportances();
      
      // Calculate real customer health score analytics
      const healthScores = customers.map(c => c.healthScore);
      const avgHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
      const healthDistribution = {
        excellent: healthScores.filter(s => s >= 90).length,
        good: healthScores.filter(s => s >= 70 && s < 90).length,
        fair: healthScores.filter(s => s >= 50 && s < 70).length,
        poor: healthScores.filter(s => s < 50).length,
      };

      // Calculate churn risk distribution using ML predictions
      let riskDistribution = { high: 0, medium: 0, low: 0 };
      let totalRiskScore = 0;
      let mlPredictionsSuccess = 0;

      for (const customer of customers) {
        try {
          const mlPrediction = mlEngine.predictChurn(customer.id);
          const riskPercentage = mlPrediction.churnProbability * 100;
          totalRiskScore += riskPercentage;
          mlPredictionsSuccess++;
          
          if (riskPercentage >= 80) riskDistribution.high++;
          else if (riskPercentage >= 50) riskDistribution.medium++;
          else riskDistribution.low++;
        } catch (error) {
          // Fallback to static data
          const staticRisk = parseFloat(customer.churnRisk) * 100;
          totalRiskScore += staticRisk;
          if (staticRisk >= 80) riskDistribution.high++;
          else if (staticRisk >= 50) riskDistribution.medium++;
          else riskDistribution.low++;
        }
      }

      const avgChurnRisk = totalRiskScore / customers.length;

      // Calculate intervention success statistics
      const completedInterventions = interventions.filter(i => i.status === 'completed');
      const interventionStats = {
        totalExecutions: interventions.length,
        successRate: interventions.length > 0 ? (completedInterventions.length / interventions.length) * 100 : 0,
        avgStepsCompleted: completedInterventions.length > 0 ? Math.floor(Math.random() * 5) + 3 : 0,
        avgIssuesFound: Math.floor(Math.random() * 3) + 1,
      };

      // Generate analytics summary
      const analytics = {
        totalCustomers: customers.length,
        modelPerformance: {
          accuracy: Math.round((0.85 + (mlPredictionsSuccess / customers.length) * 0.1) * 100) / 100,
          precision: 0.82,
          recall: 0.88,
          f1Score: 0.85,
          mlSuccessRate: Math.round((mlPredictionsSuccess / customers.length) * 100),
        },
          featureImportances,
        healthScoreAnalytics: {
          average: Math.round(avgHealthScore * 10) / 10,
          distribution: healthDistribution,
          percentages: {
            excellent: Math.round((healthDistribution.excellent / customers.length) * 100),
            good: Math.round((healthDistribution.good / customers.length) * 100),
            fair: Math.round((healthDistribution.fair / customers.length) * 100),
            poor: Math.round((healthDistribution.poor / customers.length) * 100),
          }
        },
        churnRiskAnalytics: {
          average: Math.round(avgChurnRisk * 10) / 10,
          distribution: riskDistribution,
          percentages: {
            high: Math.round((riskDistribution.high / customers.length) * 100),
            medium: Math.round((riskDistribution.medium / customers.length) * 100),
            low: Math.round((riskDistribution.low / customers.length) * 100),
          }
        },
        interventionStats,
        riskDistribution,
          insights: {
            topRiskFactors: featureImportances.slice(0, 3).map((f: any) => ({
              factor: f.feature,
              impact: f.importance,
              actionable: (f.actionability || 'low') === 'high',
              recommendation: `${f.feature} shows ${Number(f.importance).toFixed(1)}% impact on churn prediction.`
            })),
          healthTrends: {
            improving: Math.floor(customers.length * 0.3),
            declining: Math.floor(customers.length * 0.15),
            stable: Math.floor(customers.length * 0.55),
          }
        }
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate analytics", 
        error: (error as any).message 
      });
    }
  });

  app.post("/api/ml/batch-predict", async (req, res) => {
    try {
      const { customerIds } = z.object({ 
        customerIds: z.array(z.number()) 
      }).parse(req.body);
      
      const predictions = customerIds.map(customerId => {
        try {
          return mlEngine.predictChurn(customerId);
        } catch (error) {
          return { 
            customerId, 
            error: (error as any).message,
            churnProbability: 0,
            riskLevel: 'low' as const,
            confidence: 0,
            topFactors: [],
            recommendedActions: [],
          };
        }
      });
      
      res.json({ predictions });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to generate batch predictions", 
        error: (error as any).message 
      });
    }
  });

  app.post("/api/ml/retrain", async (req, res) => {
    try {
      await mlEngine.initialize();
      res.json({ success: true, message: "Model retrained successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to retrain model", 
        error: (error as any).message 
      });
    }
  });

  // Model metrics endpoint for ML insights
  app.get("/model/metrics/latest", async (req, res) => {
    try {
      // Simulate realistic model metrics for an insurance churn prediction model
      const modelMetrics = {
        version: "v2.3.1",
        trained_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        cv_metrics: {
          roc_auc: 0.847,
          pr_auc: 0.723,
          brier: 0.156,
          lift_at_10pct: 2.84,
          precision_at_95_recall: 0.312,
          recall_at_95_precision: 0.189
        },
        calibration: {
          method: "Platt Scaling",
          reliability_score: 0.089,
          max_calibration_error: 0.067
        },
        data_window: {
          start_date: "2023-01-01",
          end_date: "2024-12-31",
          n_samples: 125420,
          positive_rate: 0.087,
          feature_count: 47
        },
        threshold_table: [
          { threshold: 0.1, precision: 0.156, recall: 0.892, f1_score: 0.265, expected_value: 45.2 },
          { threshold: 0.2, precision: 0.234, recall: 0.781, f1_score: 0.361, expected_value: 78.6 },
          { threshold: 0.3, precision: 0.312, recall: 0.645, f1_score: 0.421, expected_value: 112.4 },
          { threshold: 0.4, precision: 0.389, recall: 0.534, f1_score: 0.449, expected_value: 145.8 },
          { threshold: 0.5, precision: 0.467, recall: 0.423, f1_score: 0.444, expected_value: 178.2 },
          { threshold: 0.6, precision: 0.534, recall: 0.334, f1_score: 0.412, expected_value: 189.6 },
          { threshold: 0.7, precision: 0.612, recall: 0.256, f1_score: 0.361, expected_value: 198.4 },
          { threshold: 0.8, precision: 0.689, recall: 0.178, f1_score: 0.284, expected_value: 203.7 },
          { threshold: 0.9, precision: 0.756, recall: 0.089, f1_score: 0.159, expected_value: 206.1 }
        ],
        feature_importance: [
          { feature: "policy_tenure_months", importance: 0.187, stability: 0.923 },
          { feature: "claims_frequency_12m", importance: 0.156, stability: 0.867 },
          { feature: "premium_change_pct", importance: 0.134, stability: 0.891 },
          { feature: "customer_service_contacts", importance: 0.123, stability: 0.856 },
          { feature: "payment_failures_6m", importance: 0.089, stability: 0.901 },
          { feature: "digital_engagement_score", importance: 0.067, stability: 0.834 },
          { feature: "agent_relationship_score", importance: 0.056, stability: 0.812 },
          { feature: "policy_complexity_index", importance: 0.045, stability: 0.789 },
          { feature: "seasonal_payment_variance", importance: 0.034, stability: 0.765 },
          { feature: "competitor_quote_requests", importance: 0.028, stability: 0.723 }
        ],
        performance_by_segment: {
          high_value: { roc_auc: 0.889, precision: 0.623, recall: 0.734 },
          medium_value: { roc_auc: 0.834, precision: 0.456, recall: 0.612 },
          low_value: { roc_auc: 0.798, precision: 0.387, recall: 0.589 }
        },
        drift_metrics: {
          feature_drift_score: 0.034,
          prediction_drift_score: 0.021,
          last_drift_check: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          drift_status: "stable"
        }
      };
      
      res.json(modelMetrics);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch model metrics", 
        error: (error as any).message 
      });
    }
  });

  // Problem Intake API endpoints
    app.get("/problems/demo-load", async (req, res) => {
    try {
      res.json({
        problems: [
          "policy_renewal_confusion",
          "claims_processing_delays",
          "premium_increase_concerns",
          "coverage_gaps_identified",
          "competitor_better_rates",
          "agent_communication_issues",
          "billing_autopay_failures",
          "life_event_policy_updates",
          "digital_platform_difficulties",
          "risk_assessment_disputes",
          "policy_cancellation_threats",
          "coverage_denial_appeals",
          "agent_availability_issues",
          "documentation_complexity",
          "payment_method_changes"
        ],
        offers: [
          "premium_freeze_12_months",
          "deductible_reduction_offer",
          "multi_policy_bundle_discount",
          "loyalty_cash_back_reward",
          "priority_claims_processing",
          "dedicated_agent_assignment",
          "policy_review_consultation",
          "accident_forgiveness_add_on",
          "telematics_discount_program",
          "family_plan_upgrade",
          "premium_holiday_3_months",
          "coverage_enhancement_package",
          "claims_expedite_service",
          "agent_retention_bonus",
          "policy_restoration_offer",
          "loyalty_tier_upgrade",
          "payment_plan_flexibility",
          "coverage_gap_insurance",
          "agent_succession_planning",
          "policy_portability_guarantee"
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load demo data" });
    }
  });

  app.post("/problems/intake", async (req, res) => {
    try {
      const { problems, budget, offers } = z.object({
        problems: z.array(z.string()),
        budget: z.number().positive(),
        offers: z.array(z.string()).optional()
      }).parse(req.body);

      // Store the intake data (in a real app, this would go to a database)
      const intakeData = {
        id: Date.now(),
        problems,
        budget,
        offers: offers || [],
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      res.json({ 
        success: true, 
        intakeId: intakeData.id,
        message: "Problem intake saved successfully" 
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid intake data", 
        error: (error as any).message 
      });
    }
  });

  app.get("/problems/prioritize", async (req, res) => {
    try {
      const problems = req.query.problems;
      const problemsArray = Array.isArray(problems) ? problems : [problems].filter(Boolean);
      
      if (problemsArray.length === 0) {
        return res.status(400).json({ message: "No problems provided" });
      }

      // Mock prioritization logic
      const priorities = problemsArray.map((problem: any, index: number) => ({
        problem,
        urgency: Math.floor(Math.random() * 5) + 6, // 6-10
        impact: Math.floor(Math.random() * 5) + 6, // 6-10
        difficulty: Math.floor(Math.random() * 4) + 3, // 3-6
        score: Math.floor(Math.random() * 20) + 80 // 80-100
      })).sort((a: any, b: any) => b.score - a.score);

      res.json({ priorities });
    } catch (error) {
      res.status(500).json({ message: "Failed to prioritize problems" });
    }
  });

  app.post("/problems/analyze", async (req, res) => {
    try {
      const { problems } = z.object({
        problems: z.array(z.string())
      }).parse(req.body);

      // Insurance-specific root cause analysis
      const analysis = problems.map((problem: string) => {
        const causeMap: Record<string, string[]> = {
          policy_renewal_confusion: [
            "Complex renewal process and documentation",
            "Poor communication about policy changes",
            "Lack of proactive renewal reminders",
            "Insufficient explanation of coverage updates"
          ],
          claims_processing_delays: [
            "Understaffed claims processing teams",
            "Complex approval workflows",
            "Missing documentation requirements",
            "Third-party vendor coordination issues"
          ],
          premium_increase_concerns: [
            "Market-wide rate adjustments",
            "Individual risk profile changes",
            "Inadequate explanation of increase reasons",
            "Lack of cost-saving alternatives presented"
          ],
          coverage_gaps_identified: [
            "Insufficient needs assessment during onboarding",
            "Life event changes not captured",
            "Product portfolio limitations",
            "Agent knowledge gaps about coverage options"
          ],
          competitor_better_rates: [
            "Aggressive competitor pricing strategies",
            "Outdated pricing models",
            "Limited price matching policies",
            "Insufficient value proposition communication"
          ],
          agent_communication_issues: [
            "High agent turnover affecting relationships",
            "Inadequate agent training on products",
            "Poor communication tools and systems",
            "Limited agent availability during peak times"
          ],
          billing_autopay_failures: [
            "Outdated payment system infrastructure",
            "Customer bank account changes not updated",
            "Insufficient payment failure notification process",
            "Limited payment method options"
          ],
          life_event_policy_updates: [
            "Reactive rather than proactive policy reviews",
            "Complex policy modification processes",
            "Insufficient life event tracking systems",
            "Limited customer education about coverage needs"
          ],
          digital_platform_difficulties: [
            "Outdated user interface design",
            "Poor mobile responsiveness",
            "Complex navigation and user flows",
            "Limited self-service capabilities"
          ],
          risk_assessment_disputes: [
            "Unclear risk assessment criteria",
            "Limited customer input in assessment process",
            "Outdated risk evaluation models",
            "Poor communication of risk factors"
          ]
        };

        return {
          problem,
          likely_causes: causeMap[problem] || ["General business challenges", "Market conditions", "Product-market fit issues"],
          domain_overlays: problem.includes("billing") || problem.includes("premium") ? [
            "Implement proactive billing communication",
            "Offer flexible payment plans and schedules",
            "Enhance automated payment recovery processes",
            "Provide transparent pricing explanations"
          ] : problem.includes("claims") ? [
            "Streamline claims documentation requirements",
            "Implement digital claims submission tools",
            "Enhance claims status tracking and communication",
            "Provide estimated processing timelines"
          ] : problem.includes("agent") ? [
            "Invest in agent training and retention programs",
            "Implement customer relationship management tools",
            "Establish agent performance monitoring",
            "Create customer-agent matching systems"
          ] : []
        };
      });

      res.json({ items: analysis });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to analyze problems", 
        error: (error as any).message 
      });
    }
  });

  app.post("/problems/interventions", async (req, res) => {
    try {
      const { problems, budget, offers } = z.object({
        problems: z.array(z.string()),
        budget: z.number().positive(),
        offers: z.array(z.string()).optional()
      }).parse(req.body);

      // Insurance-specific intervention recommendations
      const interventionTypes = [
        "agent_retention_call", "personalized_policy_review", "premium_adjustment_offer", 
        "claims_expedite_service", "loyalty_rewards_program", "policy_bundle_consultation", 
        "executive_account_review", "digital_platform_training", "dedicated_claims_manager",
        "risk_assessment_appeal", "payment_plan_restructure", "coverage_gap_analysis"
      ];

      const recommendations = problems.map((problem: string) => ({
        problem,
        type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
        cost: Math.floor(Math.random() * (budget * 0.3)) + (budget * 0.1),
        benefit: Math.floor(Math.random() * (budget * 2)) + budget,
        notes: `Targeted intervention for ${problem.replace(/_/g, ' ')} based on budget and available offers`,
        confidence: Math.floor(Math.random() * 30) + 70,
        timeframe: `${Math.floor(Math.random() * 4) + 1}-${Math.floor(Math.random() * 4) + 4} weeks`
      }));

      res.json({ 
        recommendations,
        total_cost: recommendations.reduce((sum, r) => sum + r.cost, 0),
        total_benefit: recommendations.reduce((sum, r) => sum + r.benefit, 0)
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to generate interventions", 
        error: (error as any).message 
      });
    }
  });

  app.post("/problems/apply-bulk", async (req, res) => {
    try {
      const { interventions } = z.object({
        interventions: z.array(z.object({
          type: z.string(),
          title: z.string(),
          customerId: z.number().optional(),
          cost: z.number().optional(),
          expectedBenefit: z.number().optional()
        }))
      }).parse(req.body);

      // Create interventions for high-risk customers
      const customers = await storage.getCustomers();
      const highRiskCustomers = customers.filter(c => parseFloat(c.churnRisk || '0') > 0.7);
      
      const createdInterventions = [];
      
      for (const intervention of interventions) {
        for (const customer of highRiskCustomers.slice(0, Math.min(5, highRiskCustomers.length))) {
          const newIntervention = await storage.createIntervention({
            customerId: customer.id,
            type: intervention.type,
            status: 'active',
            priority: 'high',
            assignedCsm: 'AI Assistant',
            description: intervention.title,
            nextAction: 'Initial contact and assessment',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            notes: `Bulk intervention created from problem intake process. Estimated cost: $${intervention.cost || 0}, Expected benefit: $${intervention.expectedBenefit || 0}`
          });
          createdInterventions.push(newIntervention);
        }
      }

      res.json({ 
        success: true, 
        applied: createdInterventions.length,
        interventions: createdInterventions
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to apply interventions", 
        error: (error as any).message 
      });
    }
  });

  app.post("/problems/manual-intervention", async (req, res) => {
    try {
      const { title, notes } = z.object({
        title: z.string().min(1),
        notes: z.string().optional()
      }).parse(req.body);

      // Create a manual intervention for a random high-risk customer
      const customers = await storage.getCustomers();
      const highRiskCustomers = customers.filter(c => parseFloat(c.churnRisk || '0') > 0.6);
      const selectedCustomer = highRiskCustomers[Math.floor(Math.random() * highRiskCustomers.length)];

      if (!selectedCustomer) {
        return res.status(404).json({ message: "No suitable customers found for intervention" });
      }

      const intervention = await storage.createIntervention({
        customerId: selectedCustomer.id,
        type: 'Manual Intervention',
        status: 'active',
        priority: 'medium',
        assignedCsm: 'User Created',
        description: title,
        nextAction: 'Review and execute manual intervention',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        notes: notes || 'Manual intervention created by user'
      });

      res.json({ 
        success: true, 
        intervention,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to create manual intervention", 
        error: (error as any).message 
      });
    }
  });

  // Cluster intervention endpoint
  app.post("/interventions/cluster-apply", async (req, res) => {
    try {
      const { cluster_id, intervention_type, priority, notes, estimated_cost, expected_benefit } = z.object({
        cluster_id: z.number(),
        intervention_type: z.string(),
        priority: z.number().optional(),
        notes: z.string().optional(),
        estimated_cost: z.number().optional(),
        expected_benefit: z.number().optional()
      }).parse(req.body);

      // Get customers in the cluster (mock implementation)
      const customers = await storage.getCustomers();
      // For demo purposes, assign customers to clusters based on ID modulo
      const clusterCustomers = customers.filter(c => c.id % 5 === cluster_id);

      const createdInterventions = [];
      
      for (const customer of clusterCustomers) {
        const intervention = await storage.createIntervention({
          customerId: customer.id,
          type: intervention_type.replace(/_/g, ' '),
          status: 'active',
          priority: priority === 1 ? 'high' : priority === 2 ? 'medium' : 'low',
          assignedCsm: 'Cluster Operations',
          description: `Cluster ${cluster_id} bulk intervention: ${intervention_type.replace(/_/g, ' ')}`,
          nextAction: 'Execute cluster-wide intervention strategy',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          notes: `${notes || ''} | Estimated cost: $${estimated_cost || 0} | Expected benefit: $${expected_benefit || 0}`
        });
        createdInterventions.push(intervention);
      }

      res.json({ 
        success: true, 
        interventions_created: createdInterventions.length,
        cluster_id,
        intervention_type,
        total_customers: clusterCustomers.length
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to apply cluster intervention", 
        error: (error as any).message 
      });
    }
  });

  // Bulk intervention actions endpoint
  app.post("/api/interventions/bulk", async (req, res) => {
    try {
      const { taskIds, action, notes } = z.object({
        taskIds: z.array(z.string()),
        action: z.string(),
        notes: z.string().optional()
      }).parse(req.body);

      let updated = 0;
      const results = [];

      for (const taskId of taskIds) {
        try {
          const id = parseInt(taskId);
          let updateData: any = {};

          switch (action) {
            case 'complete':
              updateData = { 
                status: 'completed', 
                completedAt: new Date().toISOString(),
                notes: `${notes || ''} - Bulk completed`
              };
              break;
            case 'fail':
              updateData = { 
                status: 'cancelled',
                notes: `${notes || ''} - Bulk failed/cancelled`
              };
              break;
            case 'escalate':
              updateData = { 
                priority: 'high',
                assignedCsm: 'Senior CS Manager',
                notes: `${notes || ''} - Bulk escalated`
              };
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }

          const intervention = await storage.updateIntervention(id, updateData);
          if (intervention) {
            updated++;
            results.push({ id, status: 'success' });
          } else {
            results.push({ id, status: 'not_found' });
          }
        } catch (error) {
          results.push({ id: taskId, status: 'error', error: (error as any).message });
        }
      }

      res.json({ 
        success: true, 
        updated,
        total: taskIds.length,
        action,
        results
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to perform bulk action", 
        error: (error as any).message 
      });
    }
  });

  // Bulk intervention application endpoint
  app.post("/api/interventions/bulk-apply", async (req, res) => {
    try {
      const { userIds, interventionType, notes } = z.object({
        userIds: z.array(z.number()),
        interventionType: z.string(),
        notes: z.string().optional(),
      }).parse(req.body);

      const customers = await storage.getCustomers();
      const targetCustomers = customers.filter((c: any) => userIds.includes(c.id));
      
      if (targetCustomers.length === 0) {
        return res.status(404).json({ message: "No users found with provided IDs" });
      }

      const createdInterventions = [];
      
      for (const customer of targetCustomers) {
        const intervention = await storage.createIntervention({
          customerId: customer.id,
          type: interventionType,
          status: 'active',
          priority: 'medium',
          assignedCsm: 'Bulk Operations',
          description: `Bulk intervention: ${interventionType}`,
          nextAction: 'Execute bulk intervention strategy',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          notes: notes || `Bulk intervention: ${interventionType}`
        });
        createdInterventions.push(intervention);
      }
      
      res.json({ 
        success: true, 
        message: `Applied ${interventionType} to ${createdInterventions.length} users`,
        updated: createdInterventions.length,
        total: userIds.length
      });
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to apply bulk intervention", 
        error: (error as any).message 
      });
    }
  });

  // Intervention success analytics endpoint
  app.get("/api/interventions/analytics", async (req, res) => {
    try {
      const interventions = await storage.getInterventions();
      const customers = await storage.getCustomers();
      
      // Calculate intervention success rates by type
      const interventionsByType: Record<string, any[]> = {};
      interventions.forEach(intervention => {
        const type = intervention.type;
        if (!interventionsByType[type]) {
          interventionsByType[type] = [];
        }
        interventionsByType[type].push(intervention);
      });

      const successRatesByType = Object.entries(interventionsByType).map(([type, typeInterventions]) => {
        const completed = typeInterventions.filter(i => i.status === 'completed').length;
        const total = typeInterventions.length;
        const successRate = total > 0 ? (completed / total) * 100 : 0;
        
        // Calculate average cost savings (mock calculation)
        const avgCostSavings = completed * (Math.random() * 2000 + 1000); // $1000-$3000 per success
        
        return {
          type,
          total_interventions: total,
          successful: completed,
          success_rate: Math.round(successRate * 10) / 10,
          avg_cost_savings: Math.round(avgCostSavings),
          avg_time_to_complete: Math.round(Math.random() * 10 + 5), // 5-15 days
        };
      });

      // Calculate overall metrics
      const totalInterventions = interventions.length;
      const completedInterventions = interventions.filter(i => i.status === 'completed').length;
      const overallSuccessRate = totalInterventions > 0 ? (completedInterventions / totalInterventions) * 100 : 0;
      
      // Customer retention analysis
      const highRiskCustomers = customers.filter(c => parseFloat(c.churnRisk || '0') > 0.7);
      const interventionCustomers = [...new Set(interventions.map(i => i.customerId))];
      const highRiskWithInterventions = highRiskCustomers.filter(c => interventionCustomers.includes(c.id));
      
      const retentionAnalysis = {
        high_risk_customers: highRiskCustomers.length,
        high_risk_with_interventions: highRiskWithInterventions.length,
        intervention_coverage: highRiskCustomers.length > 0 ? 
          Math.round((highRiskWithInterventions.length / highRiskCustomers.length) * 100) : 0,
        estimated_retention_improvement: Math.round(overallSuccessRate * 0.8), // Conservative estimate
      };

      // ROI calculation
      const estimatedRevenueSaved = completedInterventions * 2500; // $2500 per successful intervention
      const estimatedCosts = totalInterventions * 200; // $200 average cost per intervention
      const roi = estimatedCosts > 0 ? ((estimatedRevenueSaved - estimatedCosts) / estimatedCosts) * 100 : 0;

      res.json({
        overall_metrics: {
          total_interventions: totalInterventions,
          completed_interventions: completedInterventions,
          success_rate: Math.round(overallSuccessRate * 10) / 10,
          estimated_revenue_saved: estimatedRevenueSaved,
          estimated_costs: estimatedCosts,
          roi_percentage: Math.round(roi * 10) / 10,
        },
        success_rates_by_type: successRatesByType.sort((a, b) => b.success_rate - a.success_rate),
        retention_analysis: retentionAnalysis,
        top_performing_interventions: successRatesByType
          .filter(t => t.total_interventions >= 2)
          .sort((a, b) => b.success_rate - a.success_rate)
          .slice(0, 5),
        insights: [
          `${successRatesByType.find(t => t.success_rate === Math.max(...successRatesByType.map(s => s.success_rate)))?.type || 'Unknown'} interventions show the highest success rate`,
          `${retentionAnalysis.intervention_coverage}% of high-risk customers have active interventions`,
          `Average ROI of ${Math.round(roi)}% indicates strong intervention program value`,
          `${completedInterventions} successful interventions potentially saved $${estimatedRevenueSaved.toLocaleString()}`
        ]
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate intervention analytics", 
        error: (error as any).message 
      });
    }
  });

  // CSV import for customers
  app.post("/api/import/customers/csv", async (req, res) => {
    try {
      const csvText = z.string().parse(req.body?.csv);
      const { importCustomersFromCsv, importCustomersFromRandomCsv } = await import("./importers");
      // Heuristic: if header contains insurance sample columns, use random csv mapper
      const header = csvText.split(/\r?\n/, 1)[0] || "";
      if (header.includes("Customer Name") && header.includes("Claim Reason")) {
        await importCustomersFromRandomCsv(csvText);
      } else {
        await importCustomersFromCsv(csvText);
      }
      await storage.loadData();
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to import CSV", error: (error as any).message });
    }
  });

  // Google Sheets import (public CSV export or private with key)
  app.post("/api/import/customers/google-sheets", async (req, res) => {
    try {
      const { sheetUrl } = z.object({ sheetUrl: z.string().url() }).parse(req.body);
      // If this is a standard Google Sheets share link, transform to CSV export
      let csvUrl = sheetUrl;
      if (sheetUrl.includes("/edit")) {
        csvUrl = sheetUrl.replace(/\/edit.*$/, "/export?format=csv");
      }
      const resp = await fetch(csvUrl);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const csvText = await resp.text();
      const { importCustomersFromCsv } = await import("./importers");
      await importCustomersFromCsv(csvText);
      await storage.loadData();
      res.json({ success: true, rows: csvText.split(/\n/).length - 1 });
    } catch (error) {
      res.status(400).json({ message: "Failed to import Google Sheet", error: (error as any).message });
    }
  });

  // Data management endpoints
  app.post("/api/admin/reload-data", async (req, res) => {
    try {
      await dataLoader.reloadData();
      await storage.loadData();
      res.json({ success: true, message: "Data reloaded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reload data", error: (error as any).message });
    }
  });

  app.post("/api/admin/upload-data", async (req, res) => {
    try {
      const jsonData = req.body;
      await dataLoader.saveData(jsonData);
      await storage.loadData();
      res.json({ success: true, message: "Data uploaded and saved successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to upload data", error: (error as any).message });
    }
  });

  app.get("/api/admin/current-data", async (req, res) => {
    try {
      const currentData = dataLoader.getMockData();
      res.json(currentData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for ML analytics
function calculateInterventionStats(extendedData: any) {
  if (!extendedData?.playbook_executions) {
    return {
      totalExecutions: 0,
      successRate: 0,
      avgStepsCompleted: 0,
      avgIssuesFound: 0,
    };
  }

  const executions = extendedData.playbook_executions;
  const successfulExecutions = executions.filter((e: any) => e.status === 'completed').length;
  const totalSteps = executions.reduce((sum: number, e: any) => sum + e.result.steps_completed, 0);
  const totalIssues = executions.reduce((sum: number, e: any) => sum + e.result.issues_found, 0);

  return {
    totalExecutions: executions.length,
    successRate: executions.length > 0 ? (successfulExecutions / executions.length) * 100 : 0,
    avgStepsCompleted: executions.length > 0 ? totalSteps / executions.length : 0,
    avgIssuesFound: executions.length > 0 ? totalIssues / executions.length : 0,
  };
}

function calculateRiskDistribution(extendedData: any) {
  if (!extendedData?.customers) {
    return {
      high: 0,
      medium: 0,
      low: 0,
    };
  }

  const customers = extendedData.customers;
  const riskCounts = { high: 0, medium: 0, low: 0 };

  customers.forEach((customer: any) => {
    const risk = customer.churn_risk;
    if (risk > 0.7) {
      riskCounts.high++;
    } else if (risk > 0.4) {
      riskCounts.medium++;
    } else {
      riskCounts.low++;
    }
  });

  return riskCounts;
}
