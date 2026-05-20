/**
 * Auth — sign up (save hashed password) + login (verify against DB).
 */
import { Router } from 'express';
import crypto from 'crypto';
import { query, ensureUsersTable } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const router = Router();

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'kg-marketing-change-in-production';
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

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name || row.email.split('@')[0],
    role: 'member',
  };
}

function normalizeEmail(email) {
  return email?.toLowerCase().trim() || '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function allowedEmailDomain() {
  const domain = (process.env.AUTH_ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase();
  return domain || null;
}

function emailAllowed(email) {
  const domain = allowedEmailDomain();
  if (!domain) return true;
  return email.endsWith(`@${domain}`);
}

/**
 * POST /api/auth/signup
 * Body: { email, password, full_name? }
 */
function mapAuthDbError(err, res, next) {
  console.error('[auth]', err.code, err.message);
  if (err.status === 503) {
    return res.status(503).json({ success: false, error: err.message });
  }
  if (err.code === '42P01') {
    return res.status(503).json({
      success: false,
      error: 'Database not initialized. Set DATABASE_URL and INIT_DB=true on Render, then redeploy.',
    });
  }
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === '57P03') {
    return res.status(503).json({
      success: false,
      error: 'Cannot reach the database. Check DATABASE_URL on Render.',
    });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }
  return next(err);
}

router.post('/signup', async (req, res, next) => {
  try {
    await ensureUsersTable();

    const { email, password, full_name } = req.body || {};
    const normalized = normalizeEmail(email);

    if (!normalized || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    if (!isValidEmail(normalized)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    if (!emailAllowed(normalized)) {
      const domain = allowedEmailDomain();
      return res.status(400).json({
        success: false,
        error: `Use your company email (@${domain})`,
      });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [normalized]);
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const name = (full_name || '').trim() || normalized.split('@')[0];

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [normalized, passwordHash, name]
    );

    const user = formatUser(rows[0]);
    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    return mapAuthDbError(err, res, next);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    await ensureUsersTable();

    const { email, password } = req.body || {};
    const normalized = normalizeEmail(email);

    if (!normalized || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { rows } = await query(
      'SELECT id, email, full_name, password_hash FROM users WHERE email = $1',
      [normalized]
    );

    const row = rows[0];
    if (!row) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = formatUser(row);
    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({ success: true, data: { token, user } });
  } catch (err) {
    return mapAuthDbError(err, res, next);
  }
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

function userFromPayload(payload) {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role || 'member',
  };
}

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req, res) => {
  res.json({ success: true, data: { message: 'Logged out' } });
});

export { verifyToken };
export default router;
