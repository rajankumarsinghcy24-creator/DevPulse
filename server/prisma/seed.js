/**
 * DevPulse Capstone Task 4 - Prisma Database Seed Script
 *
 * Populates PostgreSQL (Neon) with realistic developer productivity sample data:
 * - 4 Users with bcrypt-hashed passwords (never plain text)
 * - 3 Relational Projects with valid owners
 * - 6 Relational Tasks with valid assignees, priorities, and statuses
 * - 4 Sample Activity audit log entries
 *
 * Designed to be non-destructive and idempotent via upsert.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Prisma Seed] Starting DevPulse Capstone database seeding...");

  // Generate secure bcrypt hash for seed users
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = "Password123!";
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  console.log("🔑 [1/4] Generated secure bcrypt password hash for seed accounts.");

  // 1. Seed Users (idempotent upsert by unique email)
  console.log("👥 [2/4] Upserting users...");
  const userAlex = await prisma.user.upsert({
    where: { email: "alex.rivera@devpulse.io" },
    update: { passwordHash, role: "developer" },
    create: {
      name: "Alex Rivera",
      email: "alex.rivera@devpulse.io",
      passwordHash,
      role: "developer"
    }
  });

  const userSophia = await prisma.user.upsert({
    where: { email: "sophia.chen@devpulse.io" },
    update: { passwordHash, role: "designer" },
    create: {
      name: "Sophia Chen",
      email: "sophia.chen@devpulse.io",
      passwordHash,
      role: "designer"
    }
  });

  const userMarcus = await prisma.user.upsert({
    where: { email: "marcus.vance@devpulse.io" },
    update: { passwordHash, role: "manager" },
    create: {
      name: "Marcus Vance",
      email: "marcus.vance@devpulse.io",
      passwordHash,
      role: "manager"
    }
  });

  const userElena = await prisma.user.upsert({
    where: { email: "elena.rostova@devpulse.io" },
    update: { passwordHash, role: "developer" },
    create: {
      name: "Elena Rostova",
      email: "elena.rostova@devpulse.io",
      passwordHash,
      role: "developer"
    }
  });

  console.log(`   ✅ Users ready: ${userAlex.name}, ${userSophia.name}, ${userMarcus.name}, ${userElena.name}`);

  // 2. Seed Projects
  console.log("📁 [3/4] Seeding projects...");
  let projectDashboard = await prisma.project.findFirst({
    where: { name: "DevPulse Dashboard V2", ownerId: userMarcus.id }
  });
  if (!projectDashboard) {
    projectDashboard = await prisma.project.create({
      data: {
        name: "DevPulse Dashboard V2",
        description: "Next-generation developer productivity metrics dashboard and analytics pipeline.",
        ownerId: userMarcus.id,
        status: "active"
      }
    });
  }

  let projectAI = await prisma.project.findFirst({
    where: { name: "AI Sprint Velocity Engine", ownerId: userMarcus.id }
  });
  if (!projectAI) {
    projectAI = await prisma.project.create({
      data: {
        name: "AI Sprint Velocity Engine",
        description: "Automated intelligent task breakdown and effort estimation using LLM orchestration.",
        ownerId: userMarcus.id,
        status: "active"
      }
    });
  }

  let projectCloud = await prisma.project.findFirst({
    where: { name: "Cloud Microservices Migration", ownerId: userSophia.id }
  });
  if (!projectCloud) {
    projectCloud = await prisma.project.create({
      data: {
        name: "Cloud Microservices Migration",
        description: "Decomposing legacy backend services into serverless containerized microservices.",
        ownerId: userSophia.id,
        status: "completed"
      }
    });
  }

  console.log(`   ✅ Projects ready: '${projectDashboard.name}', '${projectAI.name}', '${projectCloud.name}'`);

  // 3. Seed Tasks
  console.log("📋 [4/4] Seeding tasks...");
  const sampleTasks = [
    {
      title: "Build AI Task Generator REST Endpoint",
      description: "Implement POST /api/ai/generate-tasks integrating Google Gemini API with response validation.",
      projectId: projectAI.id,
      assignedTo: userAlex.id,
      priority: "high",
      status: "in_progress",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: "Design Responsive Project & Task Management UI",
      description: "Create modern Tailwind CSS layouts for Project Overview, Kanban Task board, and Dashboard.",
      projectId: projectDashboard.id,
      assignedTo: userSophia.id,
      priority: "medium",
      status: "done",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      title: "Implement JWT & HTTP-Only Cookie Authentication",
      description: "Setup bcrypt password hashing, token issue on login/register, and verify middleware.",
      projectId: projectAI.id,
      assignedTo: userElena.id,
      priority: "high",
      status: "done",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      title: "Configure Prisma Schema & PostgreSQL Relations",
      description: "Establish referential integrity between Users, Projects, Tasks, and Activities.",
      projectId: projectCloud.id,
      assignedTo: userAlex.id,
      priority: "high",
      status: "done",
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      title: "Create Automated End-to-End API Test Suite",
      description: "Write comprehensive unit and integration tests covering auth, CRUD, validation, and AI failures.",
      projectId: projectAI.id,
      assignedTo: userElena.id,
      priority: "medium",
      status: "todo",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    },
    {
      title: "Deploy Client to Vercel and Server to Render",
      description: "Configure production environment variables, CORS headers, and deployment documentation.",
      projectId: projectDashboard.id,
      assignedTo: userMarcus.id,
      priority: "low",
      status: "todo",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const t of sampleTasks) {
    const existing = await prisma.task.findFirst({
      where: { title: t.title, projectId: t.projectId }
    });
    if (!existing) {
      const created = await prisma.task.create({ data: t });
      // Create initial activity log
      await prisma.activity.create({
        data: {
          action: "TASK_CREATED",
          details: `Created task "${t.title}" with priority ${t.priority}`,
          userId: t.assignedTo || userMarcus.id,
          projectId: t.projectId,
          taskId: created.id
        }
      });
    }
  }

  console.log("   ✅ Seed tasks & activities populated successfully.");
  console.log("\n✨ [Prisma Seed] Seeding completed! Default password for seeded accounts is: Password123!");
}

main()
  .catch((e) => {
    console.error("❌ [Prisma Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
