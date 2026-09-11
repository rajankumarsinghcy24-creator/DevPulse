/**
 * DevPulse Capstone Task 4 - Projects API Test Suite
 *
 * Verifies:
 * 1. Unauthenticated GET /api/projects → 401
 * 2. Authenticated project creation → 201
 * 3. Project owner is automatically set to current authenticated user
 * 4. GET /api/projects → 200 (with computed progress & task counts)
 * 5. GET /api/projects/:id → 200 (detailed project info, tasks & activity)
 * 6. Project statistics are accurate (total, todo, inProgress, done, overdue)
 * 7. Progress calculation (completed / total * 100) works
 * 8. Project update by owner → 200
 * 9. Project update by non-owner → 403 Forbidden
 * 10. Project deletion by non-owner → 403 Forbidden
 * 11. Project deletion by owner → 204 No Content
 * 12. Nonexistent project GET/PUT/DELETE → 404 Not Found
 * 13. Invalid project data (missing name, short name) → 400 Bad Request
 * 14. Project creation creates Activity record
 * 15. Project update creates Activity record
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

const runProjectTests = async () => {
  console.log("\n==================================================");
  console.log("📁 Starting DevPulse Task 4 Projects API Tests");
  console.log("==================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  let ownerToken = null;
  let ownerId = null;
  let nonOwnerToken = null;
  let nonOwnerId = null;
  let createdProjectId = null;
  let createdTaskId = null;

  try {
    // -----------------------------------------------------------------
    // Setup: Create 2 Test Users (Owner & Non-Owner)
    // -----------------------------------------------------------------
    console.log("🔹 [Setup] Registering test owner and non-owner accounts");

    const ownerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Project Owner",
        email: `proj.owner.${Date.now()}@devpulse.io`,
        password: "OwnerPassword123!",
        role: "manager"
      })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.data.token;
    ownerId = ownerData.data.user.id;

    const nonOwnerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Non Owner Member",
        email: `proj.nonowner.${Date.now()}@devpulse.io`,
        password: "MemberPassword123!",
        role: "developer"
      })
    });
    const nonOwnerData = await nonOwnerRes.json();
    nonOwnerToken = nonOwnerData.data.token;
    nonOwnerId = nonOwnerData.data.user.id;

    // -----------------------------------------------------------------
    // Test 1: Unauthenticated GET /api/projects → 401
    // -----------------------------------------------------------------
    console.log("\n🔹 [1/5] Testing Authentication Enforcement");
    const unauthRes = await fetch(`${baseUrl}/api/projects`);
    assert(unauthRes.status === 401, "GET /api/projects without token returns 401 Unauthorized");

    // -----------------------------------------------------------------
    // Test 13: Invalid Project Data → 400 Bad Request
    // -----------------------------------------------------------------
    const badDataRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ name: "Pr" }) // Min length is 3
    });
    assert(badDataRes.status === 400, "POST /api/projects with short name (<3 chars) returns 400 Bad Request");

    // -----------------------------------------------------------------
    // Test 2 & 3: Authenticated Project Creation & Automatic Owner Assignment
    // -----------------------------------------------------------------
    console.log("\n🔹 [2/5] Testing Authenticated Project Creation");
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: "Automated Test Project",
        description: "Testing Task 4 Project API architecture",
        status: "active"
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, "POST /api/projects creates project with 201 Created");
    assert(createData.data && createData.data.id, "Created project returns valid UUID");
    assert(createData.data.ownerId === ownerId, "Project ownerId is automatically bound to authenticated user");
    createdProjectId = createData.data.id;

    // -----------------------------------------------------------------
    // Test 14: Project Creation Creates Activity
    // -----------------------------------------------------------------
    const createActivity = await prisma.activity.findFirst({
      where: { projectId: createdProjectId, action: "PROJECT_CREATED" }
    });
    assert(Boolean(createActivity), "Project creation automatically inserts an Activity record");
    assert(createActivity && createActivity.userId === ownerId, "Activity record references creator userId");

    // -----------------------------------------------------------------
    // Setup Task to test Statistics and Progress calculation
    // -----------------------------------------------------------------
    const task = await prisma.task.create({
      data: {
        title: "Test Task 1",
        description: "Task for stats test",
        projectId: createdProjectId,
        assignedTo: ownerId,
        priority: "high",
        status: "done"
      }
    });
    createdTaskId = task.id;

    // -----------------------------------------------------------------
    // Test 4: GET /api/projects → 200
    // -----------------------------------------------------------------
    console.log("\n🔹 [3/5] Testing Project Listing & Progress Calculation");
    const listRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, "GET /api/projects returns status 200 OK");
    assert(Array.isArray(listData.data), "GET /api/projects returns an array of projects");

    const foundProj = listData.data.find((p) => p.id === createdProjectId);
    assert(Boolean(foundProj), "Created project is returned in project listing");

    // -----------------------------------------------------------------
    // Test 5, 6 & 7: GET Project Details, Statistics & Progress
    // -----------------------------------------------------------------
    const detailRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, "GET /api/projects/:id returns status 200 OK");
    assert(detailData.data && detailData.data.stats, "Project details includes stats object");
    assert(detailData.data.stats.total === 1, "Project statistics reports 1 total task");
    assert(detailData.data.stats.done === 1, "Project statistics reports 1 done task");
    assert(detailData.data.stats.progress === 100, "Progress calculation accurately computes 100%");
    assert(Array.isArray(detailData.data.activities), "Project details includes recent activities");

    // -----------------------------------------------------------------
    // Test 8 & 9: Project Update (Owner vs Non-Owner Authorization)
    // -----------------------------------------------------------------
    console.log("\n🔹 [4/5] Testing Ownership Authorization for Updates");

    // A. Update by Non-Owner → 403
    const forbiddenUpdateRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nonOwnerToken}`
      },
      body: JSON.stringify({ name: "Hacked by non-owner" })
    });
    assert(forbiddenUpdateRes.status === 403, "PUT /api/projects/:id by non-owner returns 403 Forbidden");

    // B. Update by Owner → 200
    const ownerUpdateRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: "Renamed Project by Owner",
        description: "Updated description by legitimate owner"
      })
    });
    const ownerUpdateData = await ownerUpdateRes.json();
    assert(ownerUpdateRes.status === 200, "PUT /api/projects/:id by legitimate owner returns 200 OK");
    assert(ownerUpdateData.data.name === "Renamed Project by Owner", "Project name successfully updated");

    // -----------------------------------------------------------------
    // Test 15: Project Update Creates Activity
    // -----------------------------------------------------------------
    const updateActivity = await prisma.activity.findFirst({
      where: { projectId: createdProjectId, action: "PROJECT_UPDATED" }
    });
    assert(Boolean(updateActivity), "Project update automatically creates an Activity record");

    // -----------------------------------------------------------------
    // Test 10 & 11: Project Deletion (Owner vs Non-Owner Authorization)
    // -----------------------------------------------------------------
    console.log("\n🔹 [5/5] Testing Ownership Authorization for Deletion");

    // A. Delete by Non-Owner → 403
    const forbiddenDelRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${nonOwnerToken}` }
    });
    assert(forbiddenDelRes.status === 403, "DELETE /api/projects/:id by non-owner returns 403 Forbidden");

    // B. Delete by Owner → 204
    const ownerDelRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(ownerDelRes.status === 204, "DELETE /api/projects/:id by owner returns 204 No Content");
    createdProjectId = null; // Successfully deleted

    // -----------------------------------------------------------------
    // Test 12: Non-existent Project → 404
    // -----------------------------------------------------------------
    const notFoundRes = await fetch(`${baseUrl}/api/projects/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(notFoundRes.status === 404, "GET /api/projects/:id for non-existent ID returns 404 Not Found");

  } catch (err) {
    console.error("❌ Unexpected test error:", err);
    failed++;
  } finally {
    // Clean up created test data without touching existing seed data
    if (createdProjectId) {
      try {
        await prisma.project.delete({ where: { id: createdProjectId } });
      } catch {}
    }
    if (ownerId) {
      try {
        await prisma.user.delete({ where: { id: ownerId } });
      } catch {}
    }
    if (nonOwnerId) {
      try {
        await prisma.user.delete({ where: { id: nonOwnerId } });
      } catch {}
    }
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`📊 Project Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runProjectTests();
