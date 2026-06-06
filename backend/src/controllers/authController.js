// Auth controller — handles HTTP request/response for auth endpoints

const authService = require("../services/authService");

const authController = {
  /**
   * POST /api/register
   * Body: { name, email, password, role? }
   */
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/login
   * Body: { email, password }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      res.json({
        success: true,
        message: "Login successful",
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/me
   * Requires authentication — returns current user profile
   */
  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
