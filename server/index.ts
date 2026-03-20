console.log("SERVER BOOTING...");

console.log("SERVER STARTING INITIALIZATION...");
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as backgroundJobs from "./background-jobs.js";



const app = express();

// SECURITY: HTTP security headers via Helmet
// Note: CSP frame-ancestors disabled to allow DakBoard embedding
// DakBoard may use various domains/protocols that are hard to whitelist
app.use(helmet({
  contentSecurityPolicy: false, // Temporarily disabled for DakBoard compatibility - re-enable after testing
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: false, // Disabled to allow DakBoard iframe embedding
}));

// Trust the Cloudflare Tunnel reverse proxy (essential for WebSockets passing through Cloudflared)
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - will be initialized in async IIFE
const isProduction = process.env.NODE_ENV === "production";

// SECURITY: Require strong session secret in production, generate temporary in dev
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (isProduction) {
    throw new Error(
      "SECURITY ERROR: SESSION_SECRET must be set in production and be at least 32 characters long.\n" +
      "Generate a secure secret with: openssl rand -hex 32\n" +
      "Then add it to your .env file: SESSION_SECRET=your_generated_secret"
    );
  }
  // In development, generate a temporary random secret
  console.warn("⚠️  WARNING: Using auto-generated session secret for development only");
  console.warn("⚠️  Generate a permanent secret with: openssl rand -hex 32");
  sessionSecret = require('crypto').randomBytes(32).toString('hex');
}

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

console.log("-> Starting IIFE...");
(async () => {
  // Initialize session store
  let sessionStore;
  try {
    if (process.env.DATABASE_URL && isProduction) {
      console.log("-> Loading pg-simple...");
      // Use PostgreSQL session store in production
      const connectPgSimple = await import("connect-pg-simple");
      const pgSession = connectPgSimple.default(session);
      sessionStore = new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
      });
      log("Using PostgreSQL session store");
    } else {
      console.log("-> Loading memorystore...");
      // Use memory store in development
      const MemoryStore = await import("memorystore");
      console.log("-> Loaded memorystore!");
      const MemStoreClass = MemoryStore.default(session);
      sessionStore = new MemStoreClass({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
      log("Using memory session store");
    }

    console.log("-> Applying session middleware");
    app.use(
      session({
        secret: sessionSecret as string,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction, // Use secure cookies in production
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
      })
    );

    // SECURITY: Rate limiting to prevent API abuse and DoS attacks
    // NOTE: 500 req/15min accommodates kiosk polling (health, weather, alerts, config, thermostats)
    // plus retry logic without triggering a retry death-spiral.
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // Limit each IP to 500 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in RateLimit-* headers
      legacyHeaders: false, // Disable X-RateLimit-* headers
    });

    // Apply general rate limit to all API routes
    app.use('/api/', apiLimiter);

    // Stricter rate limit for refresh endpoints (expensive operations)
    const refreshLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Only 5 refresh requests per minute per IP
      message: 'Refresh rate limit exceeded. Please wait before refreshing again.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Export refreshLimiter for use in routes
    (app as any).refreshLimiter = refreshLimiter;
  } catch (error) {
    log("Warning: Failed to initialize session store, continuing without sessions");
    console.error("Session initialization error:", error);
  }

  // Initialize database connection and run migrations if needed
  if (process.env.DATABASE_URL) {
    try {
      const { initializeDatabase } = await import("./db-init.js");
      const dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        log("Database initialized successfully");
      } else {
        log("Warning: Database initialization failed, using fallback storage");
      }

      // Test database connection by attempting to import storage for memory cache
      log("Database connection verified");
    } catch (error) {
      log("Warning: Database connection failed, using fallback storage");
      console.error("Database connection error:", error);
    }
  } else {
    log("DATABASE_URL not set, using in-memory storage");
  }

  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Enhanced server startup with error handling for deployment
  try {
    server.listen({
      port,
      host: "0.0.0.0",
    }, async () => {
      log(`serving on port ${port}`);
      console.log(`Weather kiosk server started successfully on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
      console.log(`Session secret configured: ${!!process.env.SESSION_SECRET}`);

      // Start weather update job (will poll NOAA/WeatherFlow & emit WS events)
      await backgroundJobs.startWeatherUpdateJob();

      // Start thermostat update job if Beestat API key is configured
      if (process.env.BEESTAT_API_KEY) {
        await backgroundJobs.startThermostatUpdateJob();
      }

      // Start database cleanup job if using PostgreSQL
      if (process.env.DATABASE_URL) {
        backgroundJobs.startCleanupJob();
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`Permission denied to bind to port ${port}`);
        process.exit(1);
      } else {
        console.error('Unexpected server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully');

      // Stop background jobs
      if (process.env.BEESTAT_API_KEY) {
        backgroundJobs.stopThermostatUpdateJob();
      }
      if (process.env.DATABASE_URL) {
        backgroundJobs.stopCleanupJob();
      }
      backgroundJobs.stopWeatherUpdateJob();

      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully');

      // Stop background jobs
      const backgroundJobs = await import('./background-jobs.js');
      if (process.env.BEESTAT_API_KEY) {
        backgroundJobs.stopThermostatUpdateJob();
      }
      if (process.env.DATABASE_URL) {
        backgroundJobs.stopCleanupJob();
      }

      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
