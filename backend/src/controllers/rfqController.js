// RFQ controller — handles HTTP request/response for RFQ endpoints

const rfqService = require("../services/rfqService");
const { ApiError } = require("../middleware/errorHandler");

const rfqController = {
  /**
   * GET /rfqs
   */
  async getAll(req, res, next) {
    try {
      const rfqs = await rfqService.getAll(req.user.organizationId, req.user, req.query);
      res.json({ success: true, data: rfqs, count: rfqs.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /rfqs/:id
   */
  async getById(req, res, next) {
    try {
      const rfq = await rfqService.getById(req.params.id, req.user.organizationId, req.user);
      if (!rfq) throw new ApiError(404, "RFQ not found or access denied");
      res.json({ success: true, data: rfq });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /rfqs
   */
  async create(req, res, next) {
    try {
      const data = {
        ...req.body,
        createdById: req.user.id,
      };
      const rfq = await rfqService.create(data, req.user.organizationId);
      res.status(201).json({ success: true, data: rfq });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /rfqs/:id
   */
  async update(req, res, next) {
    try {
      const rfq = await rfqService.update(req.params.id, req.body, req.user.organizationId);
      res.json({ success: true, data: rfq });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /rfqs/:id
   */
  async remove(req, res, next) {
    try {
      await rfqService.remove(req.params.id, req.user.organizationId);
      res.json({ success: true, message: "RFQ deleted" });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = rfqController;
