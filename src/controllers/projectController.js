const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require("../data/mockData");
const { ApiError } = require("../middleware/errorHandler");

/**
 * @route   GET /api/projects
 * @desc    Retrieve all projects
 * @access  Public
 */
const getProjects = (req, res, next) => {
  try {
    const projects = getAllProjects();
    return res.status(200).json({
      success: true,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Retrieve a single project by ID
 * @access  Public
 */
const getProject = (req, res, next) => {
  try {
    const { id } = req.params;
    const project = getProjectById(id);

    if (!project) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Public
 */
const createNewProject = (req, res, next) => {
  try {
    const { name, description, ownerId, status } = req.body;
    const newProject = createProject({ name, description, ownerId, status });

    return res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update an existing project
 * @access  Public
 */
const updateExistingProject = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingProject = getProjectById(id);

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    const { name, description, ownerId, status } = req.body;
    const updated = updateProject(id, { name, description, ownerId, status });

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete an existing project
 * @access  Public
 */
const deleteExistingProject = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingProject = getProjectById(id);

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    deleteProject(id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  deleteExistingProject
};
