import React, { useState, useEffect, useRef } from "react";
import WeatherAppLayout from "./components/WeatherAppLayout";
import { MapPin, Search, Compass, TrendingUp, Camera, Umbrella, Clock, X } from "lucide-react";
import { getWeatherRecommendation, getWeatherIcon } from "./utils/weatherUtils";

const API_KEY = import.meta.env.VITE_API_KEY;

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
  const [city, setCity] = useState(() => localStorage.getItem("weather_last_city") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [quote, setQuote] = useState(() => randomQuote("default"));
  const [backgroundClass, setBackgroundClass] = useState("from-blue-50 to-indigo-100");
  const [tempUnit, setTempUnit] = useState("F");
  const [recentSearches, setRecentSearches] = useState(
    () => JSON.parse(localStorage.getItem("weather_recent") || "[]")
  );
  const [showRecents, setShowRecents] = useState(false);
  const blurTimerRef = useRef(null);

  useEffect(() => {
    if (!weather?.current) return;
    const condition = weather.current.condition.text.toLowerCase();
    if (condition.includes("sun") || condition.includes("clear")) {
      setBackgroundClass("from-yellow-50 to-amber-100");
      setQuote(randomQuote("sunny"));
    } else if (condition.includes("rain")) {
      setBackgroundClass("from-blue-100 to-indigo-200");
      setQuote(randomQuote("rainy"));
    } else if (condition.includes("cloud")) {
      setBackgroundClass("from-gray-100 to-blue-100");
      setQuote(randomQuote("cloudy"));
    } else if (condition.includes("snow")) {
      setBackgroundClass("from-blue-50 to-gray-100");
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
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=3&aqi=yes&alerts=yes`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Could not fetch weather data");
      }
      const data = await res.json();
      setWeather(data);
      // Persist successful search
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

  // Auto-load last city on mount
  useEffect(() => {
    const saved = localStorage.getItem("weather_last_city");
    if (saved) fetchWeather(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please search manually.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      () => {
        setError("Unable to retrieve your location. Please search manually.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const getWeather = () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }
    fetchWeather(city.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") getWeather();
    if (e.key === "Escape") setShowRecents(false);
  };

  const handleInputFocus = () => {
    clearTimeout(blurTimerRef.current);
    if (recentSearches.length > 0) setShowRecents(true);
  };

  const handleInputBlur = () => {
    // Delay so dropdown button clicks fire before the dropdown closes
    blurTimerRef.current = setTimeout(() => setShowRecents(false), 150);
  };

  const clearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem("weather_recent");
    setShowRecents(false);
  };

  const recommendation =
    weather?.forecast?.forecastday?.[0]
      ? getWeatherRecommendation(weather.current, weather.forecast.forecastday[0])
      : null;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${backgroundClass} transition-colors duration-1000`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-center text-indigo-900">
              Weather My Way
            </h1>
            <button
              onClick={() => setTempUnit((u) => (u === "F" ? "C" : "F"))}
              aria-label={`Switch to degrees ${tempUnit === "F" ? "Celsius" : "Fahrenheit"}`}
              className="bg-white border border-indigo-200 text-indigo-700 font-bold text-sm px-3 py-1 rounded-full shadow-sm hover:bg-indigo-50 transition-colors"
            >
              °{tempUnit === "F" ? "C" : "F"}
            </button>
          </div>

          <p className="text-center text-indigo-700 italic mb-6">"{quote}"</p>

          {/* Search input with recent searches dropdown */}
          <div className="relative mb-6">
            <label htmlFor="city-search" className="sr-only">
              Search by city, zip code, or location
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPin className="text-gray-500" aria-hidden="true" />
            </div>
            <input
              id="city-search"
              type="text"
              placeholder="Enter city, zip code, or location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              autoComplete="off"
              className="w-full pl-10 pr-24 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={getWeather}
              disabled={loading}
              aria-label="Search weather"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" aria-hidden="true" />
              ) : (
                <Search className="mr-1" size={18} aria-hidden="true" />
              )}
              Search
            </button>

            {/* Recent searches dropdown */}
            {showRecents && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</span>
                  <button
                    onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                    onClick={clearRecents}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    aria-label="Clear recent searches"
                  >
                    <X size={12} /> Clear
                  </button>
                </div>
                {recentSearches.map((recent) => (
                  <button
                    key={recent}
                    onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                    onClick={() => {
                      setCity(recent);
                      fetchWeather(recent);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50 transition-colors"
                  >
                    <Clock size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-gray-700">{recent}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              aria-label="Use my current location"
              className="flex items-center bg-white hover:bg-gray-50 disabled:opacity-60 text-indigo-600 font-medium py-2 px-4 rounded-lg shadow transition-colors"
            >
              <Compass className="mr-2" size={18} aria-hidden="true" />
              Use my location
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded" role="alert">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {!weather && !loading && (
          <div className="max-w-4xl mx-auto bg-white bg-opacity-80 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">
              Popular Weather Destinations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["New York", "London", "Tokyo", "Sydney", "Paris", "Dubai", "Cape Town", "Rio de Janeiro"].map(
                (popularCity) => (
                  <button
                    key={popularCity}
                    onClick={() => {
                      setCity(popularCity);
                      fetchWeather(popularCity);
                    }}
                    className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg p-4 text-center shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <p className="font-medium text-indigo-800">{popularCity}</p>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {weather && (
          <>
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-white bg-opacity-90 rounded-xl shadow p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="mr-4" aria-hidden="true">
                    {getWeatherIcon(weather.current.condition, 64)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{weather.location.name}</h2>
                    <p className="text-lg text-gray-600">{weather.current.condition.text}</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {tempUnit === "F"
                        ? `${weather.current.temp_f}°F`
                        : `${weather.current.temp_c}°C`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">
                    Feels like:{" "}
                    {tempUnit === "F"
                      ? `${weather.current.feelslike_f}°F`
                      : `${weather.current.feelslike_c}°C`}
                  </p>
                  <p className="text-gray-600">Wind: {weather.current.wind_mph} mph</p>
                  <p className="text-gray-600">Humidity: {weather.current.humidity}%</p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-white bg-opacity-80 rounded-xl shadow-sm p-4 mb-4 text-center">
                <p className="text-lg text-indigo-800 italic">"{quote}"</p>
              </div>

              {recommendation && (
                <div className="bg-white bg-opacity-90 rounded-xl shadow p-4 flex items-center">
                  <div className="mr-4" aria-hidden="true">
                    {recommendation.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Today's Recommendation</h3>
                    <p className="text-gray-700">{recommendation.text}</p>
                  </div>
                </div>
              )}
            </div>

            <WeatherAppLayout weather={weather} tempUnit={tempUnit} />
          </>
        )}

        <div className="max-w-4xl mx-auto mt-12 px-4">
          <h3 className="text-xl font-bold text-center text-indigo-900 mb-6">App Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <TrendingUp className="text-indigo-600" size={28} aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Accurate Forecasts</h4>
              <p className="text-gray-600 text-sm">Get detailed 3-day forecasts with hourly updates for any location worldwide</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <Camera className="text-indigo-600" size={28} aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Visual Weather</h4>
              <p className="text-gray-600 text-sm">Interactive weather visualizations help you understand conditions at a glance</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <Umbrella className="text-indigo-600" size={28} aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Smart Recommendations</h4>
              <p className="text-gray-600 text-sm">Get daily tips based on weather conditions to help plan your activities</p>
            </div>
          </div>

          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Powered by{" "}
              <a
                href="https://www.weatherapi.com/"
                title="Weather API"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                WeatherAPI.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
