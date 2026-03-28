/**
 * AutoPost Hub — API Client
 * Fetch wrapper with JWT token management and error handling.
 * No external dependencies — uses native fetch.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get stored JWT token from localStorage.
 */
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autopost_token');
}

/**
 * Store JWT token in localStorage.
 */
export function setToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autopost_token', token);
}

/**
 * Remove JWT token (logout).
 */
export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('autopost_token');
}

/**
 * Core fetch wrapper with auth header and error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — auto logout
  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  // Parse response
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`);
  }

  return data;
}

// ── Auth ──────────────────────────────────────

export const authAPI = {
  register: (email, name, password) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email, password) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch('/api/auth/me'),
};

// ── Upload ────────────────────────────────────

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// ── Posts ──────────────────────────────────────

export const postsAPI = {
  create: (data) =>
    apiFetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.platform) query.set('platform', params.platform);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    const qs = query.toString();
    return apiFetch(`/api/posts${qs ? `?${qs}` : ''}`);
  },

  get: (id) => apiFetch(`/api/posts/${id}`),

  retry: (id) =>
    apiFetch(`/api/posts/${id}/retry`, { method: 'POST' }),

  delete: (id) =>
    apiFetch(`/api/posts/${id}`, { method: 'DELETE' }),

  stats: () => apiFetch('/api/posts/stats'),
};

// ── Accounts ──────────────────────────────────

export const accountsAPI = {
  list: () => apiFetch('/api/accounts'),

  connect: (data) =>
    apiFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  disconnect: (id) =>
    apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
};

// ── Health ────────────────────────────────────

export const healthAPI = {
  check: () => apiFetch('/api/health'),
};
