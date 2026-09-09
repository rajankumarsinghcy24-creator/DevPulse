/**
 * DevPulse Mock In-Memory Data Store
 *
 * Provides thread-safe, synchronous in-memory persistence for Users,
 * Projects, and Tasks. Pre-seeded with realistic DevPulse productivity data.
 *
 * Note: Persistent database integration (MongoDB/PostgreSQL) is scheduled for Week 3.
 */

const initialUsers = [
  {
    id: "usr_1",
    name: "Alex Rivera",
    email: "alex.rivera@devpulse.io",
    role: "developer"
  },
  {
    id: "usr_2",
    name: "Sophia Chen",
    email: "sophia.chen@devpulse.io",
    role: "designer"
  },
  {
    id: "usr_3",
    name: "Marcus Vance",
    email: "marcus.vance@devpulse.io",
    role: "manager"
  },
  {
    id: "usr_4",
    name: "Elena Rostova",
    email: "elena.rostova@devpulse.io",
    role: "developer"
  }
];

const initialProjects = [
  {
    id: "prj_1",
    name: "DevPulse Dashboard V2",
    description: "Next-generation developer productivity metrics dashboard and analytics pipeline.",
    ownerId: "usr_3",
    status: "active",
    createdAt: "2026-08-01T09:00:00.000Z"
  },
  {
    id: "prj_2",
    name: "Cloud Telemetry Microservice",
    description: "Distributed latency monitoring and telemetry tracing agent for engineering teams.",
    ownerId: "usr_3",
    status: "active",
    createdAt: "2026-08-15T10:30:00.000Z"
  },
  {
    id: "prj_3",
    name: "Legacy Auth Migration",
    description: "Migration of legacy OAuth 1.0 credentials to unified OIDC/JWT authentication.",
    ownerId: "usr_3",
    status: "completed",
    createdAt: "2026-07-10T14:00:00.000Z"
  }
];

const initialTasks = [
  {
    id: "tsk_1",
    title: "Design Component Design Tokens",
    description: "Audit color palettes, typography scale, and dark mode contrast ratios.",
    projectId: "prj_1",
    assignedTo: "usr_2",
    priority: "high",
    status: "done",
    dueDate: "2026-09-15T00:00:00.000Z",
    createdAt: "2026-08-02T11:00:00.000Z",
    updatedAt: "2026-08-10T16:00:00.000Z"
  },
  {
    id: "tsk_2",
    title: "Implement REST Endpoint Routing",
    description: "Set up Express routers for users, projects, and tasks with error middleware.",
    projectId: "prj_1",
    assignedTo: "usr_1",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-09-20T00:00:00.000Z",
    createdAt: "2026-08-05T09:30:00.000Z",
    updatedAt: "2026-08-12T14:15:00.000Z"
  },
  {
    id: "tsk_3",
    title: "Add Query Parameter Filtering",
    description: "Support filtering tasks by projectId, assignedTo, and status query parameters.",
    projectId: "prj_1",
    assignedTo: "usr_4",
    priority: "medium",
    status: "todo",
    dueDate: "2026-09-25T00:00:00.000Z",
    createdAt: "2026-08-06T13:45:00.000Z",
    updatedAt: "2026-08-06T13:45:00.000Z"
  },
  {
    id: "tsk_4",
    title: "Setup OpenTelemetry Collector",
    description: "Configure collector pipelines to ingest trace spans and metric counters.",
    projectId: "prj_2",
    assignedTo: "usr_1",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-09-28T00:00:00.000Z",
    createdAt: "2026-08-16T08:00:00.000Z",
    updatedAt: "2026-08-18T17:20:00.000Z"
  },
  {
    id: "tsk_5",
    title: "Deprecate OAuth 1.0 Tokens",
    description: "Revoke inactive tokens and archive old credentials securely.",
    projectId: "prj_3",
    assignedTo: "usr_4",
    priority: "low",
    status: "done",
    dueDate: "2026-08-30T00:00:00.000Z",
    createdAt: "2026-07-12T10:00:00.000Z",
    updatedAt: "2026-07-25T12:00:00.000Z"
  }
];

let users = JSON.parse(JSON.stringify(initialUsers));
let projects = JSON.parse(JSON.stringify(initialProjects));
let tasks = JSON.parse(JSON.stringify(initialTasks));

