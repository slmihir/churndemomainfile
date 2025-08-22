// Machine Learning Engine with Random Forest and Reinforcement Learning
import { dataLoader } from "./data-loader";

export interface CustomerFeatures {
  healthScore: number;
  npsScore: number;
  supportTickets: number;
  featureUsageTotal: number;
  daysSinceSignup: number;
  daysSinceLastLogin: number;
  mrr: number;
  planValue: number; // Encoded plan type
  sessionCount: number;
  avgSessionDuration: number;
  totalPagesViewed: number;
}

export interface ChurnPrediction {
  customerId: number;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  topFactors: FeatureImportance[];
  recommendedActions: string[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  impact: 'positive' | 'negative';
  description: string;
}

export interface InterventionRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSuccess: number;
  estimatedRevenueSaved: number;
  description: string;
  reasoning: string;
}

// Simple Random Forest implementation (in production, use a proper ML library)
export class RandomForestPredictor {
  private trees: DecisionTree[] = [];
  private featureImportances: Map<string, number> = new Map();

  constructor(private numTrees: number = 10) {}

  train(features: CustomerFeatures[], labels: number[]): void {
    console.log(`🌲 Training Random Forest with ${this.numTrees} trees on ${features.length} samples`);
    
    this.trees = [];
    const featureImportanceSum = new Map<string, number>();

    for (let i = 0; i < this.numTrees; i++) {
      const tree = new DecisionTree();
      
      // Bootstrap sampling
      const bootstrapSample = this.bootstrapSample(features, labels);
      tree.train(bootstrapSample.features, bootstrapSample.labels);
      
      this.trees.push(tree);

      // Accumulate feature importances
      const treeImportances = tree.getFeatureImportances();
      for (const [feature, importance] of treeImportances.entries()) {
        featureImportanceSum.set(feature, (featureImportanceSum.get(feature) || 0) + importance);
      }
    }

    // Average feature importances
    for (const [feature, totalImportance] of featureImportanceSum.entries()) {
      this.featureImportances.set(feature, totalImportance / this.numTrees);
    }

    console.log('✅ Random Forest training completed');
  }

