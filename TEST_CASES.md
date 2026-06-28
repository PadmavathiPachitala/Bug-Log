# Test Cases Document

This document lists the test cases for the BugLog Developer Learning Platform, detailing the objective, preconditions, steps, expected results, and execution status.

---

## 1. Authentication

### Test Case: TC_AUTH_01
- **Feature**: User Registration
- **Objective**: Verify that a new user can register successfully with valid details.
- **Preconditions**: Email `newuser@example.com` must not exist in the database.
- **Test Steps**:
  1. Navigate to `http://localhost:3000/login.html`.
  2. Click **Register** to switch forms.
  3. Enter Name: `New User`, Email: `newuser@example.com`, Password: `password123`.
  4. Click the **Register** submit button.
- **Expected Result**: User is successfully registered, a token is set in local storage and cookies, and the browser redirects to `dashboard.html`.
- **Actual Result**: User registered, cookie set, redirected to dashboard.
- **Status**: **PASS**

### Test Case: TC_AUTH_02
- **Feature**: User Login
- **Objective**: Verify that an existing user can log in successfully with valid credentials.
- **Preconditions**: User `demo@example.com` exists with password `password123`.
- **Test Steps**:
  1. Navigate to `http://localhost:3000/login.html`.
  2. Enter Email: `demo@example.com`, Password: `password123`.
  3. Click the **Sign In** button.
- **Expected Result**: Login succeeds, session token is stored, and browser redirects to `dashboard.html`.
- **Actual Result**: Authenticated successfully, redirected to dashboard.
- **Status**: **PASS**

---

## 2. Dashboard & Search

### Test Case: TC_DASH_01
- **Feature**: Dashboard Listing & Skeleton Loading
- **Objective**: Verify that user-specific bugs are retrieved and displayed on the dashboard.
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Navigate to `dashboard.html`.
  2. Observe loading skeletons.
  3. Wait for database fetch to complete.
- **Expected Result**: Skeletons disappear and a list of cards representing the user's bugs appears.
- **Actual Result**: Skeletons displayed during fetch, cards rendered afterward.
- **Status**: **PASS**

### Test Case: TC_DASH_02
- **Feature**: Advanced Search Input
- **Objective**: Verify that searching filters bugs by title, prompt, root cause, or personal learning.
- **Preconditions**: User is logged in and bugs list is displayed.
- **Test Steps**:
  1. Locate the Search Bar.
  2. Type a keyword (e.g., `CORS`).
  3. Wait 300ms for debouncing.
- **Expected Result**: The dashboard updates to show only bugs containing the text `CORS` in their title, error message, root cause, or prompt.
- **Actual Result**: Search query debounced, list dynamically filtered.
- **Status**: **PASS**

---

## 3. Bug CRUD Lifecycle

### Test Case: TC_BUG_01
- **Feature**: Create Bug Entry
- **Objective**: Verify that logging a bug saves all metadata, timeline, and AI fields.
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Navigate to `create-bug.html`.
  2. Fill in Title: `React component loop`, Tech: `React`, Priority: `high`, AI Tool: `Gemini`.
  3. Enter AI Prompt: `Maximum update depth exceeded loop in useEffect`.
  4. Enter Verified Final Fix: `Added dependency list array`.
  5. Click **Save Log Entry**.
- **Expected Result**: Request returns status 201, entry is stored, and user is redirected to dashboard.
- **Actual Result**: Entry saved, synced for backward compatibility, redirected to dashboard.
- **Status**: **PASS**

### Test Case: TC_BUG_02
- **Feature**: View Bug Details
- **Objective**: Verify that the bug detail page displays all detailed fields including interview prep.
- **Preconditions**: A bug entry exists in the database.
- **Test Steps**:
  1. Click on a bug card on the dashboard.
  2. Observe the detail layout.
- **Expected Result**: Page displays Priority, Date Solved, Related Links, AI Prompt/Solution timeline, and Interview Preparation explanation.
- **Actual Result**: Rendered all properties, verified formatting.
- **Status**: **PASS**

---

## 4. Prompt Vault

### Test Case: TC_PRMPT_01
- **Feature**: Create Prompt Vault Entry
- **Objective**: Verify that adding a prompt saves its details and rating.
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Navigate to `prompts.html` and click **Add New Prompt** (`create-prompt.html`).
  2. Fill in Prompt: `How to write a binary search?`, AI Tool: `ChatGPT`, Category: `Algorithms`, Rating: `5`.
  3. Click **Save to Vault**.
- **Expected Result**: Prompt entry is saved and displayed in the vault index page.
- **Actual Result**: Entry saved, rendered in prompt vault view.
- **Status**: **PASS**

---

## 5. Favorites Portal

### Test Case: TC_FAV_01
- **Feature**: Favorites Tab Toggle
- **Objective**: Verify that favorited bugs and prompts are displayed under their respective tabs.
- **Preconditions**: User has favorited at least one bug and one prompt.
- **Test Steps**:
  1. Navigate to `favorites.html`.
  2. Click on the **Bugs** tab, then the **Prompts** tab.
- **Expected Result**: Starred bugs show up under the Bugs tab; favorited prompts show up under the Prompts tab.
- **Actual Result**: List renders favorited items, tabs toggle visibility successfully.
- **Status**: **PASS**

---

## 6. Analytics & Takeaways

### Test Case: TC_ANLYT_01
- **Feature**: Analytics Charts & Heuristics
- **Objective**: Verify that analytics metrics and dynamic insights load correctly.
- **Preconditions**: Database contains seeded logs.
- **Test Steps**:
  1. Navigate to `analytics.html`.
  2. Observe charts and Heuristic Insights sidebar.
- **Expected Result**: Chart.js charts render statistics; the insights sidebar displays dynamic sentences summarizing user stats.
- **Actual Result**: Charts loaded and sidebar rendered compiled takeaways.
- **Status**: **PASS**

---

## 7. Knowledge Export

### Test Case: TC_EXPRT_01
- **Feature**: Export Formats (CSV/Markdown/PDF)
- **Objective**: Verify that downloading exports works with active filters.
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Click **Export CSV** (or Markdown/PDF) on the dashboard filters panel.
- **Expected Result**: Browser prompts a file download containing formatted bug logs with all diagnostic fields.
- **Actual Result**: File download started successfully with matching headers.
- **Status**: **PASS**
