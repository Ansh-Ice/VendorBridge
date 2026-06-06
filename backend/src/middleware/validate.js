const { ApiError } = require("./errorHandler");

/**
 * Validation middleware using Zod schemas.
 * 
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate req.body against
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const details = err.errors ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`) : [err.message];
      return next(new ApiError(400, "Validation failed", details));
    }
  };
};

module.exports = validate;
