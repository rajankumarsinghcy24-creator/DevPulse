const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const { errorHandler, ApiError } = require("./middleware/errorHandler");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// ==================== CORE MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROOT / HEALTH ROUTES ====================
app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse Persistent Data Layer API (Week 3 / Task 3 - PostgreSQL & Prisma) is running.",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      projects: "/api/projects",
      tasks: "/api/tasks",
      health: "/api/health"
    }
  });
});

// GET /api/health - Database connectivity and service health
app.get("/api/health", async (req, res) => {
  let dbStatus = "disconnected";
  let errorMsg = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "disconnected";
    errorMsg = err.message;
  }

  res.status(200).json({
    success: true,
    status: dbStatus === "connected" ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      provider: "postgresql",
      status: dbStatus,
      ...(errorMsg && { error: errorMsg })
    }
  });
});

// ==================== ROUTE MOUNTS ====================
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// ==================== 404 FALLBACK ====================
app.use((req, res, next) => {
  next(new ApiError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`, 404));
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use(errorHandler);

module.exports = app;
