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

const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createTaskValidator,
  updateTaskValidator,
  patchTaskStatusValidator,
  taskIdParamValidator
} = require("../validators/taskValidator");

// All task operations require an authenticated user session
router.use(authenticate);

// GET /api/tasks - Search and multi-filter task listing
router.get("/", getTasks);

// GET /api/tasks/:id - Retrieve single task details
router.get("/:id", validate(taskIdParamValidator), getTask);

// POST /api/tasks - Create a new task under an authorized project
router.post("/", validate(createTaskValidator), createNewTask);

// PUT /api/tasks/:id - Update existing task
router.put("/:id", validate(updateTaskValidator), updateExistingTask);

// PATCH /api/tasks/:id/status - Update task status
router.patch("/:id/status", validate(patchTaskStatusValidator), patchTaskStatus);

// DELETE /api/tasks/:id - Delete task (owner only)
router.delete("/:id", validate(taskIdParamValidator), deleteExistingTask);

module.exports = router;
