const express = require("express");
const { getActivities } = require("../controllers/dashboardController");
const { activityQueryValidator } = require("../validators/dashboardValidator");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// All activity endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/activities
 * @desc    Get paginated activities feed relevant to the authenticated user
 * @access  Private
 */
router.get("/", validate(activityQueryValidator), getActivities);

module.exports = router;
