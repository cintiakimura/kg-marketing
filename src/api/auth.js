/// <reference types="vite/client" />
/**
 * KG Marketing — authentication (session token + backend API).
 */

const TOKEN_KEY = 'kg_auth_token';
const USER_KEY = 'kg_auth_user';

/** @param {string} message @param {number} [status] */
function createAuthError(message, status) {
  const err = new Error(message);
  if (status != null) {
    Object.defineProperty(err, 'status', { value: status, enumerable: true });
  }
  return err;
}

function getApiBase() {
  const envUrl =
    import.meta.env.VITE_KG_MARKETING_API_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(email, password) {
  const base = getApiBase();

  if (base) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw createAuthError(json.error || 'Login failed', res.status);
    }

    const { token, user } = json.data;
    persistSession(token, user);
    return { token, user };
  }

  // Offline dev fallback (no backend URL)
  const demoEmail = 'admin@kgprotech.com';
  if (email.toLowerCase().trim() !== demoEmail || password !== 'kgmarketing2026') {
    throw createAuthError('Invalid email or password', 401);
  }

  const user = { id: 'demo', email: demoEmail, name: 'Demo User', role: 'admin' };
  const token = `demo_${Date.now()}`;
  persistSession(token, user);
  return { token, user };
}

export async function getCurrentUser() {
  const cached = getStoredUser();
  const token = getStoredToken();
  if (!token) {
    throw createAuthError('Not authenticated', 401);
  }

  const base = getApiBase();
  if (base && !token.startsWith('demo_')) {
    const res = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      clearSession();
      throw createAuthError(json.error || 'Session expired', 401);
    }

    const user = json.data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  if (cached) return cached;
  throw createAuthError('Not authenticated', 401);
}

export async function isAuthenticated() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function logout(_redirectUrl) {
  const base = getApiBase();
  const token = getStoredToken();

  if (base && token && !token.startsWith('demo_')) {
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
  }

  clearSession();
}

export function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
