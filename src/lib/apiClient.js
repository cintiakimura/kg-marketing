/**
 * Shared fetch helper for KG Marketing backend.
 */
import { getStoredToken } from '@/api/auth';

export function getApiBase() {
  const envUrl =
    import.meta.env.VITE_KG_MARKETING_API_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export async function apiRequest(path, options = {}) {
  const base = getApiBase();
  if (!base) {
    throw new Error('Set VITE_KG_MARKETING_API_URL to connect to the API');
  }

  const token = getStoredToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    headers,
    ...options,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json.data;
}
