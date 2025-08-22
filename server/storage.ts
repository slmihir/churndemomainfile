import { 
  users, customers, churnPredictions, interventions, churnCauses, riskAlerts,
  type User, type InsertUser, type Customer, type InsertCustomer, 
  type ChurnPrediction, type InsertChurnPrediction, type Intervention, type InsertIntervention,
  type ChurnCause, type InsertChurnCause,
  type RiskAlert, type InsertRiskAlert
} from "../shared/schema";
import { dataLoader } from "./data-loader";

export interface IStorage {
  // Data loading
  loadData(): Promise<void>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;

  // Churn Predictions
  getChurnPredictions(): Promise<ChurnPrediction[]>;
  getChurnPrediction(customerId: number): Promise<ChurnPrediction | undefined>;
  createChurnPrediction(prediction: InsertChurnPrediction): Promise<ChurnPrediction>;

  // Interventions
  getInterventions(): Promise<Intervention[]>;
  getIntervention(id: number): Promise<Intervention | undefined>;
  createIntervention(intervention: InsertIntervention): Promise<Intervention>;
  updateIntervention(id: number, intervention: Partial<Intervention>): Promise<Intervention | undefined>;



  // Churn Causes
  getChurnCauses(): Promise<ChurnCause[]>;
  createChurnCause(cause: InsertChurnCause): Promise<ChurnCause>;

  // Risk Alerts
  getRiskAlerts(): Promise<RiskAlert[]>;
  createRiskAlert(alert: InsertRiskAlert): Promise<RiskAlert>;
  markAlertAsRead(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private customers: Map<number, Customer> = new Map();
  private churnPredictions: Map<number, ChurnPrediction> = new Map();
  private interventions: Map<number, Intervention> = new Map();

  private churnCauses: Map<number, ChurnCause> = new Map();
  private riskAlerts: Map<number, RiskAlert> = new Map();
  
  private currentUserId = 1;
  private currentCustomerId = 1;
  private currentPredictionId = 1;
  private currentInterventionId = 1;

  private currentCauseId = 1;
  private currentAlertId = 1;

  constructor() {
    // Data will be loaded asynchronously via loadData method
  }

  async loadData(): Promise<void> {
    await dataLoader.loadData();
    this.clearData();
    this.seedData();
  }

  private clearData(): void {
    this.customers.clear();
    this.churnPredictions.clear();
    this.interventions.clear();

    this.churnCauses.clear();
    this.riskAlerts.clear();
    
    // Reset counters
    this.currentCustomerId = 1;
    this.currentPredictionId = 1;
    this.currentInterventionId = 1;

    this.currentCauseId = 1;
    this.currentAlertId = 1;
  }

  private seedData() {
    const mockData = dataLoader.getMockData();
    
    // Seed customers from external data
    const sampleCustomers: Customer[] = mockData.customers.map(customer => ({
      id: this.currentCustomerId++,
      name: customer.name,
      email: customer.email,
      company: customer.company,
      plan: customer.plan,
      mrr: customer.mrr,
      signupDate: new Date(customer.signupDate),
      lastLogin: customer.lastLogin ? new Date(customer.lastLogin) : null,
      healthScore: customer.healthScore,
      churnRisk: customer.churnRisk,
      npsScore: customer.npsScore || null,
      supportTickets: customer.supportTickets,
      featureUsage: customer.featureUsage || null,
      isActive: customer.isActive,
    }));

    sampleCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });

    // Seed churn causes from external data
    const sampleCauses: ChurnCause[] = mockData.churnCauses.map(cause => ({
      id: this.currentCauseId++,
      name: cause.name,
      description: cause.description,
      impact: cause.impact,
      category: cause.category,
      icon: cause.icon,
    }));

    sampleCauses.forEach(cause => {
      this.churnCauses.set(cause.id, cause);
    });

    // Seed interventions from external data
    const sampleInterventions: Intervention[] = mockData.interventions.map(intervention => ({
      id: this.currentInterventionId++,
      customerId: intervention.customerId,
      type: intervention.type,
      status: intervention.status,
      priority: intervention.priority,
      assignedCsm: intervention.assignedCsm,
      description: intervention.description || null,
      nextAction: intervention.nextAction || null,
      dueDate: intervention.dueDate ? new Date(intervention.dueDate) : null,
      createdAt: new Date(), // Use current time or derive from data
      completedAt: intervention.completedAt ? new Date(intervention.completedAt) : null,
      notes: intervention.notes || null,
    }));

