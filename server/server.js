const path = require("path");
const dotenv = require("dotenv");

// Explicitly load .env from the server directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");
const prisma = require("./src/config/prisma");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log("====================================================");
  console.log(`🚀 DevPulse Capstone Task 4 Server running in [${NODE_ENV}] mode`);
  console.log(`📡 Backend URL: http://localhost:${PORT}`);
  console.log(`🩺 Health & AI Check: http://localhost:${PORT}/api/health`);
  console.log("====================================================");
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Gracefully shutting down server...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("👋 Disconnected from PostgreSQL. Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
