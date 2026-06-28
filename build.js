const fs = require('fs');
const path = require('path');

const apiFilePath = path.join(__dirname, 'api.js');

if (!fs.existsSync(apiFilePath)) {
  console.error('Error: api.js not found!');
  process.exit(1);
}

let apiContent = fs.readFileSync(apiFilePath, 'utf8');

// Get the backend URL from environment variables
const backendUrl = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;

if (backendUrl) {
  console.log(`Injecting production API URL: ${backendUrl}`);
  // Replace the API_BASE definition with the new backend URL dynamically
  apiContent = apiContent.replace(
    /const API_BASE = window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1'\r?\n\s*\?\s*'http:\/\/localhost:5000\/api'\r?\n\s*:\s*['"][^'"]+['"];/g,
    `const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'\n  ? 'http://localhost:5000/api'\n  : '${backendUrl}';`
  );
  fs.writeFileSync(apiFilePath, apiContent, 'utf8');
  console.log('Frontend api.js successfully updated for production deployment!');
} else {
  console.log('No API_BASE environment variable found. Using default: https://buglog-backend.onrender.com/api');
}
