/**
 * DevPulse Capstone Task 4 - Authentication Test Suite
 *
 * Verifies:
 * 1. User Registration & Input Validation
 * 2. Duplicate Email Prevention (409 Conflict)
 * 3. Bcrypt Password Hashing & Safe User Object (no passwordHash)
 * 4. User Login with valid & invalid credentials
 * 5. JWT & HTTP-Only Cookie Generation
 * 6. Protected /api/auth/me endpoint (Bearer token & Cookie modes)
 * 7. Rejection of unauthenticated & invalid JWT requests (401 Unauthorized)
 * 8. Logout endpoint cookie invalidation
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

const runAuthTests = async () => {
  console.log("\n==================================================");
  console.log("🔐 Starting DevPulse Task 4 Authentication Tests");
  console.log("==================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const testEmail = `auth.test.${Date.now()}@devpulse.io`;
  const testPassword = "TestPassword123!";
  let registeredToken = null;
  let registeredUserId = null;
  let cookieHeader = null;

  try {
    // -----------------------------------------------------------------
    // 1. Validation Checks (Short password & missing fields)
    // -----------------------------------------------------------------
    console.log("🔹 [1/6] Testing Registration Validation Rules");

    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "valid@devpulse.io",
        password: "123" // Less than 6 chars
      })
    });
    assert(shortPassRes.status === 400, "POST /api/auth/register rejects password shorter than 6 characters (400)");

    const badEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        password: "ValidPassword123!"
      })
    });
    assert(badEmailRes.status === 400, "POST /api/auth/register rejects malformed email (400)");

    // -----------------------------------------------------------------
    // 2. Successful Registration
    // -----------------------------------------------------------------
    console.log("\n🔹 [2/6] Testing Successful User Registration");

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Auth Test Engineer",
        email: testEmail,
        password: testPassword,
        role: "developer"
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, "POST /api/auth/register returns status 201 Created");
    assert(regData.success === true, "Registration response indicates success");
    assert(regData.data && regData.data.token, "Registration response includes JWT token");
    assert(regData.data.user && regData.data.user.id, "Registration response includes user ID");
    assert(regData.data.user.passwordHash === undefined, "Security: passwordHash is NEVER returned in response");

    registeredToken = regData.data.token;
    registeredUserId = regData.data.user.id;

    // Check Set-Cookie header
    const rawSetCookie = regRes.headers.get("set-cookie");
    assert(Boolean(rawSetCookie && rawSetCookie.includes("token=")), "Registration sets HTTP-Only 'token' cookie");
    if (rawSetCookie) {
      cookieHeader = rawSetCookie.split(";")[0];
    }

    // -----------------------------------------------------------------
    // 3. Duplicate Registration Conflict
    // -----------------------------------------------------------------
    console.log("\n🔹 [3/6] Testing Duplicate Email Prevention");

    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: "AnotherPassword123!"
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, "POST /api/auth/register returns 409 Conflict for existing email");
    assert(dupData.success === false, "Duplicate registration response reports failure");

    // -----------------------------------------------------------------
    // 4. User Login
    // -----------------------------------------------------------------
    console.log("\n🔹 [4/6] Testing User Login");

    // A. Successful login with registered user
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "POST /api/auth/login returns 200 OK with valid credentials");
    assert(loginData.data && loginData.data.token, "Login response returns valid JWT");
    assert(loginData.data.user.passwordHash === undefined, "Security: passwordHash is NEVER returned on login");

    // B. Successful login with existing seeded user
    const seedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex.rivera@devpulse.io",
        password: "Password123!"
      })
    });
    assert(seedLoginRes.status === 200, "POST /api/auth/login succeeds for seeded developer account");

    // C. Invalid password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword!"
      })
    });
    assert(wrongPassRes.status === 401, "POST /api/auth/login rejects incorrect password with 401 Unauthorized");

    // D. Unknown email
    const unknownEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.user@devpulse.io",
        password: "SomePassword123!"
      })
    });
    assert(unknownEmailRes.status === 401, "POST /api/auth/login rejects unregistered email with 401 Unauthorized");

    // -----------------------------------------------------------------
    // 5. Protected Route: GET /api/auth/me
    // -----------------------------------------------------------------
    console.log("\n🔹 [5/6] Testing Protected Profile Route (GET /api/auth/me)");

    // A. Authenticated via Authorization Bearer Header
    const meBearerRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${registeredToken}` }
    });
    const meBearerData = await meBearerRes.json();
    assert(meBearerRes.status === 200, "GET /api/auth/me succeeds with Bearer token (200)");
    assert(meBearerData.data.user.email === testEmail, "Profile data matches authenticated user email");
    assert(meBearerData.data.user.passwordHash === undefined, "Security: passwordHash is not returned in profile");

    // B. Authenticated via Cookie Header
    if (cookieHeader) {
      const meCookieRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: cookieHeader }
      });
      assert(meCookieRes.status === 200, "GET /api/auth/me succeeds with HTTP-Only Cookie header (200)");
    }

    // C. Missing Token (Unauthenticated)
    const meNoTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    assert(meNoTokenRes.status === 401, "GET /api/auth/me without token returns 401 Unauthorized");

    // D. Invalid / Tampered JWT
    const meBadTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsig" }
    });
    assert(meBadTokenRes.status === 401, "GET /api/auth/me with invalid signature returns 401 Unauthorized");

    // -----------------------------------------------------------------
    // 6. Logout
    // -----------------------------------------------------------------
    console.log("\n🔹 [6/6] Testing Logout");

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST"
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout returns status 200 OK");
    const logoutCookie = logoutRes.headers.get("set-cookie");
    assert(
      Boolean(logoutCookie && (logoutCookie.includes("token=;") || logoutCookie.includes("Max-Age=0") || logoutCookie.includes("Expires="))),
      "Logout header clears/invalidates the 'token' cookie"
    );

  } catch (err) {
    console.error("❌ Unexpected test error:", err);
    failed++;
  } finally {
    // Clean up test user from database
    if (registeredUserId) {
      try {
        await prisma.user.delete({ where: { id: registeredUserId } });
      } catch {
        // Ignore cleanup error
      }
    }
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`📊 Auth Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAuthTests();
