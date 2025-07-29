import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Clean up any existing processes on this port
  try {
    const { execSync } = await import('child_process');
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {
    // Ignore cleanup errors
  }

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 BioScriptor serving on port ${port}`);
    log(`🌐 Visit: http://0.0.0.0:${port}`);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try a different port.`);
    }
    process.exit(1);
  });
})();

// ========== DATABASE & STORAGE ==========
import './storage';

// Check database status on startup
async function checkDatabaseStatus() {
  try {
    const { getUserByFirebaseUid } = await import('./storage');
    await getUserByFirebaseUid('health-check');
    console.log('✅ Database connection healthy');
  } catch (error) {
    console.warn('⚠️ Database connection issues detected, fallback mode enabled');
  }
}

checkDatabaseStatus();

// Database connection check
async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database configuration...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found, database features disabled');
      return false;
    }

    console.log('🔌 Attempting to connect to Neon PostgreSQL...');

    // Import storage to ensure db is initialized with cleaned connection string
    const { db, users } = await import('./storage');

    // Test with a simple query
    const testQuery = await db.select().from(users).limit(1);
    console.log('✅ Database connection established and endpoint active');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    // Check for specific Neon endpoint disabled error
    if (error.message?.includes('endpoint has been disabled')) {
      console.log('🔄 Database endpoint is disabled - enable it in Neon console');
      console.log('⚠️ Running in fallback mode with demo data');
    } else if (error.message?.includes('not a valid URL')) {
      console.log('🔄 DATABASE_URL format issue - cleaning connection string');
      console.log('⚠️ Running in fallback mode while fixing connection');
    } else {
      console.log('⚠️ Database connection issues detected, fallback mode enabled');
    }

    return false;
  }
}

// Clean connection string for logging (hide password)
const cleanUrl = process.env.DATABASE_URL?.replace(
  /:[^:@]*@/,
  ':***@'
);
console.log('Cleaned connection string format:', cleanUrl?.substring(0, 50) + '...');

console.log('AI Provider Configuration:');
console.log('- Groq API Key:', !!process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('- Together API Key:', !!process.env.TOGETHER_API_KEY ? 'Set' : 'Missing');
console.log('- OpenRouter API Key:', !!process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing');

// Web Search Configuration
console.log('Search Service Configuration:');
const searxngUrl = process.env.SEARXNG_URL || 'https://searx.be';
console.log(`✅ SearXNG configured: ${searxngUrl}`);
console.log('🔍 Web search powered by SearXNG (privacy-focused meta search engine)');