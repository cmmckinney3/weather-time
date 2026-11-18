// Pure helpers that turn WeatherAPI.com responses into display-ready values.
// Nothing in here touches React or the DOM, so it is all unit-testable.
//
// WeatherAPI returns local wall-clock strings ("2026-11-17 15:00") for the
// *location's* timezone. We parse those strings by hand instead of passing
// them through Date, so labels never shift into the viewer's timezone.

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

const isF = (unit) => unit !== "C";

/** Rounded temperature number for a field like "temp", "feelslike", "maxtemp". */
export function tempValue(obj, field, unit) {
  const v = obj?.[`${field}_${isF(unit) ? "f" : "c"}`];
  return v == null ? null : Math.round(Number(v));
}

/** "42°" style label. */
export function temp(obj, field, unit) {
  const v = tempValue(obj, field, unit);
  return v == null ? "--" : `${v}°`;
}

/** Wind-ish speeds: base is "wind", "gust", or "maxwind". */
export function speedValue(obj, base, unit) {
  const v = obj?.[`${base}_${isF(unit) ? "mph" : "kph"}`];
  return v == null ? null : Math.round(Number(v));
}
export const speedUnit = (unit) => (isF(unit) ? "mph" : "km/h");
export function speed(obj, base, unit) {
  const v = speedValue(obj, base, unit);
  return v == null ? "--" : `${v} ${speedUnit(unit)}`;
}

/** Precipitation amount: base is "precip" or "totalprecip". */
export function precip(obj, base, unit) {
  if (isF(unit)) {
    const v = Number(obj?.[`${base}_in`] ?? 0);
    return `${v.toFixed(2)} in`;
  }
  const v = Number(obj?.[`${base}_mm`] ?? 0);
  return `${v.toFixed(1)} mm`;
}

export function snowfall(cm, unit) {
  const v = Number(cm ?? 0);
  return isF(unit) ? `${(v / 2.54).toFixed(1)} in` : `${v.toFixed(1)} cm`;
}

/** Visibility: base is "vis" or "avgvis". */
export function distance(obj, base, unit) {
  const v = obj?.[`${base}_${isF(unit) ? "miles" : "km"}`];
  return v == null ? "--" : `${Math.round(Number(v))} ${isF(unit) ? "mi" : "km"}`;
}

export function pressure(obj, unit) {
  return isF(unit)
    ? `${Number(obj?.pressure_in ?? 0).toFixed(2)} inHg`
    : `${Math.round(Number(obj?.pressure_mb ?? 0))} hPa`;
}

/* ------------------------------------------------------------------ */
/* Time & dates                                                        */
/* ------------------------------------------------------------------ */

/** "2026-11-17 15:04" -> { date: "2026-11-17", hour: 15, minute: 4 } */
export function parseLocal(str) {
  const m = String(str ?? "").match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { date: m[1], hour: Number(m[2]), minute: Number(m[3]) };
}

