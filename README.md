# Weather Vision

This repo contains the Weather Vision Next.js app inside `weather-app/`.

## Run (recommended)

From the repo root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- The API endpoint is `GET /api/weather?city=London`.
- Optional env: set `OPENWEATHER_API_KEY` in `weather-app/.env.local` (the API falls back to a no-key provider if not set).

