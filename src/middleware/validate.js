const { validationResult } = require("express-validator");

/**
 * Middleware that checks express-validator validation results.
 * If validation errors exist, responds with 400 and structured error list.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed. Please verify your input.",
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
