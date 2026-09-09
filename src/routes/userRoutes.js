const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser
} = require("../controllers/userController");

const {
  createUserValidator,
  updateUserValidator,
  userIdParamValidator
} = require("../validators/userValidator");

const validate = require("../middleware/validate");

// GET /api/users - List all users
router.get("/", getUsers);

// GET /api/users/:id - Get specific user
router.get("/:id", userIdParamValidator, validate, getUser);

// POST /api/users - Create new user
router.post("/", createUserValidator, validate, createNewUser);

// PUT /api/users/:id - Update user
router.put("/:id", updateUserValidator, validate, updateExistingUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", userIdParamValidator, validate, deleteExistingUser);

module.exports = router;