    sampleInterventions.forEach(intervention => {
      this.interventions.set(intervention.id, intervention);
    });



    // Seed risk alerts from external data
    const sampleAlerts: RiskAlert[] = mockData.riskAlerts.map(alert => ({
      id: this.currentAlertId++,
      customerId: alert.customerId,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      isRead: alert.isRead,
      createdAt: new Date(alert.createdAt),
    }));

    sampleAlerts.forEach(alert => {
      this.riskAlerts.set(alert.id, alert);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.currentUserId++ };
    this.users.set(user.id, user);
    return user;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = { 
      ...insertCustomer, 
      id: this.currentCustomerId++,
      lastLogin: insertCustomer.lastLogin || null,
      npsScore: insertCustomer.npsScore || null,
      healthScore: insertCustomer.healthScore || 75,
      churnRisk: insertCustomer.churnRisk || '0',
      supportTickets: insertCustomer.supportTickets || 0,
      featureUsage: insertCustomer.featureUsage || null,
      isActive: insertCustomer.isActive ?? true
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Churn Prediction methods
  async getChurnPredictions(): Promise<ChurnPrediction[]> {
    return Array.from(this.churnPredictions.values());
  }

  async getChurnPrediction(customerId: number): Promise<ChurnPrediction | undefined> {
    return Array.from(this.churnPredictions.values()).find(p => p.customerId === customerId);
  }

  async createChurnPrediction(insertPrediction: InsertChurnPrediction): Promise<ChurnPrediction> {
    const prediction: ChurnPrediction = { 
      ...insertPrediction, 
      id: this.currentPredictionId++,
      predictionDate: new Date()
    };
    this.churnPredictions.set(prediction.id, prediction);
    return prediction;
  }

  // Intervention methods
  async getInterventions(): Promise<Intervention[]> {
    return Array.from(this.interventions.values());
  }

  async getIntervention(id: number): Promise<Intervention | undefined> {
    return this.interventions.get(id);
  }

  async createIntervention(insertIntervention: InsertIntervention): Promise<Intervention> {
    const intervention: Intervention = { 
      ...insertIntervention,
      id: this.currentInterventionId++,
      createdAt: new Date(),
      description: insertIntervention.description || null,
      nextAction: insertIntervention.nextAction || null,
      dueDate: insertIntervention.dueDate || null,
      completedAt: insertIntervention.completedAt || null,
      notes: insertIntervention.notes || null,
      status: insertIntervention.status || 'active',
      priority: insertIntervention.priority || 'medium'
    };
    this.interventions.set(intervention.id, intervention);
    return intervention;
  }

  async updateIntervention(id: number, updates: Partial<Intervention>): Promise<Intervention | undefined> {
    const intervention = this.interventions.get(id);
    if (!intervention) return undefined;
    
    const updatedIntervention = { ...intervention, ...updates };
    this.interventions.set(id, updatedIntervention);
    return updatedIntervention;
  }

  

  // Churn Cause methods
  async getChurnCauses(): Promise<ChurnCause[]> {
    return Array.from(this.churnCauses.values());
  }

  async createChurnCause(insertCause: InsertChurnCause): Promise<ChurnCause> {
    const cause: ChurnCause = { ...insertCause, id: this.currentCauseId++ };
    this.churnCauses.set(cause.id, cause);
    return cause;
  }

  // Risk Alert methods
  async getRiskAlerts(): Promise<RiskAlert[]> {
    return Array.from(this.riskAlerts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createRiskAlert(insertAlert: InsertRiskAlert): Promise<RiskAlert> {
    const alert: RiskAlert = { 
      ...insertAlert, 
      id: this.currentAlertId++,
      createdAt: new Date(),
      isRead: insertAlert.isRead ?? false
    };
    this.riskAlerts.set(alert.id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<void> {
    const alert = this.riskAlerts.get(id);
    if (alert) {
      this.riskAlerts.set(id, { ...alert, isRead: true });
    }
  }
}

export const storage = new MemStorage();

// Initialize storage with data
storage.loadData().catch(console.error);
