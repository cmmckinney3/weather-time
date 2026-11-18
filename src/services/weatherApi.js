const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1";
const WEATHER_API_KEY = import.meta.env.VITE_API_KEY;

export class WeatherApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "WeatherApiError";
    this.status = status;
    this.code = code;
  }
}

function requireApiKey() {
  if (!WEATHER_API_KEY) {
    throw new WeatherApiError(
      "Missing WeatherAPI.com key. Add VITE_API_KEY to your .env file and restart the dev server."
    );
  }
}

function buildWeatherApiUrl(endpoint, params) {
  requireApiKey();

  const url = new URL(`${WEATHER_API_BASE_URL}/${endpoint}`);
  url.searchParams.set("key", WEATHER_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    url.searchParams.set(key, value === true ? "yes" : String(value));
  });

  return url;
}

async function requestWeatherApi(endpoint, params, { signal } = {}) {
  const response = await fetch(buildWeatherApiUrl(endpoint, params), { signal });

  if (!response.ok) {
    let message = "Could not fetch weather data";
    let code;

    try {
      const errorData = await response.json();
      message = errorData.error?.message || message;
      code = errorData.error?.code;
    } catch {
      // Keep the generic fallback if the API does not return JSON.
    }

    throw new WeatherApiError(message, { status: response.status, code });
  }

  return response.json();
}

export function fetchForecastWeather(query, { days = 3, aqi = true, alerts = true, signal } = {}) {
  return requestWeatherApi(
    "forecast.json",
    {
      q: query,
      days,
      aqi,
      alerts,
    },
    { signal }
  );
}

export function searchLocations(query, { signal } = {}) {
  return requestWeatherApi("search.json", { q: query }, { signal });
}

/** Lightweight current conditions, used for favorites. */
export function fetchCurrentWeather(query, { signal } = {}) {
  return requestWeatherApi("current.json", { q: query }, { signal });
}

/**
 * A past day's observed weather. The free plan covers the last 7 days;
 * we use it for "warmer/cooler than yesterday" comparisons.
 * @param {string} date - "YYYY-MM-DD" in the location's local time
 */
export function fetchHistoryWeather(query, date, { signal } = {}) {
  return requestWeatherApi("history.json", { q: query, dt: date }, { signal });
}
