// Vendor controller — handles HTTP request/response for vendor endpoints

const vendorService = require("../services/vendorService");
const { ApiError } = require("../middleware/errorHandler");

const vendorController = {
  /**
   * GET /vendors
   * Query params: ?status=ACTIVE&category=IT&search=acme
   */
  async getAll(req, res, next) {
    try {
      const vendors = await vendorService.getAll(req.query);
      res.json({ success: true, data: vendors, count: vendors.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /vendors/:id
   */
  async getById(req, res, next) {
    try {
      const vendor = await vendorService.getById(req.params.id);
      if (!vendor) throw new ApiError(404, "Vendor not found");
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /vendors
   */
  async create(req, res, next) {
    try {
      const vendor = await vendorService.create(req.body);
      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /vendors/:id
   */
  async update(req, res, next) {
    try {
      const vendor = await vendorService.update(req.params.id, req.body);
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /vendors/:id
   */
  async remove(req, res, next) {
    try {
      await vendorService.remove(req.params.id);
      res.json({ success: true, message: "Vendor deleted" });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = vendorController;
