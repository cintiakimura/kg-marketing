/**
 * KG Marketing API
 * Express + PostgreSQL (pg) + Cloudflare R2 (@aws-sdk/client-s3)
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env locally; on Render, env vars are injected — dotenv optional
try {
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });
} catch {
  console.log('[env] Using platform environment variables (Render/dashboard)');
}

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initDatabase, ping } from './db.js';
import { uploadFile } from './r2.js';
import leadsRouter from './routes/leads.js';
import campaignsRouter from './routes/campaigns.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ---------------------------------------------------------------------------
// Startup checks (log only — do not exit; Render injects env at runtime)
// ---------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  console.warn('[startup] WARNING: DATABASE_URL is not set');
}
if (!process.env.R2_ACCOUNT_ID) {
  console.warn('[startup] WARNING: R2_ACCOUNT_ID is not set (uploads will fail)');
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
const origins = (process.env.CORS_ORIGIN || process.env.VITE_API_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// Health (Render uses this to confirm the process is alive)
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try {
    if (process.env.DATABASE_URL) {
      await ping();
      database = 'connected';
    }
  } catch (err) {
    database = 'error';
    console.error('[health] DB ping failed:', err.message);
  }
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'kg-marketing-api',
      database,
      timestamp: new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------------
// File upload → R2
// ---------------------------------------------------------------------------
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided (field name: file)' });
    }

    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(201).json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        file_url: result.file_url,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/leads', leadsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/ai', aiRouter);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: { name: 'KG Marketing API', health: '/api/health' },
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[api]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status < 500 ? err.message : 'Internal server error',
  });
});

// ---------------------------------------------------------------------------
// Start — listen FIRST so Render health checks pass, then init DB in background
// ---------------------------------------------------------------------------
function start() {
  const server = app.listen(PORT, HOST, () => {
    console.log(`[server] Listening on ${HOST}:${PORT}`);
    console.log(`[server] Health → /api/health`);
  });

  server.on('error', (err) => {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  });

  if (process.env.INIT_DB === 'true' && process.env.DATABASE_URL) {
    initDatabase()
      .then(() => console.log('[db] Schema ready'))
      .catch((err) => console.error('[db] Init failed (server still running):', err.message));
  }
}

process.on('unhandledRejection', (err) => {
  console.error('[fatal] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err);
  process.exit(1);
});

start();
