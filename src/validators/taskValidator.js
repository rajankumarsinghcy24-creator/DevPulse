const { body, param } = require("express-validator");
const { getProjectById, getUserById } = require("../data/mockData");

const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const ALLOWED_TASK_STATUSES = ["todo", "in-progress", "done"];

const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters."),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Task description is required.")
    .isLength({ min: 5, max: 1000 })
    .withMessage("Task description must be between 5 and 1000 characters."),

  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("projectId is required.")
    .custom((value) => {
      const project = getProjectById(value);
      if (!project) {
        throw new Error(`Referenced projectId '${value}' does not exist.`);
      }
      return true;
    }),

  body("assignedTo")
    .trim()
    .notEmpty()
    .withMessage("assignedTo is required.")
    .custom((value) => {
      const user = getUserById(value);
      if (!user) {
        throw new Error(`Referenced assignedTo user '${value}' does not exist.`);
      }
      return true;
    }),

  body("priority")
    .optional()
    .trim()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_TASK_STATUSES.join(", ")}.`),

  body("dueDate")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value && isNaN(Date.parse(value))) {
        throw new Error("dueDate must be a valid ISO or date format.");
      }
      return true;
    })
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
    .notEmpty()
    .withMessage("Task description cannot be empty.")
    .isLength({ min: 5, max: 1000 })
    .withMessage("Task description must be between 5 and 1000 characters."),

  body("projectId")
    .optional()
    .trim()
    .custom((value) => {
      if (value !== undefined) {
        const project = getProjectById(value);
        if (!project) {
          throw new Error(`Referenced projectId '${value}' does not exist.`);
        }
      }
      return true;
    }),

  body("assignedTo")
    .optional()
    .trim()
    .custom((value) => {
      if (value !== undefined) {
        const user = getUserById(value);
        if (!user) {
          throw new Error(`Referenced assignedTo user '${value}' does not exist.`);
        }
      }
      return true;
    }),

  body("priority")
    .optional()
    .trim()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`),

  body("status")
    .optional()
    .trim()
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_TASK_STATUSES.join(", ")}.`),

  body("dueDate")
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== null && value !== undefined && value !== "") {
        if (isNaN(Date.parse(value))) {
          throw new Error("dueDate must be a valid ISO or date format.");
        }
      }
      return true;
    })
];

const updateTaskStatusValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID parameter is required."),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status field is required.")
    .isIn(ALLOWED_TASK_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_TASK_STATUSES.join(", ")}.`)
];

const taskIdParamValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID parameter is required.")
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  taskIdParamValidator,
  ALLOWED_PRIORITIES,
  ALLOWED_TASK_STATUSES
};
