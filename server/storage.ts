import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Database connection with fallback for development
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/bioscriptor_dev";

let db: ReturnType<typeof drizzle>;

if (process.env.DATABASE_URL) {
  // Production: Use Neon database
  const sql = neon(connectionString);
  db = drizzle(sql, { schema });
} else {
  // Development: Use in-memory fallback or local PostgreSQL
  console.log("Warning: No DATABASE_URL found. Using mock database for development.");

  // Create a mock database object for development
  const mockSql = () => Promise.resolve([]);
  db = drizzle(mockSql as any, { schema });
}

export const storage = {
  async getUserByFirebaseUid(firebaseUid: string) {
    try {
      const users = await db.select().from(schema.users).where(schema.users.firebaseUid.eq(firebaseUid));
      return users[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async createUser(userData: any) {
    try {
      const [user] = await db.insert(schema.users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      return { id: 1, ...userData };
    }
  },

  async updateUser(userId: number, updates: any) {
    try {
      const [user] = await db.update(schema.users).set(updates).where(schema.users.id.eq(userId)).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      return { id: userId, ...updates };
    }
  },

  async getChatSessions(userId: number) {
    try {
      return await db.select().from(schema.chatSessions).where(schema.chatSessions.userId.eq(userId));
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },

  async getChatSession(sessionId: number) {
    try {
      const sessions = await db.select().from(schema.chatSessions).where(schema.chatSessions.id.eq(sessionId));
      return sessions[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async deleteChatSession(sessionId: number) {
    try {
      await db.delete(schema.chatSessions).where(schema.chatSessions.id.eq(sessionId));
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
      return await db.select().from(schema.bioFiles).where(schema.bioFiles.userId.eq(userId));
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
    try {
      const subscriptions = await db.select().from(schema.subscriptions)
        .where(schema.subscriptions.userId.eq(userId))
        .where(schema.subscriptions.status.eq('active'));
      return subscriptions[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async getAllUsers() {
    try {
      return await db.select().from(schema.users);
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },

  async getAllSubscriptions() {
    try {
      return await db.select().from(schema.subscriptions);
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },

  async getPlanLimit(tier: string) {
    try {
      const limits = await db.select().from(schema.planLimits).where(schema.planLimits.tier.eq(tier));
      return limits[0] || null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  },

  async updatePlanLimit(tier: string, updates: any) {
    try {
      const [limit] = await db.update(schema.planLimits).set(updates).where(schema.planLimits.tier.eq(tier)).returning();
      return limit;
    } catch (error) {
      console.error("Database error:", error);
      return { tier, ...updates };
    }
  },

  async getAdminLogs(limit: number) {
    try {
      return await db.select().from(schema.adminLogs).limit(limit);
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },

  async createAdminLog(logData: any) {
    try {
      const [log] = await db.insert(schema.adminLogs).values(logData).returning();
      return log;
    } catch (error) {
      console.error("Database error:", error);
      return { id: 1, ...logData };
    }
  },

  async resetUserDailyLimit(userId: number) {
    try {
      const [user] = await db.update(schema.users).set({ queryCount: 0 }).where(schema.users.id.eq(userId)).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      return { id: userId, queryCount: 0 };
    }
  }
};

export { db };
export * from "@shared/schema";