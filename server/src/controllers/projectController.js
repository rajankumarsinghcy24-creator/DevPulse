const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Calculates task status counts, overdue tasks, and completion progress percentage.
 */
const calculateProjectStats = (tasks = []) => {
  const total = tasks.length;
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let overdue = 0;
  const now = new Date();

  for (const t of tasks) {
    const st = t.status === "in_progress" ? "in-progress" : t.status;
    if (st === "done") {
      done++;
    } else if (st === "in-progress") {
      inProgress++;
      if (t.dueDate && new Date(t.dueDate) < now) overdue++;
    } else {
      todo++;
      if (t.dueDate && new Date(t.dueDate) < now) overdue++;
    }
  }

  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    total,
    todo,
    inProgress,
    done,
    overdue,
    progress
  };
};

/**
 * @route   GET /api/projects
 * @desc    Retrieve all accessible projects with task counts & progress
 * @access  Private (Authenticated)
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
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true
          }
        }
      }
    });

    const formattedProjects = projects.map((p) => {
      const stats = calculateProjectStats(p.tasks);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        ownerId: p.ownerId,
        owner: p.owner,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        stats: {
          totalTasks: stats.total,
          completedTasks: stats.done,
          progress: stats.progress
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProjects.length,
      data: formattedProjects
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Retrieve project details, owner, task breakdown, stats & recent activity
 * @access  Private (Authenticated)
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
          orderBy: { createdAt: "desc" },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    const stats = calculateProjectStats(project.tasks);

    // Format task statuses for API consistency
    const formattedTasks = project.tasks.map((t) => ({
      ...t,
      status: t.status === "in_progress" ? "in-progress" : t.status
    }));

    return res.status(200).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        ownerId: project.ownerId,
        owner: project.owner,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats,
        tasks: formattedTasks,
        activities: project.activities
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/projects
 * @desc    Create a new project (ownerId set to current authenticated user)
 * @access  Private (Authenticated)
 */
const createNewProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    // Security: ownerId is strictly derived from the authenticated user token
    const ownerId = req.user.id;

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

    // Create Activity Record
    await prisma.activity.create({
      data: {
        action: "PROJECT_CREATED",
        details: `Created project "${newProject.name}"`,
        userId: req.user.id,
        projectId: newProject.id
      }
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: newProject
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update an existing project (owner authorization enforced)
 * @access  Private (Authenticated)
 */
const updateExistingProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check if project exists -> 404
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    // 2. Authorization check: only project owner can edit -> 403
    if (existingProject.ownerId !== req.user.id) {
      return next(new ApiError("Forbidden. You are not authorized to modify this project.", 403));
    }

    const { name, description, status } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

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

    // Create Activity Record
    await prisma.activity.create({
      data: {
        action: "PROJECT_UPDATED",
        details: `Updated project "${updatedProject.name}"`,
        userId: req.user.id,
        projectId: updatedProject.id
      }
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete an existing project (owner authorization enforced)
 * @access  Private (Authenticated)
 */
const deleteExistingProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check if project exists -> 404
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return next(new ApiError(`Project with ID '${id}' not found.`, 404));
    }

    // 2. Authorization check: only project owner can delete -> 403
    if (existingProject.ownerId !== req.user.id) {
      return next(new ApiError("Forbidden. You are not authorized to delete this project.", 403));
    }

    // 3. Cascading delete handled by Prisma schema (deletes linked tasks & activities)
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
