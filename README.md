# [BugLog] — AI-Assisted Developer Learning Platform

BugLog is a developer learning platform that helps engineers build a personal debugging knowledge base by capturing error messages, hypotheses, code fixes, AI suggestions, and takeaways, alongside an AI Prompt Vault and detailed Analytics.

---

## 1. Project Overview & Features

BugLog converts one-time AI debugging assistance into permanent developer knowledge.

### Features
1. **Dashboard & Advanced Search**: Collapsible filter panel supporting Technology, Priority/Severity, AI Tool, Status, Date Ranges, and Tags, matching server-side search across title, tags, root causes, prompts, and solutions.
2. **AI Prompt Vault**: Create, search, filter, rate (1-5), star (favorite), and copy prompts to clipboard.
3. **Analytics Dashboard**: Chart.js graphs mapping logging trends, tag counts, technology distribution, recently fixed bugs, and summary statistics (Prompt Effectiveness, Learning Progress %, Most Used AI Tool, and Most Common Error).
4. **Export System**: Pipe logs to CSV, Markdown, or PDF format directly to the client with all AI and learning metadata.
5. **AI Learning Insights**: Diagnostic aggregates calculating resolution rates, common mistakes, strengths/weaknesses, and dynamic heuristic learning sentences (e.g. *"You solved 2 React bugs."*).
6. **Favorites Portal**: A dedicated tabbed page (`favorites.html`) showing favorited bugs and starred prompts.
7. **Interview Preparation**: Dedicated explanations and takeaways sections to prepare developers for technical interviews.
8. **Code Viewer**: Highlight.js CDN formatting for code snippets.
9. **Secure Auth**: HttpOnly cookies for JWT handling with explicit token expiration warnings, input validation using `express-validator`, and API rate limiting.

---

## 2. Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3 variables, Chart.js, Highlight.js, FontAwesome.
- **Backend**: Node.js + Express, Mongoose (MongoDB ODM), cookie-parser, pdfkit.
- **Testing**: Jest, Supertest, `mongodb-memory-server` (for database sandboxing).

---

## 3. Folder Structure

```
BUGLOG/
├── backend/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection setup
│   │   └── seed.js                   # Mock database seeding script
│   ├── controllers/
│   │   ├── aiLearningInsightsController.js
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   └── bugController.js
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   ├── auth.js                   # JWT route guard
│   │   ├── rateLimiter.js            # API & Auth rate limiting
│   │   └── validation.js             # Payload sanitizers
│   ├── models/
│   │   ├── User.js
│   │   ├── BugEntry.js
│   │   └── Prompt.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── bugRoutes.js
│   │   ├── learningInsightsRoutes.js
│   │   └── promptRoutes.js
│   ├── .env.example
│   ├── API_DOCUMENTATION.md          # Comprehensive REST API specifications
│   ├── package.json
│   ├── auth.test.js                  # Auth unit tests
│   ├── bugs.test.js                  # Bugs unit tests
│   ├── prompts.test.js               # Prompt vault unit tests
│   ├── analytics.test.js             # Analytics unit tests
│   └── integration.test.js           # Multi-step integration flows
├── index.html                        # Public Landing Hero Page
├── dashboard.html                    # Collapsible filters & Bugs Grid
├── prompts.html                      # Prompt Vault listing
├── analytics.html                    # Statistics Charts & AI Insights
├── favorites.html                    # Starred bugs & prompts portal
├── create-bug.html                   # Log Bug form
├── edit-bug.html                     # Edit Bug form
├── bug-detail.html                   # Detailed Diagnostic viewer
├── create-prompt.html                # Add Prompt form
├── edit-prompt.html                  # Edit Prompt form
├── prompt-detail.html                # Prompt viewer
├── login.html                        # Authentication form
├── api.js                            # Frontend API client
├── script.js                         # Event handlers, search debouncing
└── style.css                         # CSS variables & layouts
```

---

## 4. Installation & Environment Setup

### Environment Variables
Configure the environment file in the `backend/` directory:

1. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Adjust variables inside `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/buglog
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```

### Installation Steps

1. Clone or navigate to the project directory.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

---

## 5. Running the Application

### Running Backend
Start the backend Express server:
```bash
cd backend
npm run dev
```
*The server will run on `http://localhost:5000` and automatically restart on file changes.*

### Running Frontend
You can serve the static frontend files using any static file server:
```bash
# Serves the root directory on port 3000
npx serve -l 3000
```
Open **`http://localhost:3000`** in your browser.

### Seeding Mock Data
To populate the database with a test user and sample data immediately, run:
```bash
cd backend
node seed.js
```
*Log in with credentials: **`demo@example.com`** / **`password123`**.*

---

## 6. Testing Strategy & Execution

### Testing Strategy
- **Unit Tests**: Validate specific handlers, schema logic, validations, and middleware behaviors in isolation.
- **Integration Tests**: Execute multi-step routes representing end-to-end user transactions (e.g., Register → Login → Dashboard, or Bug CRUD Lifecycles).
- **Sandboxed Database**: All test suites utilize `mongodb-memory-server` to spin up an in-memory MongoDB database, ensuring local databases are not affected.

### Running Tests
Execute the test suites using Jest:
```bash
cd backend
npm test
```
*Runs all 5 test files, verifying 23 tests synchronously.*

---

## 7. Debugging Strategy

Our debugging strategy focuses on:
1. **Compilation Validation**: Reviewing stack traces and error line numbers on node startup failures.
2. **REST API Audits**: Testing endpoint routing, HTTP statuses, and JSON payloads using `Supertest` suites or local command-line tests.
3. **Database Hook Audits**: Checking Mongoose pre-save and validation middleware triggers to identify side effects like double-hashing passwords.
4. **Layout Inspections**: Reviewing DOM structure consistency across templates.

---

## 8. Optimization Summary

- **Database compound indexes** are defined on frequently queried fields like `userId + status`, `userId + isFavorited`, etc., to prevent collection scans.
- **Input Search Debouncing** (300ms) prevents excessive API calls during typing.
- **Document Fragments** are used for DOM renders to minimize layout reflows and repaints.
- **Secure JWT cookie handling** (HTTPOnly + Strict) prevents XSS/CSRF tokens leaks.
- **Auth rate limiters** protect endpoints against brute-force attacks.

---

## 9. Project Documentation Guides

Refer to the following documents for comprehensive guides:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Comprehensive production deployment instructions (Vercel, Render, Atlas).
- [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) — Standard operating procedures for logging, backups, and security audits.
- [PROJECT_REFLECTION.md](./PROJECT_REFLECTION.md) — Reflection on objectives, development challenges, and learnings.
