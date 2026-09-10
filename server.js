const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = require("./src/app");
const prisma = require("./src/config/prisma");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log("====================================================");
  console.log(`🚀 DevPulse Persistent Data Layer (PostgreSQL) running in [${NODE_ENV}] mode`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health & DB check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`);
  console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
  console.log("====================================================");
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Gracefully shutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("👋 Disconnected from PostgreSQL. Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
