// ==========================================
// API Helper - Base URL for backend
// ==========================================

// In production (Vercel) the API is deployed alongside the frontend on the
// same origin, so a relative path avoids CORS entirely. In dev, Vite and
// the Express server run on different ports.
const API_BASE = import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Wraps fetch so every caller gets the real backend error message
// (the API replies { error } on failure, { message } on success) instead
// of a blank alert box or a swallowed console.error.
export async function apiRequest(path, options) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export default API_BASE;