/** 15 -> "3 PM" */
export function hourLabel(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

/** 15, 4 -> "3:04 PM" */
export function clockLabel(hour, minute) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

/** Hour label for an hourly entry's "time" field. */
export function formatHour(timeStr) {
  const p = parseLocal(timeStr);
  return p ? hourLabel(p.hour) : "";
}

/** Local clock for a "YYYY-MM-DD HH:mm" string. */
export function formatClock(timeStr) {
  const p = parseLocal(timeStr);
  return p ? clockLabel(p.hour, p.minute) : "";
}

function dateParts(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** "2026-11-18" -> "Wed" */
export function weekdayShort(dateStr) {
  return dateParts(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

/** "2026-11-18" -> "Wednesday" */
export function weekdayLong(dateStr) {
  return dateParts(dateStr).toLocaleDateString("en-US", { weekday: "long" });
}

/** "2026-11-18" -> "Nov 18" */
export function monthDay(dateStr) {
  return dateParts(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Friendly day name relative to the location's "today". */
export function dayName(dateStr, todayStr, { short = false } = {}) {
  if (dateStr === todayStr) return "Today";
  const diff = Math.round((dateParts(dateStr) - dateParts(todayStr)) / 86_400_000);
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return short ? weekdayShort(dateStr) : weekdayLong(dateStr);
}

/** "YYYY-MM-DD" one day before the given date string. */
export function previousDate(dateStr) {
  const d = dateParts(dateStr);
  d.setDate(d.getDate() - 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "06:42 AM" -> minutes after midnight, or null ("No moonset" etc). */
export function clockToMinutes(clock) {
  const m = String(clock ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** "06:42 AM" -> "6:42 AM"; passes through non-clock strings like "No moonrise". */
export function tidyClock(clock) {
  const mins = clockToMinutes(clock);
  if (mins == null) return clock ?? "--";
  return clockLabel(Math.floor(mins / 60), mins % 60);
}

/** 586 -> "9h 46m" */
export function durationLabel(minutes) {
  if (minutes == null) return "--";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

/* ------------------------------------------------------------------ */
/* Hourly data                                                         */
/* ------------------------------------------------------------------ */

/** Every forecast hour from the current hour onward (up to the end of the forecast). */
export function upcomingHours(weather, limit = Infinity) {
  const nowEpoch = weather?.location?.localtime_epoch ?? Math.floor(Date.now() / 1000);
  const all = (weather?.forecast?.forecastday ?? []).flatMap((d) => d.hour ?? []);
  // Keep the hour that contains "now" (its start is within the last 60 minutes).
  return all.filter((h) => h.time_epoch + 3600 > nowEpoch).slice(0, limit);
}

/** Chance of precipitation for an hour, whichever of rain/snow is higher. */
export function hourPrecipChance(hour) {
  return Math.max(Number(hour?.chance_of_rain ?? 0), Number(hour?.chance_of_snow ?? 0));
}

/* ------------------------------------------------------------------ */
/* Conditions                                                          */
/* ------------------------------------------------------------------ */

const CODE_KIND = new Map();
const assign = (kind, codes) => codes.forEach((c) => CODE_KIND.set(c, kind));
assign("clear", [1000]);
assign("partly", [1003]);
assign("cloudy", [1006, 1009]);
assign("fog", [1030, 1135, 1147]);
assign("drizzle", [1150, 1153, 1168, 1171]);
assign("rain", [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246]);
assign("sleet", [1069, 1072, 1204, 1207, 1237, 1249, 1252, 1261, 1264]);
assign("snow", [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258]);
assign("storm", [1087, 1273, 1276, 1279, 1282]);

/**
 * Collapse WeatherAPI's ~48 condition codes into a handful of kinds:
 * clear | partly | cloudy | fog | drizzle | rain | sleet | snow | storm
 */
export function conditionKind(condition) {
  const byCode = CODE_KIND.get(Number(condition?.code));
  if (byCode) return byCode;
  const t = String(condition?.text ?? "").toLowerCase();
  if (t.includes("thunder")) return "storm";
  if (t.includes("sleet") || t.includes("ice") || t.includes("freezing")) return "sleet";
  if (t.includes("snow") || t.includes("blizzard")) return "snow";
  if (t.includes("drizzle")) return "drizzle";
  if (t.includes("rain") || t.includes("shower")) return "rain";
  if (t.includes("fog") || t.includes("mist") || t.includes("haze")) return "fog";
  if (t.includes("partly")) return "partly";
  if (t.includes("cloud") || t.includes("overcast")) return "cloudy";
  return "clear";
}

const WET_KINDS = new Set(["drizzle", "rain", "sleet", "snow", "storm"]);
export const isWetKind = (kind) => WET_KINDS.has(kind);

/** Sky theme for the hero card gradient. */
export function skyTheme(condition, isDay) {
  const kind = conditionKind(condition);
  if (kind === "storm") return "storm";
  if (kind === "snow" || kind === "sleet") return isDay ? "snow" : "snow-night";
  if (kind === "rain" || kind === "drizzle") return isDay ? "rain" : "rain-night";
  if (kind === "fog") return isDay ? "fog" : "fog-night";
  if (kind === "cloudy") return isDay ? "cloudy" : "cloudy-night";
  return isDay ? "clear" : "night";
}

/* ------------------------------------------------------------------ */
/* Plain-language summary                                              */
/* ------------------------------------------------------------------ */

function precipNoun(hour) {
  const kind = conditionKind(hour.condition);
  if (kind === "snow") return "Snow";
  if (kind === "sleet") return "Sleet";
  if (kind === "storm") return "Storms";
  if (Number(hour.chance_of_snow ?? 0) > Number(hour.chance_of_rain ?? 0)) return "Snow";
  return "Rain";
}

const isWetHour = (h) =>
  Number(h.will_it_rain) === 1 || Number(h.will_it_snow) === 1 || hourPrecipChance(h) >= 50;

/**
 * One or two short sentences describing the next ~12 hours,
 * e.g. "Rain likely around 6 PM. Falling to 31° by 5 AM."
 */
export function nearTermSummary(weather, unit, yesterday) {
  const current = weather?.current;
  const hours = upcomingHours(weather, 13);
  if (!current || hours.length < 2) return "";
  const parts = [];

  // Precipitation story
  const nowWet = isWetKind(conditionKind(current.condition)) && Number(current.precip_mm ?? 0) > 0;
  if (nowWet) {
    const ease = hours.slice(1).find((h) => !isWetHour(h) && hourPrecipChance(h) < 30);
    const noun = precipNoun({ ...current, chance_of_rain: 100 });
    parts.push(
      ease ? `${noun} should ease by ${formatHour(ease.time)}.` : `${noun} continuing for the next several hours.`
    );
  } else {
    const wet = hours.slice(1).find(isWetHour);
    if (wet) {
      parts.push(`${precipNoun(wet)} likely around ${formatHour(wet.time)}.`);
    } else {
      const maybe = hours.slice(1).find((h) => hourPrecipChance(h) >= 30);
      parts.push(
        maybe
          ? `Slight chance of ${precipNoun(maybe).toLowerCase()} around ${formatHour(maybe.time)}.`
          : "Dry for the next 12 hours."
      );
    }
  }

  // Temperature trend
  const nowT = tempValue(current, "temp", unit);
  const rest = hours.slice(1);
  const hi = rest.reduce((a, b) => (tempValue(b, "temp", unit) > tempValue(a, "temp", unit) ? b : a));
  const lo = rest.reduce((a, b) => (tempValue(b, "temp", unit) < tempValue(a, "temp", unit) ? b : a));
  const threshold = unit === "C" ? 2 : 4;
  if (tempValue(lo, "temp", unit) <= nowT - threshold) {
    parts.push(`Falling to ${temp(lo, "temp", unit)} by ${formatHour(lo.time)}.`);
  } else if (tempValue(hi, "temp", unit) >= nowT + threshold) {
    parts.push(`Warming to ${temp(hi, "temp", unit)} by ${formatHour(hi.time)}.`);
  } else {
    parts.push("Temperatures holding steady.");
  }

  // Yesterday comparison
  const cmp = compareToYesterday(weather, yesterday, unit);
  if (cmp && cmp.phrase) parts.push(cmp.phrase);

  return parts.join(" ");
}

/** Today's high vs yesterday's high. */
export function compareToYesterday(weather, yesterday, unit) {
  const today = weather?.forecast?.forecastday?.[0]?.day;
  const yday = yesterday?.forecast?.forecastday?.[0]?.day;
  if (!today || !yday) return null;
  const diff = tempValue(today, "maxtemp", unit) - tempValue(yday, "maxtemp", unit);
  const threshold = unit === "C" ? 2 : 3;
  let phrase = "";
  if (diff >= threshold) phrase = `Today runs ${diff}° warmer than yesterday.`;
  else if (diff <= -threshold) phrase = `Today runs ${Math.abs(diff)}° cooler than yesterday.`;
  return { diff, phrase, yesterday: yday };
}

/* ------------------------------------------------------------------ */
/* Scales & descriptions                                               */
/* ------------------------------------------------------------------ */

const AQI_LEVELS = [
  null,
  { label: "Good", color: "#22a06b", advice: "Air quality is great. Enjoy time outside." },
  { label: "Moderate", color: "#d4a10a", advice: "Acceptable for most. Unusually sensitive people may want to limit long exertion outdoors." },
  { label: "Unhealthy for sensitive groups", color: "#e8730c", advice: "People with heart or lung conditions, children and older adults should take it easier outside." },
  { label: "Unhealthy", color: "#d93838", advice: "Everyone may start to feel effects. Limit prolonged outdoor exertion." },
  { label: "Very unhealthy", color: "#8e44ad", advice: "Health alert. Avoid prolonged outdoor activity." },
  { label: "Hazardous", color: "#7d1d3f", advice: "Emergency conditions. Stay indoors and keep activity low." },
];

/** US EPA index (1–6) -> label, color, advice. */
export function aqiInfo(index) {
  const i = Math.min(6, Math.max(1, Math.round(Number(index) || 0)));
  return Number(index) ? { index: i, ...AQI_LEVELS[i] } : null;
}

export function uvInfo(uv) {
  const v = Math.round(Number(uv ?? 0));
  if (v <= 2) return { value: v, label: "Low", color: "#22a06b", advice: "No protection needed for most people." };
  if (v <= 5) return { value: v, label: "Moderate", color: "#d4a10a", advice: "Wear sunscreen if you'll be out for a while." };
  if (v <= 7) return { value: v, label: "High", color: "#e8730c", advice: "Sunscreen, a hat and shade around midday." };
  if (v <= 10) return { value: v, label: "Very high", color: "#d93838", advice: "Limit midday sun. Unprotected skin burns quickly." };
  return { value: v, label: "Extreme", color: "#8e44ad", advice: "Avoid the midday sun. Cover up fully." };
}

const BEAUFORT = [
  [1, "Calm"], [4, "Light air"], [8, "Light breeze"], [13, "Gentle breeze"],
  [19, "Moderate breeze"], [25, "Fresh breeze"], [32, "Strong breeze"], [39, "Near gale"],
  [47, "Gale"], [55, "Strong gale"], [64, "Storm"], [73, "Violent storm"],
];
/** Plain description of a wind speed given in mph. */
export function windDescription(mph) {
  const v = Number(mph ?? 0);
  const hit = BEAUFORT.find(([max]) => v < max);
  return hit ? hit[1] : "Hurricane force";
}

/** How the air feels, from dew point in °F. */
export function dewPointComfort(dewF) {
  const d = Number(dewF);
  if (Number.isNaN(d)) return "--";
  if (d < 35) return "Very dry";
  if (d < 50) return "Dry";
  if (d <= 55) return "Comfortable";
  if (d <= 60) return "Slightly humid";
  if (d <= 65) return "Humid";
  if (d <= 70) return "Muggy";
  return "Oppressive";
}

export function visibilityDescription(miles) {
  const v = Number(miles ?? 0);
  if (v >= 10) return "Perfectly clear";
  if (v >= 5) return "Good";
  if (v >= 2) return "Moderate";
  if (v >= 0.6) return "Poor";
  return "Very poor";
}

/** Pressure tendency over the next three hours. */
export function pressureTrend(weather) {
  const hours = upcomingHours(weather, 4);
  const now = Number(weather?.current?.pressure_mb);
  const later = Number(hours[3]?.pressure_mb);
  if (Number.isNaN(now) || Number.isNaN(later)) return "Steady";
  const diff = later - now;
  if (diff >= 1) return "Rising";
  if (diff <= -1) return "Falling";
  return "Steady";
}

/** Why "feels like" differs from the actual temperature. */
export function feelsLikeReason(current, unit) {
  const actual = tempValue(current, "temp", unit);
  const feels = tempValue(current, "feelslike", unit);
  const diff = feels - actual;
  if (Math.abs(diff) < (unit === "C" ? 1 : 2)) return "Similar to the actual temperature.";
  if (diff < 0) return Number(current.wind_mph) >= 3 ? "Wind is making it feel colder." : "Feels cooler than the actual temperature.";
  return Number(current.humidity) >= 40 ? "Humidity is making it feel warmer." : "Sunshine is making it feel warmer.";
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const COMPASS_WORDS = {
  N: "north", NNE: "north-northeast", NE: "northeast", ENE: "east-northeast",
  E: "east", ESE: "east-southeast", SE: "southeast", SSE: "south-southeast",
  S: "south", SSW: "south-southwest", SW: "southwest", WSW: "west-southwest",
  W: "west", WNW: "west-northwest", NW: "northwest", NNW: "north-northwest",
};
export function compassPoint(degree) {
  return COMPASS[Math.round(((Number(degree) % 360) + 360) % 360 / 22.5) % 16];
}
export function compassWords(abbr) {
  return COMPASS_WORDS[abbr] ?? abbr;
}

/* ------------------------------------------------------------------ */
/* Sun & moon                                                          */
/* ------------------------------------------------------------------ */

/** Minutes of daylight for an astro block. */
export function daylightMinutes(astro) {
  const rise = clockToMinutes(astro?.sunrise);
  const set = clockToMinutes(astro?.sunset);
  return rise == null || set == null ? null : set - rise;
}

/** 0..1 progress of the sun from sunrise to sunset, or null when it's down. */
export function sunProgress(astro, localtime) {
  const rise = clockToMinutes(astro?.sunrise);
  const set = clockToMinutes(astro?.sunset);
  const p = parseLocal(localtime);
  if (rise == null || set == null || !p) return null;
  const now = p.hour * 60 + p.minute;
  if (now < rise || now > set) return null;
  return (now - rise) / (set - rise);
}

/** The next sunrise or sunset after "now" at the location. */
export function nextSunEvent(weather) {
  const days = weather?.forecast?.forecastday ?? [];
  const p = parseLocal(weather?.location?.localtime);
  if (!days.length || !p) return null;
  const now = p.hour * 60 + p.minute;
  const today = days[0].astro;
  const rise = clockToMinutes(today?.sunrise);
  const set = clockToMinutes(today?.sunset);
  if (rise != null && now < rise) return { type: "sunrise", time: tidyClock(today.sunrise), when: "today" };
  if (set != null && now < set) return { type: "sunset", time: tidyClock(today.sunset), when: "today" };
  const tomorrow = days[1]?.astro;
  return tomorrow ? { type: "sunrise", time: tidyClock(tomorrow.sunrise), when: "tomorrow" } : null;
}

/** Waxing phases light the right side of the moon (northern hemisphere view). */
export function isWaxing(phaseName) {
  const t = String(phaseName ?? "").toLowerCase();
  return t.includes("waxing") || t.includes("first quarter");
}
