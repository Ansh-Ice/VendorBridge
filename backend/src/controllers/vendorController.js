const vendorService = require("../services/vendorService");
const { ApiError } = require("../middleware/errorHandler");

const vendorController = {
  /**
   * GET /vendors
   */
  async getAll(req, res, next) {
    try {
      const vendors = await vendorService.getAll(req.user.organizationId, req.query);
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
      const vendor = await vendorService.getById(req.params.id, req.user.organizationId);
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
      const vendor = await vendorService.create(req.body, req.user.organizationId);
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
      const vendor = await vendorService.update(req.params.id, req.body, req.user.organizationId);
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
      await vendorService.remove(req.params.id, req.user.organizationId);
      res.json({ success: true, message: "Vendor deleted" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vendors/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await vendorService.getCategories(req.user.organizationId);
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/vendors/categories
   */
  async createCategory(req, res, next) {
    try {
      const category = await vendorService.createCategory(req.body, req.user.organizationId);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = vendorController;
