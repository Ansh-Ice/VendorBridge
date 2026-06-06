// Auth routes - /api/register, /api/login, /api/me, password reset

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

const otpSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(32, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty("Old password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Retyped password must be at least 6 characters"),
});

const { ApiError } = require("../middleware/errorHandler");

router.route("/register")
  .post(validate(registerSchema), authController.register)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/register. Use POST.`));
  });

router.route("/register/verify-otp")
  .post(validate(otpSchema), authController.verifyRegistrationOtp)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/register/verify-otp. Use POST.`));
  });

router.route("/login")
  .post(validate(loginSchema), authController.login)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/login. Use POST.`));
  });

router.route("/forgot-password/request-otp")
  .post(validate(forgotPasswordRequestSchema), authController.requestPasswordResetOtp)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/forgot-password/request-otp. Use POST.`));
  });

router.route("/forgot-password/verify-otp")
  .post(validate(otpSchema), authController.verifyPasswordResetOtp)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/forgot-password/verify-otp. Use POST.`));
  });

router.route("/reset-password")
  .post(validate(resetPasswordSchema), authController.resetPassword)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/reset-password. Use POST.`));
  });

router.route("/change-password")
  .post(authMiddleware, validate(changePasswordSchema), authController.changePassword)
  .all((req, res, next) => {
    next(new ApiError(405, `Method ${req.method} not allowed for /api/change-password. Use POST.`));
  });

router.get("/me", authMiddleware, authController.me);

module.exports = router;
