// Auth service — handles registration, login, and JWT token management

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable must be set in production mode.");
}
const JWT_SECRET = process.env.JWT_SECRET || "vendorbridge_fallback_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 12;

const authService = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, password, role?, organizationName?, organizationId?, vendorId? }
   * @returns {Object} - { user, token }
   */
  async register(data) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      const error = new Error("A user with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Resolve or create organization
    let orgId = data.organizationId;
    if (!orgId) {
      let firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) {
        firstOrg = await prisma.organization.create({
          data: {
            name: data.organizationName || "Default Organization",
            legalName: data.organizationName || "Default Org Ltd",
            stateCode: "MH", // Maharashtra default
          },
        });
      }
      orgId = firstOrg.id;
    }

    // Map legacy BUYER role to PROCUREMENT_OFFICER
    let userRole = data.role || "PROCUREMENT_OFFICER";
    if (userRole === "BUYER") {
      userRole = "PROCUREMENT_OFFICER";
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        vendorId: data.vendorId || null,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        organizationId: true,
        vendorId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = authService.generateToken(user);

    return { user, token };
  },

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Object} - { user, token }
   */
  async login(email, password) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT
    const token = authService.generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  },

  /**
   * Get current user profile from token payload
   * @param {string} userId
   * @returns {Object} user
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        vendorId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            name: true,
            legalName: true,
            gstin: true,
            billingAddress: true,
            stateCode: true,
            currency: true,
          }
        },
        vendor: {
          select: {
            name: true,
            email: true,
            status: true,
          }
        }
      },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return user;
  },

  /**
   * Generate a JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        vendorId: user.vendorId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  /**
   * Verify a JWT token
   */
  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },
};

module.exports = authService;
