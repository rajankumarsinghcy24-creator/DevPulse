/**
 * Centralized Error Handling Middleware for DevPulse REST API
 *
 * Ensures all error responses adhere to the standard contract:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": []
 * }
 */

class ApiError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Express error-handling middleware
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // Handle invalid JSON payload from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON syntax in request body.";
    errors = [{ msg: "Invalid JSON format", value: err.body }];
  }

  // Fallback for uncaught server errors
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected server error occurred.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  ApiError,
  errorHandler
};