let userIdCounter = 5;
let projectIdCounter = 4;
let taskIdCounter = 6;

// ==================== USER REPOSITORY ====================

const getAllUsers = () => [...users];

const getUserById = (id) => users.find((u) => u.id === id) || null;

const getUserByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;

const createUser = ({ name, email, role }) => {
  const newUser = {
    id: `usr_${userIdCounter++}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role
  };
  users.push(newUser);
  return { ...newUser };
};

const updateUser = (id, updates) => {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const current = users[index];
  const updatedUser = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    email: updates.email !== undefined ? updates.email.toLowerCase().trim() : current.email,
    role: updates.role !== undefined ? updates.role : current.role
  };

  users[index] = updatedUser;
  return { ...updatedUser };
};

const deleteUser = (id) => {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

// ==================== PROJECT REPOSITORY ====================

const getAllProjects = () => [...projects];

const getProjectById = (id) => projects.find((p) => p.id === id) || null;

const createProject = ({ name, description, ownerId, status = "active" }) => {
  const newProject = {
    id: `prj_${projectIdCounter++}`,
    name: name.trim(),
    description: description.trim(),
    ownerId,
    status,
    createdAt: new Date().toISOString()
  };
  projects.push(newProject);
  return { ...newProject };
};

const updateProject = (id, updates) => {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = projects[index];
  const updatedProject = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    description: updates.description !== undefined ? updates.description.trim() : current.description,
    ownerId: updates.ownerId !== undefined ? updates.ownerId : current.ownerId,
    status: updates.status !== undefined ? updates.status : current.status
  };

  projects[index] = updatedProject;
  return { ...updatedProject };
};

const deleteProject = (id) => {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
};

// ==================== TASK REPOSITORY ====================

const getAllTasks = (filters = {}) => {
  let filtered = [...tasks];

  if (filters.projectId) {
    filtered = filtered.filter((t) => t.projectId === filters.projectId);
  }
  if (filters.assignedTo) {
    filtered = filtered.filter((t) => t.assignedTo === filters.assignedTo);
  }
  if (filters.status) {
    filtered = filtered.filter((t) => t.status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }

  return filtered;
};

const getTaskById = (id) => tasks.find((t) => t.id === id) || null;

const createTask = ({
  title,
  description,
  projectId,
  assignedTo,
  priority = "medium",
  status = "todo",
  dueDate = null
}) => {
  const now = new Date().toISOString();
  const newTask = {
    id: `tsk_${taskIdCounter++}`,
    title: title.trim(),
    description: description.trim(),
    projectId,
    assignedTo,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    createdAt: now,
    updatedAt: now
  };
  tasks.push(newTask);
  return { ...newTask };
};

const updateTask = (id, updates) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = tasks[index];
  const now = new Date().toISOString();

  const updatedTask = {
    ...current,
    title: updates.title !== undefined ? updates.title.trim() : current.title,
    description: updates.description !== undefined ? updates.description.trim() : current.description,
    projectId: updates.projectId !== undefined ? updates.projectId : current.projectId,
    assignedTo: updates.assignedTo !== undefined ? updates.assignedTo : current.assignedTo,
    priority: updates.priority !== undefined ? updates.priority : current.priority,
    status: updates.status !== undefined ? updates.status : current.status,
    dueDate: updates.dueDate !== undefined ? (updates.dueDate ? new Date(updates.dueDate).toISOString() : null) : current.dueDate,
    updatedAt: now
  };

  tasks[index] = updatedTask;
  return { ...updatedTask };
};

const updateTaskStatus = (id, status) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = tasks[index];
  const now = new Date().toISOString();

  const updatedTask = {
    ...current,
    status,
    updatedAt: now
  };

  tasks[index] = updatedTask;
  return { ...updatedTask };
};

const deleteTask = (id) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
};

// Reset function (primarily for automated testing)
const resetData = () => {
  users = JSON.parse(JSON.stringify(initialUsers));
  projects = JSON.parse(JSON.stringify(initialProjects));
  tasks = JSON.parse(JSON.stringify(initialTasks));
  userIdCounter = 5;
  projectIdCounter = 4;
  taskIdCounter = 6;
};

module.exports = {
  // Users
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,

  // Projects
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,

  // Tasks
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,

  // Utilities
  resetData
};
