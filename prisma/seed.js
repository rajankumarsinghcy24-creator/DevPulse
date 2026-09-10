/**
 * DevPulse Week 3 / Task 3 - Prisma Database Seed Script
 *
 * Populates PostgreSQL with realistic developer productivity sample data:
 * - 4 Users across engineering roles (developer, designer, manager)
 * - 3 Projects with foreign-key relations to owners
 * - 6 Tasks with foreign-key relations to projects and assignees
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Prisma Seed] Starting DevPulse PostgreSQL database seeding...");

  // 1. Clean existing records in reverse relational order (tasks -> projects -> users)
  console.log("🧹 [1/4] Cleaning existing records...");
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Users
  console.log("👥 [2/4] Seeding users...");
  const userAlex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex.rivera@devpulse.io",
      role: "developer"
    }
  });

  const userSophia = await prisma.user.create({
    data: {
      name: "Sophia Chen",
      email: "sophia.chen@devpulse.io",
      role: "designer"
    }
  });

  const userMarcus = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: "marcus.vance@devpulse.io",
      role: "manager"
    }
  });

  const userElena = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "elena.rostova@devpulse.io",
      role: "developer"
    }
  });

  console.log(`   ✅ Created 4 users: ${userAlex.name}, ${userSophia.name}, ${userMarcus.name}, ${userElena.name}`);

  // 3. Seed Projects
  console.log("📁 [3/4] Seeding projects...");
  const projectDashboard = await prisma.project.create({
    data: {
      name: "DevPulse Dashboard V2",
      description: "Next-generation developer productivity metrics dashboard and analytics pipeline.",
      ownerId: userMarcus.id,
      status: "active"
    }
  });

  const projectMigration = await prisma.project.create({
    data: {
      name: "Mobile Microservices Migration",
      description: "Decomposing legacy backend monolith into scalable microservices architecture.",
      ownerId: userMarcus.id,
      status: "active"
    }
  });

  const projectWarehouse = await prisma.project.create({
    data: {
      name: "Cloud Data Warehouse Integration",
      description: "Automated aggregation pipeline synchronizing git metrics and sprint velocity into Snowflake.",
      ownerId: userSophia.id,
      status: "completed"
    }
  });

  console.log(`   ✅ Created 3 projects: '${projectDashboard.name}', '${projectMigration.name}', '${projectWarehouse.name}'`);

  // 4. Seed Tasks
  console.log("📋 [4/4] Seeding tasks...");
  const task1 = await prisma.task.create({
    data: {
      title: "Setup PostgreSQL Schema & Prisma Relations",
      description: "Define relational models, foreign keys, and indexes for persistent data layer.",
      projectId: projectDashboard.id,
      assignedTo: userAlex.id,
      priority: "high",
      status: "in_progress",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Design Developer Velocity Metrics UI",
      description: "Create responsive dashboard mockups in Figma for team cycle time and throughput charts.",
      projectId: projectDashboard.id,
      assignedTo: userSophia.id,
      priority: "medium",
      status: "done",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Optimize Relational Queries & Database Connection Pool",
      description: "Profile Prisma queries, configure connection pooling, and verify foreign key cascading.",
      projectId: projectDashboard.id,
      assignedTo: userElena.id,
      priority: "high",
      status: "todo",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Dockerize Backend Microservices",
      description: "Create multi-stage Dockerfiles and docker-compose configurations for developer environments.",
      projectId: projectMigration.id,
      assignedTo: userAlex.id,
      priority: "medium",
      status: "in_progress",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    }
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Configure Automated CI/CD Regression Test Pipeline",
      description: "Integrate GitHub Actions workflow with automated unit tests and Prisma schema validation.",
      projectId: projectMigration.id,
      assignedTo: userElena.id,
      priority: "low",
      status: "todo",
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
    }
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Customer Analytics Data Export Script",
      description: "Implement idempotent batch ETL script to export sprint velocity snapshots into warehouse.",
      projectId: projectWarehouse.id,
      assignedTo: userMarcus.id,
      priority: "medium",
      status: "done",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  });

  console.log(`   ✅ Created 6 relational tasks successfully.`);
  console.log("\n✨ [Prisma Seed] DevPulse database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ [Prisma Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
