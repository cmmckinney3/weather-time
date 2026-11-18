import { describe, expect, test } from "vitest";
import {
  temp, speed, precip, distance, pressure, parseLocal, hourLabel, formatHour, dayName,
  previousDate, clockToMinutes, tidyClock, durationLabel, upcomingHours, conditionKind,
  skyTheme, nearTermSummary, compareToYesterday, aqiInfo, uvInfo, windDescription,
  dewPointComfort, compassPoint, daylightMinutes, sunProgress, nextSunEvent, isWaxing,
} from "./weather";
import { makeWeather } from "../test/fixtures";

describe("units", () => {
  const obj = { temp_f: 44.6, temp_c: 7.0, wind_mph: 9.4, wind_kph: 15.1, precip_in: 0.1, precip_mm: 2.5,
    vis_miles: 9.6, vis_km: 16, pressure_in: 30.01, pressure_mb: 1016.4 };
  test("formats per unit", () => {
    expect(temp(obj, "temp", "F")).toBe("45°");
    expect(temp(obj, "temp", "C")).toBe("7°");
    expect(speed(obj, "wind", "F")).toBe("9 mph");
    expect(speed(obj, "wind", "C")).toBe("15 km/h");
    expect(precip(obj, "precip", "F")).toBe("0.10 in");
    expect(precip(obj, "precip", "C")).toBe("2.5 mm");
    expect(distance(obj, "vis", "F")).toBe("10 mi");
    expect(pressure(obj, "F")).toBe("30.01 inHg");
    expect(pressure(obj, "C")).toBe("1016 hPa");
  });
  test("missing values show a placeholder", () => {
    expect(temp({}, "temp", "F")).toBe("--");
  });
});

describe("time helpers", () => {
  test("parses WeatherAPI local strings without timezone shifts", () => {
    expect(parseLocal("2026-11-17 05:07")).toEqual({ date: "2026-11-17", hour: 5, minute: 7 });
    expect(formatHour("2026-11-17 00:00")).toBe("12 AM");
    expect(formatHour("2026-11-17 12:00")).toBe("12 PM");
    expect(hourLabel(15)).toBe("3 PM");
  });
  test("names days relative to the location's today", () => {
    expect(dayName("2026-11-17", "2026-11-17")).toBe("Today");
    expect(dayName("2026-11-18", "2026-11-17")).toBe("Tomorrow");
    expect(dayName("2026-11-19", "2026-11-17")).toBe("Thursday");
    expect(dayName("2026-11-19", "2026-11-17", { short: true })).toBe("Thu");
  });
  test("previousDate crosses month and year boundaries", () => {
    expect(previousDate("2026-03-01")).toBe("2026-02-28");
    expect(previousDate("2027-01-01")).toBe("2026-12-31");
  });
  test("clock parsing", () => {
    expect(clockToMinutes("06:42 AM")).toBe(402);
    expect(clockToMinutes("12:05 AM")).toBe(5);
    expect(clockToMinutes("No moonset")).toBeNull();
    expect(tidyClock("04:28 PM")).toBe("4:28 PM");
    expect(tidyClock("Does not set today")).toBe("Does not set today");
    expect(durationLabel(586)).toBe("9h 46m");
  });
});

describe("upcomingHours", () => {
  test("starts at the current hour and spans into later days", () => {
    const hours = upcomingHours(makeWeather({ localHour: 15, localMinute: 54 }), 24);
    expect(hours).toHaveLength(24);
    expect(hours[0].time).toBe("2026-11-17 15:00");
    expect(hours[23].time).toBe("2026-11-18 14:00");
  });
  test("returns everything left when no limit", () => {
    expect(upcomingHours(makeWeather({ localHour: 22 }))).toHaveLength(2 + 48);
  });
});

