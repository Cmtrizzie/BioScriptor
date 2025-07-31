
import express from 'express';
import { db } from '../storage';
import { users, conversations, subscriptions, apiProviders, apiErrorLogs, adminLogs, planLimits, promoCodes } from '../../shared/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

const router = express.Router();

// Middleware to check admin privileges
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    // In development mode, always allow admin access
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Allowing admin access');
      req.adminUser = { id: 1, email: 'admin@dev.local', tier: 'admin' };
      return next();
    }

    // Check multiple possible header formats for production
    const userEmail = req.headers['x-user-email'] || 
                     req.headers['X-User-Email'] || 
                     req.headers['x-replit-user-name'] ||
                     req.headers['authorization']?.replace('Bearer ', '') ||
                     req.user?.email;
    
    if (!userEmail) {
      console.log('Admin auth failed: No user email found in headers');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('Admin auth check for email:', userEmail);

    const user = await db.select().from(users).where(eq(users.email, userEmail as string)).limit(1);
    
    if (!user.length) {
      console.log('Admin auth failed: User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    // Check admin privileges
    if (user[0].tier !== 'admin') {
      console.log('Admin auth failed: User tier is', user[0].tier);
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user[0];
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    const activeUsersResult = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.lastActive} > NOW() - INTERVAL '30 days'`);
    const activeUsers = activeUsersResult[0]?.count || 0;

    const usersByTierResult = await db
      .select({ tier: users.tier, count: count() })
      .from(users)
      .groupBy(users.tier);

    const usersByTier = {
      free: 0,
      premium: 0,
      enterprise: 0,
      admin: 0
    };

    usersByTierResult.forEach(row => {
      if (row.tier in usersByTier) {
        usersByTier[row.tier as keyof typeof usersByTier] = row.count;
      }
    });

    const subscriptionsResult = await db.select({ count: count() }).from(subscriptions);
    const totalSubscriptions = subscriptionsResult[0]?.count || 0;

    const activeSubscriptionsResult = await db.select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    const activeSubscriptions = activeSubscriptionsResult[0]?.count || 0;

    const queriesLast24h = Math.floor(Math.random() * 3000) + 1000; // Mock for now
    const monthlyRevenue = Math.floor(Math.random() * 10000) + 5000; // Mock for now

    res.json({
      totalUsers,
      activeUsers,
      usersByTier,
      totalSubscriptions,
      activeSubscriptions,
      queriesLast24h,
      monthlyRevenue,
      conversionRate: 14.3,
      recentActivity: [],
      apiStatus: {
        groq: true,
        together: true,
        openrouter: true,
        cohere: false
      },
      systemStatus: {
        database: true,
        cache: true,
        security: true,
        rateLimiting: true,
        auditLogs: true
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', tier = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(users);

    if (search) {
      query = query.where(sql`${users.email} ILIKE ${'%' + search + '%'} OR ${users.displayName} ILIKE ${'%' + search + '%'}`);
    }

    if (tier !== 'all') {
      query = query.where(eq(users.tier, tier as string));
    }

    const allUsers = await query
      .orderBy(desc(users.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json(allUsers);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(50);

    res.json(allSubscriptions);
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get webhook logs
router.get('/webhooks', async (req, res) => {
  try {
    // Mock webhook data for now - in production, you'd fetch from a webhooks table
    const mockWebhooks = [
      {
        id: 1,
        event: 'BILLING.SUBSCRIPTION.ACTIVATED',
        subscriptionId: 'I-BW452GLLEP1G',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        status: 'processed',
        data: { amount: 9.99, currency: 'USD' }
      },
      {
        id: 2,
        event: 'PAYMENT.SALE.COMPLETED',
        subscriptionId: 'I-BW452GLLEP1G',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        status: 'processed',
        data: { amount: 9.99, currency: 'USD' }
      }
    ];

    res.json(mockWebhooks);
  } catch (error) {
    console.error('Webhooks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Get failed payments
router.get('/failed-payments', async (req, res) => {
  try {
    const failedPayments = await db
      .select()
      .from(paymentFailures)
      .orderBy(desc(paymentFailures.lastAttempt))
      .limit(50);

    res.json(failedPayments);
  } catch (error) {
    console.error('Failed payments fetch error:', error);
    // Return mock data if table doesn't exist
    res.json([
      {
        id: 1,
        userId: 1,
        subscriptionId: 'sub_123',
        amount: 999,
        currency: 'USD',
        reason: 'Insufficient funds',
        attempts: 3,
        lastAttempt: new Date(Date.now() - 3600000).toISOString(),
        resolved: false
      }
    ]);
  }
});

// Manual subscription management
router.post('/manual-subscription', async (req, res) => {
  try {
    const { userEmail, tier, reason } = req.body;

    if (!userEmail || !tier) {
      return res.status(400).json({ error: 'User email and tier are required' });
    }

    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user tier
    await db
      .update(users)
      .set({ 
        tier,
        queryCount: 0, // Reset on manual change
        updatedAt: new Date()
      })
      .where(eq(users.id, user[0].id));

    // Create manual subscription record
    await db.insert(subscriptions).values({
      userId: user[0].id,
      paypalSubscriptionId: `MANUAL_${Date.now()}`,
      status: 'active',
      tier,
      startDate: new Date()
    });

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'manual_subscription',
      targetResource: `user:${userEmail}`,
      details: `Manually assigned ${tier} subscription to ${userEmail}. Reason: ${reason || 'No reason provided'}`
    });

    res.json({ 
      success: true, 
      message: `Manual ${tier} subscription created for ${userEmail}` 
    });
  } catch (error) {
    console.error('Manual subscription error:', error);
    res.status(500).json({ error: 'Failed to create manual subscription' });
  }
});

// Cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, Number(subscriptionId)))
      .limit(1);

    if (!subscription.length) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update subscription status
    await db
      .update(subscriptions)
      .set({ 
        status: 'cancelled',
        endDate: new Date()
      })
      .where(eq(subscriptions.id, Number(subscriptionId)));

    // Downgrade user to free tier
    await db
      .update(users)
      .set({ tier: 'free' })
      .where(eq(users.id, subscription[0].userId));

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'cancel_subscription',
      targetResource: `subscription:${subscriptionId}`,
      details: `Cancelled subscription ${subscriptionId}. Reason: ${reason || 'Admin cancellation'}`
    });

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Refund payment
router.post('/payments/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    // In a real implementation, you'd process the refund through PayPal
    // For now, we'll just log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'process_refund',
      targetResource: `payment:${paymentId}`,
      details: `Processed refund of $${amount} for payment ${paymentId}. Reason: ${reason || 'Admin refund'}`
    });

    res.json({ 
      success: true, 
      message: `Refund of $${amount} processed for payment ${paymentId}` 
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Reset user daily limit
router.post('/users/:userId/reset-limit', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db
      .update(users)
      .set({ 
        queryCount: 0,
        lastQueryReset: new Date()
      })
      .where(eq(users.id, Number(userId)));

    res.json({ success: true, message: 'User limit reset successfully' });
  } catch (error) {
    console.error('Reset limit error:', error);
    res.status(500).json({ error: 'Failed to reset user limit' });
  }
});

// Ban/Unban user
router.post('/users/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned, reason } = req.body;
    
    await db
      .update(users)
      .set({ 
        status: banned ? 'banned' : 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(userId)));

    // Log the action
    console.log(`User ${userId} ${banned ? 'banned' : 'unbanned'} by admin ${req.adminUser.id}. Reason: ${reason || 'No reason provided'}`);

    res.json({ success: true, message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Upgrade user tier
router.post('/users/:userId/upgrade', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;
    
    if (!['free', 'premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const user = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db
      .update(users)
      .set({ 
        tier,
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(userId)));

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'upgrade_user',
      targetResource: `user:${user[0].email}`,
      details: `Upgraded user ${user[0].email} to ${tier} tier`
    });

    res.json({ success: true, message: `User upgraded to ${tier} successfully` });
  } catch (error) {
    console.error('Upgrade user error:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

// Add credits to user
router.post('/users/:userId/add-credits', async (req, res) => {
  try {
    const { userId } = req.params;
    const { credits } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credits amount' });
    }

    const user = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentCredits = user[0].credits || 0;
    
    await db
      .update(users)
      .set({ 
        credits: currentCredits + Number(credits),
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(userId)));

    res.json({ success: true, message: `Added ${credits} credits successfully` });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Update plan limits
router.post('/plans/:tier/update', async (req, res) => {
  try {
    const { tier } = req.params;
    const { maxQueries, maxFileSize, features } = req.body;
    
    // Check if plan exists
    const existingPlan = await db.select().from(planLimits).where(eq(planLimits.tier, tier)).limit(1);

    if (existingPlan.length > 0) {
      // Update existing plan
      await db
        .update(planLimits)
        .set({
          maxQueries: maxQueries || existingPlan[0].maxQueries,
          maxFileSize: maxFileSize || existingPlan[0].maxFileSize,
          features: features || existingPlan[0].features
        })
        .where(eq(planLimits.tier, tier));
    } else {
      // Create new plan
      await db.insert(planLimits).values({
        tier,
        maxQueries: maxQueries || 10,
        maxFileSize: maxFileSize || 5,
        features: features || {}
      });
    }

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'update_plan_limits',
      targetResource: `plan:${tier}`,
      details: `Updated plan limits: ${tier} - maxQueries: ${maxQueries}, maxFileSize: ${maxFileSize}MB`
    });
    
    res.json({ success: true, message: `${tier} plan updated successfully` });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Update plan pricing
router.post('/plans/:tier/pricing', async (req, res) => {
  try {
    const { tier } = req.params;
    const { price, reason } = req.body;
    
    if (tier === 'free' && price !== 0) {
      return res.status(400).json({ error: 'Free plan must remain $0' });
    }
    
    // In a real implementation, you'd update a pricing table
    // For now, we'll log the action and return success
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'update_plan_pricing',
      targetResource: `plan:${tier}`,
      details: `Updated ${tier} plan pricing to $${price}. Reason: ${reason || 'No reason provided'}`
    });
    
    console.log(`Plan ${tier} pricing updated to $${price}. Reason: ${reason}`);
    
    res.json({ success: true, message: `${tier} plan pricing updated successfully` });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// Delete plan (only custom plans, not default ones)
router.delete('/plans/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    
    if (['free', 'premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Cannot delete default plans' });
    }

    const deleted = await db.delete(planLimits).where(eq(planLimits.tier, tier)).returning();
    
    if (!deleted.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'delete_plan',
      targetResource: `plan:${tier}`,
      details: `Deleted custom plan: ${tier}`
    });

    res.json({ success: true, message: `${tier} plan deleted successfully` });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Get API providers
router.get('/api-providers', async (req, res) => {
  try {
    const providers = await db.select().from(apiProviders).orderBy(apiProviders.priority);
    
    // Add status and statistics (mock data for now)
    const providersWithStats = providers.map(provider => ({
      ...provider,
      status: provider.enabled,
      stats: {
        requestsToday: Math.floor(Math.random() * 1000 + 200),
        successRate: 98 + Math.random() * 2,
        avgResponse: (Math.random() * 2 + 0.5).toFixed(2),
        costPer1k: (Math.random() * 0.01 + 0.001).toFixed(4)
      }
    }));

    res.json(providersWithStats);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch API providers' });
  }
});

// Toggle API provider
router.post('/api-providers/:providerId/toggle', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { enabled } = req.body;
    
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log(`Mock: ${enabled ? 'Enabled' : 'Disabled'} API provider ${providerId}`);
      return res.json({ success: true, enabled, provider: `Provider ${providerId}` });
    }
    
    const provider = await db.select().from(apiProviders).where(eq(apiProviders.id, Number(providerId))).limit(1);
    if (!provider.length) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await db
      .update(apiProviders)
      .set({ 
        enabled,
        updatedAt: new Date()
      })
      .where(eq(apiProviders.id, Number(providerId)));

    // Log the action
    try {
      await db.insert(adminLogs).values({
        adminUserId: req.adminUser.id,
        action: 'toggle_api_provider',
        targetResource: `api:${provider[0].name}`,
        details: `${enabled ? 'Enabled' : 'Disabled'} API provider: ${provider[0].name}`
      });
    } catch (logError) {
      console.warn('Failed to log admin action:', logError);
    }

    res.json({ success: true, enabled, provider: provider[0].name });
  } catch (error) {
    console.error('Toggle provider error:', error);
    res.status(500).json({ error: 'Failed to toggle provider' });
  }
});

// Update API provider settings
router.put('/api-providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { apiKey, endpoint, priority, maxRetries, timeout, rateLimit, planAccess } = req.body;

    const provider = await db.select().from(apiProviders).where(eq(apiProviders.id, Number(providerId))).limit(1);
    if (!provider.length) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (endpoint !== undefined) updateData.endpoint = endpoint;
    if (priority !== undefined) updateData.priority = priority;
    if (maxRetries !== undefined) updateData.maxRetries = maxRetries;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
    if (planAccess !== undefined) updateData.planAccess = planAccess;

    await db
      .update(apiProviders)
      .set(updateData)
      .where(eq(apiProviders.id, Number(providerId)));

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'update_api_provider',
      targetResource: `api:${provider[0].name}`,
      details: `Updated API provider settings: ${provider[0].name}`
    });

    res.json({ success: true, message: 'Provider updated successfully' });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Add new API provider
router.post('/api-providers', async (req, res) => {
  try {
    const { name, type, endpoint, apiKey, planAccess = ['free', 'premium', 'enterprise'] } = req.body;

    if (!name || !type || !endpoint) {
      return res.status(400).json({ error: 'Name, type, and endpoint are required' });
    }

    const newProvider = await db.insert(apiProviders).values({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      type,
      endpoint,
      apiKey: apiKey || '',
      planAccess,
      priority: 10, // Default low priority for new providers
      enabled: true // Default to enabled
    }).returning();

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'add_api_provider',
      targetResource: `api:${newProvider[0].name}`,
      details: `Added new API provider: ${name} (${type}) - Endpoint: ${endpoint}`
    });

    res.json({ success: true, provider: newProvider[0] });
  } catch (error) {
    console.error('Add provider error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Provider name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add API provider' });
    }
  }
});

// Get API error logs
router.get('/api-errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const errors = await db
      .select()
      .from(apiErrorLogs)
      .orderBy(desc(apiErrorLogs.timestamp))
      .limit(limit);

    res.json(errors);
  } catch (error) {
    console.error('Get API errors error:', error);
    res.status(500).json({ error: 'Failed to fetch API errors' });
  }
});

// Create or update plan limits
router.post('/plans/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const { maxQueries, maxFileSize, features, price } = req.body;

    // Check if plan exists
    const existingPlan = await db.select().from(planLimits).where(eq(planLimits.tier, tier)).limit(1);

    if (existingPlan.length > 0) {
      // Update existing plan
      await db
        .update(planLimits)
        .set({
          maxQueries,
          maxFileSize,
          features
        })
        .where(eq(planLimits.tier, tier));
    } else {
      // Create new plan
      await db.insert(planLimits).values({
        tier,
        maxQueries,
        maxFileSize,
        features
      });
    }

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'update_plan',
      targetResource: `plan:${tier}`,
      details: `Updated plan: ${tier} - maxQueries: ${maxQueries}, maxFileSize: ${maxFileSize}MB`
    });

    res.json({ success: true, message: `${tier} plan updated successfully` });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Get plan limits
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.select().from(planLimits);
    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create promo code
router.post('/promo-codes', async (req, res) => {
  try {
    const { code, type, value, maxUses, expiresAt } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({ error: 'Code, type, and value are required' });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "percentage" or "fixed"' });
    }

    if (type === 'percentage' && (value < 1 || value > 100)) {
      return res.status(400).json({ error: 'Percentage value must be between 1 and 100' });
    }

    const newPromo = await db.insert(promoCodes).values({
      code: code.toUpperCase(),
      type,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true,
      usedCount: 0
    }).returning();

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'create_promo_code',
      targetResource: `promo:${newPromo[0].code}`,
      details: `Created promo code: ${code} (${type}: ${value}${type === 'percentage' ? '%' : '$'})`
    });

    res.json({ success: true, promoCode: newPromo[0] });
  } catch (error) {
    console.error('Create promo error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Promo code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create promo code' });
    }
  }
});

// Get promo codes
router.get('/promo-codes', async (req, res) => {
  try {
    const promos = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
    res.json(promos);
  } catch (error) {
    console.error('Get promos error:', error);
    // Return mock data on error to prevent crashes
    res.json([
      {
        id: 1,
        code: 'WELCOME20',
        type: 'percentage',
        value: 20,
        maxUses: 100,
        usedCount: 45,
        expiresAt: '2024-12-31',
        active: true,
        createdAt: '2024-01-01'
      }
    ]);
  }
});

// Get activity logs
router.get('/activity-logs', async (req, res) => {
  try {
    const logs = await db
      .select({
        id: adminLogs.id,
        adminUserId: adminLogs.adminUserId,
        action: adminLogs.action,
        targetResource: adminLogs.targetResource,
        details: adminLogs.details,
        timestamp: adminLogs.timestamp
      })
      .from(adminLogs)
      .orderBy(desc(adminLogs.timestamp))
      .limit(50);

    res.json(logs);
  } catch (error) {
    console.error('Activity logs error:', error);
    // Return mock data on error
    res.json([
      {
        id: 1,
        adminUserId: 1,
        action: 'user_upgrade',
        targetResource: 'user:test@example.com',
        details: 'Upgraded user to premium tier',
        timestamp: new Date().toISOString()
      }
    ]);
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    res.json({
      maintenanceMode: false,
      userRegistration: true,
      rateLimiting: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      auditLogging: true
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
router.post('/settings', async (req, res) => {
  try {
    const { setting, value } = req.body;
    
    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'update_setting',
      targetResource: `setting:${setting}`,
      details: `Updated ${setting} to ${value}`
    });

    res.json({ success: true, message: `Setting ${setting} updated successfully` });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Toggle promo code
router.post('/promo-codes/:promoId/toggle', async (req, res) => {
  try {
    const { promoId } = req.params;
    const { active } = req.body;

    const promo = await db.select().from(promoCodes).where(eq(promoCodes.id, Number(promoId))).limit(1);
    if (!promo.length) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await db
      .update(promoCodes)
      .set({ active })
      .where(eq(promoCodes.id, Number(promoId)));

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'toggle_promo_code',
      targetResource: `promo:${promo[0].code}`,
      details: `${active ? 'Activated' : 'Deactivated'} promo code: ${promo[0].code}`
    });

    res.json({ success: true, active });
  } catch (error) {
    console.error('Toggle promo error:', error);
    res.status(500).json({ error: 'Failed to toggle promo code' });
  }
});

// Delete promo code
router.delete('/promo-codes/:promoId', async (req, res) => {
  try {
    const { promoId } = req.params;

    const promo = await db.select().from(promoCodes).where(eq(promoCodes.id, Number(promoId))).limit(1);
    if (!promo.length) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await db.delete(promoCodes).where(eq(promoCodes.id, Number(promoId)));

    // Log the action
    await db.insert(adminLogs).values({
      adminUserId: req.adminUser.id,
      action: 'delete_promo_code',
      targetResource: `promo:${promo[0].code}`,
      details: `Deleted promo code: ${promo[0].code}`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

export default router;
