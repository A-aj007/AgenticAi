# Agentflow_AI — Agentic AI Operations Automation Platform

An enterprise-grade, full-stack AI Operations Automation Platform that turns natural language automation prompts into executable visual workflows. Workflows are rendered on an interactive **React Flow** canvas and executed across a 5-stage chain of cooperating AI agents with third-party tool integrations (Gmail, Slack, Discord, Google Sheets), real-time **Socket.IO** event streaming, background queues, and a persistent audit trail in **MongoDB**.

---

## 💾 Database Architecture & Login Credential Storage

### 🗄️ Where Login Email & Password are Stored

All user accounts, credentials, workflows, and execution audit trails are stored in **MongoDB** in the `agentflow_ai` database.

#### 1. Target Database & Collection:
- **Database Name**: `agentflow_ai`
- **Collection Name**: `users`

#### 2. User Document Schema in MongoDB:
```json
{
  "_id": "6a9085abe9d1d6f396a911b4",
  "name": "Alex Rivera",
  "email": "alex@company.com",
  "password": "$2a$12$e0p/5.M3q6sJkR47p... (Bcrypt Cost 12 Salted Hash)",
  "role": "operator",
  "lastLogin": "2026-08-28T00:15:00.111Z",
  "createdAt": "2026-08-28T00:14:59.707Z",
  "updatedAt": "2026-08-28T00:15:00.111Z"
}
```

> [!IMPORTANT]
> **Password Security**: Passwords are **NEVER** stored in plain text. When a user registers or changes their password, it is automatically hashed using **Bcrypt with a salt cost factor of 12** (`bcryptjs`). Only the cryptographic one-way hash is saved in the database.

---

### 📍 Storage Locations & Connection Modes

Your database runs in one of the following configurations:

| Mode | Active Connection String | Physical Data Location on Disk | Persistence Across `npm run dev` Restarts |
|---|---|---|---|
| **Local MongoDB Service** *(Recommended & Default)* | `mongodb://127.0.0.1:27017/agentflow_ai` | Local MongoDB storage (e.g. `/opt/homebrew/var/mongodb` on macOS) | **100% Persistent** across all restarts |
| **MongoDB Atlas Cloud** | `mongodb+srv://<username>:<password>@cluster.mongodb.net/agentflow_ai` | MongoDB Cloud Cluster in AWS/GCP | **100% Persistent** in the cloud |
| **Embedded Disk Fallback** | `server/data/db/` via embedded engine | `server/data/db/` directory in project | **Persistent** on disk |

---

### 🔍 How to Check and Inspect Stored Login Credentials

You can inspect your registered users and database status using any of the following methods:

#### Method 1: Built-in Terminal CLI Inspector (Easiest)
Run the inspector script anytime directly from your terminal:
```bash
npm run db:inspect
```
This prints an instant formatted table of all registered users, their roles, email addresses, registration dates, and last login timestamps:
```
👤 REGISTERED USERS (2):
┌─────────┬────────────────────────────┬─────────────────┬─────────────────────────┬────────────┬──────────────────────────┐
│ (index) │ ID                         │ Name            │ Email                   │ Role       │ LastLogin                │
├─────────┼────────────────────────────┼─────────────────┼─────────────────────────┼────────────┼──────────────────────────┤
│ 0       │ '6a9085abe9d1d6f396a911b0' │ 'Lead Operator' │ 'operator@agentflow.ai' │ 'admin'    │ '8/28/2026, 12:14:59 AM' │
│ 1       │ '6a9085abe9d1d6f396a911b4' │ 'John Doe'      │ 'john.doe@example.com'  │ 'operator' │ '8/28/2026, 12:15:00 AM' │
└─────────┴────────────────────────────┴─────────────────┴─────────────────────────┴────────────┴──────────────────────────┘
```

#### Method 2: Via MongoDB Shell (`mongosh`)
Connect directly to the local MongoDB database via terminal:
```bash
mongosh "mongodb://127.0.0.1:27017/agentflow_ai" --eval "db.users.find({}, { name: 1, email: 1, role: 1, createdAt: 1 })"
```

#### Method 3: Via MongoDB Compass (GUI)
1. Open **MongoDB Compass**.
2. Connect to URI: `mongodb://127.0.0.1:27017` (or your MongoDB Atlas connection string).
3. Navigate to database **`agentflow_ai`** &rarr; collection **`users`**.
4. View, edit, or manage user profiles directly.

---

## 🌟 Key Features

