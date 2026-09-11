const { query } = require("express-validator");

const dashboardQueryValidator = [
  query("activityLimit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("activityLimit must be an integer between 1 and 100.")
    .toInt()
];

const activityQueryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100.")
    .toInt(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer.")
    .toInt(),

  query("projectId")
    .optional()
    .isUUID()
    .withMessage("projectId must be a valid UUID."),

  query("taskId")
    .optional()
    .isUUID()
    .withMessage("taskId must be a valid UUID.")
];

module.exports = {
  dashboardQueryValidator,
  activityQueryValidator
};
