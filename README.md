# DevPulse — Users, Projects & Tasks REST API

> **Week 2 / Task 2 — Innovation Hacks Full Stack Development Internship**  
> Modern, production-structured REST API built with Node.js and Express.js providing comprehensive CRUD management, express-validator schemas, relationship validation, status transition controls, and centralized error handling for DevPulse.

---

## 1. Project Overview

**DevPulse REST API** serves as the centralized backend service designed to power the developer productivity platform introduced in Week 1 (*DevPulse — Developer Productivity Dashboard*).

In this Week 2 milestone, the API establishes the foundational domain contracts and RESTful interfaces across three primary resources:
- **Users**: Engineering team members, design contributors, and engineering managers.
- **Projects**: Development initiatives and telemetry streams with status tracking.
- **Tasks**: Granular work items mapped to projects and assignees with priority, due date, and state management.

> [!NOTE]
> **Week 2 Data Storage**: In accordance with the internship syllabus, Week 2 utilizes a clean, modular in-memory mock data store (`src/data/mockData.js`). Persistent database integration with MongoDB/PostgreSQL is scheduled for Week 3. This release does not include persistent databases, JWT authentication, or AI features.

---

## 2. Key Features

- **Full RESTful Resource Lifecycle**: Complete CRUD operations for Users, Projects, and Tasks.
- **Strict Relationship Validation**: Enforces integrity constraints (Projects must belong to existing users; Tasks must belong to valid projects and users).
- **Dedicated Status Lifecycle Management**: Specialized `PATCH /api/tasks/:id/status` endpoint to transition tasks (`todo` -> `in-progress` -> `done`).
- **Conflict & Duplicate Prevention**: Rejects duplicate email registrations with HTTP `409 Conflict`.
- **Express-Validator Schemas**: Strict schema-level validation on all write operations (`POST`, `PUT`, `PATCH`).
- **Standardized Response Protocol**: Uniform JSON wrappers across all success (`{ success: true, data }`) and error (`{ success: false, message, errors }`) responses.
- **Centralized Error Handling**: Global Express error middleware catching validation faults, 404s, malformed JSON, and unexpected exceptions.
- **CORS Enabled**: Pre-configured Cross-Origin Resource Sharing allowing seamless consumption by Vite/React frontends.
- **Configurable Environment**: Clean isolation using `dotenv` for development and production modes.

---

## 3. Technology Stack

| Layer / Concern | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Server-side JavaScript runtime engine |
| **Web Framework** | Express.js (v4.x) | Fast, unopinionated routing and middleware stack |
| **Input Validation** | express-validator (v7.x) | Declarative request sanitization and schema validation |
| **CORS Handling** | cors (v2.x) | Cross-Origin resource sharing headers for web clients |
| **Configuration** | dotenv (v16.x) | Environment variable management via `.env` files |
| **Development** | nodemon (v3.x) | Live auto-reloading server upon code changes |
| **Data Storage** | In-Memory (JavaScript Store) | Isolated mock store pre-seeded with DevPulse records |

---

## 4. Installation Instructions

### Prerequisites
- Node.js (version 18.x or 20.x+ recommended; verified on Node v24.x)
- npm (version 9.x+)

### Setup
Clone or navigate to the repository directory:
```bash
cd DevPulse-Week2-Task2-Users-Projects-Tasks-API
```

Install production and development dependencies:
```bash
npm install
```

---

## 5. Environment Setup

Create your local `.env` configuration from the provided template:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
```

---

## 6. How to Run Locally

### Development Mode (with Live Reload)
```bash
npm run dev
```
Starts the server using `nodemon` on `http://localhost:5000`. Any code change triggers automatic restart.

### Production Start
```bash
npm start
```
Starts the server using standard `node server.js`.

### Automated Test Suite
```bash
npm test
```
Executes the comprehensive end-to-end automated test runner validating all 16 endpoints, validation schemas, conflict rejections, and error middleware.

