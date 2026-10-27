const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser
} = require("../controllers/userController");

const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createUserValidator,
  updateUserValidator,
  userIdParamValidator
} = require("../validators/userValidator");

// All user management routes require authentication
router.use(authenticate);

// GET /api/users - List users with optional role filtering
router.get("/", getUsers);

// GET /api/users/:id - Get user by ID with associated projects and tasks
router.get("/:id", validate(userIdParamValidator), getUser);

// POST /api/users - Create new user
router.post("/", validate(createUserValidator), createNewUser);

// PUT /api/users/:id - Update user
router.put("/:id", validate(updateUserValidator), updateExistingUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", validate(userIdParamValidator), deleteExistingUser);

module.exports = router;
