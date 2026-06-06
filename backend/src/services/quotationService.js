// Quotation service — handles quotation submissions

const prisma = require("../config/db");

const quotationService = {
  /**
   * Get all quotations, optionally filtered by RFQ or vendor
   */
  async getAll(filters = {}) {
    const where = {};
    if (filters.rfqId) where.rfqId = filters.rfqId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.status) where.status = filters.status;

    return prisma.quotation.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        rfq: { select: { id: true, title: true, status: true } },
        vendor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /**
   * Create a new quotation
   */
  async create(data) {
    return prisma.quotation.create({
      data: {
        amount: parseFloat(data.amount),
        notes: data.notes || null,
        rfqId: data.rfqId,
        vendorId: data.vendorId,
      },
      include: {
        rfq: true,
        vendor: true,
      },
    });
  },

  /**
   * Update quotation status (accept/reject)
   */
  async updateStatus(id, status) {
    return prisma.quotation.update({
      where: { id },
      data: { status },
    });
  },
};

module.exports = quotationService;
