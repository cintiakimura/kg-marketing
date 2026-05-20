# Deploy KG Marketing on Render

## Why deploy failed

Render was looking for `server.js` in the wrong place:

```
Cannot find module '/opt/render/project/src/server.js'
```

That usually means **Root Directory** is set to `src` (wrong) or **Start Command** is `node server.js` without `cd backend`.

## Fix — Web Service (API / Backend)

In Render Dashboard → your service → **Settings**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

Or leave **Root Directory** empty and use:

| Setting | Value |
|---------|--------|
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `npm start` |

(`npm start` runs `cd backend && node server.js` from root `package.json`.)

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

## Verify

After deploy:

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Expect: `"database": "connected"`

## Frontend (optional second service)

Create a **Static Site** on Render:

- Build: `npm install && npm run build`
- Publish directory: `dist`
- Env: `VITE_KG_MARKETING_API_URL=https://YOUR-API.onrender.com`
