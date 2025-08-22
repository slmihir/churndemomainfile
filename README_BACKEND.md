# ChurnShield Backend & API Documentation

This document describes everything you need to run ChurnShield in real time, including database schema, required tables, and all API endpoints.

---

## 1. Database Schema (PostgreSQL)

### Table: `customers`
| Column           | Type        | Description                       |
|------------------|------------|-----------------------------------|
| id               | SERIAL PK   | Customer ID                       |
| name             | TEXT        | Customer name                     |
| email            | TEXT        | Customer email                    |
| company          | TEXT        | Company name                      |
| plan             | TEXT        | Plan type                         |
| mrr              | DECIMAL     | Monthly recurring revenue         |
| signup_date      | TIMESTAMP   | Signup date                       |
| last_login       | TIMESTAMP   | Last login date                   |
| health_score     | INTEGER     | Health score (0-100)              |
| churn_risk       | DECIMAL     | Churn risk (0-1)                  |
| nps_score        | INTEGER     | NPS score                         |
| support_tickets  | INTEGER     | Open support tickets              |
| feature_usage    | JSONB       | Feature usage metrics             |
| is_active        | BOOLEAN     | Is customer active                |

### Table: `interventions`
| Column         | Type        | Description                       |
|----------------|------------|-----------------------------------|
| id             | SERIAL PK   | Intervention ID                   |
| customer_id    | INTEGER FK  | Customer ID                       |
| type           | TEXT        | Type of intervention              |
| status         | TEXT        | Status (active/completed/etc)     |
| priority       | TEXT        | Priority (low/medium/high)        |
| assigned_csm   | TEXT        | Assigned CSM                      |
| description    | TEXT        | Description                       |
| next_action    | TEXT        | Next action                       |
| due_date       | TIMESTAMP   | Due date                          |
| created_at     | TIMESTAMP   | Created at                        |
| completed_at   | TIMESTAMP   | Completed at                      |
| notes          | TEXT        | Notes                             |

### Table: `integrations`
| Column       | Type      | Description                       |
|--------------|----------|-----------------------------------|
| id           | SERIAL PK | Integration ID                    |
| name         | TEXT      | Integration name                  |
| type         | TEXT      | Type (crm/support/payment/etc)    |
| status       | TEXT      | Status                            |
| last_sync_at | TIMESTAMP | Last sync time                    |
| config       | JSONB     | Config                            |

### Table: `alerts`
| Column     | Type      | Description                       |
|------------|----------|-----------------------------------|
| id         | SERIAL PK | Alert ID                          |
| message    | TEXT      | Alert message                     |
| read       | BOOLEAN   | Is read                           |
| created_at | TIMESTAMP | Created at                        |

### Table: `churn_predictions`
| Column            | Type      | Description                       |
|-------------------|----------|-----------------------------------|
| id                | SERIAL PK | Prediction ID                     |
| customer_id       | INTEGER   | Customer ID                       |
| churn_probability | DECIMAL   | Churn probability (0-1)           |
| risk_level        | TEXT      | Risk level (low/medium/high)      |
| top_causes        | JSONB     | Top churn causes                  |
| prediction_date   | TIMESTAMP | Prediction date                   |

### Table: `churn_causes`
| Column   | Type      | Description                       |
|----------|----------|-----------------------------------|
| id       | SERIAL PK | Cause ID                          |
| cause    | TEXT      | Churn cause                       |
| count    | INTEGER   | Number of customers affected      |
| percent  | INTEGER   | % of total affected               |
| impact   | TEXT      | Impact (low/medium/high)          |

### Table: `playbooks`
| Column      | Type      | Description                       |
|-------------|----------|-----------------------------------|
| id          | SERIAL PK | Playbook ID                       |
| name        | TEXT      | Playbook name                     |
| description | TEXT      | Description                       |
| steps       | JSONB     | Steps (array)                     |
| created_at  | TIMESTAMP | Created at                        |

### Table: `playbook_executions`
| Column      | Type      | Description                       |
|-------------|----------|-----------------------------------|
| id          | SERIAL PK | Execution ID                      |
| playbook_id | INTEGER FK| Playbook ID                       |
| customer_id | INTEGER FK| Customer ID                       |
| status      | TEXT      | Status (running/completed/failed) |
| started_at  | TIMESTAMP | Start time                        |
| completed_at| TIMESTAMP | Completion time                   |
| result      | JSONB     | Execution results                 |

### Table: `user_sessions`
| Column      | Type      | Description                       |
|-------------|----------|-----------------------------------|
| id          | SERIAL PK | Session ID                        |
| customer_id | INTEGER FK| Customer ID                       |
| started_at  | TIMESTAMP | Session start                     |
| ended_at    | TIMESTAMP | Session end                       |
| pages_viewed| INTEGER   | Number of pages viewed            |
| actions     | JSONB     | User actions during session       |

---

## 2. API Endpoints

### Customers
- `GET /api/customers` — List all customers
- `GET /api/customers/{id}` — Get customer details
- `GET /api/customers/{id}/sessions` — Get customer session history
- `GET /api/customers/{id}/timeline` — Get customer activity timeline

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout
- `POST /api/auth/refresh` — Refresh access token

### Interventions
- `GET /api/interventions` — List all interventions
- `POST /api/interventions` — Create a new intervention

### Integrations
- `GET /api/integrations` — List all integrations

### Dashboard
- `GET /api/dashboard/metrics` — Get dashboard summary metrics
- `GET /api/dashboard/chart-data` — Get churn/MRR chart data

### Alerts
- `GET /api/alerts` — List all alerts

### Churn Prediction & Causes
- `POST /api/v1/churn/predict` — Predict churn for a customer (input: customerId)
- `POST /api/v1/causes/explain` — Get churn causes for a customer (input: customerId)
- `GET /api/churn-causes` — Get aggregated churn root causes

### Playbooks
- `POST /api/v1/playbooks/trigger` — Trigger a playbook for a customer

---

## 3. Background Services

### Churn Prediction Engine
- Daily batch predictions for all customers
- Real-time predictions on significant events
- Model retraining pipeline (weekly/monthly)
- Feature importance calculation

### Data Sync Services
- Integration-specific sync jobs (scheduled)
- Real-time webhooks handling
- Error handling and retry logic
- Data transformation pipelines

### Notification System
- Real-time alerts via WebSocket
- Email notifications
- Slack/Teams integration
- Alert aggregation and throttling

### Playbook Automation
- Automated playbook execution
- Action scheduling and queuing
- Success/failure monitoring
- Execution logs and analytics

### Monitoring & Maintenance
- Service health checks
- Performance monitoring
- Error tracking and logging
- Database backups and maintenance

---

## 4. Frontend Integration
- All API calls in the React app should point to these endpoints.
- Backend should return data in the format expected by the frontend (see mock API for examples).

---

## 5. Deployment
- Backend: Railway, Render, AWS, etc.
- Database: Neon, Supabase, or managed PostgreSQL
- Frontend: Vercel, Netlify, etc.

---

**This documentation covers all backend, database, and API requirements to run ChurnShield in production.**
