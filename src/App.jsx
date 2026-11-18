import { useCallback, useEffect, useState } from "react";
import { CloudSun, CalendarRange, LayoutGrid, LocateFixed, Star, X, RotateCw } from "lucide-react";
import { Link, usePath } from "./lib/router";
import { useStoredState } from "./hooks/useStoredState";
import { useWeather } from "./hooks/useWeather";
import { fetchCurrentWeather } from "./services/weatherApi";
import { tempValue } from "./lib/weather";
import LocationSearch from "./components/LocationSearch";
import WeatherIcon from "./components/WeatherIcon";
import { UnitToggle } from "./components/ui";
import NowPage from "./pages/NowPage";
import ForecastPage from "./pages/ForecastPage";
import DetailsPage from "./pages/DetailsPage";

const ROUTES = [
  { to: "/", label: "Now", icon: CloudSun, Page: NowPage },
  { to: "/forecast", label: "Forecast", icon: CalendarRange, Page: ForecastPage },
  { to: "/details", label: "Details", icon: LayoutGrid, Page: DetailsPage },
];

const POPULAR = ["New York", "London", "Tokyo", "Sydney", "Paris", "Chicago", "Toronto", "Cape Town"];
const MAX_RECENTS = 5;

/** Saved places are { label, query }; older builds stored plain strings. */
function toPlace(entry) {
  if (typeof entry === "string" && entry) return { label: entry, query: entry };
  if (entry && typeof entry === "object" && entry.label) return { label: entry.label, query: entry.query || entry.label };
  return null;
}
const toPlaces = (list) => (Array.isArray(list) ? list.map(toPlace).filter(Boolean) : []);
const sameLabel = (a, b) => a?.toLowerCase() === b?.toLowerCase();

