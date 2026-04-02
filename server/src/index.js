import "dotenv/config";
import { validateEnv } from "./lib/validateEnv.js";

// Fail fast — refuse to start with missing config.
validateEnv();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";
import logger from "./lib/logger.js";
import { getAuth } from "./lib/auth.js";
import healthRouter from "./routes/health.js";
import applicationsRouter from "./routes/applications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../../client/dist");

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only the configured frontend origin ────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "incoming request");
  next();
});

// ── Auth rate limiting (applied to all /api/auth/* routes) ───────────────────
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/auth", authRateLimiter);

// ── better-auth handler (handles all /api/auth/* routes) ─────────────────────
// getAuth() is called here (after validateEnv) so better-auth only initializes
// with confirmed-present environment variables.
app.all("/api/auth/*", toNodeHandler(getAuth()));

// ── Application routes ────────────────────────────────────────────────────────
app.use(healthRouter);
app.use("/api", applicationsRouter);

// ── Serve React frontend (production) ────────────────────────────────────────
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, "server started");
});
