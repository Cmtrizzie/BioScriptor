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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertBioFileSchema = createInsertSchema(bioFiles);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPlanLimitSchema = createInsertSchema(planLimits);
export const insertAdminLogSchema = createInsertSchema(adminLogs);
export const insertPromoCodeSchema = createInsertSchema(promoCodes);