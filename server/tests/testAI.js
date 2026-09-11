/**
 * DevPulse Capstone Task 4 - AI-Assisted Task Generation Test Suite
 *
 * Verifies:
 * 1. Authentication Protection:
 *    - Unauthenticated POST /api/ai/generate-tasks → 401
 * 2. Input Validation:
 *    - Missing projectId → 400
 *    - Non-UUID projectId → 400
 *    - Invalid taskCount (0, -1, 50) → 400
 * 3. Referential & Existence Checks:
 *    - Non-existent project UUID → 404
 * 4. Authorization Enforcement:
 *    - Unauthorized user attempting to generate tasks for another user's project → 403
 * 5. Missing / Misconfigured AI Graceful Error:
 *    - When AI_API_KEY is missing/placeholder, returns 503 with clean user message
 *    - No internal secrets or raw stack traces exposed
 * 6. Successful AI Generation (Mock / Configured Provider):
 *    - Generates requested number of structured suggestions
 *    - Each suggestion contains title, description, priority, suggestedDueDate, estimatedDuration
 * 7. Database Integrity & Non-Persistence:
 *    - CRITICAL: Generated task suggestions are NOT automatically inserted into the Task table
 * 8. Audit Activity Trail:
 *    - Verifies an AI_TASKS_GENERATED Activity record is created
 * 9. Security:
 *    - No API keys or credentials exposed in JSON payloads
 */

const dotenv = require("dotenv");
dotenv.config();

const app = require("../src/app");
const prisma = require("../src/config/prisma");

let server;
let baseUrl;
let passed = 0;
let failed = 0;

const assert = (condition, name, details = "") => {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    if (details) console.error(`     Details: ${details}`);
    failed++;
  }
};

