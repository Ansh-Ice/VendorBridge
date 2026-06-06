// Simple validation middleware
// Lightweight alternative to Joi — keeps things hackathon-simple

const { ApiError } = require("./errorHandler");

/**
 * Creates a validation middleware that checks required fields exist
 * and optionally validates field types/formats.
 *
 * @param {Object} rules - { fieldName: { required, type, min, max, pattern } }
 */
const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip further checks if field is optional and not provided
      if (value === undefined || value === null) continue;

      // Type check
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be of type ${rule.type}`);
      }

      // Min length (strings)
      if (rule.min && typeof value === "string" && value.length < rule.min) {
        errors.push(`${field} must be at least ${rule.min} characters`);
      }

      // Max length (strings)
      if (rule.max && typeof value === "string" && value.length > rule.max) {
        errors.push(`${field} must be at most ${rule.max} characters`);
      }

      // Email pattern
      if (rule.isEmail && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, "Validation failed", errors));
    }

    next();
  };
};

module.exports = validate;
