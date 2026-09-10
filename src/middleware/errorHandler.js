class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handler middleware.
 * Formats Prisma errors, validation errors, and runtime exceptions.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Handle Prisma-specific errors
  if (err.code === "P2002") {
    statusCode = 409;
    const target = err.meta && err.meta.target ? err.meta.target : "field";
    message = `Unique constraint violation on ${target}. A record with this value already exists.`;
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = err.meta && err.meta.cause ? err.meta.cause : "Record not found.";
  } else if (err.code === "P2003") {
    statusCode = 400;
    message = `Foreign key constraint failed on field: ${err.meta?.field_name || "relation"}.`;
  }

  // Sanitize internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "An unexpected server error occurred.";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    }
  });
};

module.exports = {
  ApiError,
  errorHandler
};
