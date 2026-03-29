/**
 * AutoPost Hub — API Client
 * Fetch wrapper with JWT token management and error handling.
 * No external dependencies — uses native fetch.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autopost_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autopost_token', token);
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('autopost_token');
}

export function getRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autopost_role');
}

export function setRole(role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autopost_role', role);
}

export function removeRole() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('autopost_role');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    removeRole();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
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
    return apiFetch('/api/upload', { method: 'POST', body: formData });
  },
};

// ── Posts ──────────────────────────────────────

export const postsAPI = {
  create: (data) =>
    apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(data) }),

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
  retry: (id) => apiFetch(`/api/posts/${id}/retry`, { method: 'POST' }),
  delete: (id) => apiFetch(`/api/posts/${id}`, { method: 'DELETE' }),
  stats: () => apiFetch('/api/posts/stats'),
};

// ── Accounts ──────────────────────────────────

export const accountsAPI = {
  list: () => apiFetch('/api/accounts'),
  connect: (data) =>
    apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(data) }),
  disconnect: (id) =>
    apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
};

// ── Top-Up & Balance ──────────────────────────

export const topupAPI = {
  create: (amount, proofFile) => {
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('proof', proofFile);
    return apiFetch('/api/topup', { method: 'POST', body: formData });
  },

  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    const qs = query.toString();
    return apiFetch(`/api/topup${qs ? `?${qs}` : ''}`);
  },

  balance: () => apiFetch('/api/balance'),
};

// ── Public Settings ───────────────────────────

export const settingsAPI = {
  getPublic: () => apiFetch('/api/settings/public'),
};

// ── Admin ─────────────────────────────────────

export const adminAPI = {
  stats: () => apiFetch('/api/admin/stats'),

  // Users
  users: (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    const qs = query.toString();
    return apiFetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUser: (id) => apiFetch(`/api/admin/users/${id}`),

  addBalance: (userId, amount, description) =>
    apiFetch(`/api/admin/users/${userId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),

  toggleSuspend: (userId) =>
    apiFetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' }),

  // Staff
  createStaff: (data) =>
    apiFetch('/api/admin/staff', { method: 'POST', body: JSON.stringify(data) }),

  deleteStaff: (id) =>
    apiFetch(`/api/admin/staff/${id}`, { method: 'DELETE' }),

  // Top-ups
  topups: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    const qs = query.toString();
    return apiFetch(`/api/admin/topups${qs ? `?${qs}` : ''}`);
  },

  reviewTopup: (id, action, note) =>
    apiFetch(`/api/admin/topups/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, note }),
    }),

  // Settings
  getSettings: () => apiFetch('/api/admin/settings'),

  updateSettings: (data) =>
    apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Ranking
  ranking: (limit = 20) =>
    apiFetch(`/api/admin/ranking?limit=${limit}`),
};

// ── Health ────────────────────────────────────

export const healthAPI = {
  check: () => apiFetch('/api/health'),
};
