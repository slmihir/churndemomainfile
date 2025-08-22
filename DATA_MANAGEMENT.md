# Data Management Guide

This application has been refactored to use dynamic data instead of hard-coded values. You can now customize all mock data through JSON files and API endpoints.

## How It Works

1. **Data Source**: The app reads from a `mock-data.json` file in the project root
2. **Fallback**: If no JSON file exists, it uses sensible default data
3. **Dynamic Loading**: Data can be reloaded without restarting the server
4. **API Management**: Upload and manage data through API endpoints

## Setting Up Your Data

### Option 1: Copy the Example File
```bash
cp mock-data.example.json mock-data.json
```

### Option 2: Create Your Own JSON File
Create a `mock-data.json` file in the project root with the following structure:

```json
{
  "customers": [...],
  "churnCauses": [...],
  "interventions": [...],
  "integrations": [...],
  "riskAlerts": [...],
  "dashboardSettings": {...},
  "chartData": {...}
}
```

## Data Structure Reference

### Customers
```json
{
  "name": "Company Name",
  "email": "contact@company.com",
  "company": "Company Name",
  "plan": "Enterprise|Professional|Growth",
  "mrr": "12500.00",
  "signupDate": "2023-01-15T00:00:00Z",
  "lastLogin": "2024-01-10T00:00:00Z",
  "healthScore": 25,
  "churnRisk": "92.00",
  "npsScore": 3,
  "supportTickets": 8,
  "featureUsage": { "login": 2, "features": 3, "api_calls": 150 },
  "isActive": true
}
```

### Churn Causes
```json
{
  "name": "Poor Product Adoption",
  "description": "Low feature usage & engagement",
  "impact": "34.00",
  "category": "product",
  "icon": "fas fa-exclamation-circle"
}
```

### Interventions
```json
{
  "customerId": 1,
  "type": "Executive Check-in",
  "status": "active|completed|cancelled",
  "priority": "high|medium|low",
  "assignedCsm": "Sarah Chen",
  "description": "C-level outreach scheduled",
  "nextAction": "Follow-up call",
  "dueDate": "2024-01-24T00:00:00Z",
  "completedAt": "2024-01-22T00:00:00Z",
  "notes": "Customer showing high churn risk, escalating to executive team."
}
```

### Dashboard Settings
```json
{
  "churnChange": -2.1,
  "riskChange": 8,
  "revenueIncrease": 15,
  "revenuePerCompletedIntervention": 8500
}
```

### Chart Data
```json
{
  "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "datasets": [{
    "label": "Churn Risk %",
    "data": [15.2, 14.8, 13.9, 12.8, 12.3, 11.9],
    "borderColor": "#DC2626",
    "backgroundColor": "rgba(220, 38, 38, 0.1)",
    "tension": 0.4,
    "fill": true
  }]
}
```

## API Endpoints for Data Management

### Reload Data from File
```bash
POST /api/admin/reload-data
```
Reloads data from the `mock-data.json` file without restarting the server.

### Upload New Data
```bash
POST /api/admin/upload-data
Content-Type: application/json

{
  "customers": [...],
  "churnCauses": [...],
  // ... rest of data structure
}
```
Uploads new data and saves it to `mock-data.json`.

### Get Current Data
```bash
GET /api/admin/current-data
```
Returns the currently loaded data structure.

## Workflow for Data Updates

1. **Development**: Edit `mock-data.json` and call `/api/admin/reload-data`
2. **Production**: Use `/api/admin/upload-data` to update data via API
3. **Backup**: Use `/api/admin/current-data` to export current configuration

## Machine Learning Integration Ready

The data structure is designed to be compatible with ML model inputs:

- **Customer Features**: `healthScore`, `npsScore`, `supportTickets`, `featureUsage`
- **Churn Labels**: `churnRisk` values for training
- **Time Series**: `chartData` for trend analysis
- **Interventions**: Track success rates for model validation

## Next Steps for ML Integration

1. **Random Forest**: Use customer features to predict churn probability
2. **Reinforcement Learning**: Optimize intervention strategies based on success rates
3. **Time Series**: Analyze `chartData` trends for predictive modeling
4. **A/B Testing**: Track intervention effectiveness with different strategies

The refactored code is now ready for machine learning integration while maintaining full flexibility for data customization.