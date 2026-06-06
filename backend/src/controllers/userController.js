// User controller

const userService = require("../services/userService");

const userController = {
  async getAll(req, res, next) {
    try {
      const users = await userService.getAll();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
