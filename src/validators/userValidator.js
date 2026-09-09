const { body, param } = require("express-validator");

const ALLOWED_ROLES = ["developer", "designer", "manager"];

const createUserValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Must provide a valid email address.")
    .normalizeEmail(),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required.")
    .isIn(ALLOWED_ROLES)
    .withMessage(`Role must be one of: ${ALLOWED_ROLES.join(", ")}.`)
];

const updateUserValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID parameter is required."),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters."),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must provide a valid email address.")
    .normalizeEmail(),

  body("role")
    .optional()
    .trim()
    .isIn(ALLOWED_ROLES)
    .withMessage(`Role must be one of: ${ALLOWED_ROLES.join(", ")}.`)
];

const userIdParamValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID parameter is required.")
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  userIdParamValidator,
  ALLOWED_ROLES
};
