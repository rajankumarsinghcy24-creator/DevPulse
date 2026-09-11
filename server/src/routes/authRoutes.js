const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe
} = require("../controllers/authController");

const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  registerValidator,
  loginValidator
} = require("../validators/authValidator");

// POST /api/auth/register - Register a new user account
router.post("/register", validate(registerValidator), register);

// POST /api/auth/login - Authenticate existing user
router.post("/login", validate(loginValidator), login);

// POST /api/auth/logout - Clear session & auth cookies
router.post("/logout", logout);

// GET /api/auth/me - Retrieve currently authenticated user profile
router.get("/me", authenticate, getMe);

module.exports = router;
