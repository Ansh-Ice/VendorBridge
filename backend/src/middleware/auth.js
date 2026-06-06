// Auth middleware — verifies JWT token and attaches user to request

const authService = require("../services/authService");
const { ApiError } = require("./errorHandler");

/**
 * Middleware that requires a valid JWT in the Authorization header.
 * Attaches the decoded user payload to req.user.
 *
 * Usage: router.get("/protected", authMiddleware, handler)
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new ApiError(401, "Authentication required. Provide a Bearer token.")
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired. Please login again."));
    }
    return next(new ApiError(401, "Invalid or malformed token."));
  }
};

/**
 * Middleware that restricts access to specific roles.
 *
 * Usage: router.get("/admin-only", authMiddleware, requireRole("ADMIN"), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${roles.join(" or ")}`)
      );
    }
    next();
  };
};

module.exports = { authMiddleware, requireRole };
