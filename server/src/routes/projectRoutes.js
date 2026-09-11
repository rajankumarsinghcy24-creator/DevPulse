const express = require("express");
const router = express.Router();

const {
  getProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  deleteExistingProject
} = require("../controllers/projectController");

const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator
} = require("../validators/projectValidator");

// All project operations require an authenticated session
router.use(authenticate);

// GET /api/projects - List all accessible projects
router.get("/", getProjects);

// GET /api/projects/:id - Retrieve detailed project information, tasks, and activities
router.get("/:id", validate(projectIdParamValidator), getProject);

// POST /api/projects - Create a new project (authenticated user becomes owner)
router.post("/", validate(createProjectValidator), createNewProject);

// PUT /api/projects/:id - Update existing project (owner only)
router.put("/:id", validate(updateProjectValidator), updateExistingProject);

// DELETE /api/projects/:id - Delete project and cascade (owner only)
router.delete("/:id", validate(projectIdParamValidator), deleteExistingProject);

module.exports = router;
