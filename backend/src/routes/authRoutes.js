// Auth routes — /api/register, /api/login, /api/me

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const registerRules = {
  name:     { required: true, type: "string", min: 2 },
  email:    { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string", min: 6 },
};

const loginRules = {
  email:    { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string" },
};

// POST /api/register — create a new account
router.post("/register", validate(registerRules), authController.register);

// POST /api/login — authenticate and get token
router.post("/login", validate(loginRules), authController.login);

// GET /api/me — get current user profile (protected)
router.get("/me", authMiddleware, authController.me);

module.exports = router;
