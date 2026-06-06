// Quotation controller

const quotationService = require("../services/quotationService");
const { ApiError } = require("../middleware/errorHandler");

const quotationController = {
  /**
   * GET /quotations
   * Query params: ?rfqId=xxx&vendorId=xxx&status=PENDING
   */
  async getAll(req, res, next) {
    try {
      const quotations = await quotationService.getAll(req.user.organizationId, req.user, req.query);
      res.json({ success: true, data: quotations, count: quotations.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /quotations/:id
   */
  async getById(req, res, next) {
    try {
      const quotation = await quotationService.getById(req.params.id, req.user.organizationId, req.user);
      if (!quotation) throw new ApiError(404, "Quotation not found or access denied");
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /quotations
   */
  async create(req, res, next) {
    try {
      const quotation = await quotationService.create(req.body, req.user.organizationId, req.user);
      res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /quotations/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const quotation = await quotationService.updateStatus(req.params.id, status, req.user.organizationId, req.user);
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = quotationController;
