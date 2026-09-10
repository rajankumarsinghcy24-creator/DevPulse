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

const validate = require("../middleware/validate");
const {
  createTaskValidator,
  updateTaskValidator,
  patchTaskStatusValidator,
  taskIdParamValidator
} = require("../validators/taskValidator");

// GET /api/tasks - Retrieve all tasks (supports filtering)
router.get("/", getTasks);

// GET /api/tasks/:id - Retrieve single task by ID
router.get("/:id", validate(taskIdParamValidator), getTask);

// POST /api/tasks - Create new task
router.post("/", validate(createTaskValidator), createNewTask);

// PUT /api/tasks/:id - Update task by ID
router.put("/:id", validate(updateTaskValidator), updateExistingTask);

// PATCH /api/tasks/:id/status - Update only task status
router.patch("/:id/status", validate(patchTaskStatusValidator), patchTaskStatus);

// DELETE /api/tasks/:id - Delete task by ID
router.delete("/:id", validate(taskIdParamValidator), deleteExistingTask);

module.exports = router;