---

## 7. Project Structure

```
DevPulse-Week2-Task2-Users-Projects-Tasks-API/
├── src/
│   ├── controllers/
│   │   ├── userController.js       # User CRUD & duplicate email logic
│   │   ├── projectController.js    # Project CRUD & ownership logic
│   │   └── taskController.js       # Task CRUD & status transition logic
│   ├── routes/
│   │   ├── userRoutes.js          # /api/users routing definitions
│   │   ├── projectRoutes.js       # /api/projects routing definitions
│   │   └── taskRoutes.js          # /api/tasks routing definitions
│   ├── middleware/
│   │   ├── errorHandler.js        # Centralized error handler & ApiError class
│   │   └── validate.js            # express-validator result formatter (400)
│   ├── validators/
│   │   ├── userValidator.js       # Schemas for User POST/PUT
│   │   ├── projectValidator.js    # Schemas for Project POST/PUT & owner existence
│   │   └── taskValidator.js       # Schemas for Task POST/PUT/PATCH & foreign keys
│   ├── data/
│   │   └── mockData.js            # In-memory data store with DevPulse seed records
│   └── app.js                     # Express app setup, CORS, route mounts, 404 handler
├── tests/
│   └── testApi.js                 # End-to-end automated testing suite
├── server.js                      # Application entry point & port listener
├── .env                           # Local environment variables (git-ignored)
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies & npm run scripts
└── README.md                      # Comprehensive API documentation
```

---

## 8. API Endpoint Documentation

### Base URL: `http://localhost:5000/api`

### Overview Route & Health Check
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Welcome message & endpoint directory | `200 OK` |
| `GET` | `/api/health` | Service uptime and health diagnostics | `200 OK` |

### 1. Users API (`/api/users`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all registered users | `200 OK` |
| `GET` | `/api/users/:id` | Retrieve single user by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/users` | Register a new user | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `PUT` | `/api/users/:id` | Update an existing user's details | `200 OK` / `400 Bad Request` / `404 Not Found` / `409 Conflict` |
| `DELETE` | `/api/users/:id` | Remove user from the system | `204 No Content` / `404 Not Found` |

### 2. Projects API (`/api/projects`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List all projects | `200 OK` |
| `GET` | `/api/projects/:id` | Retrieve single project by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/projects` | Create a new project | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/projects/:id` | Update project metadata or status | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/api/projects/:id` | Remove a project | `204 No Content` / `404 Not Found` |

### 3. Tasks API (`/api/tasks`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks (supports query filtering) | `200 OK` |
| `GET` | `/api/tasks/:id` | Retrieve single task by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/tasks` | Create a new task item | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/tasks/:id` | Full update of a task item | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `PATCH`| `/api/tasks/:id/status` | Transition task status | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/api/tasks/:id` | Remove a task item | `204 No Content` / `404 Not Found` |

---

## 9. Request Examples

### Create User (`POST /api/users`)
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jordan Knight",
    "email": "jordan.knight@devpulse.io",
    "role": "developer"
  }'
```

### Create Project (`POST /api/projects`)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Distributed Event Pipeline",
    "description": "Kafka consumer cluster for real-time developer activity stream.",
    "ownerId": "usr_3",
    "status": "active"
  }'
```

### Create Task (`POST /api/tasks`)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Configure Redis Caching Layer",
    "description": "Implement TTL-based query caching for high-frequency dashboard widgets.",
    "projectId": "prj_1",
    "assignedTo": "usr_1",
    "priority": "high",
    "status": "todo",
    "dueDate": "2026-10-05T00:00:00.000Z"
  }'
```

