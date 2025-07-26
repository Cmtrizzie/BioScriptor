import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
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
      const users = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, firebaseUid));
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
      const [user] = await db.update(schema.users).set(updates).where(eq(schema.users.id, userId)).returning();
      return user;
    } catch (error) {
      console.error("Database error:", error);
      return { id: userId, ...updates };
    }
  },

  async getChatSessions(userId: number) {
    try {
      return await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.userId, userId));
    } catch (error) {
      console.error("Database error:", error);
      return [];
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
    try {
      const subscriptions = await db.select().from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId))
        .where(eq(schema.subscriptions.status, 'active'));
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
    try {
      const [log] = await db.insert(schema.adminLogs).values(logData).returning();
      return log;
    } catch (error) {
      console.error("Database error:", error);
      return { id: 1, ...logData };
    }
  },

  async getAdminLogs(limit: number = 100) {
    try {
      return await db.select().from(schema.adminLogs).orderBy(desc(schema.adminLogs.timestamp)).limit(limit);
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  },
};

export { db };
export * from "@shared/schema";