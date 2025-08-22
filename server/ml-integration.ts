// Machine Learning Integration Interface
// This file provides the structure for future ML model integration

import { Customer } from "../shared/schema";
import { dataLoader } from "./data-loader";

export interface MLModelInterface {
  predict(customerData: CustomerFeatures): Promise<ChurnPrediction>;
  train(trainingData: TrainingDataPoint[]): Promise<void>;
  getFeatureImportance(): Promise<FeatureImportance[]>;
}

export interface CustomerFeatures {
  healthScore: number;
  npsScore?: number;
  supportTickets: number;
  featureUsage?: {
    login: number;
    features: number;
    api_calls: number;
  };
  daysSinceSignup: number;
  daysSinceLastLogin?: number;
  mrr: number;
  planType: string;
}

export interface ChurnPrediction {
  customerId: number;
  churnProbability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  topFactors: FeatureImportance[];
  recommendedActions: string[];
}

export interface TrainingDataPoint {
  features: CustomerFeatures;
  churnLabel: boolean; // true if customer churned
  timeToChurn?: number; // days until churn (if applicable)
}

export interface FeatureImportance {
  feature: string;
  importance: number; // 0-1
  impact: 'positive' | 'negative'; // positive = increases churn risk
}

export interface InterventionRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSuccess: number; // 0-1
  estimatedRevenueSaved: number;
  description: string;
}

export class MLDataPreprocessor {
  static extractFeatures(customer: Customer): CustomerFeatures {
    const signupDate = new Date(customer.signupDate);
    const daysSinceSignup = Math.floor(
      (Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysSinceLastLogin = customer.lastLogin
      ? Math.floor(
          (Date.now() - customer.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        )
      : undefined;

    return {
      healthScore: customer.healthScore,
      npsScore: customer.npsScore || undefined,
      supportTickets: customer.supportTickets,
      featureUsage: customer.featureUsage as any,
      daysSinceSignup,
      daysSinceLastLogin,
      mrr: parseFloat(customer.mrr),
      planType: customer.plan,
    };
  }

  static prepareTrainingData(customers: Customer[]): TrainingDataPoint[] {
    return customers.map(customer => ({
      features: this.extractFeatures(customer),
      churnLabel: parseFloat(customer.churnRisk) > 80, // Define churn threshold
      timeToChurn: undefined, // Would be calculated from historical data
    }));
  }
}

export class ReinforcementLearningAgent {
  // Placeholder for RL agent that optimizes intervention strategies
  
  async selectAction(
    customerFeatures: CustomerFeatures,
    availableInterventions: string[]
  ): Promise<string> {
    // Implement RL action selection logic
    // For now, return a simple rule-based approach
    if (customerFeatures.healthScore < 30) {
      return "Executive Check-in";
    } else if (customerFeatures.supportTickets > 5) {
      return "Support Recovery";
    } else {
      return "Engagement Boost";
    }
  }

  async updatePolicy(
    state: CustomerFeatures,
    action: string,
    reward: number,
    nextState?: CustomerFeatures
  ): Promise<void> {
    // Implement policy update logic (Q-learning, Actor-Critic, etc.)
    console.log(`Updating policy: ${action} -> reward: ${reward}`);
  }
}

// Export singleton instances for use in routes
export const mlPreprocessor = new MLDataPreprocessor();
export const rlAgent = new ReinforcementLearningAgent();

// Future ML API endpoints will use these interfaces:
/*
POST /api/ml/predict
Body: { customerId: number }
Response: ChurnPrediction

POST /api/ml/train
Body: { trainingData: TrainingDataPoint[] }
Response: { success: boolean, modelMetrics: any }

POST /api/ml/recommend-intervention
Body: { customerId: number }
Response: InterventionRecommendation

GET /api/ml/feature-importance
Response: FeatureImportance[]
*/