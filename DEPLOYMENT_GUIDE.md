# Production Deployment Guide

This guide provides a comprehensive, step-by-step procedure to deploy the BugLog Developer Learning Platform to production.

We will deploy the application using the following free hosting stack:
*   **Database:** MongoDB Atlas (Free Shared Cluster)
*   **Backend API:** Render (Node.js Free Web Service)
*   **Frontend Client:** Vercel (Static Web Hosting)

---

## Prerequisites

Before starting, ensure you have:
1.  A [GitHub](https://github.com) account.
2.  A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
3.  A [Render](https://render.com) account.
4.  A [Vercel](https://vercel.com) account.
5.  Git installed on your local machine.

---

## 1. GitHub Repository Setup

Both Render and Vercel will deploy directly from your GitHub repository.

1.  Create a new **private** or **public** repository on GitHub (e.g., `buglog`).
2.  Initialize Git in your local project root if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of BugLog codebase"
    ```
3.  Link your local repository to your GitHub repository and push your code:
    ```bash
    git remote add origin https://github.com/<your-username>/buglog.git
    git branch -M main
    git push -u origin main
    ```

---

## 2. Database Setup (MongoDB Atlas)

BugLog requires a MongoDB database. MongoDB Atlas provides a free cloud-hosted database tier.

1.  Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Click **Create a Database** and select the **M0 Free Shared** tier.
3.  Choose a cloud provider (e.g., AWS) and select a region close to your target audience.
4.  Configure **Security Quickstart**:
    *   **Username:** Enter a database username (e.g., `buglog-admin`).
    *   **Password:** Click **Generate Password** (copy and store this securely).
    *   Click **Create User**.
5.  Configure **IP Access List**:
    *   Click **Add IP Address**.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`). This is necessary because Render's free tier IP addresses change dynamically.
    *   Click **Add IP Address**.
6.  Once the cluster finishes provisioning, click **Connect** on the Database Overview screen:
    *   Select **Drivers** (under "Connect to your application").
    *   Copy the connection string (looks like `mongodb+srv://buglog-admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).
    *   Replace `<password>` in the connection string with the password generated in step 4, and append the database name `buglog` before the query parameters (e.g. `...mongodb.net/buglog?retryWrites=true...`).

---

## 3. Backend Deployment (Render)

You can deploy the Node.js backend using Render's Blueprint specification (`render.yaml`) or manually via the Render Dashboard.

### Method A: Blueprint Deployment (Recommended)
We have pre-configured a [render.yaml](file:///c:/Users/padhu/Downloads/BUGLOG/render.yaml) file in the root of the project.

1.  Log in to [Render](https://render.com).
2.  Click **Blueprints** in the top navigation.
3.  Click **New Blueprint Instance**.
4.  Connect your GitHub repository.
5.  Render will automatically parse the `render.yaml` file:
    *   **Service Name:** `buglog-backend` (Web Service)
    *   **Environment Variables:**
        *   `MONGODB_URI`: Paste your MongoDB Atlas connection string here.
        *   `ALLOWED_ORIGINS`: Paste your future Vercel frontend URL (e.g., `https://buglog-frontend.vercel.app`).
        *   `JWT_SECRET` will be automatically generated as a secure random string.
6.  Click **Approve**. Render will provision and deploy the backend.

### Method B: Manual Deployment
If you prefer not to use the Blueprint:
1.  On the Render Dashboard, click **New +** and select **Web Service**.
2.  Connect your GitHub repository.
3.  Configure the service details:
    *   **Name:** `buglog-backend`
    *   **Root Directory:** `backend`
    *   **Language:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Instance Type:** `Free`
4.  Click **Advanced** and add the following Environment Variables:
    *   `NODE_ENV` = `production`
    *   `PORT` = `10000`
    *   `MONGODB_URI` = *Your MongoDB Atlas connection URI*
    *   `JWT_SECRET` = *A strong random hash string (e.g. `openssl rand -base64 32`)*
    *   `JWT_EXPIRES_IN` = `7d`
    *   `ALLOWED_ORIGINS` = *Your Vercel deployment URL (e.g., `https://buglog-frontend.vercel.app`)*
5.  Click **Create Web Service**.

Once deployed, copy your Render Web Service URL (e.g., `https://buglog-backend.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

The frontend is a static site that is optimized to build and inject the API URL dynamically during deployment.

1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New** ➔ **Project**.
3.  Import your GitHub repository.
4.  Configure the build and deployment settings:
    *   **Framework Preset:** `Other` (or `None`)
    *   **Root Directory:** Keep as the root `/`
    *   **Build Command:** Vercel will automatically detect `npm run build` from our [package.json](file:///c:/Users/padhu/Downloads/BUGLOG/package.json), which runs the [build.js](file:///c:/Users/padhu/Downloads/BUGLOG/build.js) script to inject the backend API URL.
5.  Configure Environment Variables:
    *   Add a new environment variable:
        *   **Name:** `API_BASE`
        *   **Value:** Paste your Render backend URL with `/api` appended (e.g., `https://buglog-backend.onrender.com/api`).
6.  Click **Deploy**.
7.  Once the deployment is complete, copy the assigned Vercel URL (e.g., `https://buglog.vercel.app`).

> [!IMPORTANT]
> **CORS Sync:** Go back to your Render Web Service environment variables and update the `ALLOWED_ORIGINS` variable to match your exact Vercel URL (e.g., `https://buglog.vercel.app`). Do not add a trailing slash. If you used the Blueprint, redeploy the service for changes to take effect.

---

## 5. Environment Variables Reference

### Backend Environment Variables (`backend/`)
| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `PORT` | The port the backend listens on. | `10000` |
| `NODE_ENV` | Mode of operation. | `production` |
| `MONGODB_URI` | MongoDB Atlas Connection string. | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used for signing JWT tokens. | Random 32-character string |
| `JWT_EXPIRES_IN` | JWT token validity duration. | `7d` |
| `ALLOWED_ORIGINS` | Permitted client origins for CORS. | `https://your-app.vercel.app` |

### Frontend Environment Variables (Vercel)
| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `API_BASE` | URL of the backend API server. | `https://your-backend.onrender.com/api` |

---

## 6. Verification Steps

Perform the following steps to verify a successful deployment:

1.  **Frontend Accessibility:** Navigate to your Vercel URL (e.g., `https://buglog.vercel.app`). Verify that the landing page loads immediately.
2.  **User Registration:**
    *   Navigate to **Login** ➔ **Sign Up**.
    *   Create a test user account.
    *   Verify that you are automatically logged in and redirected to the Dashboard.
3.  **Data Persistence:**
    *   Click **+ New Bug**.
    *   Fill in the form and click **Save Bug**.
    *   Verify that the bug shows up on the Dashboard list.
4.  **Analytics Verification:**
    *   Go to **Analytics**.
    *   Ensure the charts render correctly and reflect your logged bug.
5.  **Export Checks:**
    *   On the Dashboard, click **Export Log** and export to **CSV**, **Markdown**, and **PDF**.
    *   Verify that the files download properly and contain your data.

---

## 7. Troubleshooting

### CORS Blocked Requests
*   **Symptom:** Browser console shows `Access-Control-Allow-Origin` missing headers or network requests fail.
*   **Solution:** Make sure your `ALLOWED_ORIGINS` environment variable on Render matches your Vercel URL exactly (e.g., `https://buglog.vercel.app`) with no trailing slash.

### MongoDB Connection Timeout
*   **Symptom:** Render log files show `MongoNetworkError` or connection timed out.
*   **Solution:** Go to MongoDB Atlas, navigate to **Network Access**, and make sure the IP `0.0.0.0/0` is whitelisted.

### Render Cold Starts
*   **Symptom:** The first API request after some time takes 50+ seconds to respond.
*   **Solution:** Render's free tier spins down the web service after 15 minutes of inactivity. When a new request arrives, it spins back up. This is expected behavior on the free tier.

### Vercel Build Fails
*   **Symptom:** Vercel build log shows script failure.
*   **Solution:** Verify that the `API_BASE` environment variable is set on Vercel before initiating a build.
