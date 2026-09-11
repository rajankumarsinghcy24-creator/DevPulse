const { body } = require("express-validator");

const generateTasksValidator = [
  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("projectId is required.")
    .isUUID()
    .withMessage("projectId must be a valid UUID."),

  body("projectName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("projectName must be between 2 and 100 characters."),

  body("projectDescription")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("projectDescription must not exceed 1000 characters."),

  body("goals")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("goals must not exceed 500 characters."),

  body("additionalInstructions")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("additionalInstructions must not exceed 500 characters."),

  body("taskCount")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("taskCount must be an integer between 1 and 10.")
    .toInt()
];

module.exports = {
  generateTasksValidator
};
