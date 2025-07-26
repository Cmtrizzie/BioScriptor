import { pgTable, text, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  tier: text("tier").notNull().default("free"),
  role: text("role").default("user"),
  queryCount: integer("query_count").notNull().default(0),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bioFiles = pgTable("bio_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  content: text("content").notNull(),
  analysis: jsonb("analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  paypalSubscriptionId: text("paypal_subscription_id"),
  status: text("status").notNull(),
  tier: text("tier").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const planLimits = pgTable("plan_limits", {
  id: serial("id").primaryKey(),
  tier: text("tier").notNull().unique(),
  maxQueries: integer("max_queries"),
  maxFileSize: integer("max_file_size"),
  features: jsonb("features").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  action: text("action").notNull(),
  targetResource: text("target_resource"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // 'percentage' or 'fixed'
  value: integer("value").notNull(), // percentage (1-100) or fixed amount in cents
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiProviders = pgTable("api_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'openai', 'anthropic', 'cohere', 'custom'
  endpoint: text("endpoint").notNull(),
  apiKey: text("api_key").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  maxRetries: integer("max_retries").notNull().default(2),
  timeout: integer("timeout").notNull().default(30),
  rateLimit: integer("rate_limit").notNull().default(100),
  planAccess: jsonb("plan_access").notNull().default(['free', 'premium', 'enterprise']),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiErrorLogs = pgTable("api_error_logs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  userId: integer("user_id"),
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  resolved: boolean("resolved").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // 'paypal', 'stripe', etc.
  eventType: text("event_type").notNull(),
  eventId: text("event_id"),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(), // 'success', 'failed', 'retry'
  processingTime: integer("processing_time"), // in milliseconds
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const paymentFailures = pgTable("payment_failures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: text("subscription_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  reason: text("reason").notNull(),
  attempts: integer("attempts").notNull().default(1),
  lastAttempt: timestamp("last_attempt").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertBioFileSchema = createInsertSchema(bioFiles);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPlanLimitSchema = createInsertSchema(planLimits);
export const insertAdminLogSchema = createInsertSchema(adminLogs);
export const insertPromoCodeSchema = createInsertSchema(promoCodes);
export const insertApiProviderSchema = createInsertSchema(apiProviders);
export const insertApiErrorLogSchema = createInsertSchema(apiErrorLogs);
export const insertWebhookLogSchema = createInsertSchema(webhookLogs);
export const insertPaymentFailureSchema = createInsertSchema(paymentFailures);