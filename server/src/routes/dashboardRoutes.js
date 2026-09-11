const express = require("express");
const { getDashboard } = require("../controllers/dashboardController");
const { dashboardQueryValidator } = require("../validators/dashboardValidator");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// All dashboard endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard metrics, task stats, and recent activities for the user
 * @access  Private
 */
router.get("/", validate(dashboardQueryValidator), getDashboard);

module.exports = router;
