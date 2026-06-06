// Invoice Controller

const invoiceService = require("../services/invoiceService");
const { ApiError } = require("../middleware/errorHandler");

const invoiceController = {
  /**
   * POST /invoices
   */
  async generateInvoice(req, res, next) {
    try {
      const { purchaseOrderId, invoiceDate, dueDate } = req.body;
      if (!purchaseOrderId) {
        throw new ApiError(400, "purchaseOrderId is required");
      }
      const invoice = await invoiceService.generateInvoice({ purchaseOrderId, invoiceDate, dueDate }, req.user.organizationId, req.user);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /invoices
   */
  async getAll(req, res, next) {
    try {
      const invoices = await invoiceService.getAll(req.user.organizationId, req.user, req.query);
      res.json({ success: true, data: invoices, count: invoices.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /invoices/:id
   */
  async getById(req, res, next) {
    try {
      const invoice = await invoiceService.getById(req.params.id, req.user.organizationId, req.user);
      if (!invoice) {
        throw new ApiError(404, "Invoice not found");
      }
      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /invoices/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        throw new ApiError(400, "status is required");
      }
      const invoice = await invoiceService.updateStatus(req.params.id, status, req.user.organizationId, req.user);
      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = invoiceController;
