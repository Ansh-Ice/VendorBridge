// RFQ service — all database operations for Requests for Quotation

const prisma = require("../config/db");
const { generateDocumentNumber } = require("../utils/documentNumbers");

const rfqService = {
  /**
   * Get all RFQs with related data, scoped to organizationId and user role
   */
  async getAll(organizationId, user, filters = {}) {
    const where = { organizationId };

    // Vendors can only see RFQs they are invited to and that are not drafts
    if (user.role === "VENDOR") {
      if (!user.vendorId) {
        return [];
      }
      where.rfqVendors = {
        some: {
          vendorId: user.vendorId,
        },
      };
      where.status = {
        not: "DRAFT",
      };
    }

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { rfqNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lineItems: true,
        rfqVendors: {
          include: { vendor: { select: { id: true, name: true, email: true, status: true } } },
        },
        _count: { select: { quotations: true } },
      },
    });
  },

  /**
   * Get a single RFQ by ID, scoped to organizationId and user role
   */
  async getById(id, organizationId, user) {
    const where = { id, organizationId };

    if (user.role === "VENDOR") {
      if (!user.vendorId) return null;
      where.rfqVendors = {
        some: {
          vendorId: user.vendorId,
        },
      };
      where.status = {
        not: "DRAFT",
      };
    }

    return prisma.rFQ.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lineItems: {
          orderBy: { sortOrder: "asc" },
        },
        rfqVendors: { include: { vendor: true } },
        quotations: {
          include: {
            vendor: true,
            lineItems: {
              include: { rfqLineItem: true }
            }
          }
        },
        approvalRequests: {
          include: {
            requestedBy: { select: { id: true, name: true } },
            steps: { include: { approver: { select: { id: true, name: true } } } }
          }
        }
      },
    });
  },

  /**
   * Create an RFQ and its line items inside a transaction
   */
  async create(data, organizationId) {
    return prisma.$transaction(async (tx) => {
      // Generate transaction-safe sequential number
      const rfqNumber = await generateDocumentNumber(organizationId, "RFQ", tx);

      return tx.rFQ.create({
        data: {
          organizationId,
          rfqNumber,
          title: data.title,
          description: data.description || null,
          categoryId: data.categoryId || null,
          budget: data.budget ? parseFloat(data.budget) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          terms: data.terms || null,
          status: data.status || "DRAFT",
          createdById: data.createdById,
          // Create line items
          ...(data.lineItems?.length && {
            lineItems: {
              create: data.lineItems.map((item, idx) => ({
                name: item.name,
                description: item.description || null,
                quantity: parseFloat(item.quantity),
                unit: item.unit,
                targetPrice: item.targetPrice ? parseFloat(item.targetPrice) : null,
                requiredBy: item.requiredBy ? new Date(item.requiredBy) : null,
                sortOrder: idx,
              })),
            },
          }),
          // Invite vendors
          ...(data.vendorIds?.length && {
            rfqVendors: {
              create: data.vendorIds.map((vendorId) => ({ vendorId })),
            },
          }),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lineItems: true,
          rfqVendors: { include: { vendor: true } },
        },
      });
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Update an RFQ and optionally replace line items if in DRAFT state
   */
  async update(id, data, organizationId) {
    return prisma.$transaction(async (tx) => {
      // Find the existing RFQ to check status
      const existing = await tx.rFQ.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        throw new Error("RFQ not found");
      }

      const updateData = {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.budget !== undefined && { budget: data.budget ? parseFloat(data.budget) : null }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.terms !== undefined && { terms: data.terms }),
        ...(data.status && { status: data.status }),
      };

      // If status is transitioning to PUBLISHED, set publishedAt
      if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      }

      // If in draft, allow replacing line items & vendor invites
      if (existing.status === "DRAFT") {
        if (data.lineItems) {
          // Delete old line items
          await tx.rFQLineItem.deleteMany({
            where: { rfqId: id }
          });
          
          updateData.lineItems = {
            create: data.lineItems.map((item, idx) => ({
              name: item.name,
              description: item.description || null,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              targetPrice: item.targetPrice ? parseFloat(item.targetPrice) : null,
              requiredBy: item.requiredBy ? new Date(item.requiredBy) : null,
              sortOrder: idx,
            }))
          };
        }

        if (data.vendorIds) {
          // Delete old invites
          await tx.rFQVendor.deleteMany({
            where: { rfqId: id }
          });

          updateData.rfqVendors = {
            create: data.vendorIds.map((vendorId) => ({ vendorId }))
          };
        }
      }

      return tx.rFQ.update({
        where: { id, organizationId },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lineItems: true,
          rfqVendors: { include: { vendor: true } },
        }
      });
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Delete an RFQ, scoped to organizationId
   */
  async remove(id, organizationId) {
    return prisma.rFQ.delete({
      where: { id, organizationId }
    });
  },
};

module.exports = rfqService;
