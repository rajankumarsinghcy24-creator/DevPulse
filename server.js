const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log("====================================================");
  console.log(`🚀 DevPulse REST API server running in [${NODE_ENV}] mode`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`);
  console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
  console.log("====================================================");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

module.exports = server;
