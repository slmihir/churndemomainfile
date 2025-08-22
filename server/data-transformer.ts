// Data transformer to convert external JSON format to internal schema format
import { MockDataConfiguration } from "../shared/data-types";

interface ExternalDataFormat {
  customers: ExternalCustomer[];
  interventions: ExternalIntervention[];
  integrations?: ExternalIntegration[];
  alerts: ExternalAlert[];
  churn_predictions: ExternalChurnPrediction[];
  churn_causes: ExternalChurnCause[];
  playbooks: ExternalPlaybook[];
  playbook_executions: ExternalPlaybookExecution[];
  user_sessions: ExternalUserSession[];
}

interface ExternalCustomer {
  id: number;
  name: string;
  email: string;
  company: string;
  plan: string;
  mrr: number;
  signup_date: string;
  last_login: string;
  health_score: number;
  churn_risk: number;
  nps_score: number;
  support_tickets: number;
  feature_usage: {
    featureA: number;
    featureB: number;
    featureC: number;
  };
  is_active: boolean;
}

interface ExternalIntervention {
  id: number;
  customer_id: number;
  type: string;
  status: string;
  priority: string;
  assigned_csm: string;
  description: string;
  next_action: string;
  due_date: string;
  created_at: string;
  completed_at: string | null;
  notes: string;
}

interface ExternalIntegration {
  id: number;
  name: string;
  type: string;
  status: string;
  last_sync_at: string;
  config: Record<string, any>;
}



interface ExternalAlert {
  id: number;
  message: string;
  read: boolean;
  created_at: string;
}

interface ExternalChurnPrediction {
  id: number;
  customer_id: number;
  churn_probability: number;
  risk_level: string;
  top_causes: Record<string, number>;
  prediction_date: string;
}

interface ExternalChurnCause {
  id: number;
  cause: string;
  count: number;
  percent: number;
  impact: string;
}

interface ExternalPlaybook {
  id: number;
  name: string;
  description: string;
  steps: string[];
  created_at: string;
}

interface ExternalPlaybookExecution {
  id: number;
  playbook_id: number;
  customer_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  result: {
    steps_completed: number;
    issues_found: number;
  };
}

interface ExternalUserSession {
  id: number;
  customer_id: number;
  started_at: string;
  ended_at: string;
  pages_viewed: number;
  actions: Array<{
    type: string;
    [key: string]: any;
  }>;
}

export class DataTransformer {
  static transformToInternal(external: ExternalDataFormat): MockDataConfiguration {
    return {
      customers: external.customers.map(customer => ({
        name: customer.name,
        email: customer.email,
        company: customer.company,
        plan: customer.plan,
        mrr: customer.mrr.toString(),
        signupDate: customer.signup_date,
        lastLogin: customer.last_login,
        healthScore: customer.health_score,
        churnRisk: customer.churn_risk.toString(),
        npsScore: customer.nps_score,
        supportTickets: customer.support_tickets,
        featureUsage: {
          login: customer.feature_usage.featureA || 0,
          features: customer.feature_usage.featureB || 0,
          api_calls: customer.feature_usage.featureC || 0,
        },
        isActive: customer.is_active,
      })),
      integrations: (external.integrations || []).map((i) => ({
        name: i.name,
        type: i.type,
        status: i.status,
        lastSyncAt: i.last_sync_at,
        config: i.config,
      })),
      interventions: external.interventions.map(intervention => ({
        customerId: intervention.customer_id,
        type: intervention.type,
        status: intervention.status,
        priority: intervention.priority,
        assignedCsm: intervention.assigned_csm,
        description: intervention.description,
        nextAction: intervention.next_action,
        dueDate: intervention.due_date,
        completedAt: intervention.completed_at ?? undefined,
        notes: intervention.notes,
      })),



      riskAlerts: external.alerts.map((alert, index) => ({
        customerId: (index % 50) + 1, // Distribute alerts across customers
        title: `Risk Alert: ${alert.message}`,
        description: alert.message,
        severity: this.mapAlertSeverity(alert.message),
        isRead: alert.read,
        createdAt: alert.created_at,
      })),

      churnCauses: external.churn_causes.slice(0, 5).map(cause => ({
        name: cause.cause,
        description: `${cause.cause} affecting ${cause.count} customers`,
        impact: cause.percent.toString(),
        category: this.mapCauseCategory(cause.cause),
        icon: this.mapCauseIcon(cause.cause),
      })),

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
  }

  static mapAlertSeverity(message: string): string {
    if (message.toLowerCase().includes('critical') || message.toLowerCase().includes('urgent')) {
      return 'critical';
    } else if (message.toLowerCase().includes('high') || message.toLowerCase().includes('important')) {
      return 'high';
    } else if (message.toLowerCase().includes('medium') || message.toLowerCase().includes('warning')) {
      return 'medium';
    }
    return 'low';
  }

  static mapCauseCategory(cause: string): string {
    const lowerCause = cause.toLowerCase();
    if (lowerCause.includes('engagement') || lowerCause.includes('usage')) {
      return 'product';
    } else if (lowerCause.includes('billing') || lowerCause.includes('payment')) {
      return 'billing';
    } else if (lowerCause.includes('support') || lowerCause.includes('bug')) {
      return 'support';
    } else if (lowerCause.includes('competitor')) {
      return 'competition';
    }
    return 'other';
  }

  static mapCauseIcon(cause: string): string {
    const lowerCause = cause.toLowerCase();
    if (lowerCause.includes('engagement') || lowerCause.includes('usage')) {
      return 'fas fa-chart-line';
    } else if (lowerCause.includes('billing') || lowerCause.includes('payment')) {
      return 'fas fa-credit-card';
    } else if (lowerCause.includes('support') || lowerCause.includes('bug')) {
      return 'fas fa-headset';
    } else if (lowerCause.includes('competitor')) {
      return 'fas fa-building';
    }
    return 'fas fa-exclamation-circle';
  }

  // Export extended data for ML training
  static getExtendedData(external: ExternalDataFormat) {
    return {
      customers: external.customers,
      churnPredictions: external.churn_predictions,
      userSessions: external.user_sessions,
      playbooks: external.playbooks,
      playbookExecutions: external.playbook_executions,
    };
  }
}