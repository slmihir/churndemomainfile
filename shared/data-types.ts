// External data types for JSON configuration
export interface MockDataConfiguration {
  customers: MockCustomer[];
  churnCauses: MockChurnCause[];
  interventions: MockIntervention[];
  integrations: MockIntegration[];
  riskAlerts: MockRiskAlert[];
  dashboardSettings: MockDashboardSettings;
  chartData: MockChartData;
}

export interface MockCustomer {
  name: string;
  email: string;
  company: string;
  plan: string;
  mrr: string;
  signupDate: string; // ISO date string
  lastLogin?: string; // ISO date string
  healthScore: number;
  churnRisk: string;
  npsScore?: number;
  supportTickets: number;
  featureUsage?: {
    login: number;
    features: number;
    api_calls: number;
  };
  isActive: boolean;
}

export interface MockChurnCause {
  name: string;
  description: string;
  impact: string;
  category: string;
  icon: string;
}

export interface MockIntervention {
  customerId: number;
  type: string;
  status: string;
  priority: string;
  assignedCsm: string;
  description?: string;
  nextAction?: string;
  dueDate?: string; // ISO date string
  completedAt?: string; // ISO date string
  notes?: string;
}

export interface MockIntegration {
  name: string;
  type: string;
  status: string;
  lastSyncAt?: string; // ISO date string
  config?: Record<string, any>;
}

export interface MockRiskAlert {
  customerId: number;
  title: string;
  description: string;
  severity: string;
  isRead: boolean;
  createdAt: string; // ISO date string
}

export interface MockDashboardSettings {
  churnChange: number;
  riskChange: number;
  revenueIncrease: number;
  revenuePerCompletedIntervention: number; // Base amount for revenue calculations
}

export interface MockChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

// Default data structure for when no JSON is provided
export const DEFAULT_MOCK_DATA: MockDataConfiguration = {
  customers: [
    {
      name: "TechCorp Inc",
      email: "contact@techcorp.com",
      company: "TechCorp Inc",
      plan: "Enterprise",
      mrr: "12500.00",
      signupDate: "2023-01-15T00:00:00Z",
      lastLogin: "2024-01-10T00:00:00Z",
      healthScore: 25,
      churnRisk: "92.00",
      npsScore: 3,
      supportTickets: 8,
      featureUsage: { login: 2, features: 3, api_calls: 150 },
      isActive: true,
    },
    {
      name: "RetailPro Ltd",
      email: "admin@retailpro.com",
      company: "RetailPro Ltd",
      plan: "Professional",
      mrr: "5200.00",
      signupDate: "2023-06-20T00:00:00Z",
      lastLogin: "2024-01-20T00:00:00Z",
      healthScore: 65,
      churnRisk: "76.00",
      npsScore: 6,
      supportTickets: 3,
      featureUsage: { login: 15, features: 8, api_calls: 850 },
      isActive: true,
    },
    {
      name: "StartupXYZ",
      email: "hello@startupxyz.com",
      company: "StartupXYZ",
      plan: "Growth",
      mrr: "3200.00",
      signupDate: "2023-09-10T00:00:00Z",
      lastLogin: "2024-01-22T00:00:00Z",
      healthScore: 85,
      churnRisk: "45.00",
      npsScore: 8,
      supportTickets: 1,
      featureUsage: { login: 25, features: 12, api_calls: 1200 },
      isActive: true,
    },
  ],
  churnCauses: [
    {
      name: "Poor Product Adoption",
      description: "Low feature usage & engagement",
      impact: "34.00",
      category: "product",
      icon: "fas fa-exclamation-circle",
    },
    {
      name: "Payment Issues",
      description: "Failed payments & billing disputes",
      impact: "28.00",
      category: "billing",
      icon: "fas fa-credit-card",
    },
    {
      name: "Support Experience",
      description: "Unresolved tickets & low satisfaction",
      impact: "21.00",
      category: "support",
      icon: "fas fa-headset",
    },
  ],
  interventions: [
    {
      customerId: 1,
      type: "Executive Check-in",
      status: "active",
      priority: "high",
      assignedCsm: "Sarah Chen",
      description: "C-level outreach scheduled",
      nextAction: "Follow-up call",
      dueDate: "2024-01-24T00:00:00Z",
      notes: "Customer showing high churn risk, escalating to executive team.",
    },
    {
      customerId: 2,
      type: "Payment Recovery",
      status: "completed",
      priority: "medium",
      assignedCsm: "Mike Johnson",
      description: "Automated email + phone call",
      nextAction: "Monitor payment",
      dueDate: "2024-01-30T00:00:00Z",
      completedAt: "2024-01-22T00:00:00Z",
      notes: "Payment issue resolved successfully.",
    },
  ],
  integrations: [
    {
      name: "Salesforce CRM",
      type: "crm",
      status: "connected",
      lastSyncAt: "2024-01-23T10:30:00Z",
      config: { api_key: "***", instance_url: "https://yourcompany.salesforce.com" },
    },
    {
      name: "Zendesk Support",
      type: "support",
      status: "connected",
      lastSyncAt: "2024-01-23T10:25:00Z",
      config: { subdomain: "yourcompany", api_token: "***" },
    },
    {
      name: "Stripe Payments",
      type: "payment",
      status: "syncing",
      lastSyncAt: "2024-01-23T10:20:00Z",
      config: { api_key: "***", webhook_secret: "***" },
    },
  ],
  riskAlerts: [
    {
      customerId: 1,
      title: "TechCorp Inc - High Churn Risk",
      description: "NPS dropped to 3, no logins in 14 days",
      severity: "critical",
      isRead: false,
      createdAt: "2024-01-23T10:00:00Z",
    },
    {
      customerId: 2,
      title: "RetailPro Ltd - Payment Failed",
      description: "3rd consecutive payment failure detected",
      severity: "high",
      isRead: false,
      createdAt: "2024-01-23T09:45:00Z",
    },
    {
      customerId: 3,
      title: "StartupXYZ - Low Engagement",
      description: "User activity down 60% in past week",
      severity: "medium",
      isRead: false,
      createdAt: "2024-01-23T08:00:00Z",
    },
  ],
  dashboardSettings: {
    churnChange: -2.1,
    riskChange: 8,
    revenueIncrease: 15,
    revenuePerCompletedIntervention: 8500,
  },
  chartData: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{
      label: "Churn Risk %",
      data: [15.2, 14.8, 13.9, 12.8, 12.3, 11.9],
      borderColor: "#DC2626",
      backgroundColor: "rgba(220, 38, 38, 0.1)",
      tension: 0.4,
      fill: true,
    }],
  },
};