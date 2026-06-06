// Vendor service — all database operations for vendors

const prisma = require("../config/db");

const vendorService = {
  /**
   * Get all vendors with optional filtering
   */
  async getAll(filters = {}) {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = { contains: filters.category, mode: "insensitive" };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { quotations: true, rfqVendors: true } },
      },
    });
  },

  /**
   * Get a single vendor by ID
   */
  async getById(id) {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        quotations: { include: { rfq: true } },
        rfqVendors: { include: { rfq: true } },
      },
    });
  },

  /**
   * Create a new vendor
   */
  async create(data) {
    return prisma.vendor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        category: data.category || null,
      },
    });
  },

  /**
   * Update a vendor
   */
  async update(id, data) {
    return prisma.vendor.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a vendor
   */
  async remove(id) {
    return prisma.vendor.delete({ where: { id } });
  },
};

module.exports = vendorService;
