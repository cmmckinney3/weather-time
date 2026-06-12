import React, { useState, useEffect, useRef, useCallback } from "react";
import WeatherAppLayout from "./components/WeatherAppLayout";
import { MapPin, Search, Compass, Zap, Droplets, Wind, X, Clock, Radio, Star } from "lucide-react";
import { getWeatherRecommendation, getWeatherIcon, getAtmosphere } from "./utils/weatherUtils";
import { fetchForecastWeather, searchLocations } from "./services/weatherApi";

const WEATHER_QUOTES = {
  sunny: [
    "Wherever you go, no matter what the weather, always bring your own sunshine.",
    "A sunny day is a reminder that light always follows darkness.",
    "Keep your face to the sunshine and you cannot see the shadow.",
  ],
  rainy: [
    "Some people feel the rain. Others just get wet.",
    "Let the rain kiss you. Let the rain beat upon your head with silver liquid drops.",
    "The sound of rain needs no translation.",
  ],
  cloudy: [
    "Even the darkest clouds will eventually part for the sun.",
    "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.",
    "Behind every cloud is another cloud.",
  ],
  snowy: [
    "Snowflakes are one of nature's most fragile things, but just look what they can do when they stick together.",
    "When snow falls, nature listens.",
    "The first fall of snow is not only an event, it is a magical event.",
  ],
  default: [
    "Wherever you go, the weather follows you.",
    "Climate is what we expect, weather is what we get.",
    "Nature, time and patience are the three great physicians.",
  ],
};