### Update Task Status (`PATCH /api/tasks/:id/status`)
```bash
curl -X PATCH http://localhost:5000/api/tasks/tsk_2/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

---

## 10. Response Examples

### Standard Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "tsk_2",
    "title": "Implement REST Endpoint Routing",
    "description": "Set up Express routers for users, projects, and tasks with error middleware.",
    "projectId": "prj_1",
    "assignedTo": "usr_1",
    "priority": "high",
    "status": "done",
    "dueDate": "2026-09-20T00:00:00.000Z",
    "createdAt": "2026-08-05T09:30:00.000Z",
    "updatedAt": "2026-09-09T12:35:00.000Z"
  }
}
```

### Deletion Success (`204 No Content`)
HTTP status `204` with an empty response body.

---

## 11. Validation & Error Examples

### 1. Validation Failure (`400 Bad Request`)
When an invalid role is supplied or required fields are omitted:
```json
{
  "success": false,
  "message": "Validation failed. Please verify your input.",
  "errors": [
    {
      "field": "role",
      "message": "Role must be one of: developer, designer, manager.",
      "value": "superadmin"
    }
  ]
}
```

### 2. Relationship Validation Failure (`400 Bad Request`)
When attempting to link a task to a non-existent user or project:
```json
{
  "success": false,
  "message": "Validation failed. Please verify your input.",
  "errors": [
    {
      "field": "assignedTo",
      "message": "Referenced assignedTo user 'usr_999' does not exist.",
      "value": "usr_999"
    }
  ]
}
```

### 3. Resource Not Found (`404 Not Found`)
```json
{
  "success": false,
  "message": "Project with ID 'prj_999' not found.",
  "errors": []
}
```

### 4. Duplicate Email Conflict (`409 Conflict`)
```json
{
  "success": false,
  "message": "User with email 'alex.rivera@devpulse.io' already exists.",
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered",
      "value": "alex.rivera@devpulse.io"
    }
  ]
}
```

---

## 12. HTTP Status Codes Reference

| HTTP Code | Name | Scenario Handled |
| :--- | :--- | :--- |
| `200` | OK | Successful record retrieval, standard update (`PUT`), and status patch (`PATCH`). |
| `201` | Created | Successful entity creation via `POST`. |
| `204` | No Content | Successful resource removal via `DELETE`. |
| `400` | Bad Request | Validation error, malformed JSON body, or non-existent relational reference (`ownerId`, `projectId`, `assignedTo`). |
| `404` | Not Found | Requested entity or route does not exist. |
| `409` | Conflict | Attempted creation/update violates unique constraint (e.g., duplicate user email). |
| `500` | Internal Server Error | Unhandled server exception caught safely by centralized error middleware. |

---

## 13. Example Postman Testing Workflow

To thoroughly verify this API using Postman:

1. **Environment Setup**:
   - Create a Postman Environment with `baseUrl = http://localhost:5000`.
2. **Step 1: Check Health & Uptime**:
   - `GET {{baseUrl}}/api/health` -> Verify status `200 OK` and `{ status: "healthy" }`.
3. **Step 2: Seeded Data Inspection**:
   - `GET {{baseUrl}}/api/users` -> View seeded developers and managers.
   - `GET {{baseUrl}}/api/projects` -> View seeded DevPulse projects.
   - `GET {{baseUrl}}/api/tasks` -> View seeded tasks.
4. **Step 3: User Lifecycle & Conflict Check**:
   - `POST {{baseUrl}}/api/users` with body `{"name": "Test User", "email": "test@devpulse.io", "role": "developer"}` -> Verify `201 Created`.
   - Re-send exact same `POST` request -> Verify `409 Conflict` (duplicate email prevented).
5. **Step 4: Relational Integrity Validation**:
   - `POST {{baseUrl}}/api/projects` with `ownerId: "usr_nonexistent"` -> Verify `400 Bad Request` with descriptive message.
   - `POST {{baseUrl}}/api/tasks` with `projectId: "prj_nonexistent"` -> Verify `400 Bad Request`.
