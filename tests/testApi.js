/**
 * DevPulse Week 2 / Task 2 - Comprehensive Automated API Test Suite
 *
 * Runs end-to-end HTTP tests against all endpoints, verifying:
 * - Status codes (200, 201, 204, 400, 404, 409)
 * - Standard success and error payload formats
 * - Validation errors on all write operations
 * - Relationship validation (ownerId, projectId, assignedTo)
 * - Duplicate email conflict rejection
 * - Dedicated PATCH status endpoint
 */

const app = require("../src/app");
const { resetData } = require("../src/data/mockData");

let server;
let baseUrl;

let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName, details = "") => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    failedTests++;
  }
};

const runTests = async () => {
  console.log("\n==================================================");
  console.log("🧪 Starting DevPulse REST API Automated Test Suite");
  console.log("==================================================\n");

  resetData();

  // Spin up test server on random open port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: Root & Health Check Endpoints
    // ----------------------------------------------------
    console.log("🔹 [1/5] Testing Root & Health Endpoints");

    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200, "GET / returns status 200");
    assert(rootData.success === true && rootData.endpoints, "GET / returns API metadata and endpoints");

    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "GET /api/health returns status 200");
    assert(healthData.status === "healthy", "GET /api/health returns healthy status");

    // ----------------------------------------------------
    // TEST SUITE 2: User Endpoints & Validation
    // ----------------------------------------------------
    console.log("\n🔹 [2/5] Testing Users API (CRUD, Conflicts & Validation)");

    // GET /api/users
    const getUsersRes = await fetch(`${baseUrl}/api/users`);
    const getUsersData = await getUsersRes.json();
    assert(getUsersRes.status === 200, "GET /api/users returns 200");
    assert(Array.isArray(getUsersData.data) && getUsersData.data.length >= 4, "GET /api/users returns pre-seeded users");

    // GET /api/users/:id (valid)
    const getUserRes = await fetch(`${baseUrl}/api/users/usr_1`);
    const getUserData = await getUserRes.json();
    assert(getUserRes.status === 200, "GET /api/users/usr_1 returns 200");
    assert(getUserData.data.id === "usr_1" && getUserData.data.name === "Alex Rivera", "GET /api/users/usr_1 returns correct user");

    // GET /api/users/:id (404)
    const getMissingUserRes = await fetch(`${baseUrl}/api/users/usr_999`);
    const getMissingUserData = await getMissingUserRes.json();
    assert(getMissingUserRes.status === 404, "GET /api/users/usr_999 returns 404");
    assert(getMissingUserData.success === false && getMissingUserData.message, "GET /api/users/usr_999 returns standard error format");

    // POST /api/users (success)
    const createUserRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jordan Knight",
        email: "jordan.knight@devpulse.io",
        role: "developer"
      })
    });
    const createUserData = await createUserRes.json();
    assert(createUserRes.status === 201, "POST /api/users creates user with status 201");
    assert(createUserData.data.name === "Jordan Knight" && createUserData.data.id, "POST /api/users returns created user data with ID");
    const createdUserId = createUserData.data.id;

    // POST /api/users (409 duplicate email)
    const dupUserRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another Jordan",
        email: "jordan.knight@devpulse.io",
        role: "designer"
      })
    });
    const dupUserData = await dupUserRes.json();
    assert(dupUserRes.status === 409, "POST /api/users rejects duplicate email with status 409 Conflict");
    assert(dupUserData.success === false && dupUserData.message.includes("already exists"), "POST duplicate email returns clear message");

    // POST /api/users (400 validation failure: invalid role)
    const invalidRoleRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Hacker",
        email: "hacker@devpulse.io",
        role: "superadmin" // Not in developer | designer | manager
      })
    });
    const invalidRoleData = await invalidRoleRes.json();
    assert(invalidRoleRes.status === 400, "POST /api/users rejects invalid role with status 400 Bad Request");
    assert(Array.isArray(invalidRoleData.errors) && invalidRoleData.errors.length > 0, "POST invalid role returns validation errors array");

    // PUT /api/users/:id (success)
    const updateUserRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jordan Knight Updated",
        role: "manager"
      })
    });
    const updateUserData = await updateUserRes.json();
    assert(updateUserRes.status === 200, "PUT /api/users/:id updates user with status 200");
    assert(updateUserData.data.name === "Jordan Knight Updated" && updateUserData.data.role === "manager", "PUT updates user fields accurately");

    // PUT /api/users/:id (409 email conflict with existing user)
    const updateConflictRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex.rivera@devpulse.io" // Belongs to usr_1
      })
    });
    assert(updateConflictRes.status === 409, "PUT /api/users/:id rejects duplicate email conflict with status 409");

    // DELETE /api/users/:id (success)
    const deleteUserRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: "DELETE"
    });
    assert(deleteUserRes.status === 204, "DELETE /api/users/:id returns status 204 No Content");

    // DELETE /api/users/:id (404 after deletion)
    const reDeleteUserRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: "DELETE"
    });
    assert(reDeleteUserRes.status === 404, "DELETE /api/users/:id returns 404 on deleted user");

    // ----------------------------------------------------
    // TEST SUITE 3: Project Endpoints & Relationships
    // ----------------------------------------------------
    console.log("\n🔹 [3/5] Testing Projects API (CRUD & Relationship Validation)");

    // GET /api/projects
    const getProjectsRes = await fetch(`${baseUrl}/api/projects`);
    const getProjectsData = await getProjectsRes.json();
    assert(getProjectsRes.status === 200, "GET /api/projects returns 200");
    assert(Array.isArray(getProjectsData.data) && getProjectsData.data.length >= 3, "GET /api/projects returns seeded projects");

    // GET /api/projects/:id (valid)
    const getProjectRes = await fetch(`${baseUrl}/api/projects/prj_1`);
    const getProjectData = await getProjectRes.json();
    assert(getProjectRes.status === 200, "GET /api/projects/prj_1 returns 200");
    assert(getProjectData.data.name === "DevPulse Dashboard V2", "GET /api/projects/prj_1 returns correct project");

    // GET /api/projects/:id (404)
    const getMissingProjectRes = await fetch(`${baseUrl}/api/projects/prj_999`);
    assert(getMissingProjectRes.status === 404, "GET /api/projects/prj_999 returns 404");

    // POST /api/projects (success)
    const createProjectRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Security Audit Tool",
        description: "Static and dynamic analysis scanning pipeline for codebase security.",
        ownerId: "usr_3",
        status: "active"
      })
    });
    const createProjectData = await createProjectRes.json();
    assert(createProjectRes.status === 201, "POST /api/projects creates project with status 201");
    assert(createProjectData.data.name === "Security Audit Tool" && createProjectData.data.id, "POST /api/projects returns created project with ID");
    const createdProjectId = createProjectData.data.id;

    // POST /api/projects (400 relationship validation: non-existent ownerId)
    const invalidOwnerRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid Owner Project",
        description: "Project referencing non-existent owner",
        ownerId: "usr_999" // Non-existent
      })
    });
    const invalidOwnerData = await invalidOwnerRes.json();
    assert(invalidOwnerRes.status === 400, "POST /api/projects rejects non-existent ownerId with status 400");
    assert(invalidOwnerData.errors.some((e) => e.message.includes("ownerId")), "Error message mentions invalid ownerId reference");

    // PUT /api/projects/:id (success)
    const updateProjectRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed"
      })
    });
    const updateProjectData = await updateProjectRes.json();
    assert(updateProjectRes.status === 200, "PUT /api/projects/:id updates project status with 200");
    assert(updateProjectData.data.status === "completed", "PUT successfully changed status to completed");

    // DELETE /api/projects/:id (success)
    const deleteProjectRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: "DELETE"
    });
    assert(deleteProjectRes.status === 204, "DELETE /api/projects/:id returns status 204");

    // ----------------------------------------------------
    // TEST SUITE 4: Task Endpoints, Relationships & PATCH
    // ----------------------------------------------------
    console.log("\n🔹 [4/5] Testing Tasks API (CRUD, Filters, PATCH status & Relationships)");

    // GET /api/tasks
    const getTasksRes = await fetch(`${baseUrl}/api/tasks`);
    const getTasksData = await getTasksRes.json();
    assert(getTasksRes.status === 200, "GET /api/tasks returns 200");
    assert(Array.isArray(getTasksData.data) && getTasksData.data.length >= 5, "GET /api/tasks returns seeded tasks");

    // GET /api/tasks with query filters
    const filterTasksRes = await fetch(`${baseUrl}/api/tasks?status=in-progress`);
    const filterTasksData = await filterTasksRes.json();
    assert(filterTasksRes.status === 200, "GET /api/tasks?status=in-progress returns 200");
    assert(filterTasksData.data.every((t) => t.status === "in-progress"), "Query filter returns only in-progress tasks");

    // GET /api/tasks/:id (valid)
    const getTaskRes = await fetch(`${baseUrl}/api/tasks/tsk_1`);
    const getTaskData = await getTaskRes.json();
    assert(getTaskRes.status === 200, "GET /api/tasks/tsk_1 returns 200");
    assert(getTaskData.data.title === "Design Component Design Tokens", "GET /api/tasks/tsk_1 returns correct task");

    // POST /api/tasks (success)
    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Integrate WebSocket Notifications",
        description: "Real-time task assignment alerts using Socket.io or WebSockets.",
        projectId: "prj_1",
        assignedTo: "usr_1",
        priority: "high",
        status: "todo",
        dueDate: "2026-10-01T12:00:00.000Z"
      })
    });
    const createTaskData = await createTaskRes.json();
    assert(createTaskRes.status === 201, "POST /api/tasks creates task with status 201");
    assert(createTaskData.data.title === "Integrate WebSocket Notifications" && createTaskData.data.id, "POST returns created task with ID");
    const createdTaskId = createTaskData.data.id;

    // POST /api/tasks (400 relationship validation: invalid projectId)
    const invalidPrjTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Orphan Task",
        description: "Task with missing project",
        projectId: "prj_999",
        assignedTo: "usr_1"
      })
    });
    assert(invalidPrjTaskRes.status === 400, "POST /api/tasks rejects non-existent projectId with status 400");

    // POST /api/tasks (400 relationship validation: invalid assignedTo)
    const invalidUserTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Ghost Assigned Task",
        description: "Task with missing user",
        projectId: "prj_1",
        assignedTo: "usr_999"
      })
    });
    assert(invalidUserTaskRes.status === 400, "POST /api/tasks rejects non-existent assignedTo user with status 400");

    // PATCH /api/tasks/:id/status (success)
    const patchStatusRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "in-progress"
      })
    });
    const patchStatusData = await patchStatusRes.json();
    assert(patchStatusRes.status === 200, "PATCH /api/tasks/:id/status updates status with 200");
    assert(patchStatusData.data.status === "in-progress", "PATCH updated task status to in-progress");

    // PATCH /api/tasks/:id/status (400 invalid status rejection)
    const invalidPatchRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "almost-done" // Invalid enum
      })
    });
    assert(invalidPatchRes.status === 400, "PATCH /api/tasks/:id/status rejects invalid status with status 400");

    // PUT /api/tasks/:id (success)
    const updateTaskRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priority: "low"
      })
    });
    const updateTaskData = await updateTaskRes.json();
    assert(updateTaskRes.status === 200, "PUT /api/tasks/:id updates task with 200");
    assert(updateTaskData.data.priority === "low", "PUT updated task priority to low");

    // DELETE /api/tasks/:id (success)
    const deleteTaskRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
      method: "DELETE"
    });
    assert(deleteTaskRes.status === 204, "DELETE /api/tasks/:id returns status 204");

    // ----------------------------------------------------
    // TEST SUITE 5: Global Error Handling & 404 Routing
    // ----------------------------------------------------
    console.log("\n🔹 [5/5] Testing Global Error Handling & Unknown Routes");

    // Unknown endpoint
    const unknownRes = await fetch(`${baseUrl}/api/invalid-resource-endpoint`);
    const unknownData = await unknownRes.json();
    assert(unknownRes.status === 404, "Unknown endpoint returns status 404");
    assert(unknownData.success === false && unknownData.message.includes("Route not found"), "Unknown endpoint returns formatted 404 error");

    // Malformed JSON payload
    const malformedRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ name: broken json }"
    });
    const malformedData = await malformedRes.json();
    assert(malformedRes.status === 400, "Malformed JSON body returns status 400");
    assert(malformedData.success === false && malformedData.message.includes("Malformed JSON"), "Malformed JSON error response is structured");
  } catch (err) {
    console.error("❌ Unexpected error during test run:", err);
    failedTests++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log("\n==================================================");
  console.log(`📊 Test Summary: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
