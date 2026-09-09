const express = require("express");
const router = express.Router();

const {
  getTasks,
  getTask,
  createNewTask,
  updateExistingTask,
  patchTaskStatus,
  deleteExistingTask
} = require("../controllers/taskController");

const {
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  taskIdParamValidator
} = require("../validators/taskValidator");

const validate = require("../middleware/validate");

// GET /api/tasks - List all tasks (supports query filtering: projectId, assignedTo, status, priority)
router.get("/", getTasks);

// GET /api/tasks/:id - Get specific task
router.get("/:id", taskIdParamValidator, validate, getTask);

// POST /api/tasks - Create new task
router.post("/", createTaskValidator, validate, createNewTask);

// PUT /api/tasks/:id - Update task
router.put("/:id", updateTaskValidator, validate, updateExistingTask);

// PATCH /api/tasks/:id/status - Update task status
router.patch("/:id/status", updateTaskStatusValidator, validate, patchTaskStatus);

// DELETE /api/tasks/:id - Delete task
router.delete("/:id", taskIdParamValidator, validate, deleteExistingTask);

module.exports = router;
