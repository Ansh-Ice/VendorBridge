// Quotation service — handles quotation submissions

const prisma = require("../config/db");
const { generateDocumentNumber } = require("../utils/documentNumbers");
const { isValidTransition } = require("../utils/stateMachine");

const quotationService = {
  /**
   * Get all quotations, filtered by organizationId and role
   */
  async getAll(organizationId, user, filters = {}) {
    const where = { organizationId };

    // Vendors can only see their own quotations
    if (user.role === "VENDOR") {
      if (!user.vendorId) return [];
      where.vendorId = user.vendorId;
    }

    if (filters.rfqId) where.rfqId = filters.rfqId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.status) where.status = filters.status;

    return prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        rfq: { select: { id: true, title: true, rfqNumber: true, status: true } },
        vendor: { select: { id: true, name: true, email: true, state: true, stateCode: true } },
        lineItems: {
          include: { rfqLineItem: true }
        }
      },
    });
  },

  /**
   * Get a single quotation by ID
   */
  async getById(id, organizationId, user) {
    const where = { id, organizationId };
    
    if (user.role === "VENDOR") {
      if (!user.vendorId) return null;
      where.vendorId = user.vendorId;
    }

    return prisma.quotation.findFirst({
      where,
      include: {
        rfq: true,
        vendor: true,
        lineItems: {
          include: { rfqLineItem: true }
        }
      }
    });
  },

  /**
   * Create a new quotation inside a transaction
   */
  async create(data, organizationId, user) {
    if (user.role === "VENDOR" && !user.vendorId) {
      throw new Error("User does not have an associated vendor profile");
    }

    const vendorId = user.role === "VENDOR" ? user.vendorId : data.vendorId;
    if (!vendorId) {
      throw new Error("Vendor ID is required");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Verify RFQ exists
      const rfq = await tx.rFQ.findFirst({
        where: { id: data.rfqId, organizationId }
      });

      if (!rfq) {
        throw new Error("RFQ not found");
      }

      // 2. Generate sequential quotation number
      const quoteNumber = await generateDocumentNumber(organizationId, "QUOTE", tx);

      // 3. Process line items and calculate totals
      const shippingAmount = data.shippingAmount ? parseFloat(data.shippingAmount) : 0.0;
      const discountAmount = data.discountAmount ? parseFloat(data.discountAmount) : 0.0;
      
      let calculatedSubtotal = 0.0;
      let calculatedTax = 0.0;

      const lineItemsToCreate = (data.lineItems || []).map((item) => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const taxRate = item.taxRate !== undefined ? parseFloat(item.taxRate) : 18.0;
        
        const lineSubtotal = qty * price;
        const lineTax = lineSubtotal * (taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += lineTax;

        return {
          rfqLineItemId: item.rfqLineItemId,
          unitPrice: price,
          quantity: qty,
          taxRate,
          lineSubtotal,
          lineTax,
          lineTotal,
          deliveryDays: item.deliveryDays ? parseInt(item.deliveryDays) : null,
          notes: item.notes || null,
        };
      });

      const grandTotal = calculatedSubtotal + calculatedTax + shippingAmount - discountAmount;

      // 4. Create the quotation
      const quotation = await tx.quotation.create({
        data: {
          organizationId,
          rfqId: data.rfqId,
          vendorId,
          quoteNumber,
          subtotal: calculatedSubtotal,
          taxAmount: calculatedTax,
          shippingAmount,
          discountAmount,
          grandTotal,
          deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : 0,
          validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
          paymentTerms: data.paymentTerms || null,
          notes: data.notes || null,
          status: data.status || "SUBMITTED",
          submittedAt: new Date(),
          lineItems: {
            create: lineItemsToCreate,
          },
        },
        include: {
          rfq: true,
          vendor: true,
          lineItems: true,
        },
      });

      // 5. Update vendor invitation status to QUOTED
      await tx.rFQVendor.updateMany({
        where: {
          rfqId: data.rfqId,
          vendorId,
        },
        data: {
          status: "QUOTED",
          respondedAt: new Date(),
        },
      });

      return quotation;
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Update quotation status
   */
  async updateStatus(id, status, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.quotation.findFirst({
        where: { id, organizationId },
        include: { rfq: true }
      });

      if (!existing) {
        throw new Error("Quotation not found");
      }

      if (!isValidTransition("QUOTATION", existing.status, status)) {
        throw new Error(`Invalid quotation status transition from ${existing.status} to ${status}`);
      }

      const updated = await tx.quotation.update({
        where: { id },
        data: { status },
        include: { rfq: true, vendor: true }
      });

      // If accepted, we can associate with RFQ or update RFQ status
      if (status === "ACCEPTED") {
        await tx.rFQ.update({
          where: { id: existing.rfqId },
          data: {
            selectedQuotationId: id,
            status: "APPROVED" // auto approve if no approval workflow is active, or trigger approvals
          }
        });
      }

      return updated;
    }, { maxWait: 15000, timeout: 30000 });
  },
};

module.exports = quotationService;
