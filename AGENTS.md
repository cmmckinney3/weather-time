# AGENTS.md

Guidance for coding agents (Codex, Antigravity, and others) working in this repository. `CLAUDE.md` carries the same content, so keep the two in sync.

## Development Commands

- **Start development server**: `npm start` (http://localhost:5173)
- **Run tests**: `npm test` (Vitest, watch mode) or `npx vitest run`
- **Build for production**: `npm run build` (outputs to `dist/`, deployed via Firebase Hosting)
- **Preview production build**: `npm run preview`

## Stack

React 19 · Vite 8 · Tailwind CSS 4 (configured in CSS via `@theme`, no `tailwind.config.js`) · Lucide icons · Vitest + Testing Library. No router or chart library: both are small hand-written pieces (see below).

## Product shape

Three pages, each with one job:

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `src/pages/NowPage.jsx` | Weather right now + near future: condition-tinted hero, plain-language summary of the next 12 h, next-24-hours timeline, 4 quick facts (precip, wind, next sunrise/sunset, air quality), 3-day outlook |
| `/forecast` | `src/pages/ForecastPage.jsx` | Full hourly timeline (all remaining forecast hours, day chips jump within it) + a detail card per day |
| `/details` | `src/pages/DetailsPage.jsx` | Everything not "is it nice out": alerts, air quality + pollutants, UV, wind dial, humidity/dew point, feels-like, pressure trend, visibility, precip totals, yesterday comparison, sun arc, moon phase, location |

With no location loaded, `App.jsx` shows a welcome screen (search, use my location, favorites, popular cities).

## Architecture

```
src/
  App.jsx                 Shell: header (brand, desktop tabs, search, °F/°C), mobile bottom tab bar,
                          welcome/loading/error states, favorites + recents, geolocation
  lib/weather.js          ALL data shaping: unit formatting, local-time parsing, condition kinds,
                          summaries, scales (AQI/UV/Beaufort/dew point), sun & moon math. Pure + tested.
  lib/router.jsx          ~40-line pathname router (usePath, navigate, <Link>)
  hooks/useWeather.js     Fetches forecast (+ yesterday via history.json), silent 15-min refresh,
                          refresh on tab focus when stale, aborts superseded requests
  hooks/useStoredState.js localStorage-backed useState (tolerates blocked storage and legacy raw strings)
  services/weatherApi.js  WeatherAPI.com client: forecast, search, current, history
  components/
    HourlyChart.jsx       Scrollable hour columns + SVG temperature curve, precip bars, optional wind row/day chips
    LocationSearch.jsx    Accessible combobox: autocomplete, use-my-location, favorites (live temps), recents
    WeatherIcon.jsx       Condition code -> Lucide icon + color
    Gauges.jsx            WindDial, MoonPhase, SunArc (SVG)
    ui.jsx                Card, CardHeader, PageHeader, TextLink, UnitToggle, RangeBar, ScaleBar, Stat
  pages/                  NowPage, ForecastPage, DetailsPage
  test/fixtures.js        makeWeather(): WeatherAPI-shaped response builder for tests
```

`src/pages/QwenWeather/` and `src/router.jsx` are an older, untracked experiment. The app does not import them, and `index.css` excludes them from Tailwind scanning.

### Conventions

- **Never pass WeatherAPI local time strings through `Date` for display.** `"2026-11-17 15:00"` is the *location's* wall clock; use `parseLocal`, `formatHour`, `formatClock`, `dayName` from `lib/weather.js` so labels don't shift into the viewer's timezone.
- **Units**: one `unit` ("F" | "C") flows from `App` to every page. F means mph, in, mi, inHg; C means km/h, mm, km, hPa. Use the `temp/speed/precip/distance/pressure` helpers rather than reading `_f`/`_c` fields directly.
- **Conditions**: use `conditionKind(condition)` (code-based, text fallback) instead of string-matching condition text.
- **Data logic goes in `lib/weather.js` with a test in `lib/weather.test.js`**; components stay presentational.

### Styling

- Design tokens are CSS variables in `src/index.css` (`--canvas`, `--surface`, `--subtle`, `--line`, `--ink`, `--muted`, `--faint`, `--accent`, `--rain`, `--warm`, `--cool`), exposed to Tailwind via `@theme inline` as `bg-surface`, `text-muted`, `border-line`, etc. Light/dark switches automatically with `prefers-color-scheme`; `dark:` variants also follow the system setting.
- The Now hero is the one expressive element: `.sky .sky-<theme>` gradients keyed by `skyTheme(condition, isDay)`.
- Inter with `.tabular` (tabular numerals) for every number readout. Section titles are `CardHeader` (small uppercase muted).
- Mobile-first. Pages get a bottom tab bar under `md`, header tabs at `md+`. Keep the 390px width working.
- SVG visuals use CSS variables (`var(--warm)`, `var(--line)`, ...) so they follow the theme.

## WeatherAPI.com (free plan)

- Key: `VITE_API_KEY` in `.env` (see `.env.example`). It is bundled into the client, so it is not a secret.
- `forecast.json?days=3&aqi=yes&alerts=yes`: the free plan returns **3 days max** (asking for more still returns 3). Includes hourly data, astro, current air quality, and alerts.
- `history.json?dt=YYYY-MM-DD`: used for yesterday's comparison (free plan covers the last 7 days).
- `current.json`: lightweight live temps for favorites.
- `search.json`: autocomplete (debounced 250ms, aborted on new input).
- **Not on the free plan**: pollen, forecast-day/hourly air quality, more than 3 forecast days. The UI must not promise these.

## localStorage keys

| Key | Contents |
|-----|----------|
| `weather_last_city` | `{ label, query }` of the last loaded place (older builds stored a plain string, still accepted) |
| `weather_recent` | Array of `{ label, query }`, max 5 (plain strings accepted) |
| `weather_favorites` | Array of `{ label, query }` (plain strings accepted) |
| `weather_unit` | `"F"` or `"C"` |

`query` is what gets sent to the API (`id:123` from autocomplete, `lat,lon` from geolocation); `label` is what is shown. `auto:ip` lookups are saved as resolved coordinates.

## Ideas not yet built

- Precipitation radar / map page (the previous Leaflet + NOAA radar implementation is in git history before the redesign)
- Manual light/dark override (currently follows the system)
- Shareable `?q=` location URLs
