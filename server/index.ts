import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { mlEngine } from "./ml-engine";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Initialize ML Engine
  try {
    await mlEngine.initialize();
    log("🤖 ML Engine initialized successfully");
  } catch (error) {
    log("⚠️  ML Engine initialization failed:", (error as any).message);
  }

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

  // Handle server errors explicitly to avoid unhandled 'error' events
  server.on("error", (err: any) => {
    const code = (err && (err.code as string)) || "UNKNOWN";
    if (code === "EADDRINUSE") {
      log(`❌ Port ${port} is already in use. Please free it and retry.`);
    } else {
      log(`❌ Server error: ${err?.message || err}`);
    }
    // Exit so invoking process managers (npm scripts) don't hang silently
    process.exit(1);
  });
  server.listen(port, () => {
    log(`serving on port ${port}`);
    log(`🌐 Application running at: http://localhost:${port}`);
    log(`🤖 ML API available at: http://localhost:${port}/api/ml/`);
    log(`📊 Dashboard: http://localhost:${port}/dashboard`);
  });
})();
