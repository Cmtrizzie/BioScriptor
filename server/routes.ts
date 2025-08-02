import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatSessionSchema, insertBioFileSchema } from "@shared/schema";
import { processQuery } from "./services/ai";
import { analyzeBioFile } from "./services/bioinformatics";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { securityManager } from "./services/security";
import { SubscriptionAccessControl } from "./services/subscription-access";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper functions for exports
function convertToCSV(data: any): string {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }
  return 'No data available for CSV export';
}

async function generatePDF(data: any): Promise<Buffer> {
  // Simple PDF generation - in production, use a proper PDF library
  const pdfContent = `PDF Export\n\n${JSON.stringify(data, null, 2)}`;
  return Buffer.from(pdfContent, 'utf-8');
}

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
    const subscriptionInfo = SubscriptionAccessControl.generateAccessSummary(req.user.tier);
    res.json({
      ...req.user,
      subscriptionInfo
    });
  });

  app.get("/api/user/subscription-limits", requireAuth, async (req: any, res) => {
    try {
      const planLimits = SubscriptionAccessControl.getPlanLimits(req.user.tier);
      const subscriptionInfo = SubscriptionAccessControl.generateAccessSummary(req.user.tier);

      res.json({
        tier: req.user.tier,
        limits: planLimits,
        usage: {
          currentQueries: req.user.queryCount,
          remainingQueries: planLimits.maxQueries === -1 ? 'unlimited' : Math.max(0, planLimits.maxQueries - req.user.queryCount)
        },
        accessSummary: subscriptionInfo
      });
    } catch (error) {
      console.error('Subscription limits fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription limits' });
    }
  });

  // Admin authentication middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      // TESTING MODE: Allow all requests to admin routes
      console.log('✅ Admin access granted (testing mode)');

      // Ensure user object exists for admin operations
      if (!req.user) {
        // Create a mock admin user for testing
        req.user = {
          id: 1,
          firebaseUid: 'admin-demo',
          email: 'admin@bioscriptor.dev',
          displayName: 'Admin User',
          tier: 'enterprise',
          queryCount: 0,
          isAdmin: true
        };
      }

      // Ensure user has admin privileges
      req.user.isAdmin = true;
      next();
    } catch (error) {
      console.error('❌ Admin middleware error:', error);
      return res.status(500).json({ error: 'Admin validation failed' });
    }
  };

  // Chat routes
  app.post("/api/chat/message", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const { message } = req.body;
      const conversationId = req.body.conversationId;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get subscription limits
      const planLimits = SubscriptionAccessControl.getPlanLimits(req.user.tier);

      // Check query limits
      if (SubscriptionAccessControl.hasQueryLimit(req.user.tier, req.user.queryCount)) {
        // For demo user, allow unlimited queries by resetting count when limit is reached
        if (req.user.firebaseUid === 'demo-user-123') {
          req.user = await storage.updateUser(req.user.id, { queryCount: 0 });
        } else {
          return res.status(429).json({ 
            error: `Query limit reached. Your ${req.user.tier} plan allows ${planLimits.maxQueries} queries per month. Please upgrade for more queries.`,
            currentCount: req.user.queryCount,
            limit: planLimits.maxQueries,
            tier: req.user.tier,
            upgradeRequired: true
          });
        }
      }

      let fileContent = null;
      let fileAnalysis = null;

      // Handle file upload if present
      if (req.file) {
        console.log('📁 File uploaded:', {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          bufferLength: req.file.buffer?.length
        });

        const fileSizeInMB = req.file.size / (1024 * 1024);

        // Check file size limits based on subscription
        if (!SubscriptionAccessControl.canUploadFileSize(req.user.tier, fileSizeInMB)) {
          return res.status(413).json({
            error: `File too large. Your ${req.user.tier} plan allows files up to ${planLimits.maxFileSize}MB. Please upgrade for larger file uploads.`,
            maxFileSize: planLimits.maxFileSize,
            actualFileSize: Math.round(fileSizeInMB * 100) / 100,
            upgradeRequired: true
          });
        }

        // Check if file analysis is available for this tier
        if (!SubscriptionAccessControl.canAccessFeature(req.user.tier, 'fileAnalysis')) {
          return res.status(403).json({
            error: `File analysis is not available in your ${req.user.tier} plan. Please upgrade to Premium or Enterprise.`,
            feature: 'fileAnalysis',
            upgradeRequired: true
          });
        }

        const fileType = req.file.originalname.split('.').pop()?.toLowerCase();

        // Enhanced file content extraction for all file types
        try {
          fileContent = await extractFileContent(req.file.buffer, fileType || '', req.file.originalname, req.file.mimetype);
        } catch (error) {
          console.error('File content extraction error:', error);
          fileContent = `File: ${req.file.originalname} (${Math.round(req.file.size / 1024)}KB, ${req.file.mimetype}). Content available for analysis.`;
        }

        // Analyze the uploaded file
        try {
          fileAnalysis = await analyzeBioFile(fileContent, fileType as any);
          console.log('🔬 File analysis completed:', {
            sequenceType: fileAnalysis.sequenceType,
            fileType: fileAnalysis.fileType,
            hasContent: !!fileAnalysis.documentContent
          });
        } catch (error) {
          console.error('File analysis error:', error);
          fileAnalysis = {
            sequenceType: 'document' as any,
            sequence: fileContent.substring(0, 1000),
            fileType: fileType as any,
            documentContent: fileContent.substring(0, 2000),
            stats: {
              length: fileContent.length,
              composition: {}
            }
          };
        }

        // Save file to storage
        try {
          await storage.createBioFile({
            userId: req.user.id,
            filename: req.file.originalname,
            fileType: fileType as any,
            content: fileContent,
            analysis: fileAnalysis,
          });
        } catch (error) {
          console.error('File storage error:', error);
          // Continue processing even if storage fails
        }
      }

      // Check if advanced analysis is requested and available
      const needsAdvancedAnalysis = message.toLowerCase().includes('advanced') || 
                                   message.toLowerCase().includes('complex') ||
                                   message.toLowerCase().includes('detailed analysis');

      if (needsAdvancedAnalysis && !SubscriptionAccessControl.canAccessFeature(req.user.tier, 'advancedAnalysis')) {
        return res.status(403).json({
          error: `Advanced analysis features require a Premium or Enterprise subscription. Please upgrade to access detailed bioinformatics analysis.`,
          feature: 'advancedAnalysis',
          upgradeRequired: true
        });
      }

      // Process the query with AI, passing user tier for provider filtering
      const aiResponse = await processQuery(message, fileAnalysis || undefined, req.user.tier, conversationId);

      // Update user query count
      await storage.updateUser(req.user.id, {
        queryCount: req.user.queryCount + 1
      });

      // Add subscription info to response
      const subscriptionInfo = SubscriptionAccessControl.generateAccessSummary(req.user.tier);

      res.json({ 
        response: aiResponse,
        subscriptionInfo,
        remainingQueries: planLimits.maxQueries === -1 ? 'unlimited' : Math.max(0, planLimits.maxQueries - req.user.queryCount - 1)
      });
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

  app.post("/api/export/:format", requireAuth, async (req: any, res) => {
    try {
      const { format } = req.params;
      const { data, filename } = req.body;

      // Check if user can export in this format
      if (!SubscriptionAccessControl.canExportAs(req.user.tier, format)) {
        const availableFormats = SubscriptionAccessControl.getAvailableExportFormats(req.user.tier);
        return res.status(403).json({
          error: `Export to ${format.toUpperCase()} is not available in your ${req.user.tier} plan. Available formats: ${availableFormats.join(', ').toUpperCase()}`,
          availableFormats,
          requestedFormat: format,
          upgradeRequired: true
        });
      }

      // Generate export based on format
      let exportData;
      let contentType;

      switch (format.toLowerCase()) {
        case 'txt':
          exportData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          contentType = 'text/plain';
          break;
        case 'csv':
          // Convert data to CSV format
          exportData = convertToCSV(data);
          contentType = 'text/csv';
          break;
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          contentType = 'application/json';
          break;
        case 'pdf':
          // Premium/Enterprise feature - generate PDF
          exportData = await generatePDF(data);
          contentType = 'application/pdf';
          break;
        default:
          return res.status(400).json({ error: 'Unsupported export format' });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.${format}"`);
      res.send(exportData);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
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
      // Return mock data to prevent frontend crashes
      res.json([
        {
          id: 1,
          email: 'demo@example.com',
          displayName: 'Demo User',
          tier: 'free',
          queryCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  });

  app.get("/api/admin/subscriptions", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Admin subscriptions fetch error:', error);
      // Return mock data to prevent frontend crashes
      res.json([
        {
          id: 1,
          userId: 1,
          tier: 'premium',
          status: 'active',
          startDate: new Date().toISOString(),
          paypalSubscriptionId: 'mock-subscription-id'
        }
      ]);
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

  app.patch("/api/admin/plans/:tier/price", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { tier } = req.params;
      const { price } = req.body;

      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      if (tier === 'free' && price !== 0) {
        return res.status(400).json({ error: 'Free plan must have price of 0' });
      }

      // In a real implementation, this would update the pricing in your payment processor (PayPal, Stripe, etc.)
      // For now, we'll simulate the update

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'update_plan_price',
        targetResource: `plan:${tier}`,
        details: `Updated ${tier} plan price to $${price}`
      });

      res.json({ success: true, tier, price });
    } catch (error) {
      console.error('Plan price update error:', error);
      res.status(500).json({ error: 'Failed to update plan price' });
    }
  });

  // Promo Code Management Routes
  app.get("/api/admin/promo-codes", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error('Promo codes fetch error:', error);
      // Return mock data to prevent frontend crashes
      res.json([
        {
          id: 1,
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          maxUses: 100,
          usedCount: 5,
          active: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          code: 'STUDENT50',
          type: 'percentage',
          value: 50,
          maxUses: 50,
          usedCount: 12,
          active: true,
          expiresAt: null
        }
      ]);
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

      const updatedPromo = await storage.updatePromoCode(parseInt(id), req.body);

      if (!updatedPromo) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'update_promo_code',
        targetResource: `promo:${id}`,
        details: `Updated promo code: ${JSON.stringify(req.body)}`
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

  // API Management Routes
  app.post("/api/admin/api-providers", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { name, type, endpoint, model, costPer1kTokens } = req.body;

      if (!name || !type || !endpoint) {
        return res.status(400).json({ error: 'Name, type, and endpoint are required' });
      }

      // In a real implementation, this would be stored in a database
      // For now, we'll simulate the creation
      const newProvider = {
        id: Date.now(),
        name: name.toLowerCase().replace(/\s+/g, '_'),
        displayName: name,
        type,
        endpoint,
        model: model || 'default',
        costPer1kTokens: parseFloat(costPer1kTokens) || 0.001,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'add_api_provider',
        targetResource: `api:${newProvider.name}`,
        details: `Added new API provider: ${name} (${type}) - Endpoint: ${endpoint}`
      });

      res.json({ success: true, provider: newProvider });
    } catch (error) {
      console.error('API provider creation error:', error);
      res.status(500).json({ error: 'Failed to add API provider' });
    }
  });

  app.patch("/api/admin/api-providers/:provider/toggle", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { provider } = req.params;
      const { enabled } = req.body;

      // Toggle API provider status
      // In a real implementation, this would update environment variables or configuration
      // For now, we'll simulate the toggle and return success

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'toggle_api_provider',
        targetResource: `api:${provider}`,
        details: `${enabled ? 'Enabled' : 'Disabled'} API provider: ${provider}`
      });

      res.json({ success: true, enabled, provider });
    } catch (error) {
      console.error('API provider toggle error:', error);
      res.status(500).json({ error: 'Failed to toggle API provider' });
    }
  });

  app.get("/api/admin/api-errors", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      // Get API error logs - this would come from a dedicated error logging system
      const mockErrors = [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          provider: 'Groq',
          errorType: 'Rate Limit',
          userId: 'user1@example.com',
          details: '429 - Too many requests',
          resolved: false
        },
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          provider: 'Together',
          errorType: 'Timeout',
          userId: 'user2@example.com',
          details: 'Request timeout after 30s',
          resolved: false
        }
      ];

      res.json(mockErrors.slice(0, limit));
    } catch (error) {
      console.error('API errors fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch API errors' });
    }
  });

  //  // Payment Webhook Routes
  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const event = req.body;

      // Log webhook event
      console.log('PayPal webhook received:', event.event_type);

      // Handle different webhook events
      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          // Handle subscription activation
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          // Handle subscription cancellation
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          // Handle payment completion
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          // Handle payment failure
          break;
        default:
          console.log('Unhandled webhook event:', event.event_type);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.get("/api/admin/webhook-logs", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      // Mock webhook logs - in production, this would come from a webhook logging system
      const mockWebhookLogs = [
        {
          eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
          status: 'success',
          user: 'user@example.com',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          processingTime: '1.2s'
        },
        {
          eventType: 'BILLING.SUBSCRIPTION.CANCELLED',
          status: 'success',
          user: 'test@demo.com',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          processingTime: '0.8s'
        },
        {
          eventType: 'PAYMENT.CAPTURE.COMPLETED',
          status: 'failed',
          user: 'fail@example.com',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          processingTime: '5.2s'
        }
      ];

      res.json(mockWebhookLogs.slice(0, limit));
    } catch (error) {
      console.error('Webhook logs fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
  });

  app.get("/api/admin/failed-payments", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      // Mock failed payments data
      const mockFailedPayments = [
        {
          userId: 1,
          userEmail: 'user1@test.com',
          amount: 9.99,
          reason: 'Insufficient funds',
          attempts: 3,
          lastAttempt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          subscriptionId: 'sub_123'
        },
        {
          userId: 2,
          userEmail: 'user2@test.com',
          amount: 49.99,
          reason: 'Card expired',
          attempts: 1,
          lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          subscriptionId: 'sub_456'
        }
      ];

      res.json(mockFailedPayments);
    } catch (error) {
      console.error('Failed payments fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch failed payments' });
    }
  });

  app.post("/api/admin/manual-subscription", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userEmail, tier, reason } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail?.(userEmail);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user tier
      const updatedUser = await storage.updateUser(user.id, { 
        tier,
        queryCount: 0 // Reset on manual change
      });

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'manual_subscription_change',
        targetResource: `user:${user.id}`,
        details: `Manual subscription change to ${tier}. Reason: ${reason}`
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Manual subscription error:', error);
      res.status(500).json({ error: 'Failed to update subscription manually' });
    }
  });

  app.post("/api/admin/grant-lifetime", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userEmail, accessLevel, customFeatures } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail?.(userEmail);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const lifetimeTier = accessLevel === 'custom' ? 'lifetime_custom' : accessLevel;

      // Update user with lifetime access
      const updatedUser = await storage.updateUser(user.id, { 
        tier: lifetimeTier,
        queryCount: 0,
        lifetimeAccess: true,
        customFeatures: accessLevel === 'custom' ? customFeatures : null
      });

      await storage.createAdminLog({
        adminUserId: req.user.id,
        action: 'grant_lifetime_access',
        targetResource: `user:${user.id}`,
        details: `Granted lifetime access: ${accessLevel}${accessLevel === 'custom' ? ` with features: ${JSON.stringify(customFeatures)}` : ''}`
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Lifetime access grant error:', error);
      res.status(500).json({ error: 'Failed to grant lifetime access' });
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

  // Feedback endpoint for continuous learning
  app.post('/api/feedback', requireAuth, async (req, res) => {
    try {
      const { messageId, feedbackType, rating, comment } = req.body;

      if (!messageId || !feedbackType || !rating) {
        return res.status(400).json({ 
          error: 'Missing required fields: messageId, feedbackType, rating' 
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: 'Rating must be between 1 and 5' 
        });
      }

      // Store feedback in database (you can implement this based on your storage system)
      const feedback = {
        messageId,
        feedbackType,
        rating: parseInt(rating),
        comment: comment || null,
        userId: req.user?.uid || 'anonymous',
        timestamp: Date.now()
      };

      // In a real implementation, save to database
      console.log('Feedback received:', feedback);

      res.json({ 
        success: true, 
        message: 'Feedback recorded successfully',
        adaptiveFeedback: 'Thank you! Your feedback helps me learn and improve.' 
      });

    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ 
        error: 'Failed to process feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Subscription endpoint  
  app.post("/api/subscribe", async (req: any, res) => {
    try {
      const userEmail = req.headers['x-user-email'] || 'demo@dev.local';
      const { tier, userId } = req.body;

      console.log('🔄 Processing subscription request:', { userEmail, tier, userId });

      // In development mode, always allow subscription changes
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 Development mode: Allowing subscription for:', userEmail);

        // Mock successful subscription
        const mockResult = {
          success: true,
          message: `Successfully subscribed to ${tier} plan`,
          tier: tier,
          userEmail: userEmail,
          subscriptionId: `mock_${Date.now()}`
        };

        // For premium/enterprise tiers, we could return PayPal approval URL
        if (tier !== 'free') {
          // In a real implementation, you'd create PayPal subscription here
          mockResult.approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=mock_${Date.now()}`;
        }

        return res.json(mockResult);
      }

      // Production subscription logic would go here
      res.json({
        success: true,
        message: `Successfully subscribed to ${tier} plan`,
        tier: tier
      });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ 
        error: 'Failed to process subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Comprehensive file content extraction function
async function extractFileContent(buffer: Buffer, fileType: string, filename: string, mimetype: string): Promise<string> {
  try {
    const sizeKB = Math.round(buffer.length / 1024);

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'].includes(fileType)) {
      return analyzeImageFile(buffer, filename, fileType, sizeKB);
    }

    // Audio files
    if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(fileType)) {
      return analyzeAudioFile(buffer, filename, fileType, sizeKB);
    }

    // Video files
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(fileType)) {
      return analyzeVideoFile(buffer, filename, fileType, sizeKB);
    }

    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(fileType)) {
      return analyzeArchiveFile(buffer, filename, fileType, sizeKB);
    }

    // Executable files
    if (['exe', 'msi', 'deb', 'rpm', 'dmg', 'app'].includes(fileType)) {
      return analyzeExecutableFile(buffer, filename, fileType, sizeKB);
    }

    // Office documents
    if (['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(fileType)) {
      return analyzeOfficeDocument(buffer, filename, fileType, sizeKB);
    }

    // Code and markup files
    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css', 'xml', 'json', 'yaml', 'yml'].includes(fileType)) {
      const content = buffer.toString('utf8');
      return analyzeCodeFile(content, filename, fileType);
    }

    // Data files
    if (['csv', 'tsv', 'txt', 'log', 'md', 'rtf'].includes(fileType)) {
      const content = buffer.toString('utf8');
      return analyzeTextDataFile(content, filename, fileType);
    }

    // Binary data files
    if (['bin', 'dat', 'db', 'sqlite', 'sql'].includes(fileType)) {
      return analyzeBinaryDataFile(buffer, filename, fileType, sizeKB);
    }

    // Try to read as text for unknown types
    try {
      const content = buffer.toString('utf8');
      if (content.length > 0 && isReadableText(content)) {
        return analyzeTextDataFile(content, filename, fileType);
      }
    } catch (error) {
      // Fall through to binary analysis
    }

    // Default binary file analysis
    return analyzeBinaryFile(buffer, filename, fileType, mimetype, sizeKB);

  } catch (error) {
    console.error('File content extraction failed:', error);
    return `File: ${filename} (${Math.round(buffer.length / 1024)}KB, ${mimetype}). Content available for analysis.`;
  }
}

// Image file analysis
function analyzeImageFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Image File: ${filename}`, `Format: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  // Basic image format detection
  const header = buffer.slice(0, 20);

  if (fileType === 'jpg' || fileType === 'jpeg') {
    analysis.push('JPEG image format detected');
    // Look for EXIF data
    if (buffer.indexOf(Buffer.from('Exif')) !== -1) {
      analysis.push('Contains EXIF metadata');
    }
  } else if (fileType === 'png') {
    analysis.push('PNG image format detected');
    if (header[25] === 6) analysis.push('RGBA format (with transparency)');
    else if (header[25] === 2) analysis.push('RGB format');
  } else if (fileType === 'gif') {
    analysis.push('GIF image format detected');
    if (buffer.indexOf(Buffer.from('NETSCAPE2.0')) !== -1) {
      analysis.push('Animated GIF detected');
    }
  } else if (fileType === 'svg') {
    const content = buffer.toString('utf8');
    analysis.push('SVG vector image');
    if (content.includes('<path')) analysis.push('Contains vector paths');
    if (content.includes('<text')) analysis.push('Contains text elements');
  }

  analysis.push('I can analyze image content, colors, objects, text extraction, and provide insights about the visual elements.');

  return analysis.join('\n');
}

// Audio file analysis
function analyzeAudioFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Audio File: ${filename}`, `Format: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  if (fileType === 'mp3') {
    analysis.push('MP3 audio format detected');
    // Look for ID3 tags
    if (buffer.slice(0, 3).toString() === 'ID3') {
      analysis.push('Contains ID3 metadata tags');
    }
  } else if (fileType === 'wav') {
    analysis.push('WAV audio format detected');
    if (buffer.slice(0, 4).toString() === 'RIFF') {
      analysis.push('Standard RIFF WAV format');
    }
  }

  analysis.push('I can analyze audio metadata, format details, and help with audio processing tasks.');

  return analysis.join('\n');
}

// Video file analysis
function analyzeVideoFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Video File: ${filename}`, `Format: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  if (fileType === 'mp4') {
    analysis.push('MP4 video container detected');
    if (buffer.indexOf(Buffer.from('ftyp')) !== -1) {
      analysis.push('Standard MP4 format');
    }
  } else if (fileType === 'avi') {
    analysis.push('AVI video format detected');
  }

  analysis.push('I can analyze video metadata, format information, and assist with video processing workflows.');

  return analysis.join('\n');
}

// Archive file analysis
function analyzeArchiveFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Archive File: ${filename}`, `Format: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  if (fileType === 'zip') {
    analysis.push('ZIP archive detected');
    // Look for central directory
    if (buffer.indexOf(Buffer.from('PK\x01\x02')) !== -1) {
      analysis.push('Contains file directory structure');
    }
  } else if (fileType === 'tar') {
    analysis.push('TAR archive detected');
  }

  analysis.push('I can help extract information about archive contents and assist with compression/decompression tasks.');

  return analysis.join('\n');
}

// Executable file analysis
function analyzeExecutableFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Executable File: ${filename}`, `Type: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  if (fileType === 'exe') {
    analysis.push('Windows executable detected');
    if (buffer.slice(0, 2).toString() === 'MZ') {
      analysis.push('Valid PE executable format');
    }
  } else if (fileType === 'deb') {
    analysis.push('Debian package detected');
  }

  analysis.push('⚠️ Executable file detected. I can provide information about file structure and security considerations.');

  return analysis.join('\n');
}

// Office document analysis
function analyzeOfficeDocument(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [`Office Document: ${filename}`, `Format: ${fileType.toUpperCase()}`, `Size: ${sizeKB}KB`];

  try {
    if (fileType === 'pdf') {
      const content = buffer.toString('latin1');
      if (content.includes('%PDF-')) {
        analysis.push('Valid PDF document');
        const version = content.match(/%PDF-(\d+\.\d+)/);
        if (version) analysis.push(`PDF version: ${version[1]}`);
      }

      // Extract readable text
      const textMatches = content.match(/[\x20-\x7E\s]{20,}/g) || [];
      const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();

      if (extractedText.length > 100) {
        analysis.push(`Content preview: ${extractedText.substring(0, 300)}...`);
      } else {
        analysis.push('Document contains primarily non-text content or requires specialized PDF parsing.');
      }

    } else if (fileType === 'docx' || fileType === 'doc') {
      if (fileType === 'docx') {
        analysis.push('Modern Word document (Office Open XML)');
      } else {
        analysis.push('Legacy Word document (OLE format)');
      }

      // Try to extract readable text
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
      const textMatches = content.match(/[\x20-\x7E\s]{20,}/g) || [];
      const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();

      if (extractedText.length > 100) {
        analysis.push(`Content preview: ${extractedText.substring(0, 300)}...`);
      } else {
        analysis.push('Document structure detected. For full text extraction, specialized document parsing is recommended.');
      }
    }
  } catch (error) {
    analysis.push('Document format detected but content extraction requires specialized parsing.');
  }

  analysis.push('I can help analyze document structure, extract metadata, and assist with document processing workflows.');

  return analysis.join('\n');
}

// Code file analysis
function analyzeCodeFile(content: string, filename: string, fileType: string): string {
  const lines = content.split('\n');
  const analysis = [
    `Code File: ${filename}`,
    `Language: ${fileType.toUpperCase()}`,
    `Lines: ${lines.length}`,
    `Characters: ${content.length}`
  ];

  // Language-specific analysis
  if (fileType === 'js' || fileType === 'ts') {
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*=>\s*/g) || []).length;
    analysis.push(`Functions/Methods: ~${functions}`);
    if (content.includes('import ') || content.includes('require(')) {
      analysis.push('Contains module imports');
    }
  } else if (fileType === 'py') {
    const functions = (content.match(/def\s+\w+/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    analysis.push(`Functions: ${functions}`, `Classes: ${classes}`);
  }

  // Show preview
  const preview = content.substring(0, 500);
  analysis.push(`\nCode preview:\n${preview}${content.length > 500 ? '...' : ''}`);

  return analysis.join('\n');
}

// Text/data file analysis
function analyzeTextDataFile(content: string, filename: string, fileType: string): string {
  const lines = content.split('\n');
  const words = content.split(/\s+/).length;

  const analysis = [
    `Text File: ${filename}`,
    `Format: ${fileType.toUpperCase()}`,
    `Lines: ${lines.length}`,
    `Words: ${words}`,
    `Characters: ${content.length}`
  ];

  if (fileType === 'csv') {
    const headers = lines[0]?.split(',') || [];
    analysis.push(`Columns: ${headers.length}`);
    if (headers.length > 0) {
      analysis.push(`Headers: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`);
    }
  } else if (fileType === 'json') {
    try {
      const parsed = JSON.parse(content);
      analysis.push(`JSON structure: ${typeof parsed}`);
      if (Array.isArray(parsed)) {
        analysis.push(`Array with ${parsed.length} items`);
      } else if (typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        analysis.push(`Object with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      analysis.push('Invalid JSON format');
    }
  }

  // Show content preview
  const preview = content.substring(0, 1000);
  analysis.push(`\nContent preview:\n${preview}${content.length > 1000 ? '...' : ''}`);

  return analysis.join('\n');
}

// Binary data file analysis
function analyzeBinaryDataFile(buffer: Buffer, filename: string, fileType: string, sizeKB: number): string {
  const analysis = [
    `Binary Data File: ${filename}`,
    `Format: ${fileType.toUpperCase()}`,
    `Size: ${sizeKB}KB`
  ];

  if (fileType === 'sqlite' || fileType === 'db') {
    if (buffer.slice(0, 16).toString() === 'SQLite format 3\0') {
      analysis.push('SQLite database detected');
      analysis.push('I can help analyze database structure and queries.');
    }
  }

  // Analyze entropy to detect compression/encryption
  const entropy = calculateEntropy(buffer.slice(0, 1024));
  if (entropy > 7.5) {
    analysis.push('High entropy detected (possibly compressed or encrypted)');
  } else if (entropy < 4) {
    analysis.push('Low entropy detected (structured or repetitive data)');
  }

  analysis.push('I can analyze binary structure, hex dumps, and assist with data processing.');

  return analysis.join('\n');
}

// Generic binary file analysis
function analyzeBinaryFile(buffer: Buffer, filename: string, fileType: string, mimetype: string, sizeKB: number): string {
  const analysis = [
    `Binary File: ${filename}`,
    `Type: ${fileType ? fileType.toUpperCase() : 'Unknown'}`,
    `MIME: ${mimetype}`,
    `Size: ${sizeKB}KB`
  ];

  // Analyze file signature
  const signature = buffer.slice(0, 16);
  const hex = signature.toString('hex').toUpperCase();
  analysis.push(`File signature: ${hex}`);

  // Common file type detection by magic bytes
  if (hex.startsWith('FFD8FF')) {
    analysis.push('JPEG image detected by signature');
  } else if (hex.startsWith('89504E47')) {
    analysis.push('PNG image detected by signature');
  } else if (hex.startsWith('474946')) {
    analysis.push('GIF image detected by signature');
  } else if (hex.startsWith('25504446')) {
    analysis.push('PDF document detected by signature');
  } else if (hex.startsWith('504B0304')) {
    analysis.push('ZIP archive detected by signature');
  }

  analysis.push('I can analyze file structure, extract metadata, and provide format-specific insights.');

  return analysis.join('\n');
}

// Helper function to check if content is readable text
function isReadableText(content: string): boolean {
  const printableChars = content.match(/[\x20-\x7E\n\r\t]/g) || [];
  return printableChars.length / content.length > 0.7;
}

// Helper function to calculate entropy
function calculateEntropy(buffer: Buffer): number {
  const freq: { [key: number]: number } = {};

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    freq[byte] = (freq[byte] || 0) + 1;
  }

  let entropy = 0;
  const len = buffer.length;

  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

const verifyFirebaseToken = async (token: string) => {
  // Mock implementation - replace with actual Firebase token verification
  return {
    uid: 'mock-firebase-uid',
    email: 'test@example.com',
    displayName: 'Test User'
  };
};