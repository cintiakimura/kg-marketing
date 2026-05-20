/**
 * Auth routes — email/password login with signed session tokens.
 */
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'kg-marketing-change-in-production';
}

function getDemoCredentials() {
  return {
    email: (process.env.AUTH_ADMIN_EMAIL || 'admin@kgprotech.com').toLowerCase().trim(),
    password: process.env.AUTH_ADMIN_PASSWORD || 'kgmarketing2026',
    name: process.env.AUTH_ADMIN_NAME || 'KG Admin',
    role: process.env.AUTH_ADMIN_ROLE || 'admin',
  };
}

function signToken(payload) {
  const secret = getAuthSecret();
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = crypto
    .createHmac('sha256', getAuthSecret())
    .update(body)
    .digest('base64url');

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function userFromPayload(payload) {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const creds = getDemoCredentials();

  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const normalized = email.toLowerCase().trim();
  if (normalized !== creds.email || password !== creds.password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const user = {
    id: 'admin-1',
    email: creds.email,
    name: creds.name,
    role: creds.role,
  };

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({ success: true, data: { token, user } });
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }

  res.json({ success: true, data: { user: userFromPayload(payload) } });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req, res) => {
  res.json({ success: true, data: { message: 'Logged out' } });
});

export { verifyToken };
export default router;
