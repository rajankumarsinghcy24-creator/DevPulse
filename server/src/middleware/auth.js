const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { ApiError } = require("./errorHandler");

/**
 * Authentication Middleware:
 * Inspects both HTTP-Only cookie ('token') and Authorization header ('Bearer <token>').
 * Validates JWT, verifies user exists in database, and attaches req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-Only Cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer Header fallback
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ApiError("Authentication required. Please log in.", 401));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new ApiError("JWT_SECRET is not configured on server.", 500));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (tokenErr) {
      return next(new ApiError("Invalid or expired authentication token. Please log in again.", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return next(new ApiError("User account belonging to this token no longer exists.", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authenticate
};
