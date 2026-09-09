const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require("../data/mockData");
const { ApiError } = require("../middleware/errorHandler");

/**
 * @route   GET /api/tasks
 * @desc    Retrieve all tasks (supports query filtering by projectId, assignedTo, status, priority)
 * @access  Public
 */
const getTasks = (req, res, next) => {
  try {
    const { projectId, assignedTo, status, priority } = req.query;
    const tasks = getAllTasks({ projectId, assignedTo, status, priority });

    return res.status(200).json({
      success: true,
      data: tasks
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
const getTask = (req, res, next) => {
  try {
    const { id } = req.params;
    const task = getTaskById(id);

    if (!task) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    return res.status(200).json({
      success: true,
      data: task
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
const createNewTask = (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;
    const newTask = createTask({
      title,
      description,
      projectId,
      assignedTo,
      priority,
      status,
      dueDate
    });

    return res.status(201).json({
      success: true,
      data: newTask
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an entire task
 * @access  Public
 */
const updateExistingTask = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingTask = getTaskById(id);

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;
    const updated = updateTask(id, {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      status,
      dueDate
    });

    return res.status(200).json({
      success: true,
      data: updated
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
const patchTaskStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingTask = getTaskById(id);

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    const { status } = req.body;
    const updated = updateTaskStatus(id, status);

    return res.status(200).json({
      success: true,
      data: updated
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
const deleteExistingTask = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingTask = getTaskById(id);

    if (!existingTask) {
      return next(new ApiError(`Task with ID '${id}' not found.`, 404));
    }

    deleteTask(id);
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
