# BugLog — User Guide

Welcome to **BugLog**! This guide describes how to use the platform to capture debugging logs, leverage AI suggestions, manage your Prompt Vault, review learning analytics, and export your personal knowledge base.

---

## 1. Getting Started: Sign In & Authentication
1. Navigate to the login page: **[https://bug-log-one.vercel.app/login.html](https://bug-log-one.vercel.app/login.html)**.
2. **Auto-Registration:** Type in any email address and password (minimum 6 characters) and click **Sign In**.
   * If it is your first time using that email, BugLog will automatically register it on the fly and log you in.
   * If the account already exists, it will sign you in normally.

---

## 2. Logging a New Bug
When you solve a bug or get stuck, click **+ New Bug** on the Dashboard and fill in the details:

*   **Technology & Priority:** Specify the language/framework (e.g., *React, Python*) and set the priority level (*Low, Medium, High, Critical*).
*   **Error Message / Excerpt:** Copy and paste the raw stack trace, compiler error, or console output.
*   **Hypothesis & Root Cause:** Describe why the bug happened (e.g., *missing useEffect dependency array*).
*   **Verified Solution & Snippet:** Paste the exact code fix and an optional code snippet.
*   **Takeaways & Interview prep:** Write down what you would tell your past self. This compiles into your technical interview prep notes!
*   **Tags:** Add comma-separated keywords (e.g., *auth, routing, database*) to filter the bug later.

*Once saved, the bug will appear on your Dashboard, and the system will automatically attach a heuristic AI suggestion based on your error trace.*

---

## 3. The Dashboard: Search & Filter Panel
The Dashboard is your searchable knowledge base.

*   **Text Search:** Use the search bar to find keywords across titles, error traces, solutions, root causes, or learning notes.
*   **Advanced Filter Panel:** Click **⚙️ Advanced Filters** to open the panel and filter by:
    *   Technology
    *   Priority
    *   AI Tool Used
    *   Status (*Open, In-Progress, Resolved, Closed*)
    *   Creation Date Range
*   **Filter Pills:** Quickly toggle between *All, Open, Resolved, ★ Favorites*, and *Critical* bugs.

---

## 4. AI Prompt Vault
The Prompt Vault is a repository of your most effective developer prompts.

*   **Create Prompt:** Click **Create Prompt** to save a prompt template, specify the target AI tool (e.g., *Gemini, ChatGPT*), and write the prompt text.
*   **Rating & Favorite:** Rate the prompt's effectiveness (1-5 stars) and click the **Star** icon to favorite it.
*   **Copy to Clipboard:** Click the copy button on any prompt card to instantly copy the template text for use in your AI editor.

---

## 5. Analytics & AI Learning Insights
Click **Analytics** in the navigation bar to access visual graphs and aggregations:

*   **Logging Trends:** A line chart showing your debugging frequency over time.
*   **Technology Breakdown:** A pie chart indicating which languages or frameworks are causing the most errors.
*   **AI Tool Distribution:** A radar/bar chart showing which AI assistants you use most frequently.
*   **Summary Statistics:** Review your Prompt Effectiveness rating, Learning Progress %, and top error categories.
*   **Learning Insights:** Diagnostic sentences compiled on the fly (e.g., *"You resolved 3 Node.js bugs recently"*).

---

## 6. Favorites Portal
Click **★ Favorites** in the navbar to open a dedicated portal. It splits into two tabs:
*   **Starred Bugs:** View and edit all bug logs you have marked as favorites.
*   **Starred Prompts:** View and copy your highest-rated AI prompts.

---

## 7. Exporting your Data
To share your logs, back them up, or read them offline, use the **Export Log** button on the Dashboard. You can pipe your logs into three formats:
1.  **CSV (.csv):** A spreadsheet of all metadata, dates, and snippets.
2.  **Markdown (.md):** A beautifully formatted developer document with code blocks.
3.  **PDF (.pdf):** A clean print-ready report generated directly on the server.
