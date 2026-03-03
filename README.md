# Weather Vision

Next.js (App Router) weather app with a simple UI and an API route at `/api/weather`.

## Getting started

### Run the app

From this `weather-app/` folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

If port `3000` is already in use, Next.js will automatically pick the next available port (e.g. `3001`).

### Test the API

Open in your browser (or `curl`):

- `http://localhost:3000/api/weather?city=London`

## Environment variables (optional)

The API route will **prefer OpenWeather** when `OPENWEATHER_API_KEY` is configured, but will **fallback to Open‑Meteo** (no API key required) if the key is missing/invalid. This makes the project run out-of-the-box.

Create `weather-app/.env.local`:

```bash
OPENWEATHER_API_KEY=c15f8576880445cfbcb154336250111$
```

Restart the dev server after changing `.env.local`.
