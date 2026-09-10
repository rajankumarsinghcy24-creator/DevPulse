const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

// Helper to normalize enum values between API ("in-progress") and Prisma ("in_progress")
const normalizeStatus = (status) => {
  if (!status) return undefined;
  return status === "in-progress" ? "in_progress" : status;
};

// Helper to format task object for client response
const formatTask = (task) => {
  if (!task) return task;
  return {
    ...task,
    status: task.status === "in_progress" ? "in-progress" : task.status
  };
};

/**
 * @route   GET /api/tasks
 * @desc    Retrieve all tasks (supports ?projectId=, ?assignedTo=, ?status=, ?priority= filters)
 * @access  Public
 */
const getTasks = async (req, res, next) => {
  try {
    const { projectId, assignedTo, status, priority } = req.query;
    const where = {};

    if (projectId) where.projectId = projectId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;
    if (status) where.status = normalizeStatus(status);

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
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
      count: tasks.length,
      data: tasks.map(formatTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/tasks/:id
 * @desc    Retrieve a single task by ID
 * @access  Public
 */
const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!task) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    return res.status(200).json({
      success: true,
      data: formatTask(task)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Public
 */
const createNewTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    // Verify referenced project exists -> 400 Bad Request
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return next(
        new ApiError(`Referenced projectId '${projectId}' does not exist.`, 400, [
          { field: "projectId", message: "Project does not exist", value: projectId }
        ])
      );
    }

    // Verify assigned user if provided -> 400 Bad Request
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo }
      });
      if (!user) {
        return next(
          new ApiError(`Referenced assignedTo user '${assignedTo}' does not exist.`, 400, [
            { field: "assignedTo", message: "User does not exist", value: assignedTo }
          ])
        );
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId,
        assignedTo: assignedTo || null,
        priority: priority || "medium",
        status: normalizeStatus(status) || "todo",
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
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
      data: formatTask(newTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task
 * @access  Public
 */
const updateExistingTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = normalizeStatus(status);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    if (projectId && projectId !== existingTask.projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return next(
          new ApiError(`Referenced projectId '${projectId}' does not exist.`, 400, [
            { field: "projectId", message: "Project does not exist", value: projectId }
          ])
        );
      }
      updateData.projectId = projectId;
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const user = await prisma.user.findUnique({ where: { id: assignedTo } });
        if (!user) {
          return next(
            new ApiError(`Referenced assignedTo user '${assignedTo}' does not exist.`, 400, [
              { field: "assignedTo", message: "User does not exist", value: assignedTo }
            ])
          );
        }
        updateData.assignedTo = assignedTo;
      } else {
        updateData.assignedTo = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
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
      data: formatTask(updatedTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update only the status of an existing task
 * @access  Public
 */
const patchTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    const { status } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: normalizeStatus(status)
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
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
      data: formatTask(updatedTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete an existing task
 * @access  Public
 */
const deleteExistingTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTask,
  createNewTask,
  updateExistingTask,
  patchTaskStatus,
  deleteExistingTask
};
