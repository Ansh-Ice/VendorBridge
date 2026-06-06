// VendorBridge — Express Server Entry Point

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(",") 
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes("*")) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Request logger (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
  });
}

// ── Health check ───────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    // Test DB connectivity
    const prisma = require("./config/db");
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "VendorBridge API is running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "VendorBridge API is running but database is unreachable",
      database: "disconnected",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── API routes ─────────────────────────────────────────
app.use("/api", routes);

// ── Error handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 VendorBridge API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`🔑 Login:        POST http://localhost:${PORT}/api/login\n`);
});

