import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// --- Enable CORS
app.use(cors());

// --- Parse JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Logging middleware
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

// --- Health route for UptimeRobot
app.get("/health", (_req: Request, res: Response) => {
  res.send("Server is running ✅");
});

(async () => {
  // --- Register API routes
  const server = await registerRoutes(app);

  // --- Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // --- Serve frontend
  if (app.get("env") === "development") {
    // Vite dev server for live reload
    await setupVite(app, server);
  } else {
    // Production: serve static files
    const staticPath = path.join(__dirname, "public"); // <-- make sure your HTML & JS are here
    app.use(express.static(staticPath));

    // Catch-all: send index.html for SPA
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  // --- Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Server running on port ${port}`);
    }
  );
})();