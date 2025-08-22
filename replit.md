# Customer Churn Prediction Platform

## Overview

This is a comprehensive full-stack customer churn prediction and intervention platform built with React, Express, and TypeScript. The application provides real-time churn risk monitoring, automated intervention playbooks, comprehensive customer analytics, and team management to help businesses reduce customer churn and improve retention.

## Recent Changes (January 2025)

- ✓ Built complete customer management system with detailed profiles and risk analysis
- ✓ Implemented comprehensive playbook management with template library and intervention tracking
- ✓ Created advanced analytics dashboard with KPIs, charts, and actionable insights  
- ✓ Developed integrations marketplace with 10+ popular business tools
- ✓ Added complete settings system for team, notifications, thresholds, and automation
- ✓ Enhanced API with intervention management and churn prediction endpoints
- ✓ Fixed all navigation and routing for seamless multi-page experience

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with ESM modules

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Pattern**: RESTful API with JSON responses
- **Development**: Hot reload with Vite integration in development mode

### Project Structure
The application follows a monorepo structure with clear separation:
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Core Platform Features
- **Dashboard**: Real-time metrics, risk segmentation, churn causes, and intervention tracking
- **Customer Management**: Complete customer profiles with risk analysis, health scores, and detailed insights
- **Playbook System**: Template library with CX Rescue, Payment Recovery, Engagement Boost, and Product Training workflows
- **Analytics**: Advanced charts, KPIs, retention trends, and actionable insights with performance tracking
- **Integrations**: Marketplace with 10+ connectors (Salesforce, Zendesk, Stripe, Google Analytics, etc.)
- **Settings**: Team management, notification preferences, risk thresholds, and automation rules

### Data Layer
- **Database**: PostgreSQL with tables for users, customers, churn predictions, interventions, integrations, churn causes, and risk alerts
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas for runtime type validation
- **Storage Abstraction**: IStorage interface with in-memory implementation for development

### Frontend Architecture
- **Multi-page Application**: 6 main pages with seamless navigation (Dashboard, Customers, Playbooks, Analytics, Integrations, Settings)
- **Component Library**: Comprehensive UI components including cards, forms, modals, charts, tables, and tabs
- **Charts**: Chart.js and Recharts integration for data visualization
- **Form Handling**: React Hook Form with Zod validation for complex forms
- **State Management**: TanStack Query for server state with caching and optimistic updates

### Backend Services
- **API Routes**: RESTful endpoints for dashboard metrics, customer data, interventions, churn predictions, and analytics
- **Churn Prediction**: ML-like algorithm considering health score, NPS, support tickets, engagement, and feature usage
- **Intervention Management**: Complete CRUD operations for playbook execution and tracking
- **Middleware**: Request logging, error handling, JSON parsing, and validation
- **Development Tools**: Vite integration for hot reload and development server

## Data Flow

1. **Data Ingestion**: Customer data flows through the API endpoints into the PostgreSQL database
2. **Real-time Updates**: React Query manages server state with automatic refetching and caching
3. **Risk Calculation**: Churn risk scores are calculated and stored in the churn_predictions table
4. **Alert Generation**: Risk alerts are generated based on thresholds and stored in risk_alerts table
5. **Intervention Management**: Automated and manual interventions are tracked through the interventions table
6. **Dashboard Display**: All data is aggregated and displayed in real-time on the dashboard

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-kit for database operations
- **UI**: Multiple @radix-ui packages for accessible components
- **State Management**: @tanstack/react-query for server state
- **Forms**: @hookform/resolvers with react-hook-form
- **Charts**: chart.js for data visualization
- **Styling**: tailwindcss with class-variance-authority for component variants

### Development Dependencies
- **Build**: vite, tsx for TypeScript execution
- **Replit Integration**: @replit/vite-plugin-runtime-error-modal and @replit/vite-plugin-cartographer

## Deployment Strategy

### Development Environment
- Uses Vite dev server with hot module replacement
- Express server runs on development mode with middleware integration
- In-memory storage for rapid development and testing

### Production Build
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js`
- Database: Uses Neon serverless PostgreSQL with connection pooling
- Environment: Configured for Node.js production deployment

### Database Management
- Migrations: Drizzle Kit handles database schema migrations
- Schema: Centralized in `shared/schema.ts` for type safety across frontend and backend
- Connection: Environment variable `DATABASE_URL` for database configuration

The application is designed to be easily deployable on platforms like Replit, with proper error handling, logging, and development tools integrated throughout the stack.