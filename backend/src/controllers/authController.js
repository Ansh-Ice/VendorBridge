// Auth controller — handles HTTP request/response for auth endpoints

const authService = require("../services/authService");

const authController = {
  /**
   * POST /api/register - send registration OTP
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      res.status(202).json({
        success: true,
        message: result.message,
        data: {
          expiresAt: result.expiresAt,
          resendAvailableAt: result.resendAvailableAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/register/verify-otp - create account after OTP verification
   */
  async verifyRegistrationOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const { user, token } = await authService.verifyRegistrationOtp(email, otp);

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

  async requestPasswordResetOtp(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordResetOtp(email);

      res.status(202).json({
        success: true,
        message: result.message,
        data: {
          expiresAt: result.expiresAt,
          resendAvailableAt: result.resendAvailableAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyPasswordResetOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyPasswordResetOtp(email, otp);

      res.json({
        success: true,
        message: "OTP verified. You can now reset your password.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(resetToken, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword,
        confirmPassword
      );

      res.json({
        success: true,
        message: result.message,
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
