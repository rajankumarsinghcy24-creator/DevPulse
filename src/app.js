const express = require("express");
const cors = require("cors");
const { errorHandler, ApiError } = require("./middleware/errorHandler");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// ==================== CORE MIDDLEWARE ====================
// Enable Cross-Origin Resource Sharing for Week 1 Frontend integration
app.use(cors());

// Parse incoming JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROOT / HEALTH ROUTES ====================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse REST API (Week 2 / Task 2) is running.",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      projects: "/api/projects",
      tasks: "/api/tasks",
      health: "/api/health"
    },
    documentation: "Refer to README.md for full API schema and request examples."
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTE MOUNTS ====================
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// ==================== 404 FALLBACK HANDLER ====================
app.use((req, res, next) => {
  next(new ApiError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`, 404));
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use(errorHandler);

module.exports = app;
