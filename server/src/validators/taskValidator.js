const { body, param, query } = require("express-validator");

const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const ALLOWED_TASK_STATUSES = ["todo", "in-progress", "in_progress", "done"];

const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Task description must not exceed 1000 characters."),

  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("projectId is required."),

  body("assignedTo")
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage("assignedTo cannot be an empty string if provided."),

  body("priority")
    .optional()
    .trim()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: todo, in-progress, done.`),

  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dueDate must be a valid ISO8601 date string.")
];

const updateTaskValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID parameter is required."),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Task description must not exceed 1000 characters."),

  body("projectId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("projectId cannot be empty."),

  body("assignedTo")
    .optional({ nullable: true })
    .trim(),

  body("priority")
    .optional()
    .trim()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: todo, in-progress, done.`),

  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dueDate must be a valid ISO8601 date string.")
];

const patchTaskStatusValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID parameter is required."),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("status is required.")
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: todo, in-progress, done.`)
];

const taskIdParamValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID parameter is required.")
];

module.exports = {
  ALLOWED_PRIORITIES,
  ALLOWED_TASK_STATUSES,
  createTaskValidator,
  updateTaskValidator,
  patchTaskStatusValidator,
  taskIdParamValidator
};
