// Approval Controller — handles HTTP requests for approval steps

const approvalService = require("../services/approvalService");
const { ApiError } = require("../middleware/errorHandler");

const approvalController = {
  /**
   * POST /approvals
   */
  async createRequest(req, res, next) {
    try {
      const { rfqId, quotationId } = req.body;
      if (!rfqId || !quotationId) {
        throw new ApiError(400, "rfqId and quotationId are required");
      }
      const request = await approvalService.createRequest({ rfqId, quotationId }, req.user.organizationId, req.user);
      res.status(201).json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /approvals
   */
  async getAll(req, res, next) {
    try {
      const requests = await approvalService.getAll(req.user.organizationId, req.user, req.query);
      res.json({ success: true, data: requests, count: requests.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /approvals/:id
   */
  async getById(req, res, next) {
    try {
      const request = await approvalService.getById(req.params.id, req.user.organizationId);
      if (!request) {
        throw new ApiError(404, "Approval request not found");
      }
      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /approvals/:id/decide
   */
  async decideStep(req, res, next) {
    try {
      const { remarks, status } = req.body; // status is "APPROVED" or "REJECTED"
      if (!status || !["APPROVED", "REJECTED"].includes(status)) {
        throw new ApiError(400, "status is required and must be APPROVED or REJECTED");
      }
      const request = await approvalService.decideStep(req.params.id, remarks, status, req.user.organizationId, req.user);
      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = approvalController;
