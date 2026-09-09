const {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
} = require("../data/mockData");
const { ApiError } = require("../middleware/errorHandler");

/**
 * @route   GET /api/users
 * @desc    Retrieve all users
 * @access  Public
 */
const getUsers = (req, res, next) => {
  try {
    const users = getAllUsers();
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Retrieve a single user by ID
 * @access  Public
 */
const getUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const user = getUserById(id);

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
 * @desc    Create a new user
 * @access  Public
 */
const createNewUser = (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    // Check for duplicate email -> 409 Conflict
    const existing = getUserByEmail(email);
    if (existing) {
      return next(
        new ApiError(`User with email '${email}' already exists.`, 409, [
          { field: "email", message: "Email is already registered", value: email }
        ])
      );
    }

    const newUser = createUser({ name, email, role });
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
 * @access  Public
 */
const updateExistingUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = getUserById(id);

    if (!existingUser) {
      return next(new ApiError(`User with ID '${id}' not found.`, 404));
    }

    const { name, email, role } = req.body;

    // Check if new email is taken by another user
    if (email && email.toLowerCase().trim() !== existingUser.email.toLowerCase().trim()) {
      const emailConflict = getUserByEmail(email);
      if (emailConflict && emailConflict.id !== id) {
        return next(
          new ApiError(`User with email '${email}' already exists.`, 409, [
            { field: "email", message: "Email is already registered by another user", value: email }
          ])
        );
      }
    }

    const updatedUser = updateUser(id, { name, email, role });
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
 * @access  Public
 */
const deleteExistingUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = getUserById(id);

    if (!existingUser) {
      return next(new ApiError(`User with ID '${id}' not found.`, 404));
    }

    deleteUser(id);
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
