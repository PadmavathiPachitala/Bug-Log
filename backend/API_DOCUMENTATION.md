# BugLog API Documentation

Base URL: `http://localhost:5000`

All protected routes require a JWT token in the `Authorization` header (`Bearer <token>`) or set inside the secure `token` HttpOnly cookie.

---

## Authentication

### Register User
**POST** `/api/auth/register`  
Body (JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
Response (201): Sets HttpOnly cookie `token` and returns JSON.

### Login User
**POST** `/api/auth/login`  
Body (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Response (200): Sets HttpOnly cookie `token` and returns JSON.

### Logout User
**POST** `/api/auth/logout`  
Response (200): Clears the HttpOnly cookie `token`.

---

## Bug Entries (Protected)

### Get All Bug Entries
**GET** `/api/bugs`  
Query parameters (all optional):
- `search` (Search keywords matching title, error, technology, tags, cause/rootCause, solution/verifiedFinalFix, learningNotes/personalLearning, aiPrompt, and interviewExplanation)
- `status` (`open`, `resolved`, `in-progress`, `closed`)
- `technology` (Regex search on technology)
- `tag` (Filter by a single tag)
- `tags` (Comma-separated tag list for multiple tags)
- `filter=favorites` / `isFavorited=true` (Retrieve favorited entries only)
- `priority` / `severity` (`low`, `medium`, `high`, `critical`)
- `aiTool` (Filter by the used AI assistant)
- `startDate` / `endDate` (Filter by creation date range)
- `page` / `limit` (Pagination controls)

### Export Bug Entries
**GET** `/api/bugs/export`  
Query parameters:
- `format` (required: `csv`, `markdown`, or `pdf`)
- Accepts the same filter query parameters as `GET /api/bugs`
Response: Downloadable stream of the requested file format containing all learning and AI-assisted metadata fields.

### Get Single Bug Entry
**GET** `/api/bugs/:id`
Response (200): Returns the bug entry. If `aiSuggestedSolution` is present in the database, it will be returned in the `aiSuggestion` field (overriding heuristic suggestions).

### Create Bug Entry
**POST** `/api/bugs`  
Body (JSON):
```json
{
  "title": "CORS error on API call",
  "errorMessage": "Access-Control-Allow-Origin missing",
  "technology": "Node.js",
  "cause": "Missing CORS middleware",
  "solution": "Added cors() middleware in server.js",
  "codeSnippet": "app.use(cors());",
  "tags": ["cors", "express"],
  "learningNotes": "Ensure CORS is loaded before routes.",
  "githubRepo": "owner/repo",
  "githubCommit": "7f3a8b2",
  "aiTool": "Claude",
  "aiPrompt": "Why is my Node server rejecting origin localhost:3000?",
  "aiSuggestedSolution": "Use the cors middleware package...",
  "verifiedFinalFix": "Installed cors package and added app.use(cors());",
  "personalLearning": "CORS errors occur on browser-side calls if headers are missing.",
  "rootCause": "Missing response headers for Access-Control-Allow-Origin.",
  "interviewExplanation": "Encountered CORS issues which block front-end requests. Used Claude to identify missing headers and resolved by importing and using cors middle-ware.",
  "priority": "medium",
  "dateSolved": "2026-06-27T16:00:00.000Z",
  "relatedLinks": ["https://stackoverflow.com/questions/20035102"]
}
```
*Note on Backward Compatibility: The backend automatically maps and synchronizes `cause` ↔ `rootCause`, `solution` ↔ `verifiedFinalFix`, `learningNotes` ↔ `personalLearning`, and `severity` ↔ `priority`.*

### Update Bug Entry
**PUT** `/api/bugs/:id`  
Body (JSON): Send only fields to update. Automatically maintains cross-field compatibility mappings.

### Delete Bug Entry
**DELETE** `/api/bugs/:id`

### Toggle Favorite Status
**PATCH** `/api/bugs/:id/favorite`  
Response (200): Returns the updated bug document.

---

## Prompt Vault (Protected)

### Get All Prompts
**GET** `/api/prompts`  
Query parameters:
- `search` (Search inside prompt, notes, category, aiTool, outcome)
- `category` (Filter by category)
- `aiTool` (Filter by AI Tool)
- `rating` (Filter by effectiveness rating)
- `isFavorited` (Set to `true` to fetch starred prompts only)
- `sort` (`rating-desc` or `rating-asc`)
- `page` / `limit` (Pagination controls)

### Get Single Prompt
**GET** `/api/prompts/:id`

### Create Prompt Entry
**POST** `/api/prompts`  
Body (JSON):
```json
{
  "prompt": "Optimize this database query...",
  "aiTool": "Gemini 2.5 Flash",
  "category": "SQL",
  "effectivenessRating": 5,
  "outcome": "Reduced query time by 90%",
  "notes": "Works best when schema indexes are supplied.",
  "aiSuggestion": "Add index on userId.",
  "verifiedSolution": "Created index bugentry_userid_idx.",
  "tags": ["performance", "mongodb"],
  "isFavorited": false
}
```

### Update Prompt Entry
**PUT** `/api/prompts/:id`

### Toggle Favorite Prompt
**PATCH** `/api/prompts/:id/favorite`  
Response (200): Returns the updated prompt document.

### Delete Prompt Entry
**DELETE** `/api/prompts/:id`

---

## Analytics (Protected)

### Get Summary Statistics
**GET** `/api/analytics`  
Response (200):
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 5,
      "open": 2,
      "resolved": 3,
      "favorites": 1,
      "mostCommonError": "Access-Control-Allow-Origin missing",
      "mostUsedAiTool": "Gemini 2.5 Flash",
      "promptEffectiveness": 4.8,
      "learningProgress": 60
    },
    "technologyDistribution": [
      { "_id": "Node.js", "count": 3 }
    ],
    "topTags": [
      { "_id": "cors", "count": 2 }
    ],
    "monthlyTrends": [
      { "label": "Jun 2026", "count": 5 }
    ],
    "recentlyFixed": [ ]
  }
}
```

---

## AI Learning Insights (Protected)

### Get Dynamic Takeaways
**GET** `/api/learning-insights`  
Response (200):
```json
{
  "success": true,
  "data": {
    "bugsSolvedThisWeek": 2,
    "mostCommonTechnologies": [
      { "name": "Node.js", "count": 3 }
    ],
    "mostCommonMistakes": [
      { "name": "CORS & Cross-Origin Requests", "count": 2 }
    ],
    "strongestAreas": [
      { "name": "Node.js", "resolutionRate": 80 }
    ],
    "weakestAreas": [ ],
    "suggestedLearningTopics": [
      "Deep Dive into Web Security: CORS, CSP, and Headers"
    ],
    "sentences": [
      "You solved 2 Node.js bugs.",
      "Node.js is your strongest topic.",
      "CORS & Cross-Origin Requests is your most common issue.",
      "You frequently use Gemini 2.5 Flash for backend debugging.",
      "Suggested topic to study: Deep Dive into Web Security: CORS, CSP, and Headers."
    ]
  }
}
```
