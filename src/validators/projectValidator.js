const { body, param } = require("express-validator");
const { getUserById } = require("../data/mockData");

const ALLOWED_PROJECT_STATUSES = ["active", "completed", "archived"];

const createProjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required.")
    .isLength({ min: 3, max: 80 })
    .withMessage("Project name must be between 3 and 80 characters."),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Project description is required.")
    .isLength({ min: 5, max: 500 })
    .withMessage("Project description must be between 5 and 500 characters."),

  body("ownerId")
    .trim()
    .notEmpty()
    .withMessage("ownerId is required.")
    .custom((value) => {
      const user = getUserById(value);
      if (!user) {
        throw new Error(`Referenced ownerId '${value}' does not exist.`);
      }
      return true;
    }),

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
    .notEmpty()
    .withMessage("Project description cannot be empty.")
    .isLength({ min: 5, max: 500 })
    .withMessage("Project description must be between 5 and 500 characters."),

  body("ownerId")
    .optional()
    .trim()
    .custom((value) => {
      if (value !== undefined) {
        const user = getUserById(value);
        if (!user) {
          throw new Error(`Referenced ownerId '${value}' does not exist.`);
        }
      }
      return true;
    }),

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
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator,
  ALLOWED_PROJECT_STATUSES
};