export default function App() {
  const path = usePath();
  const route = ROUTES.find((r) => r.to === path) ?? ROUTES[0];

  const [unit, setUnit] = useStoredState("weather_unit", "F");
  const [rawFavorites, setFavorites] = useStoredState("weather_favorites", []);
  const [rawRecents, setRecents] = useStoredState("weather_recent", []);
  const [lastPlace, setLastPlace] = useStoredState("weather_last_city", null);
  const favorites = toPlaces(rawFavorites);
  const recents = toPlaces(rawRecents);
  const [place, setPlace] = useState(null);
  const [favoriteWeather, setFavoriteWeather] = useState({});
  const [locating, setLocating] = useState(false);

  const onLoaded = useCallback(
    (data, label, query) => {
      const next = { label, query };
      setPlace(next);
      setLastPlace(next);
      setRecents((prev) => [next, ...toPlaces(prev).filter((p) => !sameLabel(p.label, label))].slice(0, MAX_RECENTS));
    },
    [setLastPlace, setRecents]
  );

  const { weather, yesterday, status, error, load, clearError } = useWeather({ onLoaded });

  // Restore the last location on first visit
  useEffect(() => {
    const saved = toPlace(lastPlace);
    if (saved) load(saved.query, { label: saved.label });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live temps for favorites (cheap current.json calls)
  const loadFavoriteWeather = useCallback(async (fav) => {
    try {
      const data = await fetchCurrentWeather(fav.query);
      setFavoriteWeather((prev) => ({ ...prev, [fav.label]: data.current }));
    } catch {
      setFavoriteWeather((prev) => ({ ...prev, [fav.label]: { error: true } }));
    }
  }, []);

  useEffect(() => {
    favorites.forEach((f) => {
      if (!favoriteWeather[f.label]) loadFavoriteWeather(f);
    });
  }, [rawFavorites]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFavorite = !!place && favorites.some((f) => sameLabel(f.label, place.label));
  const toggleFavorite = () => {
    if (!place) return;
    setFavorites((prev) => {
      const list = toPlaces(prev);
      return list.some((f) => sameLabel(f.label, place.label))
        ? list.filter((f) => !sameLabel(f.label, place.label))
        : [...list, place];
    });
    if (weather && !isFavorite) setFavoriteWeather((prev) => ({ ...prev, [place.label]: weather.current }));
  };
  const removeFavorite = (label) => setFavorites((prev) => toPlaces(prev).filter((f) => !sameLabel(f.label, label)));
  const removeRecent = (label) => setRecents((prev) => toPlaces(prev).filter((r) => !sameLabel(r.label, label)));

  const select = (query, label) => load(query, { label });

  const locate = () => {
    if (!navigator.geolocation) {
      load("auto:ip");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        load(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        // Permission denied or unavailable: fall back to an approximate IP lookup.
        setLocating(false);
        load("auto:ip");
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  };

  // Document title follows the loaded place and page
  useEffect(() => {
    document.title = weather
      ? `${tempValue(weather.current, "temp", unit)}° ${weather.location.name} · ${route.label} · Weather My Way`
      : "Weather My Way";
  }, [weather, unit, route.label]);

  const busy = status === "loading" || locating;
  const searchProps = {
    favorites,
    recents,
    favoriteWeather,
    unit,
    onSelect: select,
    onLocate: locate,
    onRemoveRecent: removeRecent,
    busy,
  };

  const Page = route.Page;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Weather My Way home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
              <CloudSun size={18} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-ink">Weather My Way</span>
          </Link>

          {weather && (
            <nav aria-label="Pages" className="ml-4 hidden items-center gap-1 md:flex">
              {ROUTES.map((r) => {
                const active = r === route;
                return (
                  <Link
                    key={r.to}
                    to={r.to}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
                    }`}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex-1" />

          {weather && (
            <div className="hidden w-72 md:block lg:w-80">
              <LocationSearch {...searchProps} />
            </div>
          )}
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>

        {weather && (
          <div className="px-4 pb-3 md:hidden">
            <LocationSearch {...searchProps} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 md:pb-12">
        {error && <ErrorBanner message={error} onDismiss={clearError} onRetry={place ? () => load(place.query, { label: place.label }) : null} />}

        {weather ? (
          <Page
            key={`${weather.location.lat},${weather.location.lon}`}
            weather={weather}
            yesterday={yesterday}
            unit={unit}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ) : status === "loading" ? (
          <LoadingSkeleton />
        ) : (
          <Welcome
            searchProps={searchProps}
            favorites={favorites}
            favoriteWeather={favoriteWeather}
            unit={unit}
            onSelect={select}
            onLocate={locate}
            onRemoveFavorite={removeFavorite}
            locating={locating}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-28 text-center text-xs text-faint sm:px-6 md:pb-8">
        Weather data from{" "}
        <a href="https://www.weatherapi.com/" className="underline underline-offset-2 hover:text-muted">
          WeatherAPI.com
        </a>{" "}
        · refreshes every 15 minutes
      </footer>

      {weather && (
        <nav
          aria-label="Pages"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-3">
            {ROUTES.map((r) => {
              const active = r === route;
              return (
                <Link
                  key={r.to}
                  to={r.to}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <r.icon size={22} strokeWidth={active ? 2.2 : 1.75} aria-hidden="true" />
                  {r.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function ErrorBanner({ message, onDismiss, onRetry }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
    >
      <p className="flex-1 pt-0.5">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="flex items-center gap-1 font-medium hover:underline">
          <RotateCw size={14} aria-hidden="true" /> Retry
        </button>
      )}
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="rounded p-0.5 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

function Welcome({ searchProps, favorites, favoriteWeather, unit, onSelect, onLocate, onRemoveFavorite, locating }) {
  return (
    <div className="rise mx-auto max-w-2xl pt-6 sm:pt-14">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl">What's it like out there?</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted sm:text-lg">
          Current conditions, the next few hours, and the days ahead, for anywhere.
        </p>
      </div>

      <div className="mt-8">
        <LocationSearch {...searchProps} size="lg" autoFocus />
      </div>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
        >
          <LocateFixed size={16} aria-hidden="true" />
          {locating ? "Finding you…" : "Use my current location"}
        </button>
      </div>

      {favorites.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
            <Star size={14} className="text-warm" fill="currentColor" aria-hidden="true" /> Favorites
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {favorites.map((f) => {
              const fw = favoriteWeather[f.label];
              return (
                <li key={f.label} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(f.query, f.label)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left shadow-card transition-colors hover:bg-subtle"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{f.label.split(",")[0]}</span>
                      <span className="block truncate text-xs text-faint">{f.label.split(",").slice(1).join(",").trim()}</span>
                    </span>
                    {fw && !fw.error ? (
                      <span className="tabular flex items-center gap-2 text-lg font-semibold text-ink">
                        <WeatherIcon condition={fw.condition} isDay={fw.is_day} size={22} />
                        {Math.round(unit === "F" ? fw.temp_f : fw.temp_c)}°
                      </span>
                    ) : (
                      <span className="text-xs text-faint">{fw?.error ? "Unavailable" : "…"}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(f.label)}
                    aria-label={`Remove ${f.label} from favorites`}
                    className="absolute -right-2 -top-2 hidden rounded-full border border-line bg-surface p-1 text-faint shadow-card hover:text-ink group-hover:block focus:block"
                  >
                    <X size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">Or try</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onSelect(city)}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-faint"
            >
              {city}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4 sm:space-y-5">
      <span className="sr-only">Loading weather…</span>
      <div className="skeleton h-72 !rounded-3xl sm:h-80" />
      <div className="skeleton h-56 !rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 !rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
