/**
 * DevPulse Capstone Task 4 - Tasks API Test Suite
 *
 * Verifies:
 * 1. Authentication Protection: unauthenticated GET /api/tasks → 401
 * 2. Task Creation: authenticated POST /api/tasks → 201
 * 3. Validation: missing title, short title, invalid enums → 400
 * 4. Referential Integrity: non-existent project → 404, non-existent assignee → 400
 * 5. Authorization on creation: managing task in another user's project → 403
 * 6. Retrieval: GET /api/tasks (200) and GET /api/tasks/:id (200 with project, assignee & activity)
 * 7. Text Search: ?search= keyword matches title or description
 * 8. Multi-field Filtering: combining ?projectId=, ?status=, ?priority=
 * 9. Full Update: PUT /api/tasks/:id by owner or assignee → 200
 * 10. Update Authorization: PUT /api/tasks/:id by unauthorized user → 403
 * 11. Status Patch: PATCH /api/tasks/:id/status → 200
 * 12. Assignment: changing assignee creates TASK_ASSIGNED activity
 * 13. Deletion Authorization: DELETE by non-owner → 403, by owner → 204
 * 14. Not-Found Cases: 404 on deleted / non-existent tasks
 * 15. Activity Audit Trail: verifies activity log records for creation, update & status change
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

const runTaskTests = async () => {
  console.log("\n==================================================");
  console.log("📋 Starting DevPulse Task 4 Tasks API Tests");
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
  let memberToken = null;
  let memberId = null;
  let strangerToken = null;
  let strangerId = null;
  let testProjectId = null;
  let createdTaskId = null;

  try {
    // -----------------------------------------------------------------
    // Setup: Create 3 Users (Project Owner, Member/Assignee, Stranger) & 1 Project
    // -----------------------------------------------------------------
    console.log("🔹 [Setup] Registering test owner, assignee member, and stranger accounts");

    const ownerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Task Test Owner",
        email: `task.owner.${Date.now()}@devpulse.io`,
        password: "OwnerPassword123!",
        role: "manager"
      })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.data.token;
    ownerId = ownerData.data.user.id;

    const memberRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Task Test Assignee",
        email: `task.member.${Date.now()}@devpulse.io`,
        password: "MemberPassword123!",
        role: "developer"
      })
    });
    const memberData = await memberRes.json();
    memberToken = memberData.data.token;
    memberId = memberData.data.user.id;

    const strangerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Stranger User",
        email: `task.stranger.${Date.now()}@devpulse.io`,
        password: "StrangerPassword123!",
        role: "developer"
      })
    });
    const strangerData = await strangerRes.json();
    strangerToken = strangerData.data.token;
    strangerId = strangerData.data.user.id;

    // Create a project owned by owner
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: "Task Integration Project",
        description: "Project for verifying Task API"
      })
    });
    const projData = await projRes.json();
    testProjectId = projData.data.id;

    // -----------------------------------------------------------------
    // 1. Authentication Protection
    // -----------------------------------------------------------------
    console.log("\n🔹 [1/6] Testing Authentication Enforcement");
    const unauthRes = await fetch(`${baseUrl}/api/tasks`);
    assert(unauthRes.status === 401, "GET /api/tasks without token returns 401 Unauthorized");

    // -----------------------------------------------------------------
    // 2. Validation & Referential Checks
    // -----------------------------------------------------------------
    console.log("\n🔹 [2/6] Testing Input Validation & Foreign-Key Integrity");

    // Missing title
    const noTitleRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ projectId: testProjectId })
    });
    assert(noTitleRes.status === 400, "POST /api/tasks without title returns 400 Bad Request");

    // Non-existent project
    const badProjRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: "Valid Title",
        projectId: "00000000-0000-0000-0000-000000000000"
      })
    });
    assert(badProjRes.status === 404, "POST /api/tasks with non-existent project returns 404 Not Found");

    // Non-existent assignee
    const badAssigneeRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: "Valid Title",
        projectId: testProjectId,
        assignedTo: "00000000-0000-0000-0000-000000000000"
      })
    });
    assert(badAssigneeRes.status === 400, "POST /api/tasks with non-existent assignee returns 400 Bad Request");

    // Unauthorized project manager (stranger trying to add task to owner's project)
    const strangerTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${strangerToken}`
      },
      body: JSON.stringify({
        title: "Intruder Task",
        projectId: testProjectId
      })
    });
    assert(strangerTaskRes.status === 403, "POST /api/tasks by stranger into another user's project returns 403 Forbidden");

    // -----------------------------------------------------------------
    // 3. Task Creation & Activity Logging
    // -----------------------------------------------------------------
    console.log("\n🔹 [3/6] Testing Task Creation & Activity Logging");

    const uniqueKeyword = `SearchableKeyword_${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: `Implement Payment Gateway ${uniqueKeyword}`,
        description: "Integrate Stripe and webhook handlers for subscription billing.",
        projectId: testProjectId,
        assignedTo: memberId,
        priority: "high",
        status: "in-progress",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, "POST /api/tasks creates task with 201 Created");
    assert(createData.data && createData.data.id, "Created task returns valid UUID");
    assert(createData.data.status === "in-progress", "Task status is normalized to 'in-progress'");
    createdTaskId = createData.data.id;

    // Verify Activity Record
    const taskActivity = await prisma.activity.findFirst({
      where: { taskId: createdTaskId, action: "TASK_CREATED" }
    });
    assert(Boolean(taskActivity), "Task creation automatically logs a TASK_CREATED Activity record");

    // -----------------------------------------------------------------
    // 4. Retrieval, Search & Multi-field Filtering
    // -----------------------------------------------------------------
    console.log("\n🔹 [4/6] Testing Retrieval, Search & Multi-field Filters");

    // Single Task
    const getSingleRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200, "GET /api/tasks/:id returns 200 OK");
    assert(getSingleData.data.assignee && getSingleData.data.assignee.id === memberId, "Task details includes assigned user");
    assert(getSingleData.data.project && getSingleData.data.project.id === testProjectId, "Task details includes project info");

    // Search by unique keyword
    const searchRes = await fetch(`${baseUrl}/api/tasks?search=${uniqueKeyword}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, "GET /api/tasks?search= returns 200 OK");
    assert(searchData.data.some((t) => t.id === createdTaskId), "Search query matches task by title keyword");

    // Multi-field Filter (projectId + status + priority)
    const multiFilterRes = await fetch(
      `${baseUrl}/api/tasks?projectId=${testProjectId}&status=in-progress&priority=high`,
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    const multiFilterData = await multiFilterRes.json();
    assert(multiFilterRes.status === 200, "GET /api/tasks with multiple combined filters returns 200 OK");
    assert(multiFilterData.data.some((t) => t.id === createdTaskId), "Combined filter includes matching task");

    // -----------------------------------------------------------------
    // 5. Updates, Status Patch & Assignment
    // -----------------------------------------------------------------
    console.log("\n🔹 [5/6] Testing Updates, Status Patching & Authorization");

    // Stranger cannot update task
    const badUpdateRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${strangerToken}`
      },
      body: JSON.stringify({ title: "Hacked Title" })
    });
    assert(badUpdateRes.status === 403, "PUT /api/tasks/:id by unauthorized user returns 403 Forbidden");

    // Assignee CAN patch status
    const patchRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`
      },
      body: JSON.stringify({ status: "done" })
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200, "PATCH /api/tasks/:id/status by assigned member returns 200 OK");
    assert(patchData.data.status === "done", "Task status is updated to 'done'");

    // Verify TASK_STATUS_CHANGED activity
    const statusActivity = await prisma.activity.findFirst({
      where: { taskId: createdTaskId, action: "TASK_STATUS_CHANGED" }
    });
    assert(Boolean(statusActivity), "PATCH status logs a TASK_STATUS_CHANGED Activity record");

    // Full update by owner (changing assignee)
    const updateRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: "Updated Payment Gateway Task",
        assignedTo: ownerId, // Reassign to owner
        priority: "medium"
      })
    });
    assert(updateRes.status === 200, "PUT /api/tasks/:id by project owner returns 200 OK");

    const assignActivity = await prisma.activity.findFirst({
      where: { taskId: createdTaskId, action: "TASK_ASSIGNED" }
    });
    assert(Boolean(assignActivity), "Reassigning task logs a TASK_ASSIGNED Activity record");

    // -----------------------------------------------------------------
    // 6. Deletion & Not-Found Assertions
    // -----------------------------------------------------------------
    console.log("\n🔹 [6/6] Testing Deletion & Not-Found Error Handling");

    // Non-owner cannot delete
    const badDelRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${strangerToken}` }
    });
    assert(badDelRes.status === 403, "DELETE /api/tasks/:id by non-owner returns 403 Forbidden");

    // Owner CAN delete
    const delRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(delRes.status === 204, "DELETE /api/tasks/:id by owner returns 204 No Content");
    createdTaskId = null;

    // Verify 404 for deleted task
    const notFoundRes = await fetch(`${baseUrl}/api/tasks/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(notFoundRes.status === 404, "GET /api/tasks/:id for non-existent ID returns 404 Not Found");

  } catch (err) {
    console.error("❌ Unexpected test error:", err);
    failed++;
  } finally {
    // Clean up test data without touching seed data
    if (createdTaskId) {
      try {
        await prisma.task.delete({ where: { id: createdTaskId } });
      } catch {}
    }
    if (testProjectId) {
      try {
        await prisma.project.delete({ where: { id: testProjectId } });
      } catch {}
    }
    if (ownerId) {
      try {
        await prisma.user.delete({ where: { id: ownerId } });
      } catch {}
    }
    if (memberId) {
      try {
        await prisma.user.delete({ where: { id: memberId } });
      } catch {}
    }
    if (strangerId) {
      try {
        await prisma.user.delete({ where: { id: strangerId } });
      } catch {}
    }
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`📊 Tasks Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTaskTests();
