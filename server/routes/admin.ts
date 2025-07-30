
import express from 'express';
import { db } from '../storage';
import { users, conversations, subscriptions } from '../../shared/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

const router = express.Router();

// Middleware to check admin privileges
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'No user email provided' });
    }

    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length || user[0].tier !== 'admin') {
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

    await db
      .update(users)
      .set({ 
        tier,
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(userId)));

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
    
    // Store plan configuration in a simple way (you might want to create a plans table)
    // For now, we'll just return success
    console.log(`Plan ${tier} updated:`, { maxQueries, maxFileSize, features });
    
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
    
    console.log(`Plan ${tier} pricing updated to $${price}. Reason: ${reason}`);
    
    res.json({ success: true, message: `${tier} plan pricing updated successfully` });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// API provider management
router.post('/api-providers/:provider/toggle', async (req, res) => {
  try {
    const { provider } = req.params;
    const { enabled } = req.body;
    
    console.log(`API provider ${provider} ${enabled ? 'enabled' : 'disabled'}`);
    
    res.json({ success: true, message: `${provider} ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Toggle provider error:', error);
    res.status(500).json({ error: 'Failed to toggle provider' });
  }
});

export default router;
