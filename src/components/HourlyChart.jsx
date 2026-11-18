import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Navigation2, Droplet } from "lucide-react";
import WeatherIcon from "./WeatherIcon";
import {
  tempValue, speedValue, speedUnit, hourPrecipChance, parseLocal,
  hourLabel, weekdayShort, dayName,
} from "../lib/weather";

const COL = 58; // px per hour column
const CURVE_H = 88;
const PAD_TOP = 24;
const PAD_BOTTOM = 10;

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Horizontally scrolling hour-by-hour timeline.
 * @param hours    WeatherAPI hour entries, first one is "now"
 * @param showWind adds the wind row
 * @param days     forecastday array; when given, renders day chips that jump the timeline
 * @param today    location's "YYYY-MM-DD", for day naming
 */
export default function HourlyChart({ hours, unit, showWind = false, days, today }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [activeDate, setActiveDate] = useState(() => parseLocal(hours[0]?.time)?.date);

  const temps = useMemo(() => hours.map((h) => tempValue(h, "temp", unit)), [hours, unit]);
  const width = hours.length * COL;

  const points = useMemo(() => {
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const usable = CURVE_H - PAD_TOP - PAD_BOTTOM;
    return temps.map((t, i) => [
      i * COL + COL / 2,
      max === min ? PAD_TOP + usable / 2 : PAD_TOP + ((max - t) / (max - min)) * usable,
    ]);
  }, [temps]);

  const line = smoothPath(points);
  const area = line ? `${line} L ${points.at(-1)[0]} ${CURVE_H} L ${points[0][0]} ${CURVE_H} Z` : "";

  // Index of the first hour of each day, for the day chips.
  const dayStarts = useMemo(() => {
    const map = new Map();
    hours.forEach((h, i) => {
      const date = parseLocal(h.time)?.date;
      if (date && !map.has(date)) map.set(date, i);
    });
    return map;
  }, [hours]);

  const updateScrollState = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    const idx = Math.min(hours.length - 1, Math.floor((el.scrollLeft + COL / 2) / COL));
    setActiveDate(parseLocal(hours[idx]?.time)?.date);
  };

  useEffect(() => {
    updateScrollState();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollByCols = (n) => scroller.current?.scrollBy({ left: n * COL, behavior: "smooth" });
  const jumpTo = (date) => {
    const idx = dayStarts.get(date) ?? 0;
    scroller.current?.scrollTo({ left: idx * COL, behavior: "smooth" });
  };

  if (!hours.length) return null;

  return (
    <div>
      {days && (
        <div className="mb-4 flex gap-2 scroll-x" role="group" aria-label="Jump to day">
          {days.map((d) => {
            const active = activeDate === d.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => jumpTo(d.date)}
                aria-pressed={active}
                disabled={!dayStarts.has(d.date)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line text-muted hover:border-faint hover:text-ink"
                }`}
              >
                <WeatherIcon condition={d.day.condition} size={16} />
                <span className="font-medium">{dayName(d.date, today, { short: true })}</span>
                <span className="tabular text-faint">
                  {tempValue(d.day, "maxtemp", unit)}° / {tempValue(d.day, "mintemp", unit)}°
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <div
          ref={scroller}
          onScroll={updateScrollState}
          className="scroll-x -mx-1 px-1"
          tabIndex={0}
          role="region"
          aria-label="Hourly forecast. Scroll horizontally for more hours."
        >
          <div style={{ width }} className="relative">
            {/* Times + icons */}
            <div className="flex">
              {hours.map((h, i) => {
                const p = parseLocal(h.time);
                const isMidnight = p?.hour === 0 && i > 0;
                return (
                  <div
                    key={h.time_epoch}
                    style={{ width: COL }}
                    className={`flex shrink-0 flex-col items-center gap-2 ${isMidnight ? "border-l border-line" : ""}`}
                  >
                    <span
                      className={`text-[13px] ${
                        i === 0 || isMidnight ? "font-semibold text-ink" : "text-muted"
                      }`}
                    >
                      {i === 0 ? "Now" : isMidnight ? weekdayShort(p.date) : hourLabel(p.hour)}
                    </span>
                    <WeatherIcon condition={h.condition} isDay={h.is_day} size={22} />
                  </div>
                );
              })}
            </div>

            {/* Temperature curve */}
            <svg width={width} height={CURVE_H} className="block" aria-hidden="true">
              <defs>
                <linearGradient id="temp-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--warm)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--warm)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#temp-fill)" />
              <path d={line} fill="none" stroke="var(--warm)" strokeWidth="2.25" strokeLinecap="round" />
              {points.map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="3" fill="var(--surface)" stroke="var(--warm)" strokeWidth="2" />
                  <text
                    x={x}
                    y={y - 9}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="600"
                    fill="var(--ink)"
                    className="tabular"
                  >
                    {temps[i]}°
                  </text>
                </g>
              ))}
            </svg>

            {/* Precipitation chance */}
            <div className="flex items-end" aria-hidden="true">
              {hours.map((h) => {
                const chance = hourPrecipChance(h);
                return (
                  <div key={h.time_epoch} style={{ width: COL }} className="flex shrink-0 flex-col items-center gap-1">
                    <div className="flex h-6 w-3 items-end overflow-hidden rounded-sm bg-subtle">
                      <div className="w-full bg-rain" style={{ height: `${chance}%`, opacity: 0.35 + chance / 160 }} />
                    </div>
                    <span className={`tabular text-xs ${chance >= 30 ? "font-semibold text-rain" : "text-faint"}`}>
                      {chance}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Wind */}
            {showWind && (
              <div className="mt-2 flex" aria-hidden="true">
                {hours.map((h) => (
                  <div key={h.time_epoch} style={{ width: COL }} className="flex shrink-0 flex-col items-center gap-0.5">
                    <Navigation2
                      size={13}
                      className="text-faint"
                      fill="currentColor"
                      style={{ transform: `rotate(${(Number(h.wind_degree) + 180) % 360}deg)` }}
                    />
                    <span className="tabular text-xs text-muted">{speedValue(h, "wind", unit)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop scroll buttons */}
        {!edges.start && (
          <ScrollButton side="left" onClick={() => scrollByCols(-6)} />
        )}
        {!edges.end && (
          <ScrollButton side="right" onClick={() => scrollByCols(6)} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-warm" /> Temperature
        </span>
        <span className="flex items-center gap-1.5">
          <Droplet size={12} className="text-rain" /> Chance of rain or snow
        </span>
        {showWind && (
          <span className="flex items-center gap-1.5">
            <Navigation2 size={12} fill="currentColor" /> Wind ({speedUnit(unit)})
          </span>
        )}
      </div>
    </div>
  );
}

function ScrollButton({ side, onClick }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Earlier hours" : "Later hours"}
      className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-surface p-1.5 text-muted shadow-card hover:text-ink md:block ${
        side === "left" ? "-left-3" : "-right-3"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}
