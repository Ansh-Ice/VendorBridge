// User service — basic user CRUD (no auth)

const prisma = require("../config/db");
const bcrypt = require("bcryptjs");

const userService = {
  /**
   * Get all users
   */
  async getAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  },

  /**
   * Get user by ID
   */
  async getById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        rfqs: { select: { id: true, title: true, status: true } },
        approvals: true,
      },
    });
  },

  /**
   * Create a user (simple — no password/auth)
   */
  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password || "changeme123", 12);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "BUYER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  },

  /**
   * Seed a default user if none exist (for hackathon convenience)
   */
  async ensureDefaultUser() {
    const count = await prisma.user.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      return prisma.user.create({
        data: {
          name: "Admin User",
          email: "admin@vendorbridge.com",
          password: hashedPassword,
          role: "ADMIN",
        },
      });
    }
    return prisma.user.findFirst();
  },
};

module.exports = userService;