  predict(features: CustomerFeatures): ChurnPrediction {
    if (this.trees.length === 0) {
      throw new Error('Model not trained yet');
    }

    // Get predictions from all trees
    const predictions = this.trees.map(tree => tree.predict(features));
    const avgProbability = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
    
    // Calculate confidence as inverse of standard deviation
    const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - avgProbability, 2), 0) / predictions.length;
    const confidence = Math.max(0, 1 - Math.sqrt(variance));

    const riskLevel: 'low' | 'medium' | 'high' = 
      avgProbability > 0.7 ? 'high' : 
      avgProbability > 0.4 ? 'medium' : 'low';

    const topFactors = this.getTopFeatures(features);
    const recommendedActions = this.generateRecommendations(topFactors, riskLevel);

    return {
      customerId: 0, // Will be set by caller
      churnProbability: avgProbability,
      riskLevel,
      confidence,
      topFactors,
      recommendedActions,
    };
  }

  getFeatureImportances(): FeatureImportance[] {
    const importances = Array.from(this.featureImportances.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Calculate total importance for normalization
    const totalImportance = importances.reduce((sum, [, importance]) => sum + importance, 0);
    
    return importances
      .slice(0, 8) // Show top 8 features instead of 5
      .map(([feature, importance]) => {
        const normalizedImportance = (importance / totalImportance) * 100;
        return {
          feature: this.humanizeFeatureName(feature),
          importance: normalizedImportance,
          impact: this.determineImpact(feature),
          description: this.getFeatureDescription(feature),
          // augment with optional fields for server-side analytics where used
          // these are not part of the exported type but are consumed internally
          rawImportance: importance as any,
          confidenceLevel: this.calculateConfidenceLevel(normalizedImportance) as any,
          actionability: this.getActionability(feature) as any,
        } as any;
      });
  }

  private calculateConfidenceLevel(importance: number): 'high' | 'medium' | 'low' {
    if (importance >= 20) return 'high';
    if (importance >= 10) return 'medium';
    return 'low';
  }

  private getActionability(feature: string): 'high' | 'medium' | 'low' {
    const actionableFeatures = ['healthScore', 'featureUsage', 'supportTickets', 'npsScore'];
    const mediumActionable = ['lastLogin', 'accountAge'];
    
    if (actionableFeatures.includes(feature)) return 'high';
    if (mediumActionable.includes(feature)) return 'medium';
    return 'low';
  }

  private bootstrapSample(features: CustomerFeatures[], labels: number[]) {
    const sampleSize = features.length;
    const sampleFeatures: CustomerFeatures[] = [];
    const sampleLabels: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const randomIndex = Math.floor(Math.random() * features.length);
      sampleFeatures.push(features[randomIndex]);
      sampleLabels.push(labels[randomIndex]);
    }

    return { features: sampleFeatures, labels: sampleLabels };
  }

  private getTopFeatures(features: CustomerFeatures): FeatureImportance[] {
    const featureValues = this.extractFeatureArray(features);
    const featureNames = Object.keys(features);
    
    return featureNames
      .map((name, index) => ({
        feature: this.humanizeFeatureName(name),
        importance: this.featureImportances.get(name) || 0,
        impact: this.determineImpact(name),
        description: this.getFeatureDescription(name),
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3);
  }

  private generateRecommendations(topFactors: FeatureImportance[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Schedule immediate executive check-in');
      recommendations.push('Activate priority support channel');
    }

    topFactors.forEach(factor => {
      if (factor.feature.includes('Support')) {
        recommendations.push('Provide enhanced support training');
      } else if (factor.feature.includes('Usage')) {
        recommendations.push('Schedule product adoption session');
      } else if (factor.feature.includes('Health')) {
        recommendations.push('Conduct health score improvement review');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Monitor customer engagement closely');
    }

    return recommendations.slice(0, 3);
  }

  private humanizeFeatureName(feature: string): string {
    const mapping: Record<string, string> = {
      healthScore: 'Health Score',
      npsScore: 'NPS Score',
      supportTickets: 'Support Tickets',
      featureUsageTotal: 'Feature Usage',
      daysSinceSignup: 'Account Age',
      daysSinceLastLogin: 'Last Login',
      mrr: 'Monthly Revenue',
      planValue: 'Plan Tier',
      sessionCount: 'Session Activity',
      avgSessionDuration: 'Session Duration',
      totalPagesViewed: 'Page Views',
    };
    return mapping[feature] || feature;
  }

  private determineImpact(feature: string): 'positive' | 'negative' {
    const negativeFeatures = ['supportTickets', 'daysSinceLastLogin', 'daysSinceSignup'];
    return negativeFeatures.includes(feature) ? 'negative' : 'positive';
  }

  private getFeatureDescription(feature: string): string {
    const descriptions: Record<string, string> = {
      healthScore: 'Overall customer health metric',
      npsScore: 'Net Promoter Score feedback',
      supportTickets: 'Number of support requests',
      featureUsageTotal: 'Total feature engagement',
      daysSinceSignup: 'Account tenure',
      daysSinceLastLogin: 'Recent activity level',
      mrr: 'Monthly recurring revenue',
      planValue: 'Subscription tier value',
      sessionCount: 'User session frequency',
      avgSessionDuration: 'Average session length',
      totalPagesViewed: 'Platform exploration depth',
    };
    return descriptions[feature] || 'Feature metric';
  }

  private extractFeatureArray(features: CustomerFeatures): number[] {
    return Object.values(features);
  }
}

// Simple Decision Tree implementation
class DecisionTree {
  private tree: any = null;
  private featureImportances: Map<string, number> = new Map();

  train(features: CustomerFeatures[], labels: number[]): void {
    const data = features.map((f, i) => ({
      features: this.extractFeatureArray(f),
      label: labels[i],
    }));

    this.tree = this.buildTree(data, Object.keys(features[0]));
  }

  predict(features: CustomerFeatures): number {
    if (!this.tree) {
      throw new Error('Tree not trained');
    }

    return this.traverseTree(this.tree, this.extractFeatureArray(features));
  }

  getFeatureImportances(): Map<string, number> {
    return this.featureImportances;
  }

  private buildTree(data: any[], featureNames: string[], depth = 0): any {
    if (depth > 5 || data.length < 5) {
      // Leaf node
      const avgLabel = data.reduce((sum, d) => sum + d.label, 0) / data.length;
      return { type: 'leaf', value: avgLabel };
    }

    // Find best split
    let bestSplit = null;
    let bestGain = -1;

    for (let featureIndex = 0; featureIndex < featureNames.length; featureIndex++) {
      const values = data.map(d => d.features[featureIndex]);
      const threshold = this.findBestThreshold(values, data.map(d => d.label));
      
      const gain = this.calculateInformationGain(data, featureIndex, threshold);
      
      if (gain > bestGain) {
        bestGain = gain;
        bestSplit = { featureIndex, threshold, featureName: featureNames[featureIndex] };
      }
    }

    if (!bestSplit || bestGain <= 0) {
      const avgLabel = data.reduce((sum, d) => sum + d.label, 0) / data.length;
      return { type: 'leaf', value: avgLabel };
    }

    // Update feature importance
    const currentImportance = this.featureImportances.get(bestSplit.featureName) || 0;
    this.featureImportances.set(bestSplit.featureName, currentImportance + bestGain);

    // Split data
    const leftData = data.filter(d => d.features[bestSplit.featureIndex] <= bestSplit.threshold);
    const rightData = data.filter(d => d.features[bestSplit.featureIndex] > bestSplit.threshold);

    return {
      type: 'split',
      featureIndex: bestSplit.featureIndex,
      threshold: bestSplit.threshold,
      left: this.buildTree(leftData, featureNames, depth + 1),
      right: this.buildTree(rightData, featureNames, depth + 1),
    };
  }

  private findBestThreshold(values: number[], labels: number[]): number {
    const sortedIndices = values
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val);

    let bestThreshold = values[0];
    let bestGain = -1;

    for (let i = 1; i < sortedIndices.length; i++) {
      const threshold = (sortedIndices[i-1].val + sortedIndices[i].val) / 2;
      
      const leftLabels = sortedIndices.slice(0, i).map(s => labels[s.idx]);
      const rightLabels = sortedIndices.slice(i).map(s => labels[s.idx]);
      
      const gain = this.calculateSplitGain(leftLabels, rightLabels);
      
      if (gain > bestGain) {
        bestGain = gain;
        bestThreshold = threshold;
      }
    }

    return bestThreshold;
  }

  private calculateInformationGain(data: any[], featureIndex: number, threshold: number): number {
    const leftData = data.filter(d => d.features[featureIndex] <= threshold);
    const rightData = data.filter(d => d.features[featureIndex] > threshold);
    
    if (leftData.length === 0 || rightData.length === 0) {
      return 0;
    }

    const leftLabels = leftData.map(d => d.label);
    const rightLabels = rightData.map(d => d.label);
    
    return this.calculateSplitGain(leftLabels, rightLabels);
  }

  private calculateSplitGain(leftLabels: number[], rightLabels: number[]): number {
    if (leftLabels.length === 0 || rightLabels.length === 0) {
      return 0;
    }

    const leftMean = leftLabels.reduce((sum, l) => sum + l, 0) / leftLabels.length;
    const rightMean = rightLabels.reduce((sum, l) => sum + l, 0) / rightLabels.length;
    
    const leftVariance = leftLabels.reduce((sum, l) => sum + Math.pow(l - leftMean, 2), 0) / leftLabels.length;
    const rightVariance = rightLabels.reduce((sum, l) => sum + Math.pow(l - rightMean, 2), 0) / rightLabels.length;
    
    const totalSize = leftLabels.length + rightLabels.length;
    const weightedVariance = (leftLabels.length / totalSize) * leftVariance + (rightLabels.length / totalSize) * rightVariance;
    
    return 1 / (1 + weightedVariance); // Information gain approximation
  }

  private traverseTree(node: any, features: number[]): number {
    if (node.type === 'leaf') {
      return node.value;
    }

    if (features[node.featureIndex] <= node.threshold) {
      return this.traverseTree(node.left, features);
    } else {
      return this.traverseTree(node.right, features);
    }
  }

  private extractFeatureArray(features: CustomerFeatures): number[] {
    return Object.values(features);
  }
}

// Reinforcement Learning Agent for Intervention Optimization
export class ReinforcementLearningAgent {
  private qTable: Map<string, Map<string, number>> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.9;
  private explorationRate = 0.1;

  private actions = [
    'Executive Check-in',
    'Support Recovery',
    'Engagement Boost',
    'Payment Recovery',
    'Onboarding Call',
    'Upsell Proposal',
    'Renewal Reminder',
  ];

  constructor() {
    this.initializeQTable();
  }

  selectAction(customerFeatures: CustomerFeatures): InterventionRecommendation {
    const state = this.encodeState(customerFeatures);
    
    // Epsilon-greedy action selection
    let selectedAction: string;
    
    if (Math.random() < this.explorationRate) {
      // Explore: random action
      selectedAction = this.actions[Math.floor(Math.random() * this.actions.length)];
    } else {
      // Exploit: best action according to Q-table
      selectedAction = this.getBestAction(state);
    }

    return this.createRecommendation(selectedAction, customerFeatures);
  }

  updatePolicy(
    state: CustomerFeatures,
    action: string,
    reward: number,
    nextState?: CustomerFeatures
  ): void {
    const stateKey = this.encodeState(state);
    const nextStateKey = nextState ? this.encodeState(nextState) : stateKey;

    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }

    const stateActions = this.qTable.get(stateKey)!;
    const currentQ = stateActions.get(action) || 0;

    let maxNextQ = 0;
    if (nextState) {
      const nextStateActions = this.qTable.get(nextStateKey);
      if (nextStateActions) {
        maxNextQ = Math.max(...Array.from(nextStateActions.values()));
      }
    }

    // Q-learning update
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    stateActions.set(action, newQ);

    console.log(`🧠 Updated Q-value for ${action}: ${currentQ.toFixed(3)} → ${newQ.toFixed(3)} (reward: ${reward})`);
  }

  getActionAnalytics(): any {
    const analytics: any = {};
    
    for (const [state, actions] of this.qTable.entries()) {
      const bestAction = this.getBestActionForState(actions);
      const avgQValue = (Array.from(actions.values()) as number[]).reduce((sum: number, q: number) => sum + q, 0) / actions.size;
      
      analytics[state] = {
        bestAction,
        avgQValue,
        actionValues: Object.fromEntries(actions),
      };
    }

    return analytics;
  }

  private initializeQTable(): void {
    // Initialize with small random values
    const sampleStates = ['low_risk', 'medium_risk', 'high_risk'];
    
    for (const state of sampleStates) {
      const actionMap = new Map<string, number>();
      for (const action of this.actions) {
        actionMap.set(action, Math.random() * 0.1);
      }
      this.qTable.set(state, actionMap);
    }
  }

  private encodeState(features: CustomerFeatures): string {
    // Simple state encoding based on key features
    const healthTier = features.healthScore > 70 ? 'high' : features.healthScore > 40 ? 'medium' : 'low';
    const supportTier = features.supportTickets > 5 ? 'high' : features.supportTickets > 2 ? 'medium' : 'low';
    const engagementTier = features.daysSinceLastLogin < 7 ? 'high' : features.daysSinceLastLogin < 30 ? 'medium' : 'low';
    
    return `${healthTier}_${supportTier}_${engagementTier}`;
  }

  private getBestAction(state: string): string {
    const stateActions = this.qTable.get(state);
    if (!stateActions) {
      return this.actions[0]; // Default action
    }

    return this.getBestActionForState(stateActions);
  }

  private getBestActionForState(actions: Map<string, number>): string {
    let bestAction = '';
    let bestValue = -Infinity;

    for (const [action, value] of actions.entries()) {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction || this.actions[0];
  }

  private createRecommendation(action: string, features: CustomerFeatures): InterventionRecommendation {
    const priority = this.calculatePriority(features);
    const estimatedSuccess = this.estimateSuccessRate(action, features);
    const estimatedRevenueSaved = this.estimateRevenueSaved(features, estimatedSuccess);

    return {
      type: action,
      priority,
      estimatedSuccess,
      estimatedRevenueSaved,
      description: this.getActionDescription(action),
      reasoning: this.getActionReasoning(action, features),
    };
  }

  private calculatePriority(features: CustomerFeatures): 'low' | 'medium' | 'high' {
    const riskScore = 
      (100 - features.healthScore) * 0.3 +
      features.supportTickets * 5 +
      (features.daysSinceLastLogin / 30) * 20;

    return riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low';
  }

  private estimateSuccessRate(action: string, features: CustomerFeatures): number {
    const baseRates: Record<string, number> = {
      'Executive Check-in': 0.75,
      'Support Recovery': 0.65,
      'Engagement Boost': 0.55,
      'Payment Recovery': 0.80,
      'Onboarding Call': 0.70,
      'Upsell Proposal': 0.40,
      'Renewal Reminder': 0.60,
    };

    let rate = baseRates[action] || 0.5;

    // Adjust based on customer features
    if (features.healthScore > 70) rate += 0.1;
    if (features.npsScore > 7) rate += 0.1;
    if (features.supportTickets < 3) rate += 0.05;

    return Math.min(0.95, Math.max(0.1, rate));
  }

  private estimateRevenueSaved(features: CustomerFeatures, successRate: number): number {
    return features.mrr * 12 * successRate; // Annual revenue at risk
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'Executive Check-in': 'Schedule high-level executive outreach',
      'Support Recovery': 'Intensive support intervention program',
      'Engagement Boost': 'Feature adoption and engagement campaign',
      'Payment Recovery': 'Billing issue resolution and recovery',
      'Onboarding Call': 'Comprehensive onboarding review session',
      'Upsell Proposal': 'Value-add upgrade opportunity',
      'Renewal Reminder': 'Proactive renewal preparation',
    };
    return descriptions[action] || 'Custom intervention strategy';
  }

  private getActionReasoning(action: string, features: CustomerFeatures): string {
    if (features.healthScore < 40) {
      return 'Low health score indicates need for immediate attention';
    } else if (features.supportTickets > 5) {
      return 'High support volume suggests product or service issues';
    } else if (features.daysSinceLastLogin > 30) {
      return 'Extended absence indicates disengagement risk';
    } else {
      return 'Proactive intervention to maintain customer health';
    }
  }
}

// ML Engine that coordinates all ML components
export class MLEngine {
  private randomForest: RandomForestPredictor;
  private rlAgent: ReinforcementLearningAgent;
  private isInitialized = false;

  constructor() {
    this.randomForest = new RandomForestPredictor(15);
    this.rlAgent = new ReinforcementLearningAgent();
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing ML Engine...');
    
    const extendedData = dataLoader.getExtendedData();
    if (!extendedData) {
      console.log('⚠️  No extended data available, using simulated training data');
      this.trainWithSimulatedData();
    } else {
      this.trainWithRealData(extendedData);
    }

    this.isInitialized = true;
    console.log('✅ ML Engine initialized successfully');
  }

  predictChurn(customerId: number): ChurnPrediction {
    if (!this.isInitialized) {
      throw new Error('ML Engine not initialized');
    }

    const features = this.extractCustomerFeatures(customerId);
    if (!features) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const prediction = this.randomForest.predict(features);
    prediction.customerId = customerId;

    return prediction;
  }

  recommendIntervention(customerId: number): InterventionRecommendation {
    if (!this.isInitialized) {
      throw new Error('ML Engine not initialized');
    }

    const features = this.extractCustomerFeatures(customerId);
    if (!features) {
      throw new Error(`Customer ${customerId} not found`);
    }

    return this.rlAgent.selectAction(features);
  }

  getFeatureImportances(): FeatureImportance[] {
    if (!this.isInitialized) {
      throw new Error('ML Engine not initialized');
    }

    return this.randomForest.getFeatureImportances();
  }

  updateInterventionOutcome(
    customerId: number,
    intervention: string,
    success: boolean,
    revenueImpact?: number
  ): void {
    const features = this.extractCustomerFeatures(customerId);
    if (!features) return;

    // Calculate reward based on success and revenue impact
    let reward = success ? 1.0 : -0.5;
    if (revenueImpact) {
      reward += Math.min(revenueImpact / 10000, 0.5); // Bonus for revenue saved
    }

    this.rlAgent.updatePolicy(features, intervention, reward);
  }

  private trainWithRealData(extendedData: any): void {
    const features: CustomerFeatures[] = [];
    const labels: number[] = [];

    // Extract training data from customers and sessions
    extendedData.customers.forEach((customer: any) => {
      const customerFeatures = this.convertToFeatures(customer, extendedData.userSessions);
      features.push(customerFeatures);
      labels.push(customer.churn_risk); // Use existing churn risk as label
    });

    if (features.length > 0) {
      this.randomForest.train(features, labels);
      console.log(`📊 Trained on ${features.length} real customer records`);
    }
  }

  private trainWithSimulatedData(): void {
    const features: CustomerFeatures[] = [];
    const labels: number[] = [];

    // Generate synthetic training data
    for (let i = 0; i < 100; i++) {
      const syntheticFeatures: CustomerFeatures = {
        healthScore: Math.random() * 100,
        npsScore: Math.random() * 10,
        supportTickets: Math.floor(Math.random() * 15),
        featureUsageTotal: Math.random() * 1000,
        daysSinceSignup: Math.random() * 1000,
        daysSinceLastLogin: Math.random() * 60,
        mrr: Math.random() * 1000,
        planValue: Math.random() * 3,
        sessionCount: Math.random() * 50,
        avgSessionDuration: Math.random() * 120,
        totalPagesViewed: Math.random() * 200,
      };

      // Simulate churn probability based on features
      let churnProb = 0.5;
      churnProb -= syntheticFeatures.healthScore / 200;
      churnProb += syntheticFeatures.supportTickets / 30;
      churnProb += syntheticFeatures.daysSinceLastLogin / 120;
      churnProb = Math.max(0, Math.min(1, churnProb));

      features.push(syntheticFeatures);
      labels.push(churnProb);
    }

    this.randomForest.train(features, labels);
    console.log('📊 Trained on simulated data');
  }

  private extractCustomerFeatures(customerId: number): CustomerFeatures | null {
    const extendedData = dataLoader.getExtendedData();
    if (!extendedData) {
      return this.generateSyntheticFeatures(customerId);
    }

    const customer = extendedData.customers.find((c: any) => c.id === customerId);
    if (!customer) return null;

    return this.convertToFeatures(customer, extendedData.userSessions);
  }

  private convertToFeatures(customer: any, userSessions: any[]): CustomerFeatures {
    const customerSessions = userSessions.filter((s: any) => s.customer_id === customer.id);
    
    const sessionCount = customerSessions.length;
    const avgSessionDuration = sessionCount > 0 
      ? customerSessions.reduce((sum: number, s: any) => {
          const start = new Date(s.started_at);
          const end = new Date(s.ended_at);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        }, 0) / sessionCount
      : 0;
    
    const totalPagesViewed = customerSessions.reduce((sum: number, s: any) => sum + s.pages_viewed, 0);

    const signupDate = new Date(customer.signup_date);
    const lastLoginDate = new Date(customer.last_login);
    const now = new Date();

    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastLogin = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

    const featureUsageTotal = (customer.feature_usage?.featureA || customer.feature_usage?.login || 0) + 
                             (customer.feature_usage?.featureB || customer.feature_usage?.features || 0) + 
                             (customer.feature_usage?.featureC || customer.feature_usage?.api_calls || 0) +
                             // Insurance-specific weights
                             (customer.feature_usage?.claims || 0) * 5 +
                             (customer.feature_usage?.late_days || 0) * 0.5 +
                             (customer.feature_usage?.price_increase_pct || 0) * 1;

    const planValue = customer.plan === 'Enterprise' ? 3 : customer.plan === 'Pro' ? 2 : 1;

    return {
      healthScore: customer.health_score,
      npsScore: customer.nps_score || 5,
      supportTickets: customer.support_tickets,
      featureUsageTotal,
      daysSinceSignup,
      daysSinceLastLogin,
      mrr: customer.mrr,
      planValue,
      sessionCount,
      avgSessionDuration,
      totalPagesViewed,
    };
  }

  private generateSyntheticFeatures(customerId: number): CustomerFeatures {
    // Generate synthetic features for testing when no real data is available
    return {
      healthScore: 50 + (customerId % 50),
      npsScore: 3 + (customerId % 8),
      supportTickets: customerId % 10,
      featureUsageTotal: 100 + (customerId % 500),
      daysSinceSignup: 30 + (customerId % 300),
      daysSinceLastLogin: customerId % 60,
      mrr: 100 + (customerId % 800),
      planValue: (customerId % 3) + 1,
      sessionCount: customerId % 20,
      avgSessionDuration: 15 + (customerId % 60),
      totalPagesViewed: 10 + (customerId % 100),
    };
  }
}

// Export singleton instance
export const mlEngine = new MLEngine();