# Production Maintenance Guide

This document outlines the standard operating procedures for logging, error handling, backup management, database maintenance, dependency updates, security recommendations, monitoring, and future maintenance for the BugLog Developer Learning Platform.

---

## 1. Logging Strategy

Logging is critical for understanding the state of your application in production and troubleshooting issues.

### Current Implementation
- Standard server messages and uncaught errors are output to `stdout` and `stderr` via `console.log` and `console.error`.
- Render automatically captures these streams and aggregates them in the **Logs** tab of the dashboard.

### Production Upgrades (Recommended)
- **Structured Logging:** For a growing application, integrate a logger like `winston` or `pino` to write logs in JSON format. JSON logs are easily parseable by logging tools.
- **Log Aggregation:** Route your logs to an external log aggregator (e.g., Logtail, Datadog, or Papertrail) to search, filter, and alert on error occurrences.
- **Log Levels:** Enforce strict log levels:
  *   `error`: System failures or unexpected errors that require immediate attention.
  *   `warn`: Non-critical anomalies (e.g., unauthorized request attempts, rate limits hit).
  *   `info`: Important lifecycle events (e.g., database connection established, server listening).
  *   `debug`: Detailed troubleshooting logs (disabled in production).

---

## 2. Error Handling

Proper error handling prevents application crashes and secures sensitive information from leaking.

### Current Implementation
- Express routes utilize an [asyncHandler](file:///c:/Users/padhu/Downloads/BUGLOG/backend/middleware/asyncHandler.js) wrapper to catch rejected promises and forward them to Express error-handling middleware.
- An error-handling middleware in [server.js](file:///c:/Users/padhu/Downloads/BUGLOG/backend/server.js#L67-L70) logs the stack trace and returns a structured JSON error response:
  ```javascript
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });
  ```

### Production Best Practices
- **Never Leak Stack Traces:** Ensure that raw exception details or database queries are never exposed in production API responses (this is handled correctly by returning `'Internal server error'`).
- **Global Process Guards:** Capture process-level failures (uncaught exceptions and unhandled promise rejections) in `server.js`:
  ```javascript
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // Graceful shutdown
    process.exit(1);
  });
  ```
- **Alerting:** Set up notifications (e.g., Slack hooks or email alerts) for any HTTP 500 responses.

---

## 3. Database Maintenance & Backups

Your data is the most valuable part of the platform. Regular maintenance prevents downtime and data loss.

### Backup Strategy
1.  **Atlas Automated Backups:** While the free M0 tier does not support automated backup policies, production clusters (M10+) should have automated daily/hourly snapshots configured with a 30-day retention period.
2.  **Manual Backups (Free Tier):** Run `mongodump` periodically to store local compressed backups:
    ```bash
    mongodump --uri="mongodb+srv://buglog-admin:<password>@cluster0.abcde.mongodb.net/buglog" --archive=./backups/buglog-backup-$(date +%F).archive --gzip
    ```
3.  **Restoring Data:** To restore from an archive:
    ```bash
    mongorestore --uri="mongodb+srv://buglog-admin:<password>@cluster0.abcde.mongodb.net/buglog" --archive=./backups/buglog-backup-YYYY-MM-DD.archive --gzip
    ```

### Database Indexing
- BugLog uses compound indexes to speed up common filter and search routes.
- Verify indexes in the MongoDB Atlas console (**Performance Advisor** or **Profiler**).
- Common index definitions inside Mongoose schema files should look like:
  ```javascript
  BugEntrySchema.index({ userId: 1, createdAt: -1 });
  BugEntrySchema.index({ userId: 1, status: 1 });
  ```

---

## 4. Dependency Updates

Keep packages up to date to prevent security vulnerabilities and leverage performance enhancements.

### Audit Strategy
1.  **Check Outdated Packages:**
    ```bash
    cd backend
    npm outdated
    ```
2.  **Run Security Audits:**
    ```bash
    npm audit
    ```
3.  **Automated Vulnerability Fixing:**
    Run `npm audit fix` for minor, non-breaking patches. For major upgrades, verify manually.
4.  **Verification:** Always execute the test suite after upgrading dependencies:
    ```bash
    npm test
    ```

---

## 5. Security Recommendations

Production environments must be hardened to mitigate OWASP Top 10 risks.

1.  **Strict CORS Configuration:** Do not allow wildcard (`*`) origins. Explicitly define origins using the `ALLOWED_ORIGINS` environment variable.
2.  **API Rate Limiting:** Prevent denial-of-service (DoS) and brute-force authentication attacks using [express-rate-limit](file:///c:/Users/padhu/Downloads/BUGLOG/backend/middleware/rateLimiter.js). The backend rate-limits API routes and has a stricter threshold for `/api/auth` routes.
3.  **Environment Variable Isolation:** Never hardcode secrets like `JWT_SECRET` or database passwords. Ensure they are injected via the hosting provider's vault.
4.  **JWT Secret Strength & Rotation:** Set a 256-bit secure secret key. Rotate the `JWT_SECRET` periodically (e.g. every 90 days) via the Render environment settings.
5.  **Secure HTTP Headers:** Integrate `helmet` middleware in your Express server to automatically set secure HTTP headers (e.g., X-Frame-Options, X-Content-Type-Options).

---

## 6. Monitoring & Health Checks

Proactive monitoring alerts you of failures before your users notice them.

-  **Health Check Endpoint:** The server exposes a dedicated endpoint at `/api/health`. Use an external uptime monitoring service (like UptimeRobot or BetterStack) to ping this URL every 5 minutes.
-  **Cold Starts (Render Free Tier):** Under Render's free tier, the backend spins down after 15 minutes of inactivity. Pinging `/api/health` every 10–14 minutes using an uptime pinger keeps the service warm and eliminates spin-up delays for users.
-  **Atlas Metrics:** Watch your database connections, CPU usage, and disk space charts in the MongoDB Atlas dashboard. Set alerts for cluster memory usage exceeding 80%.

---

## 7. Future Maintenance Plan

Establish a regular maintenance cadence:

### Monthly Tasks
- Review system health logs and resolve frequent warning patterns.
- Run `npm audit` and apply security patches.
- Perform a manual database backup (if automated backups are unavailable).

### Quarterly Tasks
- Rotate database passwords and `JWT_SECRET`.
- Review MongoDB indexes and clean up unused collections.
- Update major Node.js dependencies and conduct complete end-to-end integration test runs.
