import express from "express";
import { registerRoutes } from "../server/routes";
import { mlEngine } from "../server/ml-engine";
import { storage } from "../server/storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    try {
      // Ensure in-memory storage is populated before attaching routes
      await storage.loadData();
      await mlEngine.initialize();
    } catch (err) {
      console.error("ML Engine initialization failed:", (err as Error).message);
    }
    try {
      // Attach all API routes to this Express app
      await registerRoutes(app as unknown as any);
    } catch (err) {
      console.error("Failed to register routes:", (err as Error).message);
    }
    initialized = true;
  }
}

// Lazy-init on first request (compatible with serverless cold starts)
app.use(async (req, _res, next) => {
  if (!initialized) {
    await ensureInitialized();
  }
  // Ensure Express routes defined with /api/* also match when Vercel strips /api prefix
  if (!req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : `/${req.url}`);
  }
  next();
});

export default app;