6. **Step 5: Task Status Management**:
   - `PATCH {{baseUrl}}/api/tasks/tsk_2/status` with `{"status": "done"}` -> Verify `200 OK` with updated status.
   - `PATCH {{baseUrl}}/api/tasks/tsk_2/status` with `{"status": "invalid_status"}` -> Verify `400 Bad Request`.
7. **Step 6: Deletion & 404 Check**:
   - `DELETE {{baseUrl}}/api/tasks/tsk_5` -> Verify `204 No Content`.
   - `GET {{baseUrl}}/api/tasks/tsk_5` -> Verify `404 Not Found`.

---

## 14. Task 2 Requirements Coverage

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **1. User Management Endpoints** | Full CRUD implemented (`GET /api/users`, `GET :id`, `POST`, `PUT`, `DELETE`). | ✅ Complete |
| **2. Project Creation & Retrieval** | Implemented `POST`, `GET /api/projects`, `GET :id`, plus `PUT` and `DELETE`. | ✅ Complete |
| **3. Task Creation, Update, Deletion**| Implemented `POST`, `PUT`, `DELETE`, and `GET` for tasks. | ✅ Complete |
| **4. Task Status Management** | Dedicated `PATCH /api/tasks/:id/status` endpoint with strict enum validation (`todo`, `in-progress`, `done`). | ✅ Complete |
| **5. Centralized Error Handling** | Global Express error handler formatting all errors to uniform JSON structure. | ✅ Complete |
| **6. Input Validation** | Strict `express-validator` rules on every write endpoint (`POST`, `PUT`, `PATCH`). | ✅ Complete |
| **7. HTTP Status Codes** | Accurate status codes implemented (200, 201, 204, 400, 404, 409, 500). | ✅ Complete |
| **8. Environment Variables** | Configured via `dotenv` with `.env` and `.env.example`. | ✅ Complete |
| **9. Clear API Documentation** | Complete API documentation, schemas, and Postman workflow provided in README. | ✅ Complete |
| **10. In-Memory Mock Store** | Isolated thread-safe store (`mockData.js`) without persistent DBs as required. | ✅ Complete |

---

## 15. Future Task 3 Database Integration Note

> [!IMPORTANT]
> This Week 2 implementation deliberately encapsulates all data storage within `src/data/mockData.js`. 
>
> In **Week 3 (Task 3)**:
> 1. The mock data functions will be replaced with Mongoose/Prisma ODM or native drivers connecting to a persistent database (MongoDB or PostgreSQL).
> 2. Schema models will transition from memory arrays to database collections/tables.
> 3. Controller signatures are already async-ready (`try/catch` with `next(err)`), allowing a seamless drop-in database integration without altering the public API contracts or route architecture.

---

## 16. Video Demonstration Guide

For your Task 2 internship submission video, demonstrate the following key flows:

1. **Terminal & Server Launch**:
   - Show `.env` file and demonstrate running `npm run dev`.
   - Highlight the console startup banner showing the active port and endpoints.
2. **Automated Verification**:
   - Run `npm test` in the terminal to display all automated test assertions passing.
3. **Postman / Thunder Client Demonstration**:
   - **GET all users, projects, and tasks**: Show pre-seeded data returning HTTP `200`.
   - **POST user**: Create a new user with valid data -> show `201 Created`.
   - **POST duplicate user**: Submit the same email again -> demonstrate the `409 Conflict` response.
   - **POST task with invalid project**: Submit a task with `projectId: "invalid_id"` -> show `400 Bad Request` with relationship validation error.
   - **PATCH task status**: Update task `tsk_2` status from `in-progress` to `done` -> show `200 OK`.
   - **DELETE task**: Call `DELETE` on a task -> show `204 No Content`, then `GET` the same ID to verify `404 Not Found`.
4. **Code Architecture Walkthrough**:
   - Briefly explain the modular folder structure: controllers separated from routes, validators separated from controllers, and centralized `errorHandler.js`.
