# Deploy KG Marketing on Render

## Why deploy failed

Render was looking for `server.js` in the wrong place:

```
Cannot find module '/opt/render/project/src/server.js'
```

That usually means **Root Directory** is set to `src` (wrong) or **Start Command** is `node server.js` without `cd backend`.

## Fix — Web Service (API / Backend)

**Critical:** `npm install` must run inside `backend/` so `dotenv`, `express`, `pg`, etc. are installed.

In Render Dashboard → your service → **Settings**:

| Setting | Value |
|---------|--------|
| **Root Directory** | *(leave empty)* |
| **Build Command** | `cd backend && npm install --omit=dev` |
| **Start Command** | `cd backend && node server.js` |

Do **not** set Root Directory to `src` — that causes wrong paths.

Alternative (Root Directory = `backend`):

| **Root Directory** | `backend` |
| **Build Command** | `npm install --omit=dev` |
| **Start Command** | `node server.js` |

## Environment variables

Add all variables from `.env` in Render → **Environment** (never commit secrets).

Required:

- `DATABASE_URL` — use **Internal** URL when API runs on Render
- `DATABASE_SSL=true`
- `INIT_DB=true` (first deploy only, then `false`)
- `R2_*` variables
- `GROK_API_KEY_LUMEN`
- `CORS_ORIGIN` — include your frontend URL(s)
- `PORT` — Render sets this automatically; you can omit it

## "20 vulnerabilities" in build logs

That message comes from the **frontend** `npm install` at the repo root (Vite, Rollup, etc.) — **not** the API.

The **backend has 0 vulnerabilities**. If you still see 20 on deploy, your Render **Build Command** is wrong (e.g. `npm install` or `npm install && npm run build` at root).

**API service — use only:**

```bash
cd backend && npm install --omit=dev --no-audit --no-fund
```

Do **not** run root `npm install` on the API web service.

For a separate **Static Site** (frontend), vulnerabilities may still appear in logs; they do not block deploy unless the build exits with an error.

## "Application exited early"

Usually caused by:

1. **Server not listening before DB init** — fixed: app now binds `0.0.0.0:PORT` immediately.
2. **Missing env vars on Render** — add `DATABASE_URL`, `DATABASE_SSL=true`, R2 keys, `GROK_API_KEY_LUMEN` in Dashboard → Environment.
3. **Wrong build command** — must be `cd backend && npm install --omit=dev --no-audit`.

Check **Logs** tab for `[server] Listening on 0.0.0.0:...` — if missing, paste the error line above it.

## Verify

After deploy:

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Expect: `"status": "ok"`. `"database": "connected"` once `DATABASE_URL` is the Render **Internal** URL.

## Frontend (optional second service)

Create a **Static Site** on Render:

- Build: `npm install && npm run build`
- Publish directory: `dist`
- Env: `VITE_KG_MARKETING_API_URL=https://YOUR-API.onrender.com`
