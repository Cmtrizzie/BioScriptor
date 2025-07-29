import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

// Database connection with fallback for development
let connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/bioscriptor_dev";

// Clean up DATABASE_URL if it starts with 'psql'
if (connectionString.startsWith("psql '") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(6, -1); // Remove "psql '" from start and "'" from end
}

// Additional cleanup for common malformed URLs
if (connectionString.includes('base')) {
  console.warn('⚠️ Detected malformed DATABASE_URL containing "base". Please check your environment variables.');
  connectionString = "postgresql://localhost:5432/bioscriptor_dev";
}

// Ensure SSL mode is set for Neon
if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

let db: any = null;
let isDatabaseAvailable = false;

console.log('🔍 Checking database configuration...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Cleaned connection string format:', connectionString.substring(0, 50) + '...');

if (process.env.DATABASE_URL) {
  try {
    console.log('🔌 Attempting to connect to Neon PostgreSQL...');
    const sql = neon(connectionString);
    db = drizzle(sql, { schema });
    isDatabaseAvailable = true;
    console.log('✅ Database connection established');
  } catch (error) {
    console.warn('❌ Database connection failed, running in fallback mode:', error.message);
    isDatabaseAvailable = false;
  }
} else {
  // Development: Use in-memory fallback or local PostgreSQL
  console.log("⚠️ No DATABASE_URL found. Using mock database for development.");

  // Create a mock database object for development
  const mockSql = () => Promise.resolve([]);
  db = drizzle(mockSql as any, { schema });
}

// In-memory fallback storage
const fallbackStorage = {
  users: new Map(),
  conversations: new Map(),
  subscriptions: new Map(),
  adminLogs: []
};

