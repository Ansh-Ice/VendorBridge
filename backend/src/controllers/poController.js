// Purchase Order Controller

const poService = require("../services/poService");
const { ApiError } = require("../middleware/errorHandler");

const poController = {
  /**
   * POST /purchase-orders
   */
  async generatePO(req, res, next) {
    try {
      const { approvalRequestId } = req.body;
      if (!approvalRequestId) {
        throw new ApiError(400, "approvalRequestId is required");
      }
      const po = await poService.generatePO(approvalRequestId, req.user.organizationId, req.user);
      res.status(201).json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /purchase-orders
   */
  async getAll(req, res, next) {
    try {
      const pos = await poService.getAll(req.user.organizationId, req.user, req.query);
      res.json({ success: true, data: pos, count: pos.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /purchase-orders/:id
   */
  async getById(req, res, next) {
    try {
      const po = await poService.getById(req.params.id, req.user.organizationId, req.user);
      if (!po) {
        throw new ApiError(404, "Purchase Order not found");
      }
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /purchase-orders/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        throw new ApiError(400, "status is required");
      }
      const po = await poService.updateStatus(req.params.id, status, req.user.organizationId, req.user);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = poController;
