const { body, param } = require("express-validator");

const ALLOWED_PROJECT_STATUSES = ["active", "completed", "archived"];

const createProjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required.")
    .isLength({ min: 3, max: 80 })
    .withMessage("Project name must be between 3 and 80 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Project description must not exceed 500 characters."),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_PROJECT_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_PROJECT_STATUSES.join(", ")}.`)
];

const updateProjectValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Project ID parameter is required."),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project name cannot be empty.")
    .isLength({ min: 3, max: 80 })
    .withMessage("Project name must be between 3 and 80 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Project description must not exceed 500 characters."),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_PROJECT_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_PROJECT_STATUSES.join(", ")}.`)
];

const projectIdParamValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Project ID parameter is required.")
];

module.exports = {
  ALLOWED_PROJECT_STATUSES,
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator
};
