const prisma = require("../config/prisma");
const aiService = require("../services/aiService");
const { ApiError } = require("../middleware/errorHandler");

/**
 * POST /api/ai/generate-tasks
 * Generates structured task suggestions for a project using the configured AI provider.
 * NOTE: Tasks are NOT automatically inserted into the database. They are suggestions
 * returned for the client to review, customize, and explicitly save.
 */
const generateTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      projectId,
      projectName,
      projectDescription,
      goals,
      additionalInstructions,
      taskCount
    } = req.body;

    // 1. Verify that the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return next(new ApiError(`Project with ID '${projectId}' not found.`, 404));
    }

    // 2. Verify authorization (owner or assigned collaborator)
    const isOwner = project.ownerId === userId;
    let isCollaborator = false;
    if (!isOwner) {
      const assignedTask = await prisma.task.findFirst({
        where: {
          projectId,
          assignedTo: userId
        }
      });
      isCollaborator = Boolean(assignedTask);
    }

    if (!isOwner && !isCollaborator) {
      return next(
        new ApiError("Forbidden: You do not have permission to generate tasks for this project.", 403)
      );
    }

    // 3. Call the AI service
    const resolvedProjectName = (projectName && projectName.trim()) || project.name;
    const resolvedDescription =
      (projectDescription && projectDescription.trim()) || project.description || "";
    const resolvedInstructions =
      (additionalInstructions && additionalInstructions.trim()) ||
      (goals && goals.trim()) ||
      "";
    const resolvedCount = taskCount || 5;

    const generatedTasks = await aiService.generateTasks({
      projectName: resolvedProjectName,
      projectDescription: resolvedDescription,
      additionalInstructions: resolvedInstructions,
      taskCount: resolvedCount
    });

    // 4. Log the AI task generation activity
    try {
      await prisma.activity.create({
        data: {
          action: "AI_TASKS_GENERATED",
          details: `Generated ${generatedTasks.length} task suggestions using AI for project '${project.name}'`,
          userId,
          projectId: project.id
        }
      });
    } catch (activityErr) {
      console.warn("Could not log AI generation activity:", activityErr.message);
    }

    // 5. Return structured suggestions (NOT persisted to Task table)
    return res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedTasks.length} task suggestions.`,
      data: {
        projectId: project.id,
        projectName: project.name,
        taskCount: generatedTasks.length,
        tasks: generatedTasks
      }
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  generateTasks
};
