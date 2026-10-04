import React, { useMemo } from "react";
import { Star, Wind, Droplets, Umbrella, Sun } from "lucide-react";
import { getWeatherIcon, getWeatherRecommendation } from "../../utils/weatherUtils";
import { formatLocalTimeLabel } from "./skyUtils";

/** Deterministic pseudo-random star field for the night sky. */
function Stars({ count = 70 }) {
  const stars = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 62).toFixed(2)}%`,
      size: rand() > 0.85 ? 2.5 : 1.5,
      delay: `${(rand() * 3).toFixed(2)}s`,
      opacity: 0.35 + rand() * 0.55,
    }));
  }, [count]);
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="sky-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

const STATS = [
  { icon: Wind, label: "Wind", get: (c, u) => `${Math.round(u === "F" ? c.wind_mph : c.wind_kph)} ${u === "F" ? "mph" : "kph"} ${c.wind_dir}` },
  { icon: Droplets, label: "Humidity", get: (c) => `${c.humidity}%` },
  { icon: Umbrella, label: "Rain", get: (c, u, today) => `${today?.day?.daily_chance_of_rain ?? 0}%` },
  { icon: Sun, label: "UV", get: (c) => `${c.uv}` },
];

export default function SkyHero({ weather, tempUnit, atmosphere, toggleFavorite, isFavorite }) {
  const { current, location, forecast } = weather;
  const today = forecast?.forecastday?.[0];
  const t = (f, c) => Math.round(tempUnit === "F" ? f : c);
  const recommendation = today ? getWeatherRecommendation(current, today) : null;
  const localTime = formatLocalTimeLabel(location?.localtime);
  const fav = isFavorite(location?.name);

  const showStars = atmosphere === "clear-night";
  const showRain = atmosphere === "rain" || atmosphere === "storm";

  return (
    <section className="sky-hero animate-fade-in-up" aria-label="Current conditions">
      <div className="sky-orb" aria-hidden="true" />
      {showStars && <Stars />}
      {showRain && <div className="sky-rain" aria-hidden="true" />}
      <div className="noise" aria-hidden="true" />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 min-h-[60vh] flex flex-col">
        {/* Eyebrow */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">
            <span className="live-dot bg-ch-emerald" aria-hidden="true" />
            Current conditions
          </div>
          {localTime && (
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
              Local · {localTime}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="mt-8 flex items-start gap-3">
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight drop-shadow-lg">
            {location.name}
          </h2>
          <button
            onClick={() => toggleFavorite(location.name)}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={fav}
            className="mt-2 sm:mt-3 p-1 rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Star
              size={22}
              className={fav ? "text-amber-300 drop-shadow" : "text-white/50 hover:text-white/80"}
              fill={fav ? "currentColor" : "none"}
            />
          </button>
        </div>
        <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.25em] text-white/65">
          {location.region && `${location.region} · `}{location.country}
        </p>

        {/* Condition + temperature */}
        <div className="mt-auto pt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-white/90 drop-shadow">{getWeatherIcon(current.condition, 30)}</span>
            <p className="font-serif italic text-2xl sm:text-3xl text-white drop-shadow">
              {current.condition.text}
            </p>
          </div>
          <div className="flex items-end gap-5">
            <p className="sky-temp text-[clamp(5.5rem,13vw,9.5rem)] leading-[0.8] tracking-tight">
              {t(current.temp_f, current.temp_c)}°
            </p>
            <div className="pb-3 flex flex-col gap-1.5 font-mono text-xs text-white/85">
              <div className="flex items-baseline gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/55">Feels</span>
                <span>{t(current.feelslike_f, current.feelslike_c)}°</span>
              </div>
              {today?.day && (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/55">High</span>
                    <span>{t(today.day.maxtemp_f, today.day.maxtemp_c)}°</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/55">Low</span>
                    <span>{t(today.day.mintemp_f, today.day.mintemp_c)}°</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Slim stats strip */}
        <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-3">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <s.icon size={14} className="text-white/75" aria-hidden="true" />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/55">{s.label}</span>
              <span className="text-sm font-mono font-medium text-white">{s.get(current, tempUnit, today)}</span>
            </div>
          ))}
        </div>

        {recommendation && (
          <p className="mt-5 font-serif italic text-lg text-white/85 max-w-2xl">
            {recommendation.text}
          </p>
        )}
      </div>
    </section>
  );
}
