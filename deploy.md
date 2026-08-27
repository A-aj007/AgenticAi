# 🚀 Full-Stack Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide walks you through deploying **Agentflow_AI** to production with:
- **Frontend**: [Vercel](https://vercel.com) (Next.js)
- **Backend API & WebSockets**: [Render](https://render.com) (Node.js Express + Socket.IO)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud Cluster)

---

## 📋 Architecture Overview

```
 [ Browser / User ]
         │
         ├─── (HTTPS) ─────────► [ Vercel ] (Next.js Frontend Client)
         │                               │
         │                               │ REST API & WebSockets
         │                               ▼
         └─── (WSS / HTTPS) ───► [ Render ] (Express Backend API + Socket.IO)
                                         │
                                         ▼
                                [ MongoDB Atlas ] (Cloud Database)
```

---

## 🛠️ Step 1: Push Code to GitHub

Before deploying, commit and push your project to a new GitHub repository.

### 1.1 Initialize Git in the Project Root
Run these commands from your project root folder (`/Users/amitanandjadhav/Desktop/project folder`):

```bash
git init
git add .
git commit -m "feat: complete Agentflow_AI platform for production deployment"
```

### 1.2 Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Set repository name (e.g. `agentflow-ai`).
3. Keep it **Public** or **Private**.
4. **Do NOT** initialize with README or .gitignore (we already created them).
5. Click **Create repository**.

### 1.3 Link and Push Code
Copy the commands shown on GitHub:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/agentflow-ai.git
git push -u origin main
```

---

## 🍃 Step 2: Set Up Free Cloud MongoDB Atlas Database

If you haven't set up MongoDB Atlas yet:

1. **Sign In**: Go to [MongoDB Atlas](https://cloud.mongodb.com) and log in or create a free account.
2. **Create Database Cluster**:
   - Choose **M0 Free Shared Cluster**.
   - Select your preferred cloud provider (AWS/GCP) and region closest to your users.
   - Click **Create Deployment**.
3. **Set Up Database User**:
   - Under **Database Access** &rarr; **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `agentflow_admin` (or your choice).
   - Password: Click **Autogenerate Secure Password** and **copy it safely**.
   - Built-in Role: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network Access (Whitelist IPs)**:
   - Under **Security** &rarr; **Network Access** &rarr; **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**.
5. **Get Connection String**:
   - Go to **Database** &rarr; Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the URI string, which looks like:
     ```text
     mongodb+srv://agentflow_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=AgenticAI
     ```
   - Replace `<password>` with your real user password and insert the database name `agentflow_ai` before the `?`:
     ```text
     mongodb+srv://agentflow_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agentflow_ai?retryWrites=true&w=majority&appName=AgenticAI
     ```

---

## 🖥️ Step 3: Deploy Backend Web Service on Render.com

Render will host your Express API server and Socket.IO real-time engine.

1. **Sign In to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2. **Create New Web Service**:
   - Click **New +** &rarr; **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your GitHub account and select your `agentflow-ai` repository.
3. **Configure Service Settings**:
   - **Name**: `agentflow-ai-server` (or any unique name)
   - **Region**: Select region closest to your MongoDB Atlas region (e.g. *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch**: `main`
   - **Root Directory**: `server` *(Important!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js` (or `npm start`)
   - **Instance Type**: `Free`
4. **Add Environment Variables**:
   Under the **Environment Variables** section, add the following key-value pairs:

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render standard port |
   | `MONGODB_URI` | `mongodb+srv://agentflow_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agentflow_ai?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `CLIENT_URL` | `http://localhost:3000` | We will add your Vercel URL here after Step 4 |
   | `JWT_SECRET` | `generate_any_secure_random_string_here_32_chars` | Secret key to sign user login tokens |
   | `JWT_EXPIRES_IN` | `7d` | Token expiration |
   | `CREDENTIAL_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte hex key for OAuth token vault |
   | `GEMINI_API_KEY` | `YOUR_GEMINI_API_KEY` | *(Optional)* Google Gemini API key for AI generation |
   | `OPENROUTER_API_KEY` | `YOUR_OPENROUTER_KEY` | *(Optional)* OpenRouter AI key |

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build and deploy your backend.
   - Once deployed (Status: **Live**), copy your public Render URL from the top of the dashboard:
     ```text
     https://agentflow-ai-server.onrender.com
     ```
   - Test it by opening: `https://agentflow-ai-server.onrender.com/api/health`
   - It should return: `{"status":"HEALTHY","service":"Agentflow_AI API Engine",...}`

---

## 🌐 Step 4: Deploy Frontend on Vercel

Vercel provides lightning-fast edge hosting optimized for Next.js.

1. **Sign In to Vercel**: Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. **Import Project**:
   - Click **Add New...** &rarr; **Project**.
   - Locate your `agentflow-ai` repository and click **Import**.
3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js` (automatically detected)
   - **Root Directory**: Click **Edit** &rarr; Select `client` &rarr; Click **Continue**. *(Important!)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. **Add Environment Variables**:
   Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://agentflow-ai-server.onrender.com` *(Replace with your real Render URL from Step 3)* |

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will build the Next.js pages and deploy globally.
   - Once done, you will receive your live production URL:
     ```text
     https://agentflow-ai.vercel.app
     ```

---

## 🔄 Step 5: Connect Vercel URL to Render CORS

Now that you have your live frontend URL from Vercel:

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Select your `agentflow-ai-server` service &rarr; Click **Environment**.
3. Update the `CLIENT_URL` environment variable:
   ```text
   CLIENT_URL=https://agentflow-ai.vercel.app,http://localhost:3000
   ```
4. Click **Save Changes**. Render will automatically redeploy the backend in ~30 seconds.

---

## ✅ Step 6: Post-Deployment Verification Checklist

Open your live frontend URL (`https://agentflow-ai.vercel.app`) and verify:

- [ ] **Health & Connectivity**: System is connected to the backend API.
- [ ] **User Registration**: Register a new account at `/register` — confirm you are redirected to `/dashboard`.
- [ ] **Persistence**: Log out and log back in with the same email and password to verify cloud MongoDB Atlas storage.
- [ ] **AI Synthesis**: Navigate to `/workflows/builder`, type an automation prompt (e.g. *"When a refund request is received via Gmail, analyze sentiment and alert Slack"*), and click **Synthesize**.
- [ ] **Visual Studio**: Open the generated graph in `/workflows/[id]` and test node drag-and-drop.
- [ ] **Live Execution & WebSockets**: Execute a workflow and confirm real-time multi-agent execution logs stream into the timeline.

---

## 🔧 Troubleshooting & Tips

### 1. Free Tier Render "Spin Down"
- Render free tier web services spin down after 15 minutes of inactivity.
- The first request after idle might take ~30-50 seconds to wake up. Subsequent requests are instantaneous.
- *Tip*: You can use a free uptime monitor (like [UptimeRobot](https://uptimerobot.com)) to ping `https://your-backend.onrender.com/api/health` every 10 minutes to keep it always awake!

### 2. CORS Errors in Browser Console
- If you see `Access to XMLHttpRequest blocked by CORS policy`, verify that:
  1. `CLIENT_URL` on Render includes your exact Vercel domain (e.g. `https://agentflow-ai.vercel.app`).
  2. `NEXT_PUBLIC_API_URL` on Vercel is set to your exact Render URL without a trailing slash (e.g. `https://agentflow-ai-server.onrender.com`).

### 3. MongoDB Connection Timeout
- If Render logs show `Could not connect to MongoDB Atlas`, verify:
  1. In MongoDB Atlas &rarr; **Network Access**, IP `0.0.0.0/0` is allowed.
  2. Your MongoDB username and password in `MONGODB_URI` contain no unescaped special characters (e.g. `@`, `:`, `/`).
