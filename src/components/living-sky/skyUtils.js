import { filterHourlyData } from "../../utils/weatherUtils";

/** Pick the right temp field for the active unit. */
export const tempFor = (obj, tempUnit, field = "temp") =>
  tempUnit === "F" ? obj?.[`${field}_f`] : obj?.[`${field}_c`];

/** Flatten the next 24 hourly entries starting at the current local hour. */
export function getNext24Hours(weather) {
  const days = weather?.forecast?.forecastday ?? [];
  if (days.length === 0) return [];
  const localtime = weather?.location?.localtime;
  const hours = [
    ...filterHourlyData(days[0].hour ?? [], 0, localtime),
    ...(days[1]?.hour ?? []),
    ...(days[2]?.hour ?? []),
  ];
  return hours.slice(0, 24);
}

/** "06:42 AM" -> minutes since midnight (null when unparseable). */
export function parseClockToMinutes(clock) {
  if (!clock) return null;
  const m = String(clock).trim().match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** Minutes since midnight for a WeatherAPI "YYYY-MM-DD HH:mm" localtime. */
export function localMinutes(localtime) {
  if (!localtime) return null;
  const d = new Date(String(localtime).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * 0..1 position of the sun along its arc between sunrise and sunset.
 * Returns null at night or when astro data is missing.
 */
export function sunArcPosition(astro, localtime) {
  const rise = parseClockToMinutes(astro?.sunrise);
  const set = parseClockToMinutes(astro?.sunset);
  const now = localMinutes(localtime);
  if (rise == null || set == null || now == null || set <= rise) return null;
  if (now < rise || now > set) return null;
  return (now - rise) / (set - rise);
}

/** "YYYY-MM-DD HH:mm" -> "9:42 PM" style local label. */
export function formatLocalTimeLabel(localtime) {
  if (!localtime) return null;
  const parsed = new Date(String(localtime).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function uvLabel(uv) {
  if (uv == null || Number.isNaN(Number(uv))) return "—";
  const v = Number(uv);
  if (v < 3) return "Low";
  if (v < 6) return "Moderate";
  if (v < 8) return "High";
  if (v < 11) return "Very high";
  return "Extreme";
}

export function uvTone(uv) {
  if (uv == null) return "text-slate-400";
  const v = Number(uv);
  if (v < 3) return "text-ch-emerald";
  if (v < 6) return "text-ch-amber";
  if (v < 8) return "text-orange-400";
  return "text-ch-red";
}

/**
 * Compact precipitation story for a forecast day:
 * chance %, expected total, and a human window like "2–5 PM · peak 3 PM".
 */
export function precipStory(dayData, tempUnit) {
  const day = dayData?.day;
  if (!day) return null;
  const rainChance = Number(day.daily_chance_of_rain ?? 0);
  const snowChance = Number(day.daily_chance_of_snow ?? 0);
  const willRain = Number(day.daily_will_it_rain) === 1;
  const willSnow = Number(day.daily_will_it_snow) === 1;
  const amount =
    tempUnit === "F" ? `${day.totalprecip_in ?? 0}″` : `${day.totalprecip_mm ?? 0} mm`;

  const hours = dayData.hour ?? [];
  const pickWindow = (chanceKey, willKey) => {
    const active = hours.filter(
      (h) => Number(h[willKey]) === 1 || Number(h[chanceKey] ?? 0) >= 40
    );
    if (active.length === 0) return null;
    const fmt = (t) =>
      new Date(t).toLocaleString("en-US", { hour: "numeric", hour12: true });
    const first = fmt(active[0].time);
    const last = fmt(active[active.length - 1].time);
    const peak = active.reduce((a, b) =>
      Number(b[chanceKey]) > Number(a[chanceKey]) ? b : a
    );
    return `${first}${first === last ? "" : `–${last}`} · peak ${fmt(peak.time)}`;
  };

  const snowy = willSnow || snowChance >= rainChance || Number(day.totalsnow_cm ?? 0) > 0;
  const window = snowy
    ? pickWindow("chance_of_snow", "will_it_snow")
    : pickWindow("chance_of_rain", "will_it_rain");

  return {
    chance: snowy ? snowChance : rainChance,
    willIt: snowy ? willSnow : willRain,
    amount,
    snowy,
    window,
    headline: snowy
      ? willSnow
        ? "Snow expected"
        : snowChance > 0
          ? "Snow possible"
          : "No snow expected"
      : willRain
        ? "Rain expected"
        : rainChance > 0
          ? "Rain possible"
          : "No rain expected",
  };
}
