// api.js

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://buglog-backend.onrender.com/api'; // Replace with your Render backend URL

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function isAuthenticated() {
  return !!getToken();
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    credentials: 'include' // Send cookies automatically
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);

    // If the token is invalid or expired, the server will return 401
    if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      clearToken();
      window.location.href = 'login.html';
      return { success: false, message: 'Session expired. Please log in again.' };
    }

    // Handle non-successful HTTP responses (e.g., 400, 404, 500)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      console.error('API Error:', errorData.message || res.statusText);
      return { success: false, message: errorData.message || 'An API error occurred.' };
    }

    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'A network error occurred. Please try again.' };
  }
}

// Dedicated helper to handle raw file downloads (blobs) for CSV, Markdown, PDF
async function apiDownload(endpoint, params = '') {
  const headers = {};
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: 'GET',
    headers,
    credentials: 'include'
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}?${params}`, options);

    if (res.status === 401) {
      clearToken();
      window.location.href = 'login.html';
      return null;
    }

    if (!res.ok) {
      console.error('Download API error:', res.statusText);
      return null;
    }

    return await res.blob();
  } catch (error) {
    console.error('Network Error during download:', error);
    return null;
  }
}

async function login(email, password) {
  const data = await apiCall('/auth/login', 'POST', { email, password });
  if (data?.success) {
    setToken(data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return { success: true };
  }
  return { success: false, message: data.message || 'Login failed.' };
}

async function register(name, email, password) {
  const data = await apiCall('/auth/register', 'POST', { name, email, password });
  if (data?.success) {
    setToken(data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return { success: true };
  }
  return { success: false, message: data.message || 'Registration failed.' };
}

async function logout() {
  await apiCall('/auth/logout', 'POST'); // Clear cookie on backend
  clearToken();
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

/* ==========================================
   BUG JOURNAL APIS
   ========================================== */

async function getBugs(params = '') {
  return await apiCall(`/bugs?${params}`);
}

async function getBug(id) {
  return await apiCall(`/bugs/${id}`);
}

async function createBug(bugData) {
  return await apiCall('/bugs', 'POST', bugData);
}

async function updateBug(id, bugData) {
  return await apiCall(`/bugs/${id}`, 'PUT', bugData);
}

async function deleteBug(id) {
  return await apiCall(`/bugs/${id}`, 'DELETE');
}

async function toggleFavorite(id) {
  return await apiCall(`/bugs/${id}/favorite`, 'PATCH');
}

async function downloadBugsExport(params = '') {
  return await apiDownload('/bugs/export', params);
}

/* ==========================================
   PROMPT VAULT APIS
   ========================================== */

async function getPrompts(params = '') {
  return await apiCall(`/prompts?${params}`);
}

async function getPrompt(id) {
  return await apiCall(`/prompts/${id}`);
}

async function createPrompt(promptData) {
  return await apiCall('/prompts', 'POST', promptData);
}

async function updatePrompt(id, promptData) {
  return await apiCall(`/prompts/${id}`, 'PUT', promptData);
}

async function deletePrompt(id) {
  return await apiCall(`/prompts/${id}`, 'DELETE');
}

async function toggleFavoritePrompt(id) {
  return await apiCall(`/prompts/${id}/favorite`, 'PATCH');
}

/* ==========================================
   ANALYTICS & AI INSIGHTS APIS
   ========================================== */

async function getAnalytics() {
  return await apiCall('/analytics');
}

async function getLearningInsights() {
  return await apiCall('/learning-insights');
}
