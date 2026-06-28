# BugLog — Debugging Report

This report details bugs and logical inconsistencies found during the project's development, their root causes, the fixes applied, and the lessons learned.

---

## 1. Inconsistent Port Configuration

**Issue Found:** The application failed to load data on the dashboard after a fresh setup. API calls from the frontend were failing.
**Root Cause:** A port mismatch was discovered. The backend server was running on `port 5000` by default, but the frontend `api.js` file was hardcoded to make requests to `http://localhost:5001/api`.
**Fix Applied:** The `API_BASE` constant in `api.js` was updated from `http://localhost:5001/api` to `http://localhost:5000/api` to match the backend's default port.
**Lessons Learned:** Configuration management is critical. Default values and constants should be consistent across the entire project (frontend, backend, documentation). Using environment variables for such settings is a best practice to avoid this issue.

---

## 2. Unauthenticated Dashboard Access Flash

**Issue Found:** When an unauthenticated user navigates directly to `dashboard.html`, the page skeleton and "Loading..." message are briefly visible before the user is redirected to the login page.
**Root Cause:** The authentication check is performed client-side in JavaScript. The browser loads and begins rendering the HTML of `dashboard.html` before the script runs, checks for a token, and executes the redirect.
**Fix Applied:** No code fix was applied for this issue as it would require a significant architectural change (e.g., moving to a framework with routing or implementing server-side rendering). The issue is documented here as a known limitation of the current static-site architecture.
**Lessons Learned:** For applications with protected routes, client-side redirects are a simple but imperfect solution. A more robust architecture (like a single-page application with a router or a server-rendered app) handles auth checks before rendering the protected view, providing a better user experience and security posture.

---

## 3. Insecure JWT Storage

**Issue Found:** The JSON Web Token (JWT) is stored in `localStorage`.
**Root Cause:** `localStorage` is a common and simple way to persist data in the browser. However, it is accessible to any JavaScript running on the page, making it vulnerable to token theft via Cross-Site Scripting (XSS) attacks.
**Fix Applied:** No code fix was applied. The recommendation is to refactor the authentication mechanism to use secure, `HttpOnly` cookies. This is a significant change left for future work.
**Lessons Learned:** Security should be a primary concern from the start. While `localStorage` is convenient for development, `HttpOnly` cookies provide superior security for storing session tokens in a production environment by making them inaccessible to client-side scripts.