# DevPulse - Persistent Data Layer (PostgreSQL & Prisma)
## Week 3 / Task 3 - Innovation Hacks

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21.2-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748.svg)](https://www.prisma.io/)

A production-grade RESTful backend providing a persistent relational data layer for the **DevPulse Developer Productivity Dashboard**. This project builds upon the in-memory architecture established in Week 2 / Task 2, transitioning data persistence to **PostgreSQL** using the **Prisma ORM**.

---

## 📋 Task 3 Requirements Covered

| Requirement | Implementation Detail |
|---|---|
| **Relational Persistence** | Real PostgreSQL database storage for `Users`, `Projects`, and `Tasks`. |
| **Complete CRUD** | Full Create, Read, Update, Delete routes for all 3 entities. |
| **Relational Integrity** | Explicit Foreign Keys (`Project.ownerId → User.id`, `Task.projectId → Project.id`, `Task.assignedTo → User.id`). |
| **Cascade & SetNull** | Safe cascading deletes (`onDelete: Cascade` for projects/tasks, `SetNull` for task assignees). |
| **Request Validation** | Declarative schema validation using `express-validator`. |
| **Centralized Error Handling** | Standardized JSON error envelopes, HTTP status codes, and mapped Prisma error codes (`P2002`, `P2025`, `P2003`). |
| **Secure Configuration** | Environment variables via `.env` (git-ignored) and clean committed `.env.example`. |
| **Database Seeding** | Automated script (`prisma/seed.js`) populating realistic productivity data. |
| **Automated Testing** | End-to-end verification suite in `tests/testApi.js`. |

---

## 🏛️ Architecture & Tech Stack

```text
DevPulse-Week3-Task3-Persistent-Data-Layer-PostgreSQL/
│
├── prisma/
│   ├── schema.prisma             # Relational models, enums & foreign keys
│   └── seed.js                   # Idempotent seed script
│
├── src/
│   ├── config/
│   │   └── prisma.js             # Singleton PrismaClient instance
│   │
│   ├── controllers/              # Business logic & Prisma query execution
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   │
│   ├── routes/                   # Express REST endpoints
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   │
│   ├── middleware/               # Centralized error handler & validation runner
│   │   ├── errorHandler.js
│   │   └── validate.js
│   │
│   ├── validators/               # express-validator chains
│   │   ├── userValidator.js
│   │   ├── projectValidator.js
│   │   └── taskValidator.js
│   │
│   └── app.js                    # Express app configuration & middleware mounts
│
├── tests/
│   └── testApi.js                # Verification test suite
│
├── server.js                     # HTTP server startup & graceful shutdown
├── .env                          # Local secrets (ignored by git)
├── .env.example                  # Template with placeholders
├── .gitignore
└── package.json
```

---

## 🐘 Why PostgreSQL + Prisma ORM?

1. **Relational Guarantees & Constraints**:
   - Unlike document databases, PostgreSQL enforces relational referential integrity at the engine level. A project cannot point to a deleted user without triggering the defined constraint (`CASCADE` or `RESTRICT`).
2. **Type Safety & Auto-Generated Client**:
   - Prisma reads the declarative `schema.prisma` file and generates a type-safe JavaScript query builder (`@prisma/client`), eliminating boilerplate SQL while preventing SQL injection.
3. **Declarative Migrations**:
   - `prisma migrate` automatically tracks schema changes, generates timestamped SQL migration scripts, and applies them deterministically across local, staging, and production environments.

---

## 🗄️ Database Schema & Entity Relationships

```
 ┌──────────────────────┐
 │         User         │
 ├──────────────────────┤
 │ id (UUID) [PK]       │
 │ name (String)        │
 │ email (String) [UQ]  │
 │ role (Enum)          │
 │ createdAt (DateTime) │
 │ updatedAt (DateTime) │
 └──────────┬───────────┘
            │ 1
            │
            │ owns (1:N)
            ▼ N
 ┌──────────────────────┐             ┌──────────────────────┐
 │       Project        │ 1         N │         Task         │
 ├──────────────────────┼─────────────┼──────────────────────┤
 │ id (UUID) [PK]       │   has many  │ id (UUID) [PK]       │
 │ name (String)        │             │ title (String)       │
 │ description (String) │             │ description (String) │
 │ ownerId (UUID) [FK]  │             │ projectId (UUID) [FK]│
 │ status (Enum)        │             │ assignedTo (UUID)[FK]│
 │ createdAt (DateTime) │             │ priority (Enum)      │
 │ updatedAt (DateTime) │             │ status (Enum)        │
 └──────────────────────┘             │ dueDate (DateTime)   │
                                      │ createdAt (DateTime) │
                                      │ updatedAt (DateTime) │
                                      └──────────────────────┘
```

### Enums
- **User Role**: `developer`, `designer`, `manager`
- **Project Status**: `active`, `completed`, `archived`
- **Task Priority**: `low`, `medium`, `high`
- **Task Status**: `todo`, `in-progress` (mapped to `in_progress`), `done`

---

## 🚀 Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- A PostgreSQL server running locally (e.g. via PostgreSQL installer, Homebrew, Docker) or in the cloud (Neon, Supabase, Railway, Aiven, ElephantSQL).

### 2. Install Dependencies
```bash
cd DevPulse-Week3-Task3-Persistent-Data-Layer-PostgreSQL
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your actual PostgreSQL connection credentials:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/devpulse_db?schema=public"
PORT=5000
NODE_ENV=development
```

> [!IMPORTANT]
> Never commit `.env` with real credentials. `.env` is already configured in `.gitignore`.

---

## 🔄 Prisma Migrations & Database Seeding

### 1. Generate Prisma Client
```bash
npm run prisma:generate
```

### 2. Create & Apply Migrations
Creates the PostgreSQL database tables, enums, foreign keys, and indexes:
```bash
npm run prisma:migrate
# Or: npx prisma migrate dev --name init_persistent_data_layer
```

### 3. Seed Database with Sample Data
Populates the database with 4 users, 3 projects, and 6 relational tasks:
```bash
npm run seed
```

### 4. Optional: Inspect with Prisma Studio
View and manipulate database records in a visual web UI:
```bash
npm run prisma:studio
```

---

## 📡 API Endpoints

### Base URL
`http://localhost:5000`

### Health & Root
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status, version, and route directory |
| `GET` | `/api/health` | Service uptime and live PostgreSQL connectivity check |

### Users (`/api/users`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/users` | List all users (supports `?role=developer`) | `200` |
| `GET` | `/api/users/:id` | Get user by UUID with projects & tasks | `200`, `404` |
| `POST` | `/api/users` | Create user `{ name, email, role }` | `201`, `400`, `409` |
| `PUT` | `/api/users/:id` | Update user by UUID | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/users/:id` | Delete user by UUID | `204`, `404` |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/projects` | List all projects (supports `?status=&ownerId=`) | `200` |
| `GET` | `/api/projects/:id` | Get project by UUID with owner & tasks | `200`, `404` |
| `POST` | `/api/projects` | Create project `{ name, description, ownerId, status }` | `201`, `400` |
| `PUT` | `/api/projects/:id` | Update project by UUID | `200`, `400`, `404` |
| `DELETE` | `/api/projects/:id` | Delete project by UUID (cascades tasks) | `204`, `404` |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/tasks` | List all tasks (supports `?projectId=&assignedTo=&status=&priority=`) | `200` |
| `GET` | `/api/tasks/:id` | Get task by UUID with project and assignee | `200`, `404` |
| `POST` | `/api/tasks` | Create task `{ title, description, projectId, assignedTo, priority, status, dueDate }` | `201`, `400` |
| `PUT` | `/api/tasks/:id` | Update complete task by UUID | `200`, `400`, `404` |
| `PATCH` | `/api/tasks/:id/status` | Update only task status `{ status: "done" }` | `200`, `400`, `404` |
| `DELETE` | `/api/tasks/:id` | Delete task by UUID | `204`, `404` |

---

## 🧪 Testing

Run the automated verification suite:
```bash
npm test
```

The test script automatically:
1. Spawns an ephemeral Express server on an available port.
2. Asserts HTTP 200 on `/` and `/api/health`.
3. Validates 404 fallback routing.
4. Executes validation checks (invalid email, missing required fields, invalid enum values).
5. When PostgreSQL is connected: executes live CRUD, foreign-key constraint enforcement, duplicate email 409 conflict checks, and cascading deletes.
