# Weather My Way

Weather My Way is a Vite + React weather dashboard styled with Tailwind CSS. It uses [WeatherAPI.com](https://www.weatherapi.com/) to search locations and display current conditions, forecast details, and weather-related guidance.

## Features

- Search by city, ZIP code, or coordinates with WeatherAPI.com autocomplete.
- Use browser geolocation to load weather for the current location.
- Current conditions with temperature unit toggle (°F/°C), condition icon, and practical recommendation.
- 3-day forecast with expandable hourly breakdowns, precipitation, wind, humidity, UV, visibility, and astronomy details.
- Favorites and recent searches saved in `localStorage`.
- Radar/map-oriented components and responsive Tailwind UI.

## Tech stack

- Vite 5
- React 19
- Tailwind CSS 3
- Vitest + Testing Library
- WeatherAPI.com Forecast and Search APIs
- Supporting libraries: Lucide React, Recharts, Leaflet/React Leaflet, zipcodes

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root with your WeatherAPI.com key:

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
- `npm test` - run the Vitest test suite.

## Project structure

```text
weather-time/
├── public/                 # Static assets copied into the build
├── src/
│   ├── components/         # Weather dashboard, radar, forecast, and UI components
│   ├── components/shared/  # Shared display helpers
│   ├── services/           # WeatherAPI.com client helpers
│   ├── utils/              # Weather formatting and recommendation helpers
│   ├── App.jsx             # Main app state, search, favorites, layout
│   ├── index.css           # Tailwind and custom styles
│   └── index.jsx           # React entry point
├── vite.config.js          # Vite and Vitest configuration
├── tailwind.config.js      # Tailwind theme/configuration
└── package.json            # Dependencies and npm scripts
```

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
