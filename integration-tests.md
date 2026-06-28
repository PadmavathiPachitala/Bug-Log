# BugLog — Integration Test Cases

This document outlines manual end-to-end integration test cases for the primary user flows of the BugLog application.

**Pre-requisites:**
- Backend server is running.
- Frontend is accessible in a browser.
- Tester has cleared application data (localStorage) before starting.

---

### 1. Login Flow

| Test Case ID | Description | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **IT-01** | **Successful Login** | 1. Navigate to `login.html`. <br> 2. Enter valid credentials for an existing user. <br> 3. Click "Sign In". | User is redirected to `dashboard.html`. <br> A valid JWT is stored in localStorage. <br> The dashboard displays the user's bug logs. |
| **IT-02** | **Failed Login (Invalid Password)** | 1. Navigate to `login.html`. <br> 2. Enter a valid email and an incorrect password. <br> 3. Click "Sign In". | An error message "Invalid credentials" is displayed. <br> User remains on `login.html`. |
| **IT-03** | **Accessing Dashboard when Logged Out** | 1. Navigate directly to `dashboard.html`. | User is immediately redirected to `login.html`. |

---

### 2. Create Bug Flow

| Test Case ID | Description | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **IT-04** | **Successful Bug Creation** | 1. Log in to the application. <br> 2. On the dashboard, click "+ New Bug". <br> 3. Fill in all required fields (Title, Error Message). <br> 4. Fill in optional fields (Technology, Tags, Cause, Solution, Learning Notes). <br> 5. Click "Submit Bug". | User is redirected to `dashboard.html`. <br> The new bug appears at the top of the bug list. <br> The "Total Bugs" and "Open" stats are updated. |
| **IT-05** | **Failed Bug Creation (Missing Title)** | 1. Log in and navigate to `create-bug.html`. <br> 2. Leave the "Title" field blank. <br> 3. Fill in other fields. <br> 4. Click "Submit Bug". | An error message "Title is required" is displayed. <br> User remains on the `create-bug.html` page. |

---

### 3. Edit Bug Flow

| Test Case ID | Description | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **IT-06** | **Successful Bug Edit** | 1. Log in and navigate to the dashboard. <br> 2. Click on an existing bug card to go to `bug-detail.html`. <br> 3. Click the "Edit" button. <br> 4. On `edit-bug.html`, change the "Title" and "Status" to "resolved". <br> 5. Click "Save Changes". | User is redirected back to `bug-detail.html`. <br> The title and status on the detail page are updated. <br> The status badge shows "resolved". |

---

### 4. Delete Bug Flow

| Test Case ID | Description | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **IT-07** | **Successful Bug Deletion** | 1. Log in and navigate to the dashboard. <br> 2. Click on an existing bug card. <br> 3. On the detail page, click the "Delete" button. <br> 4. Confirm the deletion in the browser prompt. | User is redirected to `dashboard.html`. <br> The deleted bug no longer appears in the list. <br> The "Total Bugs" stat is updated. |