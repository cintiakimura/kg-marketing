# KG Marketing

Standalone Vite + React marketing campaign app for KG Protech (Campaign-in-a-Box).

## Stack

- React 18, Vite 6, React Router, TanStack Query
- Tailwind CSS, shadcn/ui, Radix UI

## Backend

API calls are stubbed under `src/api/` with `TODO` comments. Wire each module to your own backend:

- `src/api/entities.js` — Leads, Campaigns, Clients, etc.
- `src/api/auth.js` — Authentication
- `src/api/integrations.js` — LLM, email, file upload
- `src/api/functions.js` — Server functions (Gmail, Calendar sync)
- `functions/` — Deno handlers (Google APIs; persistence TODOs)

## Environment

Optional:

- `VITE_KG_MARKETING_APP_ID`
- `VITE_KG_MARKETING_API_URL` — backend URL (auth + API)

**Auth (backend):**

- `AUTH_SECRET` — signing key for session tokens (required in production)
- `AUTH_ALLOWED_EMAIL_DOMAIN` — optional; e.g. `kgprotech.com` limits signups to company email
- Users sign up via the landing page; passwords are hashed and stored in the `users` table

**Smart Lead Finder (Grok):**

- `VITE_KG_MARKETING_API_URL` — e.g. `http://localhost:3001` (calls `POST /api/ai/find-leads`)
- `GROK_API_KEY_LUMEN` — set on the **backend** for live multi-step research (Render env)
- `VITE_GROK_API_KEY` — optional; direct browser Grok if not using backend proxy
- `VITE_GROK_USE_BACKEND_PROXY=true` — force backend proxy when both keys are set
- `VITE_GROK_MODEL` — default `grok-2-latest`

## Scripts

```bash
npm install
npm run dev              # frontend (Vite)
npm run dev:backend      # API server (Express)
npm run build
npm start                # serve frontend dist
npm run start:backend    # production API
```

### Backend API

```bash
cd backend && cp .env.example .env   # add your secrets locally — never commit .env
npm install
npm run dev                          # or from root: npm run dev:backend
```

Production: `npm start` (runs backend from repo root).

## Deploy on Render (one Web Service — landing + API)

Use `render.yaml` or configure manually:

1. **Web Service** → connect this repo
2. **Build command:** `npm install && npm run build` (builds `dist/` + backend deps)
3. **Start command:** `cd backend && node server.js`
4. **Node:** 20

Visiting your service URL serves the **landing page** at `/` and the API at `/api/*`.

Set on Render: `DATABASE_URL`, `GROK_API_KEY_LUMEN`, `AUTH_SECRET`, `INIT_DB=true`, `CORS_ORIGIN` (include your Render URL).

`VITE_KG_MARKETING_API_URL` should match your Render URL (see `render.yaml`).
