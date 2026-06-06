// Invoice Service — handles invoice generation, Indian GST calculations, and status updates

const prisma = require("../config/db");
const { generateDocumentNumber } = require("../utils/documentNumbers");
const { calculateGST } = require("../utils/gst");
const { isValidTransition } = require("../utils/stateMachine");

const invoiceService = {
  /**
   * Generate a digital GST Invoice from a Purchase Order
   */
  async generateInvoice(data, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the Purchase Order
      const po = await tx.purchaseOrder.findFirst({
        where: { id: data.purchaseOrderId, organizationId },
        include: {
          vendor: true,
          lineItems: true
        }
      });

      if (!po) {
        throw new Error("Purchase Order not found");
      }

      if (po.status === "DRAFT" || po.status === "CANCELLED") {
        throw new Error("Cannot generate an invoice for a draft or cancelled Purchase Order.");
      }

      // Check if invoice already exists for this PO (optionally support multiple partial billing in future, but standard is 1-to-1 invoice for now)
      const existingInvoice = await tx.invoice.findFirst({
        where: { purchaseOrderId: data.purchaseOrderId }
      });

      if (existingInvoice) {
        throw new Error(`An invoice (${existingInvoice.invoiceNumber}) has already been generated for this Purchase Order.`);
      }

      // Fetch organization stateCode
      const organization = await tx.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error("Organization tenant not found");
      }

      // 2. Generate sequential invoice number
      const invoiceNumber = await generateDocumentNumber(organizationId, "INVOICE", tx);

      // 3. Indian GST calculation logic
      // Customer = Organization (buyer)
      // Vendor = Vendor (seller)
      const customerState = organization.stateCode || "MH";
      const vendorState = po.vendor.stateCode || customerState;

      let subtotal = 0.0;
      let totalTaxAmount = 0.0;
      let totalCgst = 0.0;
      let totalSgst = 0.0;
      let totalIgst = 0.0;

      const lineItemsToCreate = po.lineItems.map((item) => {
        const lineSubtotal = item.lineSubtotal;
        const taxRate = item.taxRate;

        // Run Indian GST calculation helper
        const gst = calculateGST(customerState, vendorState, lineSubtotal, taxRate);

        subtotal += lineSubtotal;
        totalTaxAmount += gst.taxAmount;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;
        totalIgst += gst.igst;

        return {
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate,
          lineSubtotal,
          lineTax: gst.taxAmount,
          lineTotal: gst.grandTotal,
        };
      });

      const grandTotal = subtotal + totalTaxAmount;
      const roundOff = Math.round(grandTotal) - grandTotal;
      const finalGrandTotal = Math.round(grandTotal);

      // 4. Create the Invoice
      const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
      const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          invoiceNumber,
          purchaseOrderId: data.purchaseOrderId,
          vendorId: po.vendorId,
          status: "GENERATED",
          invoiceDate,
          dueDate,
          subtotal,
          cgst: totalCgst,
          sgst: totalSgst,
          igst: totalIgst,
          taxAmount: totalTaxAmount,
          roundOff,
          grandTotal: finalGrandTotal,
          createdById: user.id,
          lineItems: {
            create: lineItemsToCreate,
          },
        },
        include: {
          lineItems: true,
          vendor: true,
          purchaseOrder: true
        },
      });

      // 5. Update PO status to COMPLETED if not already
      await tx.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: { status: "COMPLETED" }
      });

      return invoice;
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Get all invoices scoped to organization and user role
   */
  async getAll(organizationId, user, filters = {}) {
    const where = { organizationId };

    if (user.role === "VENDOR") {
      if (!user.vendorId) return [];
      where.vendorId = user.vendorId;
    }

    if (filters.status) where.status = filters.status;

    return prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true } }
      }
    });
  },

  /**
   * Get a single invoice
   */
  async getById(id, organizationId, user) {
    const where = { id, organizationId };

    if (user.role === "VENDOR") {
      if (!user.vendorId) return null;
      where.vendorId = user.vendorId;
    }

    return prisma.invoice.findFirst({
      where,
      include: {
        vendor: true,
        createdBy: { select: { id: true, name: true, email: true } },
        purchaseOrder: true,
        lineItems: true,
        organization: true
      }
    });
  },

  /**
   * Update invoice status (e.g. mark PAID or VOID)
   */
  async updateStatus(id, status, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        throw new Error("Invoice not found");
      }

      if (!isValidTransition("INVOICE", existing.status, status)) {
        throw new Error(`Invalid Invoice status transition from ${existing.status} to ${status}`);
      }

      return tx.invoice.update({
        where: { id },
        data: { status },
        include: { vendor: true, lineItems: true }
      });
    }, { maxWait: 15000, timeout: 30000 });
  }
};

module.exports = invoiceService;
