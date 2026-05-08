const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = 'https://api.weatherapi.com/v1';

async function request(path, params) {
  const search = new URLSearchParams({ key: API_KEY, ...params }).toString();
  const res = await fetch(`${BASE_URL}/${path}?${search}`);
  if (!res.ok) {
    let message = 'Could not fetch weather data';
    try {
      const errorData = await res.json();
      if (errorData?.error?.message) message = errorData.error.message;
    } catch {
      // response body wasn't JSON — fall back to default message
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function fetchForecast(query, { days = 3, aqi = 'yes', alerts = 'yes' } = {}) {
  return request('forecast.json', { q: query, days, aqi, alerts });
}

export async function fetchAutocomplete(query) {
  try {
    return await request('search.json', { q: query });
  } catch {
    return [];
  }
}

export async function fetchFavoriteCurrent(cityName) {
  try {
    const data = await request('forecast.json', { q: cityName, days: 1 });
    return {
      temp_f: data.current.temp_f,
      temp_c: data.current.temp_c,
      condition: data.current.condition,
    };
  } catch {
    return null;
  }
}
