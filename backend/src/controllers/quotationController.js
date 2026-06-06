// Quotation controller

const quotationService = require("../services/quotationService");

const quotationController = {
  /**
   * GET /quotations
   * Query params: ?rfqId=xxx&vendorId=xxx&status=PENDING
   */
  async getAll(req, res, next) {
    try {
      const quotations = await quotationService.getAll(req.query);
      res.json({ success: true, data: quotations, count: quotations.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /quotations
   */
  async create(req, res, next) {
    try {
      const quotation = await quotationService.create(req.body);
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
      const quotation = await quotationService.updateStatus(req.params.id, status);
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = quotationController;