export const storage = {
  async getUserByFirebaseUid(firebaseUid: string) {
    if (!isDatabaseAvailable) {
      // Fallback mode
      const user = fallbackStorage.users.get(firebaseUid);
      return user || null;
    }
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, firebaseUid));
      return users[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      const user = fallbackStorage.users.get(firebaseUid);
      return user || null;
    }
  },

  async createUser(userData: any) {
    if (!isDatabaseAvailable) {
      // Fallback mode
      const user = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackStorage.users.set(userData.firebaseUid, user);
      return user;
    }
    try {
      const [user] = await db.insert(schema.users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      const user = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackStorage.users.set(userData.firebaseUid, user);
      return user;
    }
  },

  async updateUser(userId: number, updates: any) {
    if (!isDatabaseAvailable) {
      // Fallback mode
      const existingUser = fallbackStorage.users.get(userId);
      if (existingUser) {
        const updatedUser = { ...existingUser, ...updates, updatedAt: new Date() };
        fallbackStorage.users.set(userId, updatedUser);
        return updatedUser;
      }
      return null;
    }
    try {
      const [user] = await db.update(schema.users).set(updates).where(eq(schema.users.id, userId)).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      const existingUser = fallbackStorage.users.get(userId);
      if (existingUser) {
        const updatedUser = { ...existingUser, ...updates, updatedAt: new Date() };
        fallbackStorage.users.set(userId, updatedUser);
        return updatedUser;
      }
      return null;
    }
  },

  async getChatSessions(userId: number) {
    if (!isDatabaseAvailable) {
      return fallbackStorage.conversations.get(userId) || [];
    }
    try {
      return await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.userId, userId));
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      return fallbackStorage.conversations.get(userId) || [];
    }
  },

  async getChatSession(sessionId: number) {
    try {
      const sessions = await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, sessionId));
      return sessions[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async deleteChatSession(sessionId: number) {
    try {
      await db.delete(schema.chatSessions).where(eq(schema.chatSessions.id, sessionId));
      return true;
    } catch (error) {
      console.error("Database error:", error);
      return false;
    }
  },

  async createBioFile(fileData: any) {
    try {
      const [file] = await db.insert(schema.bioFiles).values(fileData).returning();
      return file;
    } catch (error) {
      console.error("Database error:", error);
      return { id: 1, ...fileData };
    }
  },

  async getBioFiles(userId: number) {
    try {
      return await db.select().from(schema.bioFiles).where(eq(schema.bioFiles.userId, userId));
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },

  async createSubscription(subscriptionData: any) {
    try {
      const [subscription] = await db.insert(schema.subscriptions).values(subscriptionData).returning();
      return subscription;
    } catch (error) {
      console.error("Database error:", error);
      return { id: 1, ...subscriptionData };
    }
  },

  async getActiveSubscription(userId: number) {
    if (!isDatabaseAvailable) {
      return fallbackStorage.subscriptions.get(userId) || null;
    }
    try {
      const subscriptions = await db.select().from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId))
        .where(eq(schema.subscriptions.status, 'active'));
      return subscriptions[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      return fallbackStorage.subscriptions.get(userId) || null;
    }
  },

  async getAllUsers() {
    if (!isDatabaseAvailable) {
      return Array.from(fallbackStorage.users.values());
    }
    try {
      return await db.select().from(schema.users);
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      return Array.from(fallbackStorage.users.values());
    }
  },

  async getAllSubscriptions() {
    if (!isDatabaseAvailable) {
      return Array.from(fallbackStorage.subscriptions.values());
    }
    try {
      return await db.select().from(schema.subscriptions);
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      return Array.from(fallbackStorage.subscriptions.values());
    }
  },

  async getPlanLimit(tier: string) {
    try {
      const limits = await db.select().from(schema.planLimits).where(eq(schema.planLimits.tier, tier));
      return limits[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async updatePlanLimit(tier: string, updates: any) {
    try {
      const [limit] = await db.update(schema.planLimits).set(updates).where(eq(schema.planLimits.tier, tier)).returning();
      return limit;
    } catch (error) {
      console.error("Database error:", error);
      return { tier, ...updates };
    }
  },

  async getAllPlanLimits() {
    try {
      return await db.select().from(schema.planLimits);
    } catch (error) {
      console.error('Error fetching all plan limits:', error);
      return [];
    }
  },

  async createPlanLimit(planData: any) {
    try {
      const [result] = await db
        .insert(schema.planLimits)
        .values(planData)
        .returning();

      return result;
    } catch (error) {
      console.error('Error creating plan limit:', error);
      throw error;
    }
  },

  async deletePlanLimit(tier: any) {
    try {
      const result = await db
        .delete(schema.planLimits)
        .where(eq(schema.planLimits.tier, tier))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting plan limit:', error);
      return false;
    }
  },

  // Promo Code Methods
  async getAllPromoCodes() {
    try {
      return await db.select().from(schema.promoCodes).orderBy(desc(schema.promoCodes.createdAt));
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      return [];
    }
  },

  async createPromoCode(promoData: any) {
    try {
      const [result] = await db
        .insert(schema.promoCodes)
        .values(promoData)
        .returning();

      return result;
    } catch (error) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  },

  async updatePromoCode(id: number, updates: any) {
    try {
      const [result] = await db
        .update(schema.promoCodes)
        .set(updates)
        .where(eq(schema.promoCodes.id, id))
        .returning();

      return result || null;
    } catch (error) {
      console.error('Error updating promo code:', error);
      return null;
    }
  },

  async deletePromoCode(id: number) {
    try {
      const result = await db
        .delete(schema.promoCodes)
        .where(eq(schema.promoCodes.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting promo code:', error);
      return false;
    }
  },

  async getPromoCodeByCode(code: string) {
    try {
      const result = await db
        .select()
        .from(schema.promoCodes)
        .where(eq(schema.promoCodes.code, code.toUpperCase()))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching promo code:', error);
      return null;
    }
  },

  async resetUserDailyLimit(userId: number) {
    try {
      const [user] = await db.update(schema.users).set({ queryCount: 0 }).where(eq(schema.users.id, userId)).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      return { id: userId, queryCount: 0 };
    }
  },

  async getUserByEmail(email: string) {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
      return users[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async getUserById(userId: number) {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      return users[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async createAdminLog(logData: any) {
    if (!isDatabaseAvailable) {
      const log = { ...logData, id: Date.now().toString(), createdAt: new Date() };
      fallbackStorage.adminLogs.push(log);
      return log;
    }
    try {
      const [log] = await db.insert(schema.adminLogs).values(logData).returning();
      return log;
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      const log = { ...logData, id: Date.now().toString(), createdAt: new Date() };
      fallbackStorage.adminLogs.push(log);
      return log;
    }
  },

  async getAdminLogs(limit: number = 100) {
    if (!isDatabaseAvailable) {
      return fallbackStorage.adminLogs.slice(-100);
    }
    try {
      return await db.select().from(schema.adminLogs).orderBy(desc(schema.adminLogs.timestamp)).limit(limit);
    } catch (error) {
      console.error("Database error:", error);
      isDatabaseAvailable = false;
      return fallbackStorage.adminLogs.slice(-100);
    }
  },
};

export { db };
export * from "@shared/schema";