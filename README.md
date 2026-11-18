# Weather My Way

Weather My Way is a clean, three-page weather app built with React, Vite and Tailwind CSS. It uses [WeatherAPI.com](https://www.weatherapi.com/) (free plan) to show what the weather is doing now, what it will do over the next three days, and the finer details: air quality, UV, wind, humidity, sun and moon.

## Features

- **Now**: current conditions on a sky-tinted card, a plain-language summary of the next 12 hours ("Rain likely around 6 PM. Falling to 31° by 5 AM."), a 24-hour timeline, and quick facts for precipitation, wind, sunrise/sunset and air quality.
- **Forecast**: an hour-by-hour timeline for the whole 3-day free-plan window (temperature curve, chance of rain or snow, wind), plus a card for each day.
- **Details**: air quality and pollutants, UV, wind compass, humidity and dew point, feels-like, pressure trend, visibility, precipitation totals, today vs. yesterday, sun and moon.
- Search by city, ZIP/postcode, coordinates, or airport code with autocomplete; use your current location (falls back to IP lookup).
- Favorites with live temperatures, recent searches, and °F/°C, all saved in `localStorage`.
- Weather alerts, automatic light/dark mode, phone-friendly layout with a bottom tab bar, silent refresh every 15 minutes.

## Tech stack

- React 19, Vite 8, Tailwind CSS 4
- Vitest + Testing Library
- Lucide icons; charts and gauges are hand-built SVG
- WeatherAPI.com Forecast, History, Current, and Search APIs (free plan)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` in the project root with your WeatherAPI.com key (see `.env.example`):

   ```env
   VITE_API_KEY=your_weatherapi_key
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   Vite will print the local dev URL, typically `http://localhost:5173/`.

## Scripts

- `npm start` - run the Vite development server.
- `npm run build` - create a production build in `dist/`.
- `npm run preview` - preview the production build locally.
- `npm test` - run the Vitest test suite (watch mode); `npx vitest run` for a single run.

## Project structure

```text
src/
|-- App.jsx              # Shell: header, navigation, search, favorites, welcome screen
|-- pages/               # NowPage, ForecastPage, DetailsPage
|-- components/          # HourlyChart, LocationSearch, WeatherIcon, Gauges, ui primitives
|-- hooks/               # useWeather (fetch + refresh), useStoredState (localStorage)
|-- lib/weather.js       # Data shaping, units, summaries (unit tested)
|-- lib/router.jsx       # Tiny pathname router
|-- services/weatherApi.js
`-- index.css            # Tailwind 4 + design tokens (light/dark)
```

See `CLAUDE.md` / `AGENTS.md` for architecture notes and conventions.

## API key and security notes

- `VITE_API_KEY` is read in the browser via Vite's `import.meta.env`, so it is included in the client bundle. Do not treat this as a secret in a public deployment.
- Do not commit `.env`, `.env.local`, or real API keys.
- WeatherAPI.com free-tier limits may apply. If the app stops returning data, check your quota, key status, and request parameters.
- For stronger key protection, proxy WeatherAPI.com requests through a backend you control instead of calling the API directly from the browser.

## Deployment

Run:

```bash
npm run build
```

The production output is written to `dist/`. Deploy the contents of `dist/` to any static hosting provider that supports single-page apps, and configure `VITE_API_KEY` in the host's build environment before building.
