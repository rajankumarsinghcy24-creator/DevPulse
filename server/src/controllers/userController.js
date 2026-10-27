const prisma = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");

// Common safe selection fields to completely exclude sensitive fields (like passwordHash)
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

/**
 * @route   GET /api/users
 * @desc    Retrieve all users (supports ?role= filter)
 * @access  Private
 */
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        ...SAFE_USER_SELECT,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Retrieve a single user by ID with associated projects and tasks
 * @access  Private
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SAFE_USER_SELECT,
        ownedProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            projectId: true
          }
        }
      }
    });

    if (!user) {
      return next(new ApiError(`User with ID '${id}' not found.`, 404));
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/users
 * @desc    Create a new user (admin / management)
 * @access  Private
 */
const createNewUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email -> 409 Conflict
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return next(
        new ApiError(`User with email '${email}' already exists.`, 409, [
          { field: "email", message: "Email is already registered", value: email }
        ])
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: role || "developer",
        passwordHash: ""
      },
      select: SAFE_USER_SELECT
    });

    return res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update an existing user
 * @access  Private
 */
const updateExistingUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return next(new ApiError(`User with ID '${id}' not found.`, 404));
    }

    const { name, email, role } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;

    if (email && email.toLowerCase().trim() !== existingUser.email.toLowerCase().trim()) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (emailConflict && emailConflict.id !== id) {
        return next(
          new ApiError(`User with email '${email}' already exists.`, 409, [
            { field: "email", message: "Email is already registered by another user", value: email }
          ])
        );
      }
      updateData.email = email.toLowerCase().trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT
    });

    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete an existing user
 * @access  Private
 */
const deleteExistingUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return next(new ApiError(`User with ID '${id}' not found.`, 404));
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser
};