describe("conditions", () => {
  test("maps codes and falls back to text", () => {
    expect(conditionKind({ code: 1000 })).toBe("clear");
    expect(conditionKind({ code: 1195 })).toBe("rain");
    expect(conditionKind({ code: 1276 })).toBe("storm");
    expect(conditionKind({ code: 1225 })).toBe("snow");
    expect(conditionKind({ text: "Freezing fog" })).toBe("sleet");
    expect(conditionKind({ text: "Overcast" })).toBe("cloudy");
  });
  test("sky theme respects day and night", () => {
    expect(skyTheme({ code: 1000 }, true)).toBe("clear");
    expect(skyTheme({ code: 1000 }, false)).toBe("night");
    expect(skyTheme({ code: 1003 }, false)).toBe("night");
    expect(skyTheme({ code: 1183 }, false)).toBe("rain-night");
  });
});

describe("nearTermSummary", () => {
  test("dry day with an overnight drop", () => {
    const w = makeWeather({ localHour: 15 });
    expect(nearTermSummary(w, "F")).toMatch(/^Dry for the next 12 hours\. Falling to \d+° by \d+ (AM|PM)\.$/);
  });
  test("calls out incoming rain", () => {
    const w = makeWeather({
      localHour: 15,
      hourOverrides: { "2026-11-17 18": { chance_of_rain: 80, will_it_rain: 1, condition: { text: "Light rain", code: 1183 } } },
    });
    expect(nearTermSummary(w, "F")).toMatch(/^Rain likely around 6 PM\./);
  });
  test("says when ongoing rain eases", () => {
    const wet = { chance_of_rain: 90, will_it_rain: 1, condition: { text: "Rain", code: 1189 } };
    const w = makeWeather({
      localHour: 15,
      current: { condition: { text: "Moderate rain", code: 1189 }, precip_mm: 1.2 },
      hourOverrides: { "2026-11-17 15": wet, "2026-11-17 16": wet, "2026-11-17 17": wet },
    });
    expect(nearTermSummary(w, "F")).toMatch(/^Rain should ease by 6 PM\./);
  });
  test("adds a yesterday comparison when notable", () => {
    const w = makeWeather();
    const yesterday = { forecast: { forecastday: [{ day: { maxtemp_f: 42, maxtemp_c: 5.6, mintemp_f: 30, mintemp_c: -1 } }] } };
    expect(compareToYesterday(w, yesterday, "F").diff).toBe(8);
    expect(nearTermSummary(w, "F", yesterday)).toMatch(/8° warmer than yesterday\.$/);
  });
});

describe("scales", () => {
  test("AQI", () => {
    expect(aqiInfo(1).label).toBe("Good");
    expect(aqiInfo(4).label).toBe("Unhealthy");
    expect(aqiInfo(undefined)).toBeNull();
  });
  test("UV", () => {
    expect(uvInfo(0.4).label).toBe("Low");
    expect(uvInfo(6).label).toBe("High");
    expect(uvInfo(12).label).toBe("Extreme");
  });
  test("wind, dew point, compass", () => {
    expect(windDescription(0)).toBe("Calm");
    expect(windDescription(15)).toBe("Moderate breeze");
    expect(windDescription(80)).toBe("Hurricane force");
    expect(dewPointComfort(68)).toBe("Muggy");
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(300)).toBe("WNW");
    expect(compassPoint(359)).toBe("N");
  });
});

describe("sun & moon", () => {
  const astro = { sunrise: "06:42 AM", sunset: "04:28 PM" };
  test("daylight and progress", () => {
    expect(daylightMinutes(astro)).toBe(586);
    expect(sunProgress(astro, "2026-11-17 11:35")).toBeCloseTo(0.5, 1);
    expect(sunProgress(astro, "2026-11-17 20:00")).toBeNull();
  });
  test("next sun event", () => {
    expect(nextSunEvent(makeWeather({ localHour: 5 }))).toMatchObject({ type: "sunrise", when: "today", time: "6:42 AM" });
    expect(nextSunEvent(makeWeather({ localHour: 15 }))).toMatchObject({ type: "sunset", time: "4:28 PM" });
    expect(nextSunEvent(makeWeather({ localHour: 20 }))).toMatchObject({ type: "sunrise", when: "tomorrow" });
  });
  test("waxing detection", () => {
    expect(isWaxing("Waxing Gibbous")).toBe(true);
    expect(isWaxing("First Quarter")).toBe(true);
    expect(isWaxing("Last Quarter")).toBe(false);
  });
});
