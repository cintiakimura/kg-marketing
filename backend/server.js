/**
 * KG Marketing API
 * Express + PostgreSQL (pg) + Cloudflare R2 (@aws-sdk/client-s3)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env (user often places it there) then backend/.env overrides
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initDatabase, ping } from './db.js';
import { uploadFile } from './r2.js';
import leadsRouter from './routes/leads.js';
import campaignsRouter from './routes/campaigns.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try {
    await ping();
    database = 'connected';
  } catch {
    database = 'error';
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

// Root
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: { name: 'KG Marketing API', health: '/api/health' },
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[api]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status < 500 ? err.message : 'Internal server error',
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function start() {
  if (process.env.INIT_DB === 'true') {
    try {
      await initDatabase();
    } catch (e) {
      console.error('[db] Init failed:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
    console.log(`[server] Health → http://localhost:${PORT}/api/health`);
  });
}

start();
