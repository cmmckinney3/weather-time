import React from "react";
import { getWeatherIcon, formatTime } from "../../utils/weatherUtils";

function HourCard({ hour, tempUnit, isNow }) {
  const temp = Math.round(tempUnit === "F" ? hour.temp_f : hour.temp_c);
  const precip = Math.max(Number(hour.chance_of_rain ?? 0), Number(hour.chance_of_snow ?? 0));
  return (
    <div
      className={`hour-card snap-start flex-shrink-0 w-[76px] rounded-2xl border px-2 py-3 flex flex-col items-center gap-1.5 transition-colors ${
        isNow
          ? "border-ch-cyan/60 bg-ch-cyan/10 shadow-glow-cyan"
          : "border-cockpit-border/70 bg-cockpit-panel/40"
      }`}
    >
      <span className={`text-[10px] font-mono uppercase tracking-wider ${isNow ? "text-ch-cyan font-semibold" : "text-slate-500"}`}>
        {isNow ? "Now" : formatTime(hour.time)}
      </span>
      <span className={isNow ? "text-ch-cyan" : "text-slate-300"}>
        {getWeatherIcon(hour.condition, 20)}
      </span>
      <span className="text-sm font-mono font-semibold text-slate-100">{temp}°</span>
      <span className={`text-[10px] font-mono ${precip >= 20 ? "text-sky-400 font-semibold" : "text-slate-600"}`}>
        {precip > 0 ? `${precip}%` : "—"}
      </span>
    </div>
  );
}

export default function HourlyStrip({ hours, tempUnit }) {
  if (!hours?.length) return null;
  return (
    <section aria-label="Hourly forecast" className="animate-fade-in-up-1">
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h3 className="section-label">Next 24 hours</h3>
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
          Scroll →
        </span>
      </div>
      <div className="scroll-fade-x -mx-1 px-1">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {hours.map((hour, i) => (
            <HourCard key={hour.time ?? i} hour={hour} tempUnit={tempUnit} isNow={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
