import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  tier: text("tier").notNull().default("free"), // 'free' | 'pro' | 'team' | 'lifetime'
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  queryCount: integer("query_count").notNull().default(0),
  dailyLimit: integer("daily_limit").notNull().default(10),
  totalCredits: integer("total_credits").notNull().default(0),
  remainingMessages: integer("remaining_messages").notNull().default(10),
  subscriptionStatus: text("subscription_status").notNull().default("active"), // 'active' | 'cancelled' | 'expired'
  trialEnds: timestamp("trial_ends"),
  lastResetDate: timestamp("last_reset_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  messages: json("messages").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bioFiles = pgTable("bio_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // 'fasta' | 'gb' | 'pdb' | 'csv'
  content: text("content").notNull(),
  analysis: json("analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  paypalSubscriptionId: text("paypal_subscription_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(), // 'active' | 'cancelled' | 'expired' | 'trialing'
  tier: text("tier").notNull(),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const planLimits = pgTable("plan_limits", {
  id: serial("id").primaryKey(),
  tier: text("tier").notNull().unique(),
  dailyLimit: integer("daily_limit").notNull(),
  maxTokensPerRequest: integer("max_tokens_per_request").notNull(),
  maxCharactersPerPrompt: integer("max_characters_per_prompt").notNull(),
  modelsAccess: json("models_access").notNull(), // array of model names
  features: json("features").notNull(), // array of feature flags
  price: text("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id"),
  details: json("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBioFileSchema = createInsertSchema(bioFiles).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPlanLimitSchema = createInsertSchema(planLimits).omit({
  id: true,
  createdAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertBioFile = z.infer<typeof insertBioFileSchema>;
export type BioFile = typeof bioFiles.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertPlanLimit = z.infer<typeof insertPlanLimitSchema>;
export type PlanLimit = typeof planLimits.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;

// Message types for chat history
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  tokens?: number;
  model?: string;
}

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'team' | 'lifetime';

// Plan features
export interface PlanFeatures {
  dailyLimit: number;
  models: string[];
  historyAccess: boolean;
  exportFeatures: boolean;
  priorityQueue: boolean;
  apiAccess: boolean;
  maxTokens: number;
  maxCharacters: number;
  watermark: boolean;
  concurrentChats: number;
}
