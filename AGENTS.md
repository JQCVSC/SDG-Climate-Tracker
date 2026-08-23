# Project Instructions & Conventions

## Architecture & Integration Conventions
- **Python / Flask Backend (`climate_pledge_app/`)**:
  - Direct integration pattern for real-time environmental analysis: `generate_ai_aqi_advisory` using `gemini-3.7-flash` (or `gemini-flash-latest`) with `response_mime_type="application/json"` returning structured keys (`outdoor`, `indoor`, `commute`, `action`).
  - The `/api/aqi` endpoint bundles the `ai_advisory` object directly with the map/coordinate response payload.
  - Pledge analysis pattern: `generate_ai_pledge_analysis` with 3 sequential steps (Today, This Week, Month 1+).
