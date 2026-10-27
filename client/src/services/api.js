import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Intercept requests to attach Bearer token if stored in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("devpulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get an unauthorized error on a non-auth endpoint, clear stale token
      const isAuthEndpoint = error.config.url.includes("/auth/login") || error.config.url.includes("/auth/register");
      if (!isAuthEndpoint) {
        localStorage.removeItem("devpulse_token");
        localStorage.removeItem("devpulse_user");
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICE ====================
export const authService = {
  login: async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    if (res.data.data?.token) {
      localStorage.setItem("devpulse_token", res.data.data.token);
      localStorage.setItem("devpulse_user", JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    if (res.data.data?.token) {
      localStorage.setItem("devpulse_token", res.data.data.token);
      localStorage.setItem("devpulse_user", JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("devpulse_token");
      localStorage.removeItem("devpulse_user");
    }
  },

  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  }
};

// ==================== USERS SERVICE ====================
export const userService = {
  getUsers: async (params = {}) => {
    const res = await api.get("/users", { params });
    return res.data;
  },

  getUser: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  }
};

// ==================== PROJECTS SERVICE ====================
export const projectService = {
  getProjects: async (params = {}) => {
    const res = await api.get("/projects", { params });
    return res.data;
  },

  getProject: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data) => {
    const res = await api.post("/projects", data);
    return res.data;
  },

  updateProject: async (id, data) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  deleteProject: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  }
};

// ==================== TASKS SERVICE ====================
export const taskService = {
  getTasks: async (params = {}) => {
    const res = await api.get("/tasks", { params });
    return res.data;
  },

  getTask: async (id) => {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (data) => {
    const res = await api.post("/tasks", data);
    return res.data;
  },

  updateTask: async (id, data) => {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },

  patchTaskStatus: async (id, status) => {
    const res = await api.patch(`/tasks/${id}/status`, { status });
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  }
};

// ==================== DASHBOARD SERVICE ====================
export const dashboardService = {
  getDashboard: async (params = {}) => {
    const res = await api.get("/dashboard", { params });
    return res.data;
  },

  getActivities: async (params = {}) => {
    const res = await api.get("/activities", { params });
    return res.data;
  }
};

// ==================== AI SERVICE ====================
export const aiService = {
  generateTasks: async (payload) => {
    const res = await api.post("/ai/generate-tasks", payload);
    return res.data;
  }
};

export default api;
