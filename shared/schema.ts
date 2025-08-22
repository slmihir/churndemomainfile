import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company").notNull(),
  plan: text("plan").notNull(),
  mrr: decimal("mrr", { precision: 10, scale: 2 }).notNull(),
  signupDate: timestamp("signup_date").notNull(),
  lastLogin: timestamp("last_login"),
  healthScore: integer("health_score").notNull().default(75),
  churnRisk: decimal("churn_risk", { precision: 5, scale: 2 }).notNull().default('0'),
  npsScore: integer("nps_score"),
  supportTickets: integer("support_tickets").notNull().default(0),
  featureUsage: jsonb("feature_usage"),
  isActive: boolean("is_active").notNull().default(true),
});

export const churnPredictions = pgTable("churn_predictions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  churnProbability: decimal("churn_probability", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(), // 'low', 'medium', 'high'
  topCauses: jsonb("top_causes").notNull(),
  predictionDate: timestamp("prediction_date").notNull().defaultNow(),
});

export const interventions = pgTable("interventions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  type: text("type").notNull(), // 'executive_checkin', 'payment_recovery', etc.
  status: text("status").notNull().default('active'), // 'active', 'completed', 'cancelled'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high'
  assignedCsm: text("assigned_csm").notNull(),
  description: text("description"),
  nextAction: text("next_action"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});



export const churnCauses = pgTable("churn_causes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  impact: decimal("impact", { precision: 5, scale: 2 }).notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
});

export const riskAlerts = pgTable("risk_alerts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertChurnPredictionSchema = createInsertSchema(churnPredictions).omit({ id: true, predictionDate: true });
export const insertInterventionSchema = createInsertSchema(interventions).omit({ id: true, createdAt: true });

export const insertChurnCauseSchema = createInsertSchema(churnCauses).omit({ id: true });
export const insertRiskAlertSchema = createInsertSchema(riskAlerts).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type ChurnPrediction = typeof churnPredictions.$inferSelect;
export type InsertChurnPrediction = z.infer<typeof insertChurnPredictionSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;

export type ChurnCause = typeof churnCauses.$inferSelect;
export type InsertChurnCause = z.infer<typeof insertChurnCauseSchema>;
export type RiskAlert = typeof riskAlerts.$inferSelect;
export type InsertRiskAlert = z.infer<typeof insertRiskAlertSchema>;
