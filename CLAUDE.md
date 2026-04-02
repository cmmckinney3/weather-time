# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (opens at http://localhost:5173)
- **Build for production**: `npm run build` (outputs to `dist/` folder)
- **Preview production build**: `npm run preview`

## Architecture Overview

This is a React weather application built with Vite, using the WeatherAPI.com service for data.

### Key Components Structure

- **App.jsx**: Main application component — weather data fetching, geolocation, search, autocomplete, favorites, and state management
- **WeatherAppLayout.jsx**: Navigation wrapper with tabbed interface for different weather views
- **WeatherDashboard.jsx**: Expandable card-based forecast view with detailed hourly data
- **DetailedForecast.jsx**: Chart-based temperature visualization using Recharts with tabbed day selection
- **WeatherConditionsWidget.jsx**: Instrument panel with gauges, detailed metrics, AQI, alerts, and wind compass
- **WindCompass.jsx**: SVG compass rose widget with animated needle showing wind direction

### Data Flow

1. User searches by city/zip/coordinates or uses geolocation in `App.jsx`
2. Autocomplete suggestions fetched from WeatherAPI `/v1/search.json` (debounced, 300ms)
3. `App.jsx` fetches weather from WeatherAPI forecast endpoint (3-day, AQI, alerts)
4. Weather data is processed and filtered to show current day onwards
5. Data is passed down to weather components via `WeatherAppLayout`
6. Each component displays different aspects of the same weather data

### Styling and UI

- **Tailwind CSS**: Primary styling framework with custom theme (cockpit/instrument-panel aesthetic)
- **Lucide React**: Icon library for weather icons and UI elements
- **Responsive design**: Mobile-first approach with responsive grids and layouts
- **Theme**: Dark navy (`cockpit-deep`, `cockpit-base`, `cockpit-panel`), cyan/amber/magenta accents, JetBrains Mono font, glassmorphism panels

### Weather Data Integration

- **API**: WeatherAPI.com — key read from `VITE_API_KEY` environment variable (see `.env.example`)
- **Forecast endpoint**: `/v1/forecast.json?days=3&aqi=yes&alerts=yes`
- **Autocomplete endpoint**: `/v1/search.json?q=<query>` — used for city suggestions as user types
- **Favorite weather endpoint**: `/v1/forecast.json?days=1` — lightweight fetch for favorites live data
- **Location handling**: Supports text search, zip codes, and `lat,lon` coordinates

### State Management

- Local component state using React hooks throughout
- `App.jsx` owns: weather data, loading/error, city input, autocomplete, recent searches, favorites, favorite weather cache, temp unit
- `WeatherAppLayout.jsx`: active tab selection
- `WeatherDashboard.jsx`: expandable day card state
- `DetailedForecast.jsx`: selected day tab
- `WeatherConditionsWidget.jsx`: expanded alert state

### localStorage Keys

| Key | Contents |
|-----|----------|
| `weather_last_city` | Last searched city string |
| `weather_recent` | JSON array of recent search strings (max 5) |
| `weather_favorites` | JSON array of favorited city name strings |

## Code Architecture & Utilities

### Shared Utilities (`src/utils/weatherUtils.jsx`)
- **`getWeatherIcon(condition, size)`** - Consistent weather icon rendering across components
- **`formatTime(dateTimeStr)`** - Standardized time formatting for hourly data
- **`getDayName(index, dateStr)` / `getShortDayName()`** - Consistent day labeling
- **`filterHourlyData(hourlyData, dayIndex)`** - Filters past hours for today's view
- **`getPrecipitationSummary(dayData)`** - Extracts precipitation data from API response
- **`getPrecipitationIntensity(chanceOfRain)`** - Color-coded precipitation risk levels
- **`getWeatherRecommendation(current, today)`** - Activity recommendations with precipitation awareness

### Shared Components (`src/components/shared/`)
- **`PrecipitationInfo.jsx`** - Reusable precipitation display
  - `PrecipitationInfo` - Detailed precipitation summary
  - `HourlyPrecipIndicator` - Compact hourly precipitation display

### WindCompass Component (`src/components/WindCompass.jsx`)
- Props: `windDegree` (0–360), `windDir` (string e.g. "NNW")
- SVG compass rose with animated needle using CSS transitions
- Uses `transformBox: fill-box` + `transformOrigin: center` for cross-browser SVG rotation (Safari/Firefox compatible)
- Amber needle tip = wind source direction; slate tail = opposite

## Features

### Search & Navigation
- City/zip/coordinates text search + browser geolocation
- **Autocomplete**: debounced suggestions from WeatherAPI as user types (≥2 chars)
- **Recent Searches**: last 5 searches persisted in localStorage, shown on input focus
- **Favorites**: star any loaded city; favorites panel shown on pre-search screen and in the search dropdown (always accessible)
- Favorites display live temp + condition icon (fetched on load)
- Temperature unit toggle (°F / °C)

### Weather Views (tabs)
- **Dashboard**: 3-day expandable cards with hourly breakdown, astronomical data
- **Forecast**: hourly temperature chart (actual vs feels-like), day selector tabs
- **Conditions**: gauge instruments (humidity, UV, wind, cloud), wind direction compass, metrics grid, AQI, weather alerts
- **Precipitation**: timeline/intensity/daily chart views

## Development Notes

- API key must be set in `.env` as `VITE_API_KEY` (copy from `.env.example`)
- No test files currently exist beyond Vite scaffold defaults
- Hourly data filtering shows only future hours for current day (`filterHourlyData`)
- The `RadialGauge` component in `WeatherConditionsWidget.jsx` requires a `relative`-positioned parent at call sites for its absolute-positioned center label
