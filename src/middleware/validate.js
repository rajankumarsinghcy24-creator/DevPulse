const { validationResult } = require("express-validator");
const { ApiError } = require("./errorHandler");

/**
 * Middleware that evaluates express-validator validation chains.
 * If validation fails, forwards an ApiError with formatted error list.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return next(new ApiError("Validation failed", 400, formattedErrors));
  };
};

module.exports = validate;
