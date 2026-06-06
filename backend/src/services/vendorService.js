const prisma = require("../config/db");

const vendorService = {
  /**
   * Get all vendors with optional filtering, scoped to organizationId
   */
  async getAll(organizationId, filters = {}) {
    const where = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { gstin: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: { select: { quotations: true, rfqVendors: true } },
      },
    });
  },

  /**
   * Get a single vendor by ID, scoped to organizationId
   */
  async getById(id, organizationId) {
    return prisma.vendor.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        quotations: { include: { rfq: true } },
        rfqVendors: { include: { rfq: true } },
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },

  /**
   * Create a new vendor, scoped to organizationId
   */
  async create(data, organizationId) {
    return prisma.vendor.create({
      data: {
        organizationId,
        name: data.name,
        legalName: data.legalName || null,
        email: data.email,
        phone: data.phone || null,
        contactName: data.contactName || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        stateCode: data.stateCode || null,
        postalCode: data.postalCode || null,
        country: data.country || "India",
        gstin: data.gstin || null,
        pan: data.pan || null,
        categoryId: data.categoryId || null,
        status: data.status || "ACTIVE",
        rating: data.rating ? parseFloat(data.rating) : 0.0,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
      include: {
        category: true,
      }
    });
  },

  /**
   * Update a vendor, scoped to organizationId
   */
  async update(id, data, organizationId) {
    const { organizationId: _, id: __, ...updateData } = data;
    
    if (updateData.rating !== undefined) {
      updateData.rating = parseFloat(updateData.rating) || 0.0;
    }

    return prisma.vendor.update({
      where: { id, organizationId },
      data: updateData,
      include: {
        category: true,
      }
    });
  },

  /**
   * Delete a vendor, scoped to organizationId
   */
  async remove(id, organizationId) {
    return prisma.vendor.delete({
      where: { id, organizationId }
    });
  },

  /**
   * Get all categories for an organization
   */
  async getCategories(organizationId) {
    return prisma.vendorCategory.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Create a new category
   */
  async createCategory(data, organizationId) {
    return prisma.vendorCategory.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description || null,
      },
    });
  },
};

module.exports = vendorService;
