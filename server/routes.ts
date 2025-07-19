import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatSessionSchema, insertBioFileSchema } from "@shared/schema";
import { processQuery } from "./services/ai";
import { analyzeBioFile } from "./services/bioinformatics";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const firebaseUid = req.headers['x-firebase-uid'];
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
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
    
    req.user = user;
    next();
  };

  // User routes
  app.get("/api/user/profile", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Chat routes
  app.post("/api/chat/message", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check query limits for free tier
      if (req.user.tier === 'free' && req.user.queryCount >= 10) {
        return res.status(429).json({ error: 'Daily query limit reached. Upgrade to Pro for unlimited queries.' });
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
      const response = await processQuery(message, fileAnalysis || undefined);
      
      // Update user query count
      await storage.updateUser(req.user.id, {
        queryCount: req.user.queryCount + 1
      });

      res.json({ response });
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

  const httpServer = createServer(app);
  return httpServer;
}