function randomQuote(category) {
  const quotes = WEATHER_QUOTES[category] ?? WEATHER_QUOTES.default;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// WeatherAPI localtime arrives as "YYYY-MM-DD HH:mm"
function formatLocalTime(localtime) {
  if (!localtime) return null;
  const parsed = new Date(localtime.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function App() {
  const [city, setCity] = useState(() => localStorage.getItem("weather_last_city") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [quote, setQuote] = useState(() => randomQuote("default"));
  const [tempUnit, setTempUnit] = useState("F");
  const [recentSearches, setRecentSearches] = useState(
    () => JSON.parse(localStorage.getItem("weather_recent") || "[]")
  );
  const [showRecents, setShowRecents] = useState(false);
  const blurTimerRef = useRef(null);
  const autocompleteTimerRef = useRef(null);
  const lastQueryRef = useRef(null);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSearched, setAutocompleteSearched] = useState(false);
  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("weather_favorites") || "[]")
  );
  const [favoriteWeather, setFavoriteWeather] = useState({});
  // Map of cityName → { temp_f, temp_c, condition }

  const fetchFavoriteWeather = useCallback(async (cityName) => {
    try {
      const data = await fetchForecastWeather(cityName, { days: 1, aqi: false, alerts: false });
      setFavoriteWeather((prev) => ({
        ...prev,
        [cityName]: {
          temp_f: data.current.temp_f,
          temp_c: data.current.temp_c,
          condition: data.current.condition,
        },
      }));
    } catch {
      setFavoriteWeather((prev) => ({ ...prev, [cityName]: { error: true } }));
    }
  }, []);

  const retryFavoriteWeather = (cityName) => {
    setFavoriteWeather((prev) => {
      const next = { ...prev };
      delete next[cityName];
      return next;
    });
    fetchFavoriteWeather(cityName);
  };

  const toggleFavorite = (cityName) => {
    setFavorites((prev) => {
      const isFav = prev.some((c) => c.toLowerCase() === cityName.toLowerCase());
      const next = isFav
        ? prev.filter((c) => c.toLowerCase() !== cityName.toLowerCase())
        : [...prev, cityName];
      localStorage.setItem("weather_favorites", JSON.stringify(next));
      if (!isFav) fetchFavoriteWeather(cityName);
      return next;
    });
  };

  const isFavorite = (cityName) =>
    favorites.some((c) => c.toLowerCase() === cityName?.toLowerCase());

  useEffect(() => {
    if (!weather?.current) return;
    const condition = weather.current.condition.text.toLowerCase();
    if (condition.includes("sun") || condition.includes("clear")) {
      setQuote(randomQuote("sunny"));
    } else if (condition.includes("rain")) {
      setQuote(randomQuote("rainy"));
    } else if (condition.includes("cloud")) {
      setQuote(randomQuote("cloudy"));
    } else if (condition.includes("snow")) {
      setQuote(randomQuote("snowy"));
    } else {
      setQuote(randomQuote("default"));
    }
  }, [weather]);

  const fetchWeather = async (query) => {
    setLoading(true);
    setError(null);
    setShowRecents(false);
    try {
      const data = await fetchForecastWeather(query);
      setWeather(data);
      lastQueryRef.current = query;
      localStorage.setItem("weather_last_city", query);
      setRecentSearches((prev) => {
        const next = [query, ...prev.filter((c) => c.toLowerCase() !== query.toLowerCase())].slice(0, 5);
        localStorage.setItem("weather_recent", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      setError(err.message || "Could not fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("weather_last_city");
    if (saved) fetchWeather(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("weather_favorites") || "[]");
    saved.forEach(fetchFavoriteWeather);
  }, [fetchFavoriteWeather]);

  // Clean up pending timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(autocompleteTimerRef.current);
      clearTimeout(blurTimerRef.current);
    };
  }, []);

  // Silent auto-refresh every 20 minutes
  useEffect(() => {
    const id = setInterval(() => {
      if (!lastQueryRef.current) return;
      fetchForecastWeather(lastQueryRef.current)
        .then(setWeather)
        .catch(() => {});
    }, 20 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      () => {
        setError("Unable to retrieve your location.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setShowRecents(false);
    clearTimeout(autocompleteTimerRef.current);
    if (value.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      setAutocompleteSearched(false);
      return;
    }
    autocompleteTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(value);
        setAutocompleteResults(data);
        setAutocompleteSearched(true);
        setShowAutocomplete(true);
      } catch {
        // ignore autocomplete failures silently
      }
    }, 300);
  };

  const handleAutocompleteSelect = (result) => {
    setCity(result.name);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
    fetchWeather(result.name);
  };

  const getWeather = () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }
    fetchWeather(city.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowAutocomplete(false);
      getWeather();
    }
    if (e.key === "Escape") {
      setShowRecents(false);
      setShowAutocomplete(false);
    }
  };

  const handleInputFocus = () => {
    clearTimeout(blurTimerRef.current);
    if (!showAutocomplete && (recentSearches.length > 0 || favorites.length > 0)) setShowRecents(true);
  };

  const handleInputBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      setShowRecents(false);
      setShowAutocomplete(false);
    }, 150);
  };

  const clearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem("weather_recent");
    setShowRecents(false);
  };

  const removeRecent = (item) => {
    setRecentSearches((prev) => {
      const next = prev.filter((c) => c !== item);
      if (next.length === 0) localStorage.removeItem("weather_recent");
      else localStorage.setItem("weather_recent", JSON.stringify(next));
      return next;
    });
  };

  const recommendation =
    weather?.forecast?.forecastday?.[0]
      ? getWeatherRecommendation(weather.current, weather.forecast.forecastday[0])
      : null;

  const todayDay = weather?.forecast?.forecastday?.[0]?.day;
  const atmosphere = weather
    ? getAtmosphere(weather.current.condition, weather.current.is_day === 1)
    : "default";
  const localTime = formatLocalTime(weather?.location?.localtime);

  // Theme <html> too so the body background (outside the React root)
  // follows the atmosphere as well.
  useEffect(() => {
    document.documentElement.dataset.atmo = atmosphere;
  }, [atmosphere]);

  return (
    <div
      className="min-h-screen bg-cockpit-deep relative transition-colors duration-700"
      data-atmo={atmosphere}
    >
      {/* Ambient atmosphere — sky wash, aurora, dot grid, film grain */}
      <div className="atmosphere" aria-hidden="true">
        <div className="sky-wash" />
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="noise" />
      </div>

      {/* Top bar */}
      <header className="border-b border-cockpit-border/70 bg-cockpit-deep/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-ch-cyan/40 bg-ch-cyan/10 flex items-center justify-center shadow-glow-cyan">
              <Zap size={14} className="text-ch-cyan" />
            </div>
            <h1 className="font-serif italic text-xl text-slate-100 tracking-tight">
              Weather, <span className="text-ch-cyan">My Way</span>
            </h1>
            {weather && (
              <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-cockpit-border">
                <div className="live-dot bg-ch-emerald" />
                <span className="text-[10px] text-slate-400 font-mono tracking-[0.2em]">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              role="group"
              aria-label="Temperature unit"
              className="inline-flex items-center rounded-lg border border-cockpit-border bg-cockpit-panel/60 p-0.5 font-mono text-sm"
            >
              {["F", "C"].map((u) => {
                const active = tempUnit === u;
                return (
                  <button
                    key={u}
                    onClick={() => setTempUnit(u)}
                    aria-pressed={active}
                    aria-label={`Show temperatures in degrees ${u === "F" ? "Fahrenheit" : "Celsius"}`}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      active
                        ? "bg-ch-cyan/15 text-ch-cyan shadow-glow-cyan"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    °{u}
                  </button>
                );
              })}
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              aria-label="Use my current location"
              className="cockpit-btn px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm disabled:opacity-40"
            >
              <Compass size={14} />
              <span className="hidden sm:inline">Locate</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Landing headline (no weather loaded) */}
        {!weather && !loading && (
          <div className="text-center mt-8 sm:mt-16 mb-10 animate-fade-in-up">
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-ch-cyan mb-6">
              Weather, My Way
            </p>
            <h2 className="font-serif text-5xl sm:text-7xl leading-[1.02] text-slate-100">
              The sky,
              <br />
              <span className="italic hero-gradient-text">on your terms.</span>
            </h2>
            <p className="mt-6 text-base text-slate-400 font-serif italic max-w-md mx-auto">
              "{quote}"
            </p>
          </div>
        )}

        {/* Search section */}
        <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up relative z-20">

          <div className="relative">
            <label htmlFor="city-search" className="sr-only">
              Search by city, zip code, or location
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MapPin className="text-slate-500" size={16} />
            </div>
            <input
              id="city-search"
              type="text"
              placeholder="Enter city, zip code, or coordinates"
              value={city}
              onChange={handleCityInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              autoComplete="off"
              className="w-full pl-10 pr-28 py-3.5 rounded-2xl bg-cockpit-panel/70 backdrop-blur-md border border-cockpit-border text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-ch-cyan focus:shadow-glow-cyan transition-all"
            />
            <button
              onClick={getWeather}
              disabled={loading}
              aria-label="Search weather"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-ch-cyan-dim to-ch-cyan text-cockpit-deep font-semibold text-sm py-2 px-4 rounded-xl flex items-center gap-1.5 hover:shadow-glow-cyan disabled:opacity-40 transition-all"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-cockpit-deep border-t-transparent animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Search
            </button>

            {/* Autocomplete dropdown */}
            {showAutocomplete && autocompleteSearched && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 glass-panel overflow-y-auto max-h-[min(60vh,24rem)]">
                <div className="px-4 py-2 border-b border-cockpit-border">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Suggestions</span>
                </div>
                {autocompleteResults.length > 0 ? (
                  autocompleteResults.map((result) => (
                    <button
                      key={result.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleAutocompleteSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <MapPin size={12} className="text-ch-cyan flex-shrink-0" />
                      <span className="text-sm text-slate-200 font-mono">{result.name}</span>
                      <span className="text-xs text-slate-500 font-mono ml-1">
                        {result.region ? `${result.region}, ` : ''}{result.country}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <Search size={12} className="text-slate-600 flex-shrink-0" />
                    <span>
                      No matches for <span className="text-slate-300">"{city}"</span>. Try a city, zip code, or "lat,lon".
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recent searches + favorites dropdown */}
            {!showAutocomplete && showRecents && (recentSearches.length > 0 || favorites.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 glass-panel overflow-y-auto max-h-[min(60vh,24rem)]">
                {/* Favorites section */}
                {favorites.length > 0 && (
                  <>
                    <div className="px-4 py-2 border-b border-cockpit-border flex items-center gap-1.5">
                      <Star size={10} className="text-ch-amber" fill="currentColor" />
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Favorites</span>
                    </div>
                    {favorites.map((fav) => {
                      const fw = favoriteWeather[fav];
                      return (
                        <button
                          key={fav}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setCity(fav); fetchWeather(fav); setShowRecents(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <Star size={12} className="text-ch-amber flex-shrink-0" fill="currentColor" />
                          <span className="text-sm text-slate-200 font-mono flex-1">{fav}</span>
                          {fw && !fw.error && (
                            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                              {getWeatherIcon(fw.condition, 12)}
                              {tempUnit === "F" ? `${fw.temp_f}°F` : `${fw.temp_c}°C`}
                            </span>
                          )}
                          {fw?.error && (
                            <span className="text-[10px] font-mono text-ch-red/80" title="Failed to load">—</span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Recents section */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-cockpit-border">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Recent</span>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearRecents}
                        className="text-xs text-slate-500 hover:text-ch-red transition-colors flex items-center gap-1"
                        aria-label="Clear recent searches"
                      >
                        <X size={10} /> Clear
                      </button>
                    </div>
                    {recentSearches.map((recent) => (
                      <div
                        key={recent}
                        className="group flex items-center pr-2 hover:bg-white/5 transition-colors"
                      >
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setCity(recent); fetchWeather(recent); }}
                          className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left"
                        >
                          <Clock size={12} className="text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300 font-mono">{recent}</span>
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); removeRecent(recent); }}
                          aria-label={`Remove ${recent} from recent searches`}
                          className="p-1.5 rounded text-slate-600 hover:text-ch-red opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 glass-panel border-ch-red/30 p-4 flex items-center gap-3" role="alert">
              <div className="w-2 h-2 rounded-full bg-ch-red animate-pulse flex-shrink-0" />
              <p className="text-sm text-ch-red font-mono">{error}</p>
            </div>
          )}
        </div>

        {/* Initial-load skeleton */}
        {loading && !weather && (
          <div className="max-w-7xl mx-auto animate-fade-in-up" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading weather data…</span>
            {/* Station header skeleton */}
            <div className="glass-panel p-5 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="skeleton w-[72px] h-[72px] rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-40 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-2 text-right">
                    <div className="skeleton h-10 w-24 rounded ml-auto" />
                    <div className="skeleton h-3 w-20 rounded ml-auto" />
                  </div>
                  <div className="hidden sm:flex flex-col gap-2 pl-6 border-l border-cockpit-border">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                </div>
              </div>
            </div>
            {/* Tab bar skeleton */}
            <div className="glass-panel p-2 mb-4 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 flex-1 rounded-md" />
              ))}
            </div>
            {/* Forecast strips skeleton */}
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass-panel p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="skeleton w-12 h-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="skeleton h-4 w-24 rounded" />
                      <div className="skeleton h-3 w-32 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="skeleton h-4 w-10 rounded" />
                    <div className="skeleton h-4 w-10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites row (no weather loaded) */}
        {!weather && !loading && favorites.length > 0 && (
          <div className="max-w-4xl mx-auto glass-panel p-6 mb-4 animate-fade-in-up-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
              <Star size={14} className="text-ch-amber" fill="currentColor" />
              Favorites
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {favorites.map((fav) => {
                const fw = favoriteWeather[fav];
                const hasData = fw && !fw.error;
                return (
                  <div key={fav} className="relative">
                    <button
                      onClick={() => { setCity(fav); fetchWeather(fav); }}
                      className="cockpit-btn w-full rounded-lg px-4 py-3 text-left flex flex-col gap-1"
                    >
                      <span className="text-sm font-display truncate w-full">{fav}</span>
                      {hasData && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                          {getWeatherIcon(fw.condition, 12)}
                          <span>{tempUnit === "F" ? `${fw.temp_f}°F` : `${fw.temp_c}°C`}</span>
                        </div>
                      )}
                      {!fw && (
                        <span className="text-xs font-mono text-slate-600">Loading…</span>
                      )}
                      {fw?.error && (
                        <span className="text-xs font-mono text-ch-red/80 flex items-center gap-1">
                          <X size={10} aria-hidden="true" />
                          Failed to load
                        </span>
                      )}
                    </button>
                    {fw?.error && (
                      <button
                        onClick={(e) => { e.stopPropagation(); retryFavoriteWeather(fav); }}
                        aria-label={`Retry loading weather for ${fav}`}
                        className="absolute top-1.5 right-1.5 text-[10px] font-mono text-slate-500 hover:text-ch-cyan transition-colors px-1.5 py-0.5 rounded border border-cockpit-border bg-cockpit-deep/70"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular destinations (no weather loaded) */}
        {!weather && !loading && (
          <div className="max-w-4xl mx-auto glass-panel p-6 mb-8 animate-fade-in-up-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
              <Radio size={14} className="text-ch-cyan" />
              Popular Stations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["New York", "London", "Tokyo", "Sydney", "Paris", "Dubai", "Cape Town", "Rio de Janeiro"].map(
                (popularCity) => (
                  <button
                    key={popularCity}
                    onClick={() => {
                      setCity(popularCity);
                      fetchWeather(popularCity);
                    }}
                    className="cockpit-btn rounded-lg px-4 py-3 text-center text-sm font-display"
                  >
                    {popularCity}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Weather data display */}
        {weather && (
          <div className="animate-fade-in-up">
            {/* Atmospheric hero */}
            <section className="max-w-7xl mx-auto mb-8">
              <div className="hero-panel relative overflow-hidden">
                <div className="hero-glow hero-glow-a" aria-hidden="true" />
                <div className="hero-glow hero-glow-b" aria-hidden="true" />

                <div className="relative z-10 p-6 sm:p-10">
                  {/* Eyebrow */}
                  <div className="flex items-center justify-between gap-4 mb-7">
                    <div className="flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
                      <span className="live-dot bg-ch-emerald" aria-hidden="true" />
                      Current conditions
                    </div>
                    {localTime && (
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
                        Local · {localTime}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                    {/* Location + condition */}
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <h2 className="font-serif text-5xl sm:text-6xl text-slate-100 leading-[0.95] tracking-tight">
                          {weather.location.name}
                        </h2>
                        <button
                          onClick={() => toggleFavorite(weather.location.name)}
                          aria-label={isFavorite(weather.location.name) ? "Remove from favorites" : "Add to favorites"}
                          className="mt-2 transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            size={20}
                            className={isFavorite(weather.location.name) ? "text-ch-amber" : "text-slate-600 hover:text-slate-400"}
                            fill={isFavorite(weather.location.name) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                      <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500">
                        {weather.location.region && `${weather.location.region} · `}{weather.location.country}
                      </p>
                      <div className="mt-6 flex items-center gap-3">
                        {getWeatherIcon(weather.current.condition, 26)}
                        <p className="font-serif italic text-2xl text-ch-cyan">
                          {weather.current.condition.text}
                        </p>
                      </div>
                    </div>

                    {/* Primary readout */}
                    <div className="flex items-end gap-5 flex-shrink-0">
                      <p className="hero-temp text-[clamp(6rem,14vw,10rem)] leading-[0.8] tracking-tight">
                        {tempUnit === "F"
                          ? Math.round(weather.current.temp_f)
                          : Math.round(weather.current.temp_c)}°
                      </p>
                      <div className="pb-2 flex flex-col gap-2 font-mono text-xs">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600">Feels</span>
                          <span className="text-slate-300">
                            {tempUnit === "F"
                              ? `${Math.round(weather.current.feelslike_f)}°`
                              : `${Math.round(weather.current.feelslike_c)}°`}
                          </span>
                        </div>
                        {todayDay && (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600">High</span>
                              <span className="text-ch-amber">
                                {tempUnit === "F" ? `${Math.round(todayDay.maxtemp_f)}°` : `${Math.round(todayDay.maxtemp_c)}°`}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600">Low</span>
                              <span className="text-ch-cyan">
                                {tempUnit === "F" ? `${Math.round(todayDay.mintemp_f)}°` : `${Math.round(todayDay.mintemp_c)}°`}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats rail */}
                  <div className="mt-9 pt-5 border-t border-cockpit-border/60 flex flex-wrap items-center gap-x-8 gap-y-3">
                    {[
                      { icon: Wind, label: "Wind", value: `${weather.current.wind_mph} mph ${weather.current.wind_dir}`, color: "text-ch-amber" },
                      { icon: Droplets, label: "Humidity", value: `${weather.current.humidity}%`, color: "text-ch-magenta" },
                      { icon: Zap, label: "UV", value: `${weather.current.uv}`, color: "text-ch-cyan" },
                      { icon: Compass, label: "Pressure", value: `${weather.current.pressure_mb} mb`, color: "text-slate-300" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2.5">
                        <stat.icon size={13} className={stat.color} aria-hidden="true" />
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-600">{stat.label}</span>
                        <span className="text-xs font-mono text-slate-300">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  {recommendation && (
                    <p className="mt-5 font-serif italic text-lg text-slate-300/90">
                      {recommendation.text}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <WeatherAppLayout weather={weather} tempUnit={tempUnit} />
          </div>
        )}

        {/* Footer */}
        <footer className="max-w-7xl mx-auto mt-16 pt-5 border-t border-cockpit-border/60 text-center">
          <p className="font-serif italic text-sm text-slate-500 mb-1.5">Whatever the sky brings.</p>
          <p className="text-xs text-slate-600 font-mono">
            Powered by{" "}
            <a
              href="https://www.weatherapi.com/"
              title="Weather API"
              className="text-ch-cyan-dim hover:text-ch-cyan transition-colors"
            >
              WeatherAPI.com
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
