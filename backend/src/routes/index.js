// Central route index — mounts all route modules

const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/auth");

// Auth routes — /api/register, /api/login, /api/me
router.use("/",          require("./authRoutes"));

// Resource routes (protected by default)
router.use("/vendors",         authMiddleware, require("./vendorRoutes"));
router.use("/rfqs",            authMiddleware, require("./rfqRoutes"));
router.use("/quotations",      authMiddleware, require("./quotationRoutes"));
router.use("/approvals",       authMiddleware, require("./approvalRoutes"));
router.use("/purchase-orders", authMiddleware, require("./poRoutes"));
router.use("/invoices",        authMiddleware, require("./invoiceRoutes"));
router.use("/users",           authMiddleware, require("./userRoutes"));

module.exports = router;
