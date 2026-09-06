# Project Instructions & Conventions

## Architecture & Integration Conventions
- **Python / Flask Backend (`climate_pledge_app/`)**:
  - Direct integration pattern for real-time environmental analysis: `generate_ai_aqi_advisory` using `gemini-3.7-flash` (or `gemini-flash-latest`) with `response_mime_type="application/json"` returning structured keys (`outdoor`, `indoor`, `commute`, `action`).
  - The `/api/aqi` endpoint bundles the `ai_advisory` object directly with the map/coordinate response payload.
  - Pledge analysis pattern: `generate_ai_pledge_analysis` with 3 sequential steps (Today, This Week, Month 1+).

## Cloud Run & Full-Stack Deployment Learnings
- **Environment Variable**: Always set `ENV NODE_ENV=production` in the `Dockerfile` to ensure production code paths execute on Cloud Run.
- **Vite Host Restrictions**: Always configure `allowedHosts: true` in `vite.config.ts` to prevent "Blocked request" errors when accessing Cloud Run (`*.run.app`) subdomains.
- **Server Production Detection**: In `server.ts`, detect production mode robustly via `process.env.NODE_ENV === 'production' || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))` to ensure static files are served correctly instead of attempting to spin up Vite dev middleware in production containers.

