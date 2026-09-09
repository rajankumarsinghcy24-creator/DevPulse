const express = require("express");
const router = express.Router();

const {
  getProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  deleteExistingProject
} = require("../controllers/projectController");

const {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator
} = require("../validators/projectValidator");

const validate = require("../middleware/validate");

// GET /api/projects - List all projects
router.get("/", getProjects);

// GET /api/projects/:id - Get specific project
router.get("/:id", projectIdParamValidator, validate, getProject);

// POST /api/projects - Create new project
router.post("/", createProjectValidator, validate, createNewProject);

// PUT /api/projects/:id - Update existing project
router.put("/:id", updateProjectValidator, validate, updateExistingProject);

// DELETE /api/projects/:id - Delete project
router.delete("/:id", projectIdParamValidator, validate, deleteExistingProject);

module.exports = router;
