import type { Plugin } from 'vite';

export default function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/churn-causes')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            { cause: 'High return rate', count: 22, percent: 28, impact: 'high' },
            { cause: 'Low repeat purchase', count: 18, percent: 23, impact: 'high' },
            { cause: 'Negative product reviews', count: 15, percent: 19, impact: 'medium' },
            { cause: 'Cart abandonment', count: 12, percent: 15, impact: 'medium' },
            { cause: 'Inactive app user', count: 8, percent: 10, impact: 'medium' },
            { cause: 'No wishlist activity', count: 6, percent: 8, impact: 'low' },
            { cause: 'Recent support complaints', count: 5, percent: 7, impact: 'low' },
            { cause: 'Low NPS', count: 4, percent: 5, impact: 'low' },
            { cause: 'Delayed deliveries', count: 3, percent: 4, impact: 'low' },
            { cause: 'Unsubscribed from marketing', count: 2, percent: 2, impact: 'low' }
          ]));
          return;
        }
        if (req.url?.startsWith('/api/customers')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            { id: 1, name: 'Virgio India', email: 'india@virgio.com', company: 'Virgio', plan: 'Premium Shopper', mrr: 2500, signupDate: '2024-01-01', lastLogin: '2024-07-21', healthScore: 35, churnRisk: 0.82, npsScore: 8, supportTickets: 18, featureUsage: {orders: 1, wishlist: 0, returns: 3}, isActive: true },
            { id: 2, name: 'Virgio UAE', email: 'uae@virgio.com', company: 'Virgio', plan: 'Casual Buyer', mrr: 900, signupDate: '2024-02-10', lastLogin: '2024-07-19', healthScore: 60, churnRisk: 0.40, npsScore: 35, supportTickets: 4, featureUsage: {orders: 3, wishlist: 2, returns: 1}, isActive: true },
            { id: 3, name: 'Virgio App User', email: 'appuser@virgio.com', company: 'Virgio', plan: 'App User', mrr: 120, signupDate: '2024-03-15', lastLogin: '2024-07-20', healthScore: 20, churnRisk: 0.95, npsScore: 2, supportTickets: 12, featureUsage: {orders: 0, wishlist: 0, returns: 0}, isActive: true },
            { id: 4, name: 'Virgio Affiliate', email: 'affiliate@virgio.com', company: 'Virgio', plan: 'Affiliate', mrr: 0, signupDate: '2024-04-01', lastLogin: '2024-07-18', healthScore: 80, churnRisk: 0.10, npsScore: 70, supportTickets: 0, featureUsage: {orders: 10, wishlist: 5, returns: 0}, isActive: true },
            { id: 5, name: 'Virgio Ambassador', email: 'ambassador@virgio.com', company: 'Virgio', plan: 'Ambassador', mrr: 0, signupDate: '2024-05-01', lastLogin: '2024-07-17', healthScore: 90, churnRisk: 0.02, npsScore: 95, supportTickets: 0, featureUsage: {orders: 20, wishlist: 10, returns: 0}, isActive: true },
            { id: 6, name: 'Virgio Returner', email: 'returner@virgio.com', company: 'Virgio', plan: 'Casual Buyer', mrr: 300, signupDate: '2024-06-01', lastLogin: '2024-07-16', healthScore: 15, churnRisk: 0.99, npsScore: 1, supportTickets: 22, featureUsage: {orders: 2, wishlist: 0, returns: 5}, isActive: true },
            { id: 7, name: 'Virgio Cart Abandoner', email: 'cart@virgio.com', company: 'Virgio', plan: 'App User', mrr: 0, signupDate: '2024-06-10', lastLogin: '2024-07-15', healthScore: 25, churnRisk: 0.88, npsScore: 5, supportTickets: 2, featureUsage: {orders: 0, wishlist: 3, returns: 0}, isActive: true },
            { id: 8, name: 'Virgio Loyalist', email: 'loyal@virgio.com', company: 'Virgio', plan: 'Premium Shopper', mrr: 3500, signupDate: '2023-12-01', lastLogin: '2024-07-21', healthScore: 98, churnRisk: 0.01, npsScore: 99, supportTickets: 0, featureUsage: {orders: 50, wishlist: 20, returns: 1}, isActive: true }
          ]));
          return;
        }
        if (req.url?.startsWith('/api/interventions')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            { id: 1, customerId: 1, type: 'executive_checkin', status: 'active', priority: 'high', assignedCsm: 'csm_jane', description: 'Quarterly check-in', nextAction: 'Schedule call', dueDate: '2024-07-28', createdAt: '2024-07-21', completedAt: null, notes: 'Customer is happy.' },
            { id: 2, customerId: 2, type: 'payment_recovery', status: 'active', priority: 'medium', assignedCsm: 'csm_john', description: 'Payment failed', nextAction: 'Send reminder', dueDate: '2024-07-24', createdAt: '2024-07-21', completedAt: null, notes: 'Customer needs follow-up.' },
            { id: 3, customerId: 3, type: 'feature_training', status: 'completed', priority: 'low', assignedCsm: 'csm_jane', description: 'Feature training session', nextAction: null, dueDate: '2024-07-11', createdAt: '2024-07-11', completedAt: '2024-07-11', notes: 'Training completed.' }
          ]));
          return;
        }
        if (req.url?.startsWith('/api/integrations')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            { id: 1, name: 'Salesforce', type: 'crm', status: 'connected', lastSyncAt: '2024-07-21', config: {instance: 'us-west'} },
            { id: 2, name: 'Zendesk', type: 'support', status: 'syncing', lastSyncAt: '2024-07-21', config: {instance: 'eu-central'} },
            { id: 3, name: 'Stripe', type: 'payment', status: 'error', lastSyncAt: '2024-07-20', config: {instance: 'global'} }
          ]));
          return;
        }
        if (req.url?.startsWith('/api/dashboard/metrics')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            churnRisk: 54.3,
            churnChange: 8.7,
            customersAtRisk: 4,
            riskChange: 2,
            nps: 32,
            npsChange: -7,
            mrr: 17050,
            mrrChange: 350,
          }));
          return;
        }
        if (req.url?.startsWith('/api/dashboard/chart-data')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
              {
                label: 'Churn %',
                data: [20, 35, 50, 60, 54, 80, 54],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y',
              },
              {
                label: 'MRR',
                data: [12000, 14000, 16000, 18000, 17000, 17500, 17050],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y1',
              },
            ],
          }));
          return;
        }
        if (req.url?.startsWith('/api/alerts')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            { id: 1, message: 'Customer Beta Inc has high churn risk!', read: false, createdAt: '2024-07-21' },
            { id: 2, message: 'Payment failed for Gamma LLC', read: true, createdAt: '2024-07-20' }
          ]));
          return;
        }
        if (req.url?.startsWith('/api/v1/churn/predict')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            churnProbability: 95,
            riskLevel: 'high',
            topCauses: [
              'High return rate',
              'Low repeat purchase',
              'Negative product reviews',
              'Cart abandonment',
              'Inactive app user',
              'No wishlist activity',
              'Recent support complaints'
            ]
          }));
          return;
        }
        if (req.url?.startsWith('/api/v1/causes/explain')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            causes: [
              'High return rate',
              'Low repeat purchase',
              'Negative product reviews',
              'Cart abandonment',
              'Inactive app user',
              'No wishlist activity',
              'Recent support complaints',
              'Low NPS',
              'Delayed deliveries',
              'Unsubscribed from marketing'
            ]
          }));
          return;
        }
        if (req.url?.startsWith('/api/v1/playbooks/trigger')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: 'Playbook triggered successfully.' }));
          return;
        }
        // Add more mock endpoints as needed
        next();
      });
    },
  };
}
