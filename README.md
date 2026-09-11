# DevPulse - AI-Powered Project & Task Management Platform
## Innovation Hacks Capstone — Task 4

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT_%26_Cookies-orange.svg)](https://jwt.io/)
[![AI Powered](https://img.shields.io/badge/AI-Task_Generation-indigo.svg)](https://ai.google.dev/)

**DevPulse Capstone Platform** is a full-stack, production-ready project and task management system. It unifies the analytics concepts from **Task 1**, the RESTful architecture from **Task 2**, and the relational database foundations from **Task 3**, while introducing **JWT & HTTP-Only Cookie Authentication** and **AI-Assisted Task Generation**.

---

## 🎯 Task 4 Capstone Objectives

1. **Full-Stack Architecture**: Modern React (Vite + Tailwind CSS) client seamlessly paired with a Node.js + Express backend.
2. **Relational Persistence**: PostgreSQL (local or Neon serverless) orchestrated through the Prisma ORM.
3. **Secure Authentication & RBAC**: Password hashing via `bcrypt`, dual-mode token delivery (HTTP-Only cookies + Bearer tokens), and role-based permissions (`developer`, `designer`, `manager`).
4. **AI-Assisted Task Breakdown**: A configurable, real external AI service that parses project descriptions and objectives into actionable, structured engineering tasks for user review prior to database insertion.
5. **Interactive Dashboard & Search**: Rich visual metrics, task filters (project, priority, status, assignee), and recent activity tracking.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React + Vite + Tailwind CSS)"]
        UI[Responsive Modern UI]
        AuthCtx[Auth Context & State]
        ApiClient[Axios Client with Interceptors]
    end

    subgraph Server ["Backend (Node.js + Express REST API)"]
        AuthMid[Auth & JWT Middleware]
        ValMid[express-validator Middleware]
        Controllers[Auth, Project, Task & AI Controllers]
        AIService[Modular AI Provider Service]
        PrismaClient[Prisma ORM Client]
    end

    subgraph Database ["Data & External Services"]
        PG[(PostgreSQL / Neon Database)]
        AIProvider[External AI API: Google Gemini / OpenAI]
    end

    UI --> AuthCtx
    AuthCtx --> ApiClient
    ApiClient -- "HTTPS / Cookies / Bearer" --> Server
    Server --> AuthMid
    AuthMid --> ValMid
    ValMid --> Controllers
    Controllers --> PrismaClient
    Controllers --> AIService
    PrismaClient -- "SQL Connection Pool" --> PG
    AIService -- "HTTPS REST API" --> AIProvider
```

---

## 🗄️ Relational Database Schema

```mermaid
erDiagram
    User ||--o{ Project : "owns"
    User ||--o{ Task : "assigned to"
    User ||--o{ Activity : "performs"
    Project ||--o{ Task : "contains"
    Project ||--o{ Activity : "logs"
    Task ||--o{ Activity : "logs"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Project {
        String id PK
        String name
        String description
        String ownerId FK
        ProjectStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Task {
        String id PK
        String title
        String description
        String projectId FK
        String assignedTo FK
        Priority priority
        TaskStatus status
        DateTime dueDate
        DateTime createdAt
        DateTime updatedAt
    }

    Activity {
        String id PK
        String action
        String details
        String userId FK
        String projectId FK
        String taskId FK
        DateTime createdAt
    }
```

---

## 🤖 Real AI Task Generation Feature

The AI task generator helps engineering leads transform high-level project goals into actionable tasks:
- **Input**: Project Name, Description, Specific Goals, Desired Task Count.
- **AI Processing**: Communicates with the external AI provider (`gemini-1.5-flash` or OpenAI) via `src/services/aiService.js`.
- **Review Before Saving**: The AI responses are validated and presented to the user in an editable staging view.
- **User Control**: Users can modify titles, descriptions, and priorities, select/deselect specific tasks, and commit only the approved tasks to the database.

---

## 📁 Project Structure

```text
DevPulse-Task4-AI-Powered-Project-Task-Management-Platform/
├── client/                       # React 18 Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth & Theme context providers
│   │   ├── pages/                # Dashboard, Projects, Tasks, AI Generator, Auth
│   │   ├── services/             # Axios API client with token interceptors
│   │   ├── App.jsx               # Route definitions & navigation shell
│   │   ├── index.css             # Tailwind CSS tokens
│   │   └── main.jsx              # DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── server/                       # Express REST API (Node.js + Prisma ORM)
│   ├── prisma/
│   │   ├── schema.prisma         # Models: User, Project, Task, Activity
│   │   └── seed.js               # Hashed passwords & realistic seed data
│   ├── src/
│   │   ├── config/               # Prisma client singleton
│   │   ├── controllers/          # Auth, Project, Task, User, AI controllers
│   │   ├── middleware/           # JWT Auth, express-validator, centralized error handling
│   │   ├── routes/               # API route mounts
│   │   ├── services/             # Modular AI service (Gemini / external)
│   │   ├── validators/           # Request schema validation chains
│   │   └── app.js                # Express app configuration & CORS
│   ├── tests/
│   │   └── testApi.js            # End-to-end API test suite
│   ├── server.js                 # Server entry point & graceful shutdown
│   ├── package.json
│   └── .env.example
│
├── package.json                  # Root runner (concurrent client + server)
├── .env.example                  # Root template
├── .gitignore                    # Strictly ignores .env and node_modules
└── README.md
```

---

## ⚙️ Environment Variables

### Root / Server (`server/.env`)
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
PORT=5000
NODE_ENV=development
JWT_SECRET="replace_with_a_secure_random_jwt_secret_min_32_chars"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
AI_PROVIDER="gemini"
AI_API_KEY="your_ai_api_key_here"
AI_MODEL="gemini-1.5-flash"
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## 🚀 Setup & Local Execution

### 1. Install All Dependencies
From the project root:
```bash
npm run install:all
```
*(Installs root, server, and client dependencies concurrently).*

### 2. Configure Environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Run Prisma Migrations & Seed
```bash
npm run prisma:migrate
npm run seed
```

### 4. Start Full-Stack Application
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user with hashed password |
| `POST` | `/api/auth/login` | Public | Login & receive JWT / HTTP-Only cookie |
| `POST` | `/api/auth/logout` | Authenticated | Clear auth cookie and session |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |
| `GET` | `/api/projects` | Authenticated | List all projects with progress & stats |
| `GET` | `/api/projects/:id` | Authenticated | Retrieve project details & tasks |
| `POST` | `/api/projects` | Authenticated | Create new project |
| `PUT` | `/api/projects/:id` | Authenticated | Update existing project |
| `DELETE` | `/api/projects/:id` | Authenticated | Delete project (cascades tasks) |
| `GET` | `/api/tasks` | Authenticated | Search & filter tasks |
| `GET` | `/api/tasks/:id` | Authenticated | Retrieve single task |
| `POST` | `/api/tasks` | Authenticated | Create new task |
| `PUT` | `/api/tasks/:id` | Authenticated | Update complete task |
| `PATCH` | `/api/tasks/:id/status`| Authenticated | Quick status update (`todo`, `in-progress`, `done`) |
| `DELETE` | `/api/tasks/:id` | Authenticated | Delete task |
| `POST` | `/api/ai/generate-tasks`| Authenticated | Generate structured tasks with AI |
| `GET` | `/api/health` | Public | Database & AI service health check |

---

## 🚢 Deployment Architecture

- **Frontend**: [Vercel](https://vercel.com) (Root directory set to `client`)
- **Backend API**: [Render](https://render.com) (Root directory set to `server`, web service)
- **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL with SSL)