- **Natural Language Prompt-to-Workflow Generator**: 3-tier synthesis engine (**OpenRouter** &rarr; **Google Gemini** &rarr; **Deterministic Rule Engine**) with dynamic live prompt auto-suggestions and 1-click synthesis.
- **Interactive Visual Canvas**: Drag-and-drop node palette, animated edge connections, mini-map, and sliding configuration inspector built with `@xyflow/react`.
- **5-Stage Multi-Agent Orchestration Chain**:
  1. **Planner Agent**: Computes topological sort execution order and assigns plan confidence scores.
  2. **Execution Agent**: Runs nodes against AI models or third-party integrations with dynamic variable interpolation (`{{nodes.nodeId.output}}`).
  3. **Validation Agent**: Validates output field integrity and schema adherence.
  4. **Recovery Agent**: Classifies failures (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and applies exponential backoff or escalation.
  5. **Monitoring Agent**: Emits live Socket.IO events and records persistent `ExecutionLog` audit documents.
- **Live Real-Time Execution Streaming**: Live step-by-step agent logs, color-coded agent badges, and in-app notifications drawer.
- **Execution Lifecycle Controls**: Real-time **Pause**, **Resume**, and **Cancel** signals.
- **Third-Party Integrations & AES-256 Token Vault**: OAuth 2.0 and manual token management for **Gmail**, **Slack**, **Discord**, and **Google Sheets**, with sensitive access and refresh tokens encrypted at rest with `CREDENTIAL_ENCRYPTION_KEY`.
- **Zero-Config Local Startup**: Built-in disk-backed MongoDB and in-memory execution queue fallbacks so the entire application runs instantly out of the box without requiring external database or Redis daemons!

---

## 🏗️ Architecture Overview

```
                                +---------------------------+
                                | Operator / Browser Client |
                                +-------------+-------------+
                                              |
                          HTTP REST (JWT)     |     Socket.IO Events
                          +-------------------+-------------------+
                          |                                       |
                          v                                       v
               +--------------------+                   +--------------------+
               | Next.js Frontend   |                   | Express API Server |
               | (Pages Router :3000|                   | (Node.js :5001)    |
               +--------------------+                   +---------+----------+
                                                                  |
                      +-------------------------------------------+-----------------------------------+
                      |                                           |                                   |
                      v                                           v                                   v
          +-----------------------+                   +-----------------------+           +-----------------------+
          | BullMQ / In-Memory Q  |                   | MongoDB / Local Disk  |           | Socket.IO Live Hub    |
          +-----------+-----------+                   +-----------------------+           +-----------------------+
                      |
                      v
          +---------------------------------------------------------------------------------------------------+
          |                                 5-Stage Multi-Agent Orchestrator                                  |
          |                                                                                                   |
          |   [1. Planner Agent]  -->  [2. Execution Agent]  -->  [3. Validation Agent]                       |
          |                                    |                                                              |
          |                            Integration Service                                                    |
          |                        (Gmail/Slack/Discord/Sheets)                                               |
          |                                                                                                   |
          |                        --> [4. Recovery Agent]   -->  [5. Monitoring Agent]                       |
          |                           (Backoff & Retries)        (Logs & Socket Broadcast)                    |
          +---------------------------------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (Pages Router)
- **UI Library**: React 19, Tailwind CSS, Lucide React
- **Visual Canvas**: React Flow (`@xyflow/react`)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-Time Client**: Socket.IO Client

### Backend
- **Server**: Node.js, Express
- **Database**: MongoDB via Mongoose (with automatic disk-backed persistent fallback in `server/data/db/`)
- **Queue / Background Jobs**: BullMQ on Redis via `ioredis` (with automatic in-memory queue fallback)
- **Real-Time Hub**: Socket.IO
- **Security**: JSON Web Tokens (JWT), Bcrypt.js (Cost 12), Helmet, CORS, Express Validator, Express Rate Limit, AES-256-CBC token encryption
- **AI Integrations**: OpenRouter API, Google Generative AI (`@google/generative-ai`), LangGraph orchestration substrate

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

---

### 2. Installation

Clone the repository and install all dependencies (root, server, and client) with a single command:

```bash
npm run install:all
```

---

### 3. Environment Configuration

Default environment files are already pre-configured in `server/.env`.

To connect to your **MongoDB Atlas Cloud Cluster**, replace `<db_username>` with your actual MongoDB username in `server/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:o9xkNmIiypPGyeTX@agenticai.9mh6cmx.mongodb.net/agentflow_ai?appName=AgenticAI
```

*(If `MONGODB_URI` is left blank, all data is automatically saved locally to `server/data/db/` on your disk and kept across restarts).*

---

### 4. Run the Application

Start both the backend server (`:5001`) and frontend client (`:3000`) concurrently:

```bash
npm run dev
```

---

### 5. Access the Web Application

- Open your browser at: **[http://localhost:3000](http://localhost:3000)**
- **Default Seeded Account**:
  - **Email**: `operator@agentflow.ai`
  - **Password**: `Password123!`
  *(Or register a new account on `/register` — it will be saved permanently).*

---

## 📖 Step-by-Step Feature Walkthrough

### 1. Dashboard (`/dashboard`)
- View aggregated operational metrics: **Total Workflows**, **Total Executions**, **Success Rate %**, and **Average Duration**.
- View recent executions with live status badges.
- Launch quick automation templates.

### 2. Prompt-to-Workflow AI Builder (`/workflows/builder`)
1. Click the prompt box or start typing (e.g. *"invoice"*, *"support"*, *"discord"*, *"sheets"*).
2. Live suggestions filter dynamically as you type. Click any suggestion or click **Synthesize** to instantly generate the graph.
3. Click **Execute Multi-Agent Run** or **Open in Canvas Studio**.

### 3. Visual Workflow Studio (`/workflows/[id]`)
1. **Left Panel (Node Palette)**: Drag triggers, AI actions, Gmail, Slack, Discord, Google Sheets, or logic nodes directly onto the canvas.
2. **Center Canvas**: Connect nodes with animated edges, zoom, pan, or use the mini-map.
3. **Right Panel (Config Panel)**: Click any node to customize parameters, action types, or reference upstream node variables using `{{nodes.nodeId.output}}`.
4. Click **Execute Agent Flow** to run.

### 4. Real-Time Execution Live View (`/executions/[id]`)
- Watch live agent logs stream into the timeline in real time via Socket.IO:
  - 🟣 **Planner Agent**: Generates topological execution order and confidence scores.
  - 🔵 **Execution Agent**: Dispatches actions and interpolates variables.
  - 🟢 **Validation Agent**: Checks schema and output field integrity.
  - 🟠 **Recovery Agent**: Evaluates errors and calculates exponential backoff retries.
  - 🔘 **Monitoring Agent**: Emits audit logs and user notifications.
- Use lifecycle controls to **Pause**, **Resume**, or **Cancel** active runs.
- Inspect JSON outputs and error taxonomy classifications.

### 5. Integrations & Credential Vault (`/integrations`)
- Connect and test **Gmail**, **Slack**, **Discord**, and **Google Sheets**.
- Initiate standard OAuth 2.0 authorization flows or provide manual API tokens.
- All tokens are automatically encrypted at rest using AES-256.

### 6. Platform Settings (`/settings`)
- View authenticated operator profile and role permissions (`Admin` / `Operator`).
- Inspect real-time health of Backend API, LangGraph engine, BullMQ Queue, and AES-256 Encryption Vault.

---

## 📡 API Reference Summary

### Authentication & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System heartbeat, LangGraph status, and queue diagnostics |
| `POST` | `/api/auth/register` | Register new user account (role: `operator` or `admin`) |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### Workflows
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workflows/dashboard` | Aggregated dashboard KPI metrics |
| `GET` | `/api/workflows` | List workflows with pagination & search |
| `POST` | `/api/workflows` | Create a new workflow manually |
| `POST` | `/api/workflows/generate` | AI prompt-to-workflow graph synthesis |
| `GET` | `/api/workflows/:id` | Fetch single workflow details |
| `PUT` | `/api/workflows/:id` | Update workflow nodes, edges, & configs |
| `POST` | `/api/workflows/:id/duplicate` | Clone workflow |
| `POST` | `/api/workflows/:id/execute` | Dispatch workflow execution to queue |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |

### Executions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/executions` | List execution history with filters |
| `GET` | `/api/executions/:id` | Fetch execution snapshot & outputs |
| `GET` | `/api/executions/:id/timeline` | Fetch granular agent timeline logs |
| `POST` | `/api/executions/:id/pause` | Pause active execution |
| `POST` | `/api/executions/:id/resume` | Resume paused execution |
| `POST` | `/api/executions/:id/cancel` | Cancel active execution |

### Integrations & Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/integrations` | List integration connection states |
| `GET` | `/api/integrations/status` | Token health check & provider validity |
| `GET` | `/api/integrations/oauth/:provider/start` | Generate OAuth start authorization URL |
| `GET` | `/api/integrations/oauth/:provider/callback` | OAuth redirect callback handler |
| `POST` | `/api/integrations` | Save manual encrypted credentials |
| `DELETE` | `/api/integrations/:provider` | Disconnect integration |
| `GET` | `/api/notifications` | List user notifications drawer alerts |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read |

---

## 🔒 Security & Best Practices

- **Password Hashing**: Bcrypt with cost factor 12.
- **Token Storage**: OAuth access and refresh tokens are encrypted at rest with AES-256-CBC using `CREDENTIAL_ENCRYPTION_KEY`.
- **API Security**: HTTP security headers via `helmet`, strict CORS origin matching, rate limiting on auth routes, and body validation via `express-validator`.
- **Explicit Error Taxonomy**: Missing/expired credentials surface as explicit `INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED` codes instead of generic 500 errors.

---

## 📄 License
This project is licensed under the MIT License.
