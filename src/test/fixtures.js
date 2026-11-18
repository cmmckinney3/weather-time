// Builds a WeatherAPI-shaped forecast response for tests.

const pad = (n) => String(n).padStart(2, "0");
const BASE_EPOCH = Date.UTC(2026, 10, 17, 0, 0) / 1000; // treat as local midnight Nov 17

export function makeHour(date, hour, overrides = {}) {
  const dayIndex = Number(date.slice(-2)) - 17;
  const tempF = overrides.temp_f ?? 40 + Math.round(10 * Math.sin(((hour - 9) / 24) * 2 * Math.PI));
  return {
    time_epoch: BASE_EPOCH + (dayIndex * 24 + hour) * 3600,
    time: `${date} ${pad(hour)}:00`,
    temp_f: tempF,
    temp_c: Math.round(((tempF - 32) * 5) / 9 * 10) / 10,
    feelslike_f: tempF - 3,
    feelslike_c: Math.round(((tempF - 35) * 5) / 9 * 10) / 10,
    is_day: hour >= 7 && hour < 17 ? 1 : 0,
    condition: { text: "Partly cloudy", code: 1003 },
    wind_mph: 8,
    wind_kph: 12.9,
    wind_degree: 300,
    wind_dir: "WNW",
    pressure_mb: 1016,
    pressure_in: 30.0,
    precip_mm: 0,
    precip_in: 0,
    humidity: 60,
    cloud: 40,
    chance_of_rain: 0,
    chance_of_snow: 0,
    will_it_rain: 0,
    will_it_snow: 0,
    ...overrides,
  };
}

export function makeWeather({ localHour = 15, localMinute = 54, hourOverrides = {}, current = {} } = {}) {
  const dates = ["2026-11-17", "2026-11-18", "2026-11-19"];
  const forecastday = dates.map((date) => ({
    date,
    day: {
      maxtemp_f: 50, maxtemp_c: 10, mintemp_f: 30, mintemp_c: -1.1, avgtemp_f: 40, avgtemp_c: 4.4,
      maxwind_mph: 14, maxwind_kph: 22.5, totalprecip_mm: 0, totalprecip_in: 0, totalsnow_cm: 0,
      avghumidity: 62, daily_chance_of_rain: 0, daily_chance_of_snow: 0,
      daily_will_it_rain: 0, daily_will_it_snow: 0,
      condition: { text: "Partly cloudy", code: 1003 }, uv: 2,
    },
    astro: {
      sunrise: "06:42 AM", sunset: "04:28 PM", moonrise: "12:58 PM", moonset: "Does not set today",
      moon_phase: "First Quarter", moon_illumination: 63,
    },
    hour: Array.from({ length: 24 }, (_, h) => makeHour(date, h, hourOverrides[`${date} ${h}`])),
  }));

  return {
    location: {
      name: "Chicago", region: "Illinois", country: "United States of America",
      lat: 41.85, lon: -87.65, tz_id: "America/Chicago",
      localtime: `2026-11-17 ${pad(localHour)}:${pad(localMinute)}`,
      localtime_epoch: BASE_EPOCH + localHour * 3600 + localMinute * 60,
    },
    current: {
      last_updated: `2026-11-17 ${pad(localHour)}:45`,
      temp_f: 45, temp_c: 7.2, feelslike_f: 41, feelslike_c: 5, is_day: 1,
      condition: { text: "Partly cloudy", code: 1003 },
      wind_mph: 9.4, wind_kph: 15.1, wind_degree: 300, wind_dir: "WNW", gust_mph: 15, gust_kph: 24,
      pressure_mb: 1016, pressure_in: 30.0, precip_mm: 0, precip_in: 0, humidity: 55, cloud: 25,
      dewpoint_f: 30, dewpoint_c: -1.1, windchill_f: 41, windchill_c: 5, heatindex_f: 45, heatindex_c: 7.2,
      vis_miles: 10, vis_km: 16, uv: 1, wetbulb_f: 38, wetbulb_c: 3.3,
      air_quality: { co: 195, no2: 21.4, o3: 45, so2: 4.7, pm2_5: 15.4, pm10: 15.5, "us-epa-index": 1, "gb-defra-index": 2 },
      ...current,
    },
    forecast: { forecastday },
    alerts: { alert: [] },
  };
}
