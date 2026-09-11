const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

/**
 * GET /api/dashboard
 * Returns aggregated statistics and recent activities for the authenticated user.
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activityLimit = req.query.activityLimit ? parseInt(req.query.activityLimit, 10) : 10;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Filter projects accessible to user (owned or collaborator with assigned tasks)
    const accessibleProjectFilter = {
      OR: [
        { ownerId: userId },
        { tasks: { some: { assignedTo: userId } } }
      ]
    };

    // Filter tasks accessible to user (within accessible projects or assigned directly)
    const accessibleTaskFilter = {
      OR: [
        { project: accessibleProjectFilter },
        { assignedTo: userId }
      ]
    };

    // Filter activities relevant to user (created by user or on user's accessible projects)
    const accessibleActivityFilter = {
      OR: [
        { userId: userId },
        { project: accessibleProjectFilter }
      ]
    };

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      archivedProjects,
      ownedProjects,

      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      upcomingTasks,

      myTotalTasks,
      myTodoTasks,
      myInProgressTasks,
      myDoneTasks,
      myOverdueTasks,
      myUpcomingTasks,

      recentActivities
    ] = await prisma.$transaction([
      // Projects
      prisma.project.count({ where: accessibleProjectFilter }),
      prisma.project.count({ where: { ...accessibleProjectFilter, status: "active" } }),
      prisma.project.count({ where: { ...accessibleProjectFilter, status: "completed" } }),
      prisma.project.count({ where: { ...accessibleProjectFilter, status: "archived" } }),
      prisma.project.count({ where: { ownerId: userId } }),

      // Overall Accessible Tasks
      prisma.task.count({ where: accessibleTaskFilter }),
      prisma.task.count({ where: { ...accessibleTaskFilter, status: "todo" } }),
      prisma.task.count({ where: { ...accessibleTaskFilter, status: "in_progress" } }),
      prisma.task.count({ where: { ...accessibleTaskFilter, status: "done" } }),
      prisma.task.count({
        where: {
          ...accessibleTaskFilter,
          status: { not: "done" },
          dueDate: { lt: now }
        }
      }),
      prisma.task.count({
        where: {
          ...accessibleTaskFilter,
          status: { not: "done" },
          dueDate: { gte: now, lte: sevenDaysLater }
        }
      }),

      // Tasks Assigned Specifically to Me
      prisma.task.count({ where: { assignedTo: userId } }),
      prisma.task.count({ where: { assignedTo: userId, status: "todo" } }),
      prisma.task.count({ where: { assignedTo: userId, status: "in_progress" } }),
      prisma.task.count({ where: { assignedTo: userId, status: "done" } }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          status: { not: "done" },
          dueDate: { lt: now }
        }
      }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          status: { not: "done" },
          dueDate: { gte: now, lte: sevenDaysLater }
        }
      }),

      // Recent Activities
      prisma.activity.findMany({
        where: accessibleActivityFilter,
        take: activityLimit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          project: {
            select: { id: true, name: true }
          },
          task: {
            select: { id: true, title: true }
          }
        }
      })
    ]);

    const progressPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const myProgressPercentage = myTotalTasks > 0 ? Math.round((myDoneTasks / myTotalTasks) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          archived: archivedProjects,
          owned: ownedProjects
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          done: doneTasks,
          progressPercentage,
          overdue: overdueTasks,
          upcoming: upcomingTasks,
          byStatus: {
            todo: todoTasks,
            "in-progress": inProgressTasks,
            done: doneTasks
          },
          assignedToMe: {
            total: myTotalTasks,
            todo: myTodoTasks,
            inProgress: myInProgressTasks,
            done: myDoneTasks,
            progressPercentage: myProgressPercentage,
            overdue: myOverdueTasks,
            upcoming: myUpcomingTasks,
            byStatus: {
              todo: myTodoTasks,
              "in-progress": myInProgressTasks,
              done: myDoneTasks
            }
          }
        },
        recentActivities: recentActivities.map((act) => ({
          id: act.id,
          action: act.action,
          details: act.details,
          createdAt: act.createdAt,
          user: act.user,
          project: act.project,
          task: act.task
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/activities
 * Returns paginated list of user-accessible activities with optional project/task filtering.
 */
const getActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const { projectId, taskId } = req.query;

    const accessibleProjectFilter = {
      OR: [
        { ownerId: userId },
        { tasks: { some: { assignedTo: userId } } }
      ]
    };

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          ...accessibleProjectFilter
        }
      });
      if (!project) {
        return next(new ApiError("Project not found or you do not have permission to view its activities.", 404));
      }
    }

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          OR: [
            { project: accessibleProjectFilter },
            { assignedTo: userId }
          ]
        }
      });
      if (!task) {
        return next(new ApiError("Task not found or you do not have permission to view its activities.", 404));
      }
    }

    const where = {
      AND: [
        {
          OR: [
            { userId: userId },
            { project: accessibleProjectFilter }
          ]
        },
        projectId ? { projectId } : {},
        taskId ? { taskId } : {}
      ]
    };

    const [total, activities] = await prisma.$transaction([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          project: {
            select: { id: true, name: true }
          },
          task: {
            select: { id: true, title: true }
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: activities.map((act) => ({
        id: act.id,
        action: act.action,
        details: act.details,
        createdAt: act.createdAt,
        user: act.user,
        project: act.project,
        task: act.task
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getDashboard,
  getActivities
};
