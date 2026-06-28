# BugLog API Sample Requests

Use these examples with [Postman](https://www.postman.com/), [Thunder Client](https://www.thunderclient.com/), or `curl`.

## Setup

1. Start MongoDB locally or use MongoDB Atlas.
2. Copy `.env.example` to `.env` and update values.
3. Run `npm install` then `npm start` from the `backend` folder.

---

## 1. Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"password\":\"secret123\"}"
```

## 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"jane@example.com\",\"password\":\"secret123\"}"
```

Save the `token` from the response for the requests below.

## 3. Create Bug Entry

```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"title\":\"Null reference error\",\"errorMessage\":\"Cannot read property of undefined\",\"technology\":\"React\",\"cause\":\"State not initialized\",\"solution\":\"Added default value to useState\",\"codeSnippet\":\"const [data, setData] = useState(null);\",\"tags\":[\"react\",\"javascript\"],\"status\":\"open\"}"
```

## 4. Get All Bugs

```bash
curl -X GET http://localhost:5000/api/bugs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. Get Single Bug

```bash
curl -X GET http://localhost:5000/api/bugs/BUG_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. Update Bug

```bash
curl -X PUT http://localhost:5000/api/bugs/BUG_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"status\":\"resolved\"}"
```

## 7. Delete Bug

```bash
curl -X DELETE http://localhost:5000/api/bugs/BUG_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 8. Health Check

```bash
curl http://localhost:5000/api/health
```
