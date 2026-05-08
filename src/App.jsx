import React, { useState, useEffect, useRef, useCallback } from "react";
import WeatherAppLayout from "./components/WeatherAppLayout";
import { MapPin, Search, Compass, Zap, Droplets, Wind, X, Clock, Radio, Star } from "lucide-react";
import { getWeatherRecommendation, getWeatherIcon } from "./utils/weatherUtils";
import { fetchForecast, fetchAutocomplete, fetchFavoriteCurrent } from "./api/weather";
import { useToast } from "./components/shared/Toast";
import { WeatherSkeleton } from "./components/shared/Skeleton";
import WeatherBackground from "./components/WeatherBackground";

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

function App() {
  const toast = useToast();
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
  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("weather_favorites") || "[]")
  );
  const [favoriteWeather, setFavoriteWeather] = useState({});
  // Map of cityName → { temp_f, temp_c, condition }

  const loadFavoriteWeather = useCallback(async (cityName) => {
    const data = await fetchFavoriteCurrent(cityName);
    if (!data) return;
    setFavoriteWeather((prev) => ({ ...prev, [cityName]: data }));
  }, []);

  const toggleFavorite = (cityName) => {
    setFavorites((prev) => {
      const isFav = prev.some((c) => c.toLowerCase() === cityName.toLowerCase());
      const next = isFav
        ? prev.filter((c) => c.toLowerCase() !== cityName.toLowerCase())
        : [...prev, cityName];
      localStorage.setItem("weather_favorites", JSON.stringify(next));
      if (isFav) {
        toast.info(`Removed ${cityName} from favorites`);
      } else {
        toast.success(`Added ${cityName} to favorites`);
        loadFavoriteWeather(cityName);
      }
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

  const loadWeather = async (query) => {
    setLoading(true);
    setError(null);
    setShowRecents(false);
    try {
      const data = await fetchForecast(query);
      setWeather(data);
      lastQueryRef.current = query;
      localStorage.setItem("weather_last_city", query);
      setRecentSearches((prev) => {
        const next = [query, ...prev.filter((c) => c.toLowerCase() !== query.toLowerCase())].slice(0, 5);
        localStorage.setItem("weather_recent", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      const message = err.message || "Could not fetch weather data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("weather_last_city");
    if (saved) loadWeather(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("weather_favorites") || "[]");
    saved.forEach(loadFavoriteWeather);
  }, [loadFavoriteWeather]);

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
      fetchForecast(lastQueryRef.current)
        .then((data) => setWeather(data))
        .catch(() => {});
    }, 20 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const message = "Geolocation is not supported by your browser.";
      setError(message);
      toast.error(message);
      return;
    }
    setLoading(true);
    toast.info("Locating you…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeather(`${latitude},${longitude}`);
      },
      () => {
        const message = "Unable to retrieve your location.";
        setError(message);
        toast.error(message);
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
      return;
    }
    autocompleteTimerRef.current = setTimeout(async () => {
      const data = await fetchAutocomplete(value);
      setAutocompleteResults(data);
      setShowAutocomplete(data.length > 0);
    }, 300);
  };

  const handleAutocompleteSelect = (result) => {
    setCity(result.name);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
    loadWeather(result.name);
  };

  const getWeather = () => {
    if (!city.trim()) {
      const message = "Please enter a city name";
      setError(message);
      toast.error(message);
      return;
    }
    loadWeather(city.trim());
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
    toast.info("Cleared recent searches");
  };

  const recommendation =
    weather?.forecast?.forecastday?.[0]
      ? getWeatherRecommendation(weather.current, weather.forecast.forecastday[0])
      : null;

  return (
    <div className="min-h-screen bg-cockpit-deep grid-texture relative">
      {/* Animated weather + day/night background */}
      <WeatherBackground weather={weather} />

      {/* Top bar */}
      <header className="border-b border-cockpit-border bg-cockpit-base/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ch-cyan to-ch-cyan-dim flex items-center justify-center shadow-glow-cyan">
              <Zap size={16} className="text-cockpit-deep" />
            </div>
            <h1 className="text-lg font-semibold font-display text-slate-100 tracking-tight">
              Weather My Way
            </h1>
            {weather && (
              <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-cockpit-border">
                <div className="live-dot bg-ch-emerald" />
                <span className="text-xs text-slate-400 font-mono">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTempUnit((u) => (u === "F" ? "C" : "F"))}
              aria-label={`Switch to degrees ${tempUnit === "F" ? "Celsius" : "Fahrenheit"}`}
              className="cockpit-btn px-3 py-1.5 rounded-lg font-mono text-sm font-medium"
            >
              °{tempUnit === "F" ? "C" : "F"}
            </button>
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
        {/* Search section */}
        <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up relative z-20">
          {!weather && (
            <p className="text-center text-slate-400 italic mb-4 text-sm font-display">
              "{quote}"
            </p>
          )}

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
              className="w-full pl-10 pr-28 py-3 rounded-xl bg-cockpit-panel border border-cockpit-border text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-ch-cyan focus:shadow-glow-cyan transition-all"
            />
            <button
              onClick={getWeather}
              disabled={loading}
              aria-label="Search weather"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-ch-cyan-dim to-ch-cyan text-cockpit-deep font-semibold text-sm py-2 px-4 rounded-lg flex items-center gap-1.5 hover:shadow-glow-cyan disabled:opacity-40 transition-all"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-cockpit-deep border-t-transparent animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Search
            </button>

            {/* Autocomplete dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 glass-panel overflow-hidden">
                <div className="px-4 py-2 border-b border-cockpit-border">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Suggestions</span>
                </div>
                {autocompleteResults.map((result) => (
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
                ))}
              </div>
            )}

            {/* Recent searches + favorites dropdown */}
            {!showAutocomplete && showRecents && (recentSearches.length > 0 || favorites.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 glass-panel overflow-hidden">
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
                          onClick={() => { setCity(fav); loadWeather(fav); setShowRecents(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <Star size={12} className="text-ch-amber flex-shrink-0" fill="currentColor" />
                          <span className="text-sm text-slate-200 font-mono flex-1">{fav}</span>
                          {fw && (
                            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                              {getWeatherIcon(fw.condition, 12)}
                              {tempUnit === "F" ? `${fw.temp_f}°F` : `${fw.temp_c}°C`}
                            </span>
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
                      <button
                        key={recent}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setCity(recent); loadWeather(recent); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                      >
                        <Clock size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="text-sm text-slate-300 font-mono">{recent}</span>
                      </button>
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

        {/* Skeleton while initial weather is loading */}
        {loading && !weather && <WeatherSkeleton />}

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
                return (
                  <button
                    key={fav}
                    onClick={() => { setCity(fav); loadWeather(fav); }}
                    className="cockpit-btn rounded-lg px-4 py-3 text-left flex flex-col gap-1"
                  >
                    <span className="text-sm font-display truncate w-full">{fav}</span>
                    {fw ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        {getWeatherIcon(fw.condition, 12)}
                        <span>{tempUnit === "F" ? `${fw.temp_f}°F` : `${fw.temp_c}°C`}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-slate-600">Loading…</span>
                    )}
                  </button>
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
                      loadWeather(popularCity);
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
            {/* Station header */}
            <div className="max-w-7xl mx-auto mb-6">
              <div className="glass-panel p-5 scanlines relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cockpit-deep/60 border border-cockpit-border">
                      {getWeatherIcon(weather.current.condition, 48)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-semibold text-slate-100 font-display">
                          {weather.location.name}
                        </h2>
                        <span className="text-xs text-slate-500 font-mono">
                          {weather.location.region && `${weather.location.region}, `}{weather.location.country}
                        </span>
                        <button
                          onClick={() => toggleFavorite(weather.location.name)}
                          aria-label={isFavorite(weather.location.name) ? "Remove from favorites" : "Add to favorites"}
                          className="ml-1 transition-colors hover:scale-110 active:scale-95"
                        >
                          <Star
                            size={16}
                            className={isFavorite(weather.location.name) ? "text-ch-amber" : "text-slate-600 hover:text-slate-400"}
                            fill={isFavorite(weather.location.name) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">{weather.current.condition.text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Primary readout */}
                    <div className="text-right">
                      <p className="text-4xl font-bold font-mono text-ch-cyan glow-cyan tracking-tight">
                        {tempUnit === "F"
                          ? `${weather.current.temp_f}°`
                          : `${weather.current.temp_c}°`}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        FEELS {tempUnit === "F"
                          ? `${weather.current.feelslike_f}°F`
                          : `${weather.current.feelslike_c}°C`}
                      </p>
                    </div>

                    {/* Quick stats */}
                    <div className="hidden sm:flex flex-col gap-2 pl-6 border-l border-cockpit-border">
                      <div className="flex items-center gap-2">
                        <Wind size={12} className="text-ch-amber" />
                        <span className="text-sm font-mono text-slate-300">{weather.current.wind_mph} mph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets size={12} className="text-ch-magenta" />
                        <span className="text-sm font-mono text-slate-300">{weather.current.humidity}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation bar */}
                {recommendation && (
                  <div className="mt-4 pt-4 border-t border-cockpit-border flex items-center gap-3">
                    <div className="opacity-70">{recommendation.icon}</div>
                    <p className="text-sm text-slate-400 italic font-display">{recommendation.text}</p>
                  </div>
                )}
              </div>
            </div>

            <WeatherAppLayout weather={weather} tempUnit={tempUnit} />
          </div>
        )}

        {/* Footer */}
        <footer className="max-w-7xl mx-auto mt-12 pt-4 border-t border-cockpit-border text-center">
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
