# BugLog Backend

Node.js + Express + MongoDB REST API with JWT authentication for the BugLog project.

## Project Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   └── bugController.js
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   └── BugEntry.js
├── routes/
│   ├── authRoutes.js
│   └── bugRoutes.js
├── docs/
│   └── API_SAMPLES.md
├── server.js
├── package.json
├── .env.example
├── API_DOCUMENTATION.md
└── README.md
```

## Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### Installation

```bash
cd backend
npm install
cp .env.example .env
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/buglog` |
| `JWT_SECRET` | Secret key for signing tokens | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| GET | `/api/bugs` | Yes | List all bug entries |
| GET | `/api/bugs/:id` | Yes | Get one bug entry |
| POST | `/api/bugs` | Yes | Create bug entry |
| PUT | `/api/bugs/:id` | Yes | Update bug entry |
| DELETE | `/api/bugs/:id` | Yes | Delete bug entry |
| GET | `/api/health` | No | Health check |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full details and [docs/API_SAMPLES.md](./docs/API_SAMPLES.md) for curl examples.

## Tech Stack

Express, Mongoose, bcryptjs, jsonwebtoken, dotenv, cors
