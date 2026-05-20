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
- `VITE_KG_MARKETING_API_URL`

## Scripts

```bash
npm install
npm run dev
npm run build
```
