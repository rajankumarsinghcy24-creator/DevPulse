const express = require("express");
const { generateTasks } = require("../controllers/aiController");
const { generateTasksValidator } = require("../validators/aiValidator");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// All AI endpoints require authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/generate-tasks
 * @desc    Generate structured task suggestions for a project using AI
 * @access  Private (Owner or Project Collaborator)
 */
router.post("/generate-tasks", validate(generateTasksValidator), generateTasks);

module.exports = router;
