// Purchase Order Service — handles PO generation and status updates

const prisma = require("../config/db");
const { generateDocumentNumber } = require("../utils/documentNumbers");
const { isValidTransition } = require("../utils/stateMachine");

const poService = {
  /**
   * Generate a Purchase Order from an APPROVED approval request
   */
  async generatePO(approvalRequestId, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the approval request
      const approvalRequest = await tx.approvalRequest.findFirst({
        where: { id: approvalRequestId, organizationId },
        include: {
          rfq: true,
          quotation: {
            include: {
              vendor: true,
              lineItems: { include: { rfqLineItem: true } }
            }
          }
        }
      });

      if (!approvalRequest) {
        throw new Error("Approval request not found");
      }

      if (approvalRequest.status !== "APPROVED") {
        throw new Error("Quotation must be approved before generating a Purchase Order.");
      }

      // 2. Check if PO already exists
      const existingPO = await tx.purchaseOrder.findFirst({
        where: { approvalRequestId }
      });

      if (existingPO) {
        throw new Error(`A Purchase Order (${existingPO.poNumber}) has already been generated for this request.`);
      }

      // 3. Generate sequential PO number
      const poNumber = await generateDocumentNumber(organizationId, "PO", tx);

      // 4. Create the Purchase Order
      const deliveryDeadline = new Date();
      deliveryDeadline.setDate(deliveryDeadline.getDate() + (approvalRequest.quotation.deliveryDays || 14));

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          organizationId,
          poNumber,
          rfqId: approvalRequest.rfqId,
          quotationId: approvalRequest.quotationId,
          approvalRequestId,
          vendorId: approvalRequest.quotation.vendorId,
          status: "ISSUED", // Start issued
          expectedDeliveryDate: deliveryDeadline,
          subtotal: approvalRequest.quotation.subtotal,
          taxAmount: approvalRequest.quotation.taxAmount,
          grandTotal: approvalRequest.quotation.grandTotal,
          terms: approvalRequest.quotation.paymentTerms || approvalRequest.rfq.terms || null,
          generatedById: user.id,
          lineItems: {
            create: approvalRequest.quotation.lineItems.map((li) => ({
              name: li.rfqLineItem.name,
              description: li.rfqLineItem.description || li.notes || null,
              quantity: li.quantity,
              unit: li.rfqLineItem.unit,
              unitPrice: li.unitPrice,
              taxRate: li.taxRate,
              lineSubtotal: li.lineSubtotal,
              lineTax: li.lineTax,
              lineTotal: li.lineTotal,
            })),
          },
        },
        include: {
          lineItems: true,
          vendor: true,
        },
      });

      // 5. Update RFQ status to AWARDED
      await tx.rFQ.update({
        where: { id: approvalRequest.rfqId },
        data: { status: "AWARDED" }
      });

      return purchaseOrder;
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Get all Purchase Orders, filtered by organization and role
   */
  async getAll(organizationId, user, filters = {}) {
    const where = { organizationId };

    if (user.role === "VENDOR") {
      if (!user.vendorId) return [];
      where.vendorId = user.vendorId;
    }

    if (filters.status) where.status = filters.status;

    return prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        generatedBy: { select: { id: true, name: true } },
        rfq: { select: { id: true, rfqNumber: true, title: true } },
        _count: { select: { invoices: true } }
      }
    });
  },

  /**
   * Get a single Purchase Order by ID
   */
  async getById(id, organizationId, user) {
    const where = { id, organizationId };

    if (user.role === "VENDOR") {
      if (!user.vendorId) return null;
      where.vendorId = user.vendorId;
    }

    return prisma.purchaseOrder.findFirst({
      where,
      include: {
        vendor: true,
        generatedBy: { select: { id: true, name: true, email: true } },
        rfq: true,
        quotation: true,
        lineItems: true,
        invoices: true,
      }
    });
  },

  /**
   * Update PO status (e.g. mark received or complete)
   */
  async updateStatus(id, status, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        throw new Error("Purchase Order not found");
      }

      if (!isValidTransition("PO", existing.status, status)) {
        throw new Error(`Invalid Purchase Order status transition from ${existing.status} to ${status}`);
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status },
        include: { vendor: true, lineItems: true }
      });
    }, { maxWait: 15000, timeout: 30000 });
  }
};

module.exports = poService;
