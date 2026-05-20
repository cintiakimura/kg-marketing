/**
 * KG Marketing — authentication (standalone; no third-party BaaS).
 */

// TODO: Implement session/token storage and your auth provider (e.g. JWT, OAuth, Clerk).

export async function getCurrentUser() {
  // TODO: Fetch the current user from your auth API (e.g. GET /api/me)
  return { role: 'admin', email: 'user@kgmarketing.local', name: 'Demo User' };
}

export async function isAuthenticated() {
  // TODO: Return whether the user has a valid session/token
  return true;
}

export async function logout(_redirectUrl) {
  // TODO: Clear session/token and optionally redirect to your login page
}

export function redirectToLogin(_returnPath) {
  // TODO: Redirect to your login route (e.g. /login?returnUrl=...)
}
