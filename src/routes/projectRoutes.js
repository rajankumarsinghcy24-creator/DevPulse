const express = require("express");
const router = express.Router();

const {
  getProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  deleteExistingProject
} = require("../controllers/projectController");

const validate = require("../middleware/validate");
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator
} = require("../validators/projectValidator");

// GET /api/projects - Retrieve all projects
router.get("/", getProjects);

// GET /api/projects/:id - Retrieve single project by ID
router.get("/:id", validate(projectIdParamValidator), getProject);

// POST /api/projects - Create new project
router.post("/", validate(createProjectValidator), createNewProject);

// PUT /api/projects/:id - Update project by ID
router.put("/:id", validate(updateProjectValidator), updateExistingProject);

// DELETE /api/projects/:id - Delete project by ID
router.delete("/:id", validate(projectIdParamValidator), deleteExistingProject);

module.exports = router;
