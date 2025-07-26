import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatSessionSchema, insertBioFileSchema } from "@shared/schema";
import { processQuery } from "./services/ai";
import { analyzeBioFile } from "./services/bioinformatics";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { securityManager } from "./services/security";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security and authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      // Rate limiting
      const clientIp = req.ip || req.connection.remoteAddress;
      if (securityManager.isRateLimited(clientIp, 100, 60000)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const firebaseUid = req.headers['x-firebase-uid'];
      if (!firebaseUid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Security audit
      securityManager.createAuditLog({
        userId: firebaseUid as string,
        action: 'api_access',
        resource: req.path,
        metadata: { method: req.method, userAgent: req.headers['user-agent'] }
      });

      let user = await storage.getUserByFirebaseUid(firebaseUid as string);

      if (!user) {
        // Create user if doesn't exist (first-time login)
        const email = req.headers['x-firebase-email'] as string;
        const displayName = req.headers['x-firebase-display-name'] as string;
        const photoURL = req.headers['x-firebase-photo-url'] as string;
        
        if (!email) {
          return res.status(400).json({ error: 'Email required' });
        }
        
        user = await storage.createUser({
          email,
          displayName,
          photoURL,
          firebaseUid: firebaseUid as string,
          tier: 'free',
          queryCount: 0,
        });
      }

      // Reset demo user query count daily
      if (firebaseUid === 'demo-user-123') {
        const lastReset = user.updatedAt ? new Date(user.updatedAt) : new Date(user.createdAt);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        // Reset every 24 hours OR if query count exceeds limit (for demo purposes)
        if (hoursSinceReset >= 24 || user.queryCount >= 10) {
          user = await storage.updateUser(user.id, { queryCount: 0 });
        }
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Security middleware error:', error);
      return res.status(500).json({ error: 'Security validation failed' });
    }
  };

  // User routes
  app.get("/api/user/profile", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Admin authentication middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      // TESTING MODE: Allow all requests to admin routes
      console.log('Admin access granted (testing mode)');
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return res.status(500).json({ error: 'Admin validation failed' });
    }
  };

  // Chat routes
  app.post("/api/chat/message", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check query limits based on tier
      const queryLimits = {
        'free': 10,
        'premium': 1000,
        'enterprise': -1 // unlimited
      };
      
      const userLimit = queryLimits[req.user.tier as keyof typeof queryLimits] || 10;
      
      // For demo user, allow unlimited queries by resetting count when limit is reached
      if (req.user.firebaseUid === 'demo-user-123' && req.user.queryCount >= userLimit) {
        req.user = await storage.updateUser(req.user.id, { queryCount: 0 });
      }
      
      if (userLimit !== -1 && req.user.queryCount >= userLimit && req.user.firebaseUid !== 'demo-user-123') {
        return res.status(429).json({ 
          error: 'Daily query limit reached. Please upgrade your plan for more queries.',
          currentCount: req.user.queryCount,
          limit: userLimit,
          tier: req.user.tier
        });
      }

      let fileContent = null;
      let fileAnalysis = null;
      
      // Handle file upload if present
      if (req.file) {
        fileContent = req.file.buffer.toString();
        const fileType = req.file.originalname.split('.').pop()?.toLowerCase();
        
        // Analyze the uploaded file
        fileAnalysis = await analyzeBioFile(fileContent, fileType as any);
        
        // Save file to storage
        await storage.createBioFile({
          userId: req.user.id,
          filename: req.file.originalname,
          fileType: fileType as any,
          content: fileContent,
          analysis: fileAnalysis,
        });
      }

      // Process the query with AI
      const aiResponse = await processQuery(message, fileAnalysis || undefined);
      
      // Update user query count
      await storage.updateUser(req.user.id, {
        queryCount: req.user.queryCount + 1
      });

      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });

  app.get("/api/chat/sessions", requireAuth, async (req: any, res) => {
    try {
      const sessions = await storage.getChatSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // File routes
  app.get("/api/files", requireAuth, async (req: any, res) => {
    try {
      const files = await storage.getBioFiles(req.user.id);
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Subscription routes
  app.post("/api/subscription", requireAuth, async (req: any, res) => {
    try {
      const { paypalSubscriptionId, tier } = req.body;
      
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        paypalSubscriptionId,
        status: 'active',
        tier,
        startDate: new Date(),
      });

      // Update user tier
      await storage.updateUser(req.user.id, {
        tier,
        queryCount: 0, // Reset query count on upgrade
      });

      res.json(subscription);
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  app.get("/api/subscription/current", requireAuth, async (req: any, res) => {
    try {
      const subscription = await storage.getActiveSubscription(req.user.id);
      res.json(subscription);
    } catch (error) {
      console.error('Subscription fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  app.get("/api/plan-limits/:tier", requireAuth, async (req: any, res) => {
    try {
      const { tier } = req.params;
      const planLimit = await storage.getPlanLimit(tier as any);
      res.json(planLimit);
    } catch (error) {
      console.error('Plan limits fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch plan limits' });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive information
      const publicUsers = users.map(user => ({
        ...user,
        firebaseUid: undefined
      }));
      
      res.json(publicUsers);
    } catch (error) {
      console.error('Admin users fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get("/api/admin/subscriptions", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Admin subscriptions fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  app.get("/api/admin/logs", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAdminLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Admin logs fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch admin logs' });
    }
  });

  app.post("/api/admin/users/:userId/reset-limit", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updatedUser = await storage.resetUserDailyLimit(parseInt(userId));
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Log admin action
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'reset_user_limit',
        targetResource: `user:${userId}`,
        details: 'Reset daily query limit'
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Admin reset limit error:', error);
      res.status(500).json({ error: 'Failed to reset user limit' });
    }
  });

  app.patch("/api/admin/plan-limits/:tier", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { tier } = req.params;
      const updates = req.body;
      
      const updatedPlanLimit = await storage.updatePlanLimit(tier as any, updates);
      
      if (!updatedPlanLimit) {
        return res.status(404).json({ error: 'Plan limit not found' });
      }
      
      // Log admin action
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'update_plan_limits',
        targetResource: `plan:${tier}`,
        details: `Updated plan limits: ${JSON.stringify(updates)}`
      });
      
      res.json(updatedPlanLimit);
    } catch (error) {
      console.error('Admin plan limits update error:', error);
      res.status(500).json({ error: 'Failed to update plan limits' });
    }
  });

  app.get("/api/admin/analytics/dashboard", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const subscriptions = await storage.getAllSubscriptions();
      const logs = await storage.getAdminLogs(1000);
      
      // Calculate revenue (mock calculation)
      const revenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((total, sub) => {
          const prices = { premium: 9.99, enterprise: 49.99 };
          return total + (prices[sub.tier as keyof typeof prices] || 0);
        }, 0);

      const analytics = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.queryCount > 0).length,
        usersByTier: {
          free: users.filter(u => u.tier === 'free').length,
          premium: users.filter(u => u.tier === 'premium').length,
          enterprise: users.filter(u => u.tier === 'enterprise').length,
        },
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        recentActivity: logs.slice(0, 20),
        queriesLast24h: logs.filter(log => 
          log.action === 'api_access' && 
          new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
        ).length,
        monthlyRevenue: revenue,
        dailyActiveUsers: users.filter(u => {
          const lastActive = new Date(u.updatedAt);
          return lastActive.getTime() > Date.now() - 24 * 60 * 60 * 1000;
        }).length
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Admin analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // API Management Routes
  app.get("/api/admin/api-keys", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const apiStatus = {
        groq: !!process.env.GROQ_API_KEY,
        together: !!process.env.TOGETHER_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        cohere: !!process.env.COHERE_API_KEY,
        scrapeduck: !!process.env.SCRAPEDUCK_API_KEY
      };
      
      res.json(apiStatus);
    } catch (error) {
      console.error('API keys fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch API status' });
    }
  });

  app.post("/api/admin/users/:userId/ban", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { banned, reason } = req.body;
      
      const updatedUser = await storage.updateUser(parseInt(userId), { 
        tier: banned ? 'banned' : 'free',
        queryCount: banned ? 0 : undefined
      });
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: banned ? 'ban_user' : 'unban_user',
        targetResource: `user:${userId}`,
        details: `Reason: ${reason || 'No reason provided'}`
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('User ban error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  app.post("/api/admin/users/:userId/upgrade", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { tier } = req.body;
      
      const updatedUser = await storage.updateUser(parseInt(userId), { 
        tier,
        queryCount: 0 // Reset on upgrade
      });
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'upgrade_user',
        targetResource: `user:${userId}`,
        details: `Upgraded to ${tier}`
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('User upgrade error:', error);
      res.status(500).json({ error: 'Failed to upgrade user' });
    }
  });

  app.post("/api/admin/users/:userId/add-credits", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { credits } = req.body;
      const user = await storage.getUserById(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(parseInt(userId), { 
        queryCount: Math.max(0, user.queryCount - credits)
      });
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'add_credits',
        targetResource: `user:${userId}`,
        details: `Added ${credits} credits`
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Add credits error:', error);
      res.status(500).json({ error: 'Failed to add credits' });
    }
  });

  // Plan Management Routes
  app.get("/api/admin/plans", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const plans = await storage.getAllPlanLimits();
      res.json(plans);
    } catch (error) {
      console.error('Plans fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  });

  app.post("/api/admin/plans", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { tier, maxQueries, maxFileSize, features } = req.body;
      
      const newPlan = await storage.createPlanLimit({
        tier,
        maxQueries,
        maxFileSize,
        features
      });
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'create_plan',
        targetResource: `plan:${tier}`,
        details: `Created new plan: ${JSON.stringify({ maxQueries, maxFileSize, features })}`
      });
      
      res.json(newPlan);
    } catch (error) {
      console.error('Plan creation error:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  });

  app.put("/api/admin/plans/:tier", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { tier } = req.params;
      const updates = req.body;
      
      const updatedPlan = await storage.updatePlanLimit(tier as any, updates);
      
      if (!updatedPlan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'update_plan',
        targetResource: `plan:${tier}`,
        details: `Updated plan: ${JSON.stringify(updates)}`
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error('Plan update error:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  app.delete("/api/admin/plans/:tier", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { tier } = req.params;
      
      if (tier === 'free') {
        return res.status(400).json({ error: 'Cannot delete free plan' });
      }
      
      const deleted = await storage.deletePlanLimit(tier as any);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'delete_plan',
        targetResource: `plan:${tier}`,
        details: `Deleted plan: ${tier}`
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Plan deletion error:', error);
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  });

  // Promo Code Management Routes
  app.get("/api/admin/promo-codes", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error('Promo codes fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
  });

  app.post("/api/admin/promo-codes", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { code, type, value, maxUses, expiresAt } = req.body;
      
      const promoCode = await storage.createPromoCode({
        code: code.toUpperCase(),
        type,
        value,
        maxUses,
        usedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true
      });
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'create_promo_code',
        targetResource: `promo:${code}`,
        details: `Created promo code: ${type} ${value}${type === 'percentage' ? '%' : '$'}`
      });
      
      res.json(promoCode);
    } catch (error) {
      console.error('Promo code creation error:', error);
      res.status(500).json({ error: 'Failed to create promo code' });
    }
  });

  app.patch("/api/admin/promo-codes/:id", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedPromo = await storage.updatePromoCode(parseInt(id), updates);
      
      if (!updatedPromo) {
        return res.status(404).json({ error: 'Promo code not found' });
      }
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'update_promo_code',
        targetResource: `promo:${id}`,
        details: `Updated promo code: ${JSON.stringify(updates)}`
      });
      
      res.json(updatedPromo);
    } catch (error) {
      console.error('Promo code update error:', error);
      res.status(500).json({ error: 'Failed to update promo code' });
    }
  });

  app.delete("/api/admin/promo-codes/:id", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deletePromoCode(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Promo code not found' });
      }
      
      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'delete_promo_code',
        targetResource: `promo:${id}`,
        details: `Deleted promo code`
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Promo code deletion error:', error);
      res.status(500).json({ error: 'Failed to delete promo code' });
    }
  });

  // Chat session management
  app.get("/api/chat/sessions/:sessionId", requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSession(parseInt(sessionId));
      
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      console.error('Session fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  app.delete("/api/chat/sessions/:sessionId", requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSession(parseInt(sessionId));
      
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      const deleted = await storage.deleteChatSession(parseInt(sessionId));
      res.json({ success: deleted });
    } catch (error) {
      console.error('Session delete error:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
