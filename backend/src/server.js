// VendorBridge — Express Server Entry Point

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const userService = require("./services/userService");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Request logger (development)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// ── Health check ───────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VendorBridge API is running",
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ─────────────────────────────────────────
app.use("/api", routes);

// ── Error handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────
async function start() {
  try {
    // Ensure a default user exists for hackathon convenience
    const defaultUser = await userService.ensureDefaultUser();
    console.log(`Default user ready: ${defaultUser.name} (${defaultUser.id})`);

    app.listen(PORT, () => {
      console.log(`\n🚀 VendorBridge API running at http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
