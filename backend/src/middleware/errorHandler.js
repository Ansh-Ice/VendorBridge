// Global error handling middleware

/**
 * Custom API error class for consistent error responses
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 404 handler — catches unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global error handler — formats all errors into a consistent JSON response
 */
const errorHandler = (err, req, res, next) => {
  // Prisma known errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.join(", ") || "field";
    return res.status(409).json({
      success: false,
      error: `Duplicate value for: ${field}`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Record not found",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { ApiError, notFoundHandler, errorHandler };
