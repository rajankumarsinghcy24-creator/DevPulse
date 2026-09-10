const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

/**
 * @route   GET /api/projects
 * @desc    Retrieve all projects (supports ?status= and ?ownerId= filters)
 * @access  Public
 */
const getProjects = async (req, res, next) => {
  try {
    const { status, ownerId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Retrieve a single project by ID with its owner and tasks
 * @access  Public
 */
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            assignedTo: true,
            dueDate: true,
            createdAt: true
          }
        }
      }
    });

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
const createNewProject = async (req, res, next) => {
  try {
    const { name, description, ownerId, status } = req.body;

    // Verify referenced owner exists -> 400 Bad Request
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      return next(
        new ApiError(`Referenced ownerId '${ownerId}' does not exist.`, 400, [
          { field: "ownerId", message: "User does not exist", value: ownerId }
        ])
      );
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId,
        status: status || "active"
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

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
const updateExistingProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    const { name, description, ownerId, status } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    if (ownerId && ownerId !== existingProject.ownerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { id: ownerId }
      });
      if (!ownerExists) {
        return next(
          new ApiError(`Referenced ownerId '${ownerId}' does not exist.`, 400, [
            { field: "ownerId", message: "User does not exist", value: ownerId }
          ])
        );
      }
      updateData.ownerId = ownerId;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedProject
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
const deleteExistingProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    await prisma.project.delete({
      where: { id }
    });

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
