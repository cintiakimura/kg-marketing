# Fix sign up on Render — `DATABASE_URL is not configured`

Your app is working. The API just has **no database connection** on the Render service.

You are on: **https://kg-marketing-api.onrender.com** (or similar)

## Fix in 2 minutes (Render Dashboard)

### 1. Open your **Web Service** (the one that runs the API)
Not the Static Site — the **Web Service** named e.g. `kg-marketing-api` or `kg-marketing`.

### 2. Environment → Add variables

| Key | Value |
|-----|--------|
| `DATABASE_URL` | From Postgres → **Connections** → **Internal Database URL** |
| `DATABASE_SSL` | `true` |
| `INIT_DB` | `true` |
| `AUTH_SECRET` | Any long random string (or Generate) |
| `AUTH_ALLOWED_EMAIL_DOMAIN` | `kgprotech.com` (optional) |

**Important:** Use the **Internal** URL (hostname like `dpg-xxxxx-a`), not the External URL, when API and DB are both on Render.

### 3. If you have no Postgres yet
1. Render Dashboard → **New +** → **PostgreSQL**
2. Create database (free tier is fine)
3. Copy **Internal Database URL**
4. Paste into Web Service → Environment → `DATABASE_URL`
5. **Save** → **Manual Deploy**

### 4. Verify
Open: `https://YOUR-SERVICE.onrender.com/api/health`

```json
"database": "connected",
"users_table": true
```

Then sign up again on the landing page.

## Also set (same Web Service)

- `GROK_API_KEY_LUMEN` — your **xAI API key** (Smart Lead Finder + Grok campaigns). Without this, the app uses **demo** sample data.
- `GROK_MODEL` — optional; default is `grok-4.3`. Do **not** use retired names like `grok-2-latest` (API returns “Model not found” and find-leads fails).
- `CORS_ORIGIN` — `https://kg-marketing-api.onrender.com` (your real URL)
- `VITE_KG_MARKETING_API_URL` — only needed at **build** time; set to same URL and redeploy

Your local `.env` file is **not** uploaded to Render — env vars must be set in the dashboard.

### Verify Grok (not demo)

1. After deploy, open: `https://YOUR-SERVICE.onrender.com/api/ai/status`  
   Expect: `"grok_configured": true`
2. Or: `https://YOUR-SERVICE.onrender.com/api/health`  
   Expect: `"grok_configured": true`
3. In the app, open **Smart Lead Finder** — you should see “Live Grok enabled” at the top (not the amber demo warning).

A permanent public URL is **not** required for Grok — only the API key on the **server** that handles `/api/ai/find-leads`.
