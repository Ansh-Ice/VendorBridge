// RFQ service — all database operations for Requests for Quotation

const prisma = require("../config/db");

const rfqService = {
  /**
   * Get all RFQs with related data
   */
  async getAll(filters = {}) {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
    }

    return prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        rfqVendors: {
          include: { vendor: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { quotations: true } },
      },
    });
  },

  /**
   * Get a single RFQ by ID with full details
   */
  async getById(id) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        rfqVendors: { include: { vendor: true } },
        quotations: { include: { vendor: true } },
        approvals: { include: { approver: { select: { id: true, name: true } } } },
      },
    });
  },

  /**
   * Create an RFQ and optionally invite vendors
   */
  async create(data) {
    return prisma.rFQ.create({
      data: {
        title: data.title,
        description: data.description || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status || "DRAFT",
        createdById: data.createdById,
        // Invite vendors if provided
        ...(data.vendorIds?.length && {
          rfqVendors: {
            create: data.vendorIds.map((vendorId) => ({ vendorId })),
          },
        }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        rfqVendors: { include: { vendor: true } },
      },
    });
  },

  /**
   * Update an RFQ
   */
  async update(id, data) {
    return prisma.rFQ.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.budget !== undefined && { budget: data.budget ? parseFloat(data.budget) : null }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.status && { status: data.status }),
      },
    });
  },

  /**
   * Delete an RFQ
   */
  async remove(id) {
    return prisma.rFQ.delete({ where: { id } });
  },
};

module.exports = rfqService;
