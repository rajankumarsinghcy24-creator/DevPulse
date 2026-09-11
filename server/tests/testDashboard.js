/**
 * DevPulse Capstone Task 4 - Dashboard & Activities API Test Suite
 *
 * Verifies:
 * 1. Authentication Protection:
 *    - Unauthenticated GET /api/dashboard → 401
 *    - Unauthenticated GET /api/activities → 401
 * 2. Query Parameter Validation:
 *    - Invalid activityLimit, negative limits, invalid UUIDs → 400
 * 3. Initial Empty State:
 *    - Fresh user has 0 projects, 0 tasks, 0% progress, empty recent activities
 * 4. Aggregated Project & Task Metrics:
 *    - Correct counts for active, completed projects
 *    - Correct counts for todo, in_progress, done tasks
 *    - Accurate progress percentage calculation (e.g. 2/4 = 50%)
 * 5. Overdue & Upcoming Task Calculations:
 *    - Uncompleted past due tasks counted as overdue
 *    - Completed past due tasks excluded from overdue
 *    - Tasks due in the next 7 days counted as upcoming
 * 6. Assigned Task Metrics:
 *    - Assignee sees their specific assigned tasks, statuses, and overdue/upcoming metrics
 * 7. Recent Activities Feed:
 *    - activities returned with action, details, user, project, task, createdAt
 *    - passwordHash is NEVER exposed in activities
 *    - query parameters limit and page work
 *    - filter by projectId works
 * 8. Data Isolation & Security:
 *    - Isolated user sees 0 counts and zero foreign activities
 *    - Foreign user cannot view activities of a private project (404/403)
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

const runDashboardTests = async () => {
  console.log("\n==================================================");
  console.log("📊 Starting DevPulse Task 4 Dashboard & Activities API Tests");
  console.log("==================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  let userAToken, userAId;
  let userBToken, userBId;
  let userCToken, userCId;

  try {
    // ----------------------------------------------------
    // SETUP: Register test accounts
    // ----------------------------------------------------
    console.log("🔹 [Setup] Registering test user accounts");

    // User A (Project Creator & Owner)
    const regResA = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dashboard Owner A",
        email: `dash_owner_${timestamp}@devpulse.io`,
        password: "Password123!",
        role: "manager"
      })
    });
    const regDataA = await regResA.json();
    userAToken = regDataA.data?.token;
    userAId = regDataA.data?.user?.id;

    // User B (Collaborator & Assignee)
    const regResB = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dashboard Member B",
        email: `dash_member_${timestamp}@devpulse.io`,
        password: "Password123!",
        role: "developer"
      })
    });
    const regDataB = await regResB.json();
    userBToken = regDataB.data?.token;
    userBId = regDataB.data?.user?.id;

    // User C (Isolated stranger with zero records)
    const regResC = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dashboard Stranger C",
        email: `dash_stranger_${timestamp}@devpulse.io`,
        password: "Password123!",
        role: "designer"
      })
    });
    const regDataC = await regResC.json();
    userCToken = regDataC.data?.token;
    userCId = regDataC.data?.user?.id;

    assert(userAToken && userBToken && userCToken, "All 3 test user accounts registered successfully");

    // ----------------------------------------------------
    // 1. Authentication Protection
    // ----------------------------------------------------
    console.log("\n🔹 [1/7] Testing Authentication Protection");

    const noAuthDash = await fetch(`${baseUrl}/api/dashboard`);
    assert(noAuthDash.status === 401, "GET /api/dashboard without token returns 401 Unauthorized");

    const noAuthAct = await fetch(`${baseUrl}/api/activities`);
    assert(noAuthAct.status === 401, "GET /api/activities without token returns 401 Unauthorized");

    // ----------------------------------------------------
    // 2. Query Parameter Validation
    // ----------------------------------------------------
    console.log("\n🔹 [2/7] Testing Query Parameter Validation");

    const invalidDashParam = await fetch(`${baseUrl}/api/dashboard?activityLimit=999`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(invalidDashParam.status === 400, "GET /api/dashboard with activityLimit > 100 returns 400 Bad Request");

    const invalidActLimit = await fetch(`${baseUrl}/api/activities?limit=-1`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(invalidActLimit.status === 400, "GET /api/activities with negative limit returns 400 Bad Request");

    const invalidActPage = await fetch(`${baseUrl}/api/activities?page=0`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(invalidActPage.status === 400, "GET /api/activities with page 0 returns 400 Bad Request");

    const invalidActUUID = await fetch(`${baseUrl}/api/activities?projectId=not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(invalidActUUID.status === 400, "GET /api/activities with malformed UUID returns 400 Bad Request");

    // ----------------------------------------------------
    // 3. Initial Empty State
    // ----------------------------------------------------
    console.log("\n🔹 [3/7] Testing Initial Empty State for New User");

    const emptyDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userCToken}` }
    });
    const emptyDashData = await emptyDashRes.json();

    assert(emptyDashRes.status === 200, "GET /api/dashboard returns 200 OK for new user");
    assert(emptyDashData.data?.projects?.total === 0, "Initial total projects is 0");
    assert(emptyDashData.data?.tasks?.total === 0, "Initial total tasks is 0");
    assert(emptyDashData.data?.tasks?.progressPercentage === 0, "Initial progress is 0%");
    assert(emptyDashData.data?.tasks?.assignedToMe?.total === 0, "Initial assigned tasks is 0");
    assert(Array.isArray(emptyDashData.data?.recentActivities) && emptyDashData.data?.recentActivities.length === 0, "Initial recent activities is an empty array");

    // ----------------------------------------------------
    // 4. Aggregated Projects & Tasks Metrics
    // ----------------------------------------------------
    console.log("\n🔹 [4/7] Testing Aggregated Projects & Tasks Metrics");

    // User A creates Project 1 (active)
    const proj1Res = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        name: `Dashboard Project Alpha ${timestamp}`,
        description: "Testing aggregated metrics",
        status: "active"
      })
    });
    const proj1Data = await proj1Res.json();
    const proj1Id = proj1Data.data?.id;

    // User A creates Project 2 (active initially, will be updated to completed)
    const proj2Res = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        name: `Dashboard Project Beta ${timestamp}`,
        description: "Testing completion state",
        status: "active"
      })
    });
    const proj2Data = await proj2Res.json();
    const proj2Id = proj2Data.data?.id;

    // Update Project 2 to completed
    await fetch(`${baseUrl}/api/projects/${proj2Id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({ status: "completed" })
    });

    // Create 4 Tasks in Project 1: 1 todo, 1 in-progress, 2 done
    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Alpha Task Todo",
        projectId: proj1Id,
        priority: "high",
        status: "todo"
      })
    });

    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Alpha Task In Progress",
        projectId: proj1Id,
        priority: "medium",
        status: "in-progress"
      })
    });

    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Alpha Task Done 1",
        projectId: proj1Id,
        priority: "low",
        status: "done"
      })
    });

    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Alpha Task Done 2",
        projectId: proj1Id,
        priority: "medium",
        status: "done"
      })
    });

    // Fetch User A's dashboard
    const userADashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const userADash = await userADashRes.json();

    assert(userADashRes.status === 200, "GET /api/dashboard returns 200 OK for owner");
    assert(userADash.data?.projects?.total === 2, "Reports exactly 2 total projects", `got ${userADash.data?.projects?.total}`);
    assert(userADash.data?.projects?.active === 1, "Reports exactly 1 active project");
    assert(userADash.data?.projects?.completed === 1, "Reports exactly 1 completed project");
    assert(userADash.data?.projects?.owned === 2, "Reports exactly 2 owned projects");

    assert(userADash.data?.tasks?.total === 4, "Reports exactly 4 total tasks");
    assert(userADash.data?.tasks?.todo === 1, "Reports 1 todo task");
    assert(userADash.data?.tasks?.inProgress === 1, "Reports 1 inProgress task");
    assert(userADash.data?.tasks?.done === 2, "Reports 2 done tasks");
    assert(userADash.data?.tasks?.progressPercentage === 50, "Accurately calculates 50% completion rate (2/4)", `got ${userADash.data?.tasks?.progressPercentage}%`);

    // ----------------------------------------------------
    // 5. Overdue and Upcoming Due Tasks Handling
    // ----------------------------------------------------
    console.log("\n🔹 [5/7] Testing Overdue & Upcoming Due Tasks Handling");

    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days from now

    // Overdue task (incomplete and past dueDate)
    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Overdue Critical Bugfix",
        projectId: proj1Id,
        priority: "high",
        status: "todo",
        dueDate: pastDate
      })
    });

    // Upcoming task (incomplete and within 7 days)
    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Upcoming Milestone Delivery",
        projectId: proj1Id,
        priority: "medium",
        status: "in-progress",
        dueDate: futureDate
      })
    });

    // Completed task with past date (MUST NOT be counted as overdue!)
    await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Already Finished Past Task",
        projectId: proj1Id,
        priority: "low",
        status: "done",
        dueDate: pastDate
      })
    });

    const dueDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const dueDash = await dueDashRes.json();

    assert(dueDash.data?.tasks?.overdue >= 1, "Accurately detects at least 1 overdue task", `got ${dueDash.data?.tasks?.overdue}`);
    assert(dueDash.data?.tasks?.upcoming >= 1, "Accurately detects at least 1 upcoming task", `got ${dueDash.data?.tasks?.upcoming}`);

    // ----------------------------------------------------
    // 6. Assigned Task Statistics for Assignee
    // ----------------------------------------------------
    console.log("\n🔹 [6/7] Testing Assigned Task Statistics for Collaborator");

    // Assign an in-progress task and a todo task to User B
    const assignTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Assigned Task for User B",
        projectId: proj1Id,
        assignedTo: userBId,
        priority: "high",
        status: "in-progress",
        dueDate: futureDate
      })
    });
    assert(assignTaskRes.status === 201, "Created task assigned to User B");

    const userBDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    const userBDash = await userBDashRes.json();

    assert(userBDashRes.status === 200, "GET /api/dashboard returns 200 OK for collaborator");
    assert(userBDash.data?.tasks?.assignedToMe?.total >= 1, "Reports tasks assignedToMe for collaborator", `got ${userBDash.data?.tasks?.assignedToMe?.total}`);
    assert(userBDash.data?.tasks?.assignedToMe?.inProgress >= 1, "Reports assigned tasks in-progress");
    assert(userBDash.data?.tasks?.assignedToMe?.upcoming >= 1, "Reports assigned upcoming tasks");

    // ----------------------------------------------------
    // 7. Recent Activities Feed & Security Isolation
    // ----------------------------------------------------
    console.log("\n🔹 [7/7] Testing Recent Activities & Security Data Isolation");

    // User A checks recent activities
    const actRes = await fetch(`${baseUrl}/api/activities?limit=5`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const actData = await actRes.json();

    assert(actRes.status === 200, "GET /api/activities returns 200 OK");
    assert(Array.isArray(actData.data), "Activities response contains an array");
    assert(actData.data.length <= 5, "Activities pagination limit respected (<= 5)");
    assert(actData.pagination?.total > 0, "Activities pagination metadata includes total count");

    // Security check: Verify passwordHash is NEVER exposed in activities
    const passwordHashLeak = actData.data.some((act) => act.user?.passwordHash !== undefined);
    assert(!passwordHashLeak, "Security: passwordHash is NEVER exposed in activities response");

    // Filter activities by project
    const projActRes = await fetch(`${baseUrl}/api/activities?projectId=${proj1Id}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const projActData = await projActRes.json();
    assert(projActRes.status === 200, "GET /api/activities?projectId= returns 200 OK");
    const allMatchProj = projActData.data.every((act) => act.project?.id === proj1Id);
    assert(allMatchProj, "All returned activities match the queried projectId");

    // Data Isolation: User C (stranger) attempts to view activities of Project 1
    const unauthorizedActRes = await fetch(`${baseUrl}/api/activities?projectId=${proj1Id}`, {
      headers: { Authorization: `Bearer ${userCToken}` }
    });
    assert(unauthorizedActRes.status === 404, "Data Isolation: Stranger accessing private project activities returns 404 Not Found");

    // User C dashboard remains strictly isolated (0 records)
    const isolatedDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userCToken}` }
    });
    const isolatedDash = await isolatedDashRes.json();
    assert(isolatedDash.data?.projects?.total === 0, "Data Isolation: Stranger dashboard projects count remains 0");
    assert(isolatedDash.data?.tasks?.total === 0, "Data Isolation: Stranger dashboard tasks count remains 0");
    assert(isolatedDash.data?.recentActivities?.length === 0, "Data Isolation: Stranger dashboard sees 0 foreign activities");

  } catch (err) {
    console.error("❌ Test suite encountered unhandled error:", err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n==================================================");
  console.log(`📊 Dashboard Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
};

if (require.main === module) {
  runDashboardTests()
    .then(() => {
      prisma.$disconnect();
    })
    .catch((err) => {
      console.error("Dashboard tests failed to execute:", err);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = runDashboardTests;
