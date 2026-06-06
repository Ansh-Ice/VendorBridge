// Auth routes — /api/register, /api/login, /api/me

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");

const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).trim(),
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "APPROVER"]).optional(),
  organizationName: z.string().optional(),
  organizationId: z.string().optional(),
  vendorId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
  password: z.string().nonempty("Password is required"),
});

const { ApiError } = require("../middleware/errorHandler");

// POST /api/register — create a new account
router.route("/register")
  .post(validate(registerSchema), authController.register)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/register. Use POST.`));
  });

// POST /api/login — authenticate and get token
router.route("/login")
  .post(validate(loginSchema), authController.login)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/login. Use POST.`));
  });

// GET /api/me — get current user profile (protected)
router.get("/me", authMiddleware, authController.me);

module.exports = router;
