# Churn Prediction Application - Complete Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Application Architecture](#application-architecture)
3. [Machine Learning Implementation](#machine-learning-implementation)
4. [Frontend Components](#frontend-components)
5. [Backend API Design](#backend-api-design)
6. [Data Flow](#data-flow)
7. [ML Model Integration](#ml-model-integration)
8. [Key Features](#key-features)
9. [Development Setup](#development-setup)
10. [API Reference](#api-reference)

## Overview

This is a sophisticated **Customer Churn Prediction Application** built with modern web technologies and advanced machine learning capabilities. The application predicts customer churn risk using Random Forest algorithms and provides intelligent intervention recommendations through Reinforcement Learning.

### Tech Stack
- **Frontend**: React, TypeScript, TanStack Query, Chart.js, Tailwind CSS
- **Backend**: Express.js, TypeScript, Node.js
- **ML Engine**: Custom Random Forest & Q-Learning implementation
- **Data**: JSON-based mock data with dynamic loading
- **UI Components**: Custom component library with shadcn/ui

## Application Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   ML Engine     │
│   (React)       │◄──►│  (Express.js)   │◄──►│ (Custom Models) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Data Storage   │◄─────────────┘
                        │ (In-Memory +    │
                        │  JSON Files)    │
                        └─────────────────┘
```

### Directory Structure
```
Churn-main/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── dashboard/  # Dashboard-specific components
│   │   │   ├── layout/     # Layout components (Sidebar, TopBar)
│   │   │   └── ui/         # Base UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
│   └── package.json
├── server/                 # Backend Express.js application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # In-memory data storage
│   ├── ml-engine.ts       # ML models implementation
│   ├── data-loader.ts     # Dynamic data loading
│   └── data-transformer.ts # Data format transformation
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts          # Zod validation schemas
├── mock-data.json         # Customer and business data
└── package.json           # Root package configuration
```

## Machine Learning Implementation

### 1. Random Forest Model for Churn Prediction

The application uses a custom-built Random Forest implementation for predicting customer churn probability.

**Model Features:**
- **15 Decision Trees** trained on customer data
- **Feature Engineering** from customer attributes
- **Real-time Predictions** via API endpoints
- **Feature Importance Analysis** for explainable AI

**Key Customer Features Used:**
```typescript
interface CustomerFeatures {
  healthScore: number;        // Overall customer health (0-100)
  npsScore: number;          // Net Promoter Score
  supportTickets: number;     // Number of support requests
  daysSinceLastLogin: number; // User engagement metric
  featureUsage: number;      // Product adoption score
  contractValue: number;     // Annual contract value
  accountAge: number;        // Tenure in days
}
```

**Prediction Output:**
```typescript
interface ChurnPrediction {
  customerId: number;
  churnProbability: number;   // 0.0 to 1.0 (decimal)
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;         // Model confidence
  topFactors: FeatureImportance[];
  recommendedActions: string[];
}
```

### 2. Reinforcement Learning for Intervention Optimization

The application implements a **Q-Learning agent** to optimize intervention strategies.

**Q-Learning Implementation:**
```typescript
class QLearningAgent {
  private qTable: Map<string, number>;
  private learningRate = 0.1;
  private discountFactor = 0.95;
  private explorationRate = 0.1;

  // Learns from intervention outcomes
  updateQValue(state: string, action: string, reward: number, nextState: string) {
    // Q-learning update formula implementation
  }

  // Recommends best intervention for customer
  recommendAction(customerState: string): InterventionRecommendation {
    // Returns optimal intervention based on learned Q-values
  }
}
```

**Intervention Types:**
- Executive Check-in
- Payment Recovery
- Support Training
- Feature Adoption
- Account Review

### 3. Feature Importance & Explainable AI

The ML engine provides detailed feature importance analysis:

```typescript
interface FeatureImportance {
  feature: string;           // Feature name (e.g., "Health Score")
  importance: number;        // Percentage importance (0-100)
  impact: 'positive' | 'negative';
  description: string;       // Human-readable explanation
  confidenceLevel: 'high' | 'medium' | 'low';
  actionability: 'high' | 'medium' | 'low';
}
```

## Frontend Components

### Dashboard Components

#### 1. ML Insights Component (`ml-insights.tsx`)
**Purpose**: Central hub for ML-powered analytics and predictions

**Features:**
- Real-time churn predictions for selected customers
- Feature importance visualization with confidence levels
- Model performance metrics
- Intervention recommendations with success probabilities

**Data Sources:**
- `/api/v1/churn/predict` - Individual customer predictions
- `/api/ml/analytics` - Model performance and feature importance
- `/api/ml/recommend-intervention` - AI-powered intervention suggestions

#### 2. Analytics Page (`analytics.tsx`)
**Purpose**: Comprehensive analytics dashboard with ML-powered insights

**Key Charts:**
- **Churn Risk Distribution**: Uses ML batch predictions with correct thresholds (50%, 80%)
- **Health Score Distribution**: ML-enhanced customer health analysis
- **Retention Trends**: ML-calculated retention probabilities
- **Success Rate Analysis**: Intervention effectiveness metrics

**Data Integration:**
```typescript
// Risk distribution using ML predictions
const riskDistribution = useMemo(() => {
  const predictions = mlPredictions.predictions;
  const lowRisk = predictions.filter(p => p.churnProbability < 0.5).length;
  const mediumRisk = predictions.filter(p => p.churnProbability >= 0.5 && p.churnProbability < 0.8).length;
  const highRisk = predictions.filter(p => p.churnProbability >= 0.8).length;
  // ... chart configuration
}, [mlPredictions, theme]);
```

#### 3. Customer Management (`customers.tsx`)
**Purpose**: Customer list with real-time ML churn risk assessment

**ML Integration:**
- **Batch Predictions**: Loads ML predictions for all customers
- **Dynamic Risk Display**: Shows ML-calculated risk with "(ML)" indicator
- **Smart Filtering**: Risk filters use ML predictions, not static data
- **Real-time Updates**: Predictions refresh after individual predict actions

```typescript
// ML-powered customer risk calculation
const getMLChurnRisk = (customerId: number): number => {
  const prediction = mlPredictions?.predictions?.find(p => p.customerId === customerId);
  return prediction ? (prediction.churnProbability * 100) : 0;
};
```

### Core UI Components

#### Data Visualization
- **Chart.js Integration**: Line charts, bar charts, doughnut charts
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Charts automatically refresh with new ML data
- **Theme Support**: Dynamic color schemes based on CSS variables

#### State Management
- **TanStack Query**: Efficient API state management with caching
- **React Hooks**: Custom hooks for ML data fetching and transformation
- **Error Boundaries**: Graceful error handling for ML API failures

## Backend API Design

### Core API Structure

#### 1. ML-Specific Endpoints

**`POST /api/ml/predict`**
```typescript
// Single customer churn prediction
{
  "customerId": 1,
  "churnProbability": 0.8883,
  "riskLevel": "high",
  "confidence": 0.8739,
  "topFactors": [/* feature importance */],
  "recommendedActions": [/* action strings */]
}
```

**`POST /api/ml/batch-predict`**
```typescript
// Batch predictions for multiple customers
{
  "predictions": [
    {
      "customerId": 1,
      "churnProbability": 0.8883,
      "riskLevel": "high"
    }
    // ... more predictions
  ]
}
```

**`GET /api/ml/analytics`**
```typescript
// Comprehensive ML analytics
{
  "totalCustomers": 50,
  "riskDistribution": {
    "high": 17,    // ≥80% churn probability
    "medium": 31,  // 50-80% churn probability  
    "low": 2       // <50% churn probability
  },
  "featureImportances": [/* detailed feature analysis */],
  "healthScoreAnalytics": {/* health score distribution */},
  "modelPerformance": {/* accuracy metrics */}
}
```

**`POST /api/ml/recommend-intervention`**
```typescript
// AI-powered intervention recommendations
{
  "type": "Executive Check-in",
  "priority": "high",
  "estimatedSuccess": 0.85,
  "reasoning": "Customer shows high churn risk with declining health score"
}
```

#### 2. Enhanced Business Endpoints

**`GET /api/dashboard/metrics`**
- Uses ML predictions for `customersAtRisk` and `averageChurnRisk`
- Combines ML data with business metrics
- Real-time calculation based on current ML model state

**`GET /api/dashboard/segmentation`**
- Customer risk segmentation using ML predictions
- Standardized thresholds (50%, 80%) across all interfaces
- Fallback to static data if ML predictions fail

**`GET /api/dashboard/chart-data`**
- ML-enhanced trend data generation
- Uses current ML predictions to create realistic time series
- Combines historical patterns with current risk assessment

### Data Storage Architecture

#### In-Memory Storage (`storage.ts`)
```typescript
class MemStorage {
  private customers: Map<number, Customer> = new Map();
  private interventions: Map<number, Intervention> = new Map();
  
  // Dynamic data loading from JSON files
  async loadData(): Promise<void> {
    const mockData = dataLoader.getMockData();
    this.seedData(); // Populate from loaded data
  }
}
```

#### Dynamic Data Loading (`data-loader.ts`)
```typescript
class DataLoader {
  // Loads and transforms external JSON data
  async loadData(): Promise<void> {
    const rawData = JSON.parse(fs.readFileSync('mock-data.json', 'utf8'));
    
    // Transform external format to internal schema
    if (this.isExternalFormat(rawData)) {
      this.mockData = DataTransformer.transformToInternal(rawData);
      this.extendedData = DataTransformer.getExtendedData(rawData);
    }
  }
}
```

## Data Flow

### 1. Application Startup
```
1. Server starts → ML Engine initializes
2. Load mock-data.json → Transform to internal format  
3. Train Random Forest on customer features
4. Initialize Q-Learning agent with intervention data
5. Start Express server with all API routes
```

### 2. Customer Churn Prediction Flow
```
Frontend Request → Backend API → ML Engine → Feature Extraction → 
Random Forest Prediction → Risk Classification → Response with Actions
```

### 3. Real-time Analytics Flow
```
Page Load → Batch ML Predictions → Risk Distribution Calculation → 
Chart Data Generation → UI Update → User Interaction → Refresh Cycle
```

### 4. Intervention Recommendation Flow
```
Customer Analysis → ML Risk Assessment → Q-Learning Agent Consultation → 
Intervention Strategy Selection → Success Probability Estimation → 
Recommendation Delivery → Outcome Tracking → Model Learning
```

## ML Model Integration

### Risk Threshold Standardization

The application uses consistent risk thresholds across all components:

```typescript
// Standardized Risk Classification
const classifyRisk = (churnProbability: number) => {
  if (churnProbability >= 0.8) return 'high';    // ≥80%
  if (churnProbability >= 0.5) return 'medium';  // 50-80%
  return 'low';                                   // <50%
};
```

### Feature Engineering Pipeline

```typescript
// Customer data transformation for ML
const extractFeatures = (customer: Customer): FeatureVector => {
  return {
    healthScore: customer.healthScore,
    npsScore: customer.npsScore || 0,
    supportTickets: customer.supportTickets,
    daysSinceLastLogin: calculateDaysSince(customer.lastLogin),
    featureUsage: calculateUsageScore(customer.featureUsage),
    contractValue: customer.mrr * 12,
    accountAge: calculateDaysSince(customer.createdAt)
  };
};
```

### Model Performance Monitoring

```typescript
// Real-time model performance tracking
interface ModelMetrics {
  accuracy: number;          // Overall prediction accuracy
  precision: number;         // Precision for high-risk predictions
  recall: number;           // Recall for actual churned customers
  f1Score: number;          // Balanced F1 score
  featureStability: number; // Feature importance consistency
}
```

## Key Features

### 1. Real-time ML Predictions
- **Instant Analysis**: Sub-second churn predictions for any customer
- **Batch Processing**: Efficient bulk predictions for analytics
- **Consistent Results**: Same ML model across all interfaces

### 2. Explainable AI
- **Feature Importance**: Detailed analysis of churn risk factors
- **Confidence Levels**: Model confidence for each prediction
- **Actionable Insights**: Specific recommendations based on risk factors

### 3. Adaptive Learning
- **Q-Learning**: Intervention strategies improve based on outcomes
- **Model Updates**: Random Forest can be retrained with new data
- **Feedback Loop**: User actions influence future recommendations

### 4. Comprehensive Analytics
- **Multi-dimensional Analysis**: Customer health, risk distribution, trends
- **Interactive Dashboards**: Real-time charts and visualizations
- **Export Capabilities**: Data export for external analysis

### 5. Integration-Ready Architecture
- **RESTful APIs**: Standard HTTP endpoints for all ML functionality
- **Webhook Support**: Real-time notifications for high-risk customers
- **Data Import/Export**: JSON-based data management

## Development Setup

### Prerequisites
```bash
Node.js 18+
npm or yarn
TypeScript knowledge
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd Churn-main

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```bash
# Server runs on http://localhost:5000
# Frontend accessible via Vite dev server
# ML API available at http://localhost:5000/api/ml/
```

### Data Configuration
```bash
# Place your customer data in mock-data.json
# Follow the schema in mock-data.example.json
# Restart server to load new data
```

## API Reference

### Customer Prediction APIs

#### Individual Prediction
```http
POST /api/v1/churn/predict
Content-Type: application/json

{
  "customerId": 1
}
```

#### Batch Predictions
```http
POST /api/ml/batch-predict
Content-Type: application/json

{
  "customerIds": [1, 2, 3, 4, 5]
}
```

### Analytics APIs

#### ML Analytics
```http
GET /api/ml/analytics
```

#### Feature Importance
```http
GET /api/ml/feature-importance
```

#### Feature Analysis (Detailed)
```http
GET /api/ml/feature-analysis
```

### Dashboard APIs

#### Business Metrics
```http
GET /api/dashboard/metrics
```

#### Customer Segmentation
```http
GET /api/dashboard/segmentation
```

#### Chart Data
```http
GET /api/dashboard/chart-data
```

### Intervention APIs

#### Get Recommendation
```http
POST /api/ml/recommend-intervention
Content-Type: application/json

{
  "customerId": 1
}
```

#### Trigger Playbook
```http
POST /api/v1/playbooks/trigger
Content-Type: application/json

{
  "customerId": 1,
  "playbookId": 1
}
```

#### Update Outcome (for RL learning)
```http
POST /api/ml/update-outcome
Content-Type: application/json

{
  "customerId": 1,
  "intervention": "Executive Check-in",
  "success": true,
  "revenueImpact": 5000
}
```

### Administrative APIs

#### Reload Data
```http
POST /api/admin/reload-data
```

#### Upload New Data
```http
POST /api/admin/upload-data
Content-Type: application/json

{
  "data": { /* new mock data */ }
}
```

---

## Conclusion

This application represents a sophisticated integration of modern web development practices with advanced machine learning capabilities. The architecture ensures scalability, maintainability, and real-time performance while providing powerful AI-driven insights for customer success teams.

The ML models continuously learn and adapt, providing increasingly accurate predictions and recommendations. The modular design allows for easy integration with external systems and expansion of ML capabilities.

**Key Architectural Strengths:**
- **Separation of Concerns**: Clear boundaries between UI, API, and ML layers
- **Real-time Performance**: Sub-second predictions with efficient caching
- **Explainable AI**: Transparent model decisions with actionable insights
- **Adaptive Learning**: Models improve automatically based on outcomes
- **Production Ready**: Comprehensive error handling and monitoring

This foundation supports both current requirements and future enhancements, making it an ideal platform for AI-powered customer success applications.