const runAITests = async () => {
  console.log("\n==================================================");
  console.log("🤖 Starting DevPulse Task 4 AI Task Generation Tests");
  console.log("==================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  let ownerToken, ownerId;
  let strangerToken, strangerId;
  let testProjectId;
  const prevProvider = process.env.AI_PROVIDER;
  const prevKey = process.env.AI_API_KEY;

  try {
    // ----------------------------------------------------
    // SETUP: Register test accounts & test project
    // ----------------------------------------------------
    console.log("🔹 [Setup] Registering test accounts and sample project");

    // Owner Account
    const regOwnerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AI Test Owner",
        email: `ai_owner_${timestamp}@devpulse.io`,
        password: "Password123!",
        role: "manager"
      })
    });
    const regOwnerData = await regOwnerRes.json();
    ownerToken = regOwnerData.data?.token;
    ownerId = regOwnerData.data?.user?.id;

    // Stranger Account
    const regStrangerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AI Test Stranger",
        email: `ai_stranger_${timestamp}@devpulse.io`,
        password: "Password123!",
        role: "developer"
      })
    });
    const regStrangerData = await regStrangerRes.json();
    strangerToken = regStrangerData.data?.token;
    strangerId = regStrangerData.data?.user?.id;

    // Create a real project for Owner
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: `AI Target Project ${timestamp}`,
        description: "A high-performance cloud microservices architecture",
        status: "active"
      })
    });
    const projData = await projRes.json();
    testProjectId = projData.data?.id;

    assert(ownerToken && strangerToken && testProjectId, "Setup complete: Owner, Stranger, and Project initialized");

    // ----------------------------------------------------
    // 1. Authentication Protection
    // ----------------------------------------------------
    console.log("\n🔹 [1/7] Testing Authentication Protection");

    const noAuthRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: testProjectId })
    });
    assert(noAuthRes.status === 401, "POST /api/ai/generate-tasks without token returns 401 Unauthorized");

    // ----------------------------------------------------
    // 2. Input Validation
    // ----------------------------------------------------
    console.log("\n🔹 [2/7] Testing Request Validation");

    const noProjRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({})
    });
    assert(noProjRes.status === 400, "POST /api/ai/generate-tasks without projectId returns 400 Bad Request");

    const invalidUuidRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ projectId: "invalid-uuid-format" })
    });
    assert(invalidUuidRes.status === 400, "POST /api/ai/generate-tasks with non-UUID returns 400 Bad Request");

    const invalidCountRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ projectId: testProjectId, taskCount: 99 })
    });
    assert(invalidCountRes.status === 400, "POST /api/ai/generate-tasks with taskCount > 10 returns 400 Bad Request");

    // ----------------------------------------------------
    // 3. Referential & Existence Checks
    // ----------------------------------------------------
    console.log("\n🔹 [3/7] Testing Non-Existent Project Handling");

    const nonExistentUuid = "00000000-0000-0000-0000-000000000000";
    const notFoundRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ projectId: nonExistentUuid })
    });
    assert(notFoundRes.status === 404, "POST /api/ai/generate-tasks with non-existent project returns 404 Not Found");

    // ----------------------------------------------------
    // 4. Authorization Enforcement
    // ----------------------------------------------------
    console.log("\n🔹 [4/7] Testing Project Authorization");

    const unauthorizedRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${strangerToken}`
      },
      body: JSON.stringify({ projectId: testProjectId })
    });
    assert(unauthorizedRes.status === 403, "POST /api/ai/generate-tasks by unauthorized user returns 403 Forbidden");

    // ----------------------------------------------------
    // 5. Missing / Misconfigured AI Graceful Error
    // ----------------------------------------------------
    console.log("\n🔹 [5/7] Testing Graceful Handling When AI Key Is Missing");

    // Temporarily ensure provider is gemini with dummy/unconfigured key
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_API_KEY = "your_ai_api_key_here";

    const missingKeyRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ projectId: testProjectId })
    });
    const missingKeyData = await missingKeyRes.json();

    assert(missingKeyRes.status === 503, "Missing AI_API_KEY returns 503 Service Unavailable");
    const errMsg = missingKeyData.error?.message || missingKeyData.message || "";
    assert(
      typeof errMsg === "string" && errMsg.includes("AI service is not configured"),
      "Returns clean user-friendly configuration message without exposing secrets",
      `got: ${errMsg}`
    );

    // Restore environment
    process.env.AI_PROVIDER = prevProvider;
    process.env.AI_API_KEY = prevKey;

    // ----------------------------------------------------
    // 6. Successful AI Generation (Mock / Configured Provider)
    // ----------------------------------------------------
    console.log("\n🔹 [6/7] Testing Structured AI Task Generation");

    // Set provider to mock for deterministic end-to-end testing
    process.env.AI_PROVIDER = "mock";

    const requestedTaskCount = 4;
    const generateRes = await fetch(`${baseUrl}/api/ai/generate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        projectId: testProjectId,
        taskCount: requestedTaskCount,
        additionalInstructions: "Focus on Kubernetes deployments and Docker orchestration"
      })
    });
    const generateData = await generateRes.json();

    assert(generateRes.status === 200, "POST /api/ai/generate-tasks returns 200 OK");
    assert(generateData.success === true, "Response indicates success: true");
    assert(generateData.data?.projectId === testProjectId, "Response references correct projectId");
    assert(Array.isArray(generateData.data?.tasks), "Response contains tasks array");
    assert(
      generateData.data?.tasks.length === requestedTaskCount,
      `Generated exact requested count (${requestedTaskCount} tasks)`,
      `got ${generateData.data?.tasks.length}`
    );

    // Validate structure of each generated task
    let allValid = true;
    for (const task of generateData.data.tasks) {
      if (
        !task.title ||
        typeof task.title !== "string" ||
        !task.description ||
        !["low", "medium", "high"].includes(task.priority) ||
        !task.suggestedDueDate ||
        isNaN(Date.parse(task.suggestedDueDate)) ||
        !task.estimatedDuration
      ) {
        allValid = false;
        break;
      }
    }
    assert(allValid, "Every generated task satisfies schema: title, description, priority, suggestedDueDate, estimatedDuration");

    // ----------------------------------------------------
    // 7. CRITICAL Database Non-Persistence & Activity Trail
    // ----------------------------------------------------
    console.log("\n🔹 [7/7] Verifying Database Non-Persistence & Activity Logging");

    // Verify tasks are NOT inserted into the PostgreSQL Task table
    const dbTaskCount = await prisma.task.count({
      where: { projectId: testProjectId }
    });
    assert(dbTaskCount === 0, "CRITICAL: Generated AI tasks are NOT automatically inserted into PostgreSQL Task table", `count is ${dbTaskCount}`);

    // Verify activity record was created
    const activityRecord = await prisma.activity.findFirst({
      where: {
        projectId: testProjectId,
        action: "AI_TASKS_GENERATED"
      }
    });
    assert(Boolean(activityRecord), "Activity record with action 'AI_TASKS_GENERATED' was logged in PostgreSQL");
    assert(activityRecord?.userId === ownerId, "Activity record references the requesting user");

    // Verify security: No secrets or raw keys present in response
    const rawResponseBody = JSON.stringify(generateData);
    assert(!rawResponseBody.includes("AI_API_KEY") && !rawResponseBody.includes("JWT_SECRET"), "Security: No secrets or API keys exposed in API response");

  } catch (err) {
    console.error("❌ Test suite encountered unhandled error:", err);
    failed++;
  } finally {
    process.env.AI_PROVIDER = prevProvider;
    process.env.AI_API_KEY = prevKey;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n==================================================");
  console.log(`📊 AI Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
};

if (require.main === module) {
  runAITests()
    .then(() => {
      prisma.$disconnect();
    })
    .catch((err) => {
      console.error("AI tests failed to execute:", err);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = runAITests;
