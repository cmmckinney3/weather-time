import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getWeatherIcon, getDayName, formatTime, filterHourlyData } from "../../utils/weatherUtils";

function DayHourGrid({ dayData, dayIndex, tempUnit, localtime }) {
  const hours = filterHourlyData(dayData.hour ?? [], dayIndex, localtime);
  if (!hours.length) return null;
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 px-4 pb-4 pt-1">
      {hours.map((h) => {
        const precip = Math.max(Number(h.chance_of_rain ?? 0), Number(h.chance_of_snow ?? 0));
        return (
          <div
            key={h.time}
            className="rounded-xl border border-cockpit-border/50 bg-cockpit-deep/40 px-1 py-2 flex flex-col items-center gap-1"
          >
            <span className="text-[9px] font-mono text-slate-500 uppercase">{formatTime(h.time)}</span>
            {getWeatherIcon(h.condition, 16)}
            <span className="text-xs font-mono font-semibold text-slate-200">
              {Math.round(tempUnit === "F" ? h.temp_f : h.temp_c)}°
            </span>
            <span className={`text-[9px] font-mono ${precip >= 20 ? "text-sky-400" : "text-slate-600"}`}>
              {precip > 0 ? `${precip}%` : "·"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DayRows({ weather, tempUnit }) {
  const [open, setOpen] = useState(0);
  const days = weather?.forecast?.forecastday ?? [];
  if (!days.length) return null;
  const localtime = weather?.location?.localtime;

  const t = (v) => Math.round(v);
  const lo = Math.min(...days.map((d) => t(tempUnit === "F" ? d.day.mintemp_f : d.day.mintemp_c)));
  const hi = Math.max(...days.map((d) => t(tempUnit === "F" ? d.day.maxtemp_f : d.day.maxtemp_c)));
  const span = Math.max(hi - lo, 1);

  return (
    <section aria-label="3-day forecast" className="animate-fade-in-up-2">
      <h3 className="section-label px-1">3-day outlook</h3>
      <div className="tile !p-0 overflow-hidden divide-y divide-cockpit-border/50">
        {days.map((fd, i) => {
          const day = fd.day;
          const isOpen = open === i;
          const low = t(tempUnit === "F" ? day.mintemp_f : day.mintemp_c);
          const high = t(tempUnit === "F" ? day.maxtemp_f : day.maxtemp_c);
          const precip = Math.max(
            Number(day.daily_chance_of_rain ?? 0),
            Number(day.daily_chance_of_snow ?? 0)
          );
          return (
            <div key={fd.date ?? i}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 sm:gap-5 px-4 sm:px-5 py-4 text-left hover:bg-white/[0.03] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ch-cyan/60"
              >
                <span className="w-20 sm:w-28 flex-shrink-0 text-sm font-display font-medium text-slate-200">
                  {getDayName(i, fd.date)}
                </span>
                <span className="flex-shrink-0 w-8 flex justify-center">
                  {getWeatherIcon(day.condition, 22)}
                </span>
                <span
                  className={`hidden sm:inline flex-shrink-0 text-[11px] font-mono w-12 ${
                    precip >= 30 ? "text-sky-400 font-semibold" : "text-slate-600"
                  }`}
                >
                  {precip > 0 ? `${precip}%` : ""}
                </span>
                <span className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono text-slate-400 w-8 text-right">{low}°</span>
                  <span className="relative flex-1 h-2 rounded-full bg-cockpit-deep/80 overflow-hidden" aria-hidden="true">
                    <span
                      className="absolute inset-y-0 rounded-full day-range-bar"
                      style={{
                        left: `${(((low - lo) / span) * 100).toFixed(1)}%`,
                        width: `${(((high - low) / span) * 100).toFixed(1)}%`,
                      }}
                    />
                  </span>
                  <span className="text-sm font-mono font-semibold text-slate-100 w-8">{high}°</span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <DayHourGrid dayData={fd} dayIndex={i} tempUnit={tempUnit} localtime={localtime} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
