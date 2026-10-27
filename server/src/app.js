const path = require("path");
const dotenv = require("dotenv");

// Ensure environment variables are loaded with explicit path
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const prisma = require("./config/prisma");
const { errorHandler, ApiError } = require("./middleware/errorHandler");

const app = express();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, tighten in production
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// ==================== CORE MIDDLEWARE ====================
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROOT / HEALTH ROUTES ====================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse Capstone Task 4 - AI-Powered Project & Task Management API is running.",
    version: "1.0.0",
    documentation: "/README.md",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      projects: "/api/projects",
      tasks: "/api/tasks",
      dashboard: "/api/dashboard",
      activities: "/api/activities",
      ai: "/api/ai",
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
    },
    ai: {
      configured: Boolean(process.env.AI_API_KEY && !process.env.AI_API_KEY.includes("your_ai_api_key")),
      provider: process.env.AI_PROVIDER || "gemini"
    }
  });
});

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const activityRoutes = require("./routes/activityRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ==================== ROUTE MOUNTS ====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/ai", aiRoutes);

// ==================== 404 FALLBACK ====================
app.use((req, res, next) => {
  next(new ApiError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`, 404));
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use(errorHandler);

module.exports = app;
