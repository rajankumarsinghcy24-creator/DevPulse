const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

// Helper to normalize enum between API ("in-progress") and Prisma ("in_progress")
const normalizeStatus = (status) => {
  if (!status) return undefined;
  return status === "in-progress" ? "in_progress" : status;
};

// Helper to format task for client response
const formatTask = (task) => {
  if (!task) return task;
  return {
    ...task,
    status: task.status === "in_progress" ? "in-progress" : task.status
  };
};

/**
 * @route   GET /api/tasks
 * @desc    Retrieve all tasks with search & multi-field filtering
 * @access  Private (Authenticated)
 */
const getTasks = async (req, res, next) => {
  try {
    const { search, q, projectId, assignedTo, status, priority, overdue } = req.query;
    const where = {};

    // 1. Text Search across title & description
    const searchTerm = (search || q || "").trim();
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } }
      ];
    }

    // 2. Project Filter
    if (projectId) {
      where.projectId = projectId;
    }

    // 3. Assignee Filter
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // 4. Status Filter
    if (status) {
      where.status = normalizeStatus(status);
    }

    // 5. Priority Filter
    if (priority) {
      where.priority = priority;
    }

    // 6. Overdue Filter
    if (overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "done" };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            ownerId: true
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
 * @desc    Retrieve single task details with project, assignee, and activities
 * @access  Private (Authenticated)
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
            status: true,
            ownerId: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
 * @desc    Create a new task under a project
 * @access  Private (Authenticated)
 */
const createNewTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    // 1. Validate that the referenced project exists -> 404
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return next(new ApiError(`Referenced projectId '${projectId}' not found.`, 404));
    }

    // 2. Authorization: Project owner has permission to create tasks
    if (project.ownerId !== req.user.id) {
      return next(new ApiError("Forbidden. You are not authorized to manage tasks in this project.", 403));
    }

    // 3. Validate assigned user if provided -> 400
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

    // 4. Create Task
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

    // 5. Activity Logging
    await prisma.activity.create({
      data: {
        action: "TASK_CREATED",
        details: `Created task "${newTask.title}" with priority ${newTask.priority}`,
        userId: req.user.id,
        projectId: newTask.projectId,
        taskId: newTask.id
      }
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: formatTask(newTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task
 * @access  Private (Authenticated)
 */
const updateExistingTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Verify task exists -> 404
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    // 2. Authorization: Project owner or task assignee can update
    const isOwner = existingTask.project.ownerId === req.user.id;
    const isAssignee = existingTask.assignedTo === req.user.id;
    if (!isOwner && !isAssignee) {
      return next(new ApiError("Forbidden. You are not authorized to update this task.", 403));
    }

    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = normalizeStatus(status);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Validate project change if provided
    if (projectId && projectId !== existingTask.projectId) {
      const newProj = await prisma.project.findUnique({ where: { id: projectId } });
      if (!newProj) {
        return next(new ApiError(`Referenced projectId '${projectId}' does not exist.`, 400));
      }
      if (newProj.ownerId !== req.user.id) {
        return next(new ApiError("Forbidden. You cannot move task to a project you do not own.", 403));
      }
      updateData.projectId = projectId;
    }

    // Validate assignee change if provided
    let assigneeChanged = false;
    let newAssigneeName = "unassigned";
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
        newAssigneeName = user.name;
      } else {
        updateData.assignedTo = null;
      }
      if (assignedTo !== existingTask.assignedTo) {
        assigneeChanged = true;
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

    // Activity Logging
    if (assigneeChanged) {
      await prisma.activity.create({
        data: {
          action: "TASK_ASSIGNED",
          details: `Assigned task "${updatedTask.title}" to ${newAssigneeName}`,
          userId: req.user.id,
          projectId: updatedTask.projectId,
          taskId: updatedTask.id
        }
      });
    } else {
      await prisma.activity.create({
        data: {
          action: "TASK_UPDATED",
          details: `Updated task "${updatedTask.title}"`,
          userId: req.user.id,
          projectId: updatedTask.projectId,
          taskId: updatedTask.id
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: formatTask(updatedTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update only task status
 * @access  Private (Authenticated)
 */
const patchTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Verify task exists -> 404
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    // 2. Authorization: Project owner or assigned user can change status
    const isOwner = existingTask.project.ownerId === req.user.id;
    const isAssignee = existingTask.assignedTo === req.user.id;
    if (!isOwner && !isAssignee) {
      return next(new ApiError("Forbidden. You are not authorized to update this task's status.", 403));
    }

    const { status } = req.body;
    const normalized = normalizeStatus(status);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: normalized
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

    // Activity Logging
    await prisma.activity.create({
      data: {
        action: "TASK_STATUS_CHANGED",
        details: `Changed status of task "${updatedTask.title}" to ${status}`,
        userId: req.user.id,
        projectId: updatedTask.projectId,
        taskId: updatedTask.id
      }
    });

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      data: formatTask(updatedTask)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task (project owner only)
 * @access  Private (Authenticated)
 */
const deleteExistingTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Verify task exists -> 404
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    // 2. Authorization: Only project owner can delete tasks
    if (existingTask.project.ownerId !== req.user.id) {
      return next(new ApiError("Forbidden. You are not authorized to delete this task.", 403));
    }

    // 3. Delete Task (Prisma foreign-key cascades delete to activities)
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
