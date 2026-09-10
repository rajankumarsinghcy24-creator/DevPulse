const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser
} = require("../controllers/userController");

const validate = require("../middleware/validate");
const {
  createUserValidator,
  updateUserValidator,
  userIdParamValidator
} = require("../validators/userValidator");

// GET /api/users - Retrieve all users
router.get("/", getUsers);

// GET /api/users/:id - Retrieve single user by ID
router.get("/:id", validate(userIdParamValidator), getUser);

// POST /api/users - Create new user
router.post("/", validate(createUserValidator), createNewUser);

// PUT /api/users/:id - Update user by ID
router.put("/:id", validate(updateUserValidator), updateExistingUser);

// DELETE /api/users/:id - Delete user by ID
router.delete("/:id", validate(userIdParamValidator), deleteExistingUser);

module.exports = router;
