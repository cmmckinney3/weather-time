import React, { useState } from "react";
import {
  Wind, Umbrella, Sunrise, Sunset, Moon, Activity, Droplets,
  Sun, Thermometer, Gauge, AlertTriangle, ChevronDown,
} from "lucide-react";
import WindCompass from "../WindCompass";
import { precipStory, sunArcPosition, uvLabel, uvTone, tempFor } from "./skyUtils";

const AQI_LEVELS = [
  { label: "Good", color: "text-ch-emerald", dot: "bg-ch-emerald" },
  { label: "Moderate", color: "text-ch-amber", dot: "bg-ch-amber" },
  { label: "Unhealthy (Sensitive)", color: "text-orange-400", dot: "bg-orange-400" },
  { label: "Unhealthy", color: "text-ch-red", dot: "bg-ch-red" },
  { label: "Very Unhealthy", color: "text-purple-400", dot: "bg-purple-400" },
  { label: "Hazardous", color: "text-rose-400", dot: "bg-rose-400" },
];

const SEVERITY_STYLES = {
  Extreme: "bg-ch-red/15 text-ch-red border-ch-red/40",
  Severe: "bg-orange-400/15 text-orange-400 border-orange-400/40",
  Moderate: "bg-ch-amber/15 text-ch-amber border-ch-amber/40",
  Minor: "bg-yellow-400/15 text-yellow-400 border-yellow-400/40",
};

function Tile({ icon: Icon, label, accent = "text-ch-cyan", className = "", children }) {
  return (
    <div className={`tile tile-lift ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={accent} aria-hidden="true" />
        <span className="tile-label">{label}</span>
      </div>
      {children}
    </div>
  );
}

function AlertsTile({ alerts }) {
  const [open, setOpen] = useState(0);
  if (!alerts?.length) return null;
  return (
    <div className="tile col-span-2 lg:col-span-4 !border-ch-red/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-ch-red" aria-hidden="true" />
        <span className="tile-label">Weather alerts</span>
        <span className="ml-auto text-[10px] font-mono text-slate-500">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-xl border border-cockpit-border/60 bg-cockpit-deep/40 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
              >
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.Minor}`}>
                  {a.severity}
                </span>
                <span className="flex-1 text-sm text-slate-200 truncate">{a.headline}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <p className="px-3.5 pb-3 text-xs leading-relaxed text-slate-400 whitespace-pre-line">
                  {a.desc}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WindTile({ current, tempUnit }) {
  const speed = Math.round(tempUnit === "F" ? current.wind_mph : current.wind_kph);
  const gust = Math.round(tempUnit === "F" ? current.gust_mph : current.gust_kph);
  const unit = tempUnit === "F" ? "mph" : "kph";
  return (
    <Tile icon={Wind} label="Wind" accent="text-ch-amber" className="col-span-2">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-[128px] h-[128px] flex items-center justify-center overflow-hidden">
          <div className="scale-[0.8]">
            <WindCompass windDegree={current.wind_degree} windDir={current.wind_dir} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-3xl font-semibold text-slate-100">
            {speed}<span className="text-sm text-slate-500 font-normal ml-1">{unit}</span>
          </p>
          <p className="mt-1 text-xs font-mono text-slate-400">
            from {current.wind_dir} · gusts {gust} {unit}
          </p>
        </div>
      </div>
    </Tile>
  );
}

function PrecipTile({ dayData, tempUnit }) {
  const story = precipStory(dayData, tempUnit);
  if (!story) return null;
  return (
    <Tile icon={Umbrella} label="Precipitation" accent="text-sky-400" className="col-span-2">
      <div className="flex items-baseline gap-2">
        <p className={`font-mono text-3xl font-semibold ${story.chance >= 30 ? "text-sky-300" : "text-slate-100"}`}>
          {story.chance}%
        </p>
        <span className="text-xs font-mono text-slate-500">{story.headline.toLowerCase()}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-cockpit-deep/80 overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300 transition-all"
          style={{ width: `${Math.min(story.chance, 100)}%` }}
        />
      </div>
      <p className="mt-2.5 text-xs font-mono text-slate-400">
        Expected {story.amount}{story.window ? ` · ${story.window}` : ""}
      </p>
    </Tile>
  );
}

function SunMoonTile({ astro, localtime }) {
  const pos = sunArcPosition(astro, localtime);
  const dot = pos != null
    ? { x: 100 - 90 * Math.cos(Math.PI * pos), y: 90 - 90 * Math.sin(Math.PI * pos) }
    : null;
  return (
    <Tile icon={Sunrise} label="Sun & moon" accent="text-ch-amber" className="col-span-2">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 200 100" className="w-32 flex-shrink-0" aria-hidden="true">
          <path d="M 10 90 A 90 90 0 0 1 190 90" fill="none" stroke="rgb(var(--surface-border))" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 10 90 L 10 96 M 190 90 L 190 96" stroke="rgb(var(--surface-border))" strokeWidth="2" />
          {dot && (
            <circle cx={dot.x} cy={dot.y} r="7" fill="rgb(var(--accent))" opacity="0.95">
              <animate attributeName="opacity" values="0.95;0.6;0.95" dur="3s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div className="flex-1 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-500"><Sunrise size={12} /> Rise</span>
            <span className="text-slate-200">{astro?.sunrise ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-500"><Sunset size={12} /> Set</span>
            <span className="text-slate-200">{astro?.sunset ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-500"><Moon size={12} /> Moon</span>
            <span className="text-slate-200 truncate">{astro?.moon_phase ?? "—"}</span>
          </div>
        </div>
      </div>
    </Tile>
  );
}

function AQITile({ current }) {
  const idx = current.air_quality?.["us-epa-index"];
  const level = idx >= 1 && idx <= 6 ? AQI_LEVELS[idx - 1] : null;
  const pm25 = current.air_quality?.pm2_5;
  return (
    <Tile icon={Activity} label="Air quality" accent="text-ch-emerald" className="col-span-2">
      {level ? (
        <>
          <div className="flex items-baseline gap-2">
            <p className={`font-mono text-2xl font-semibold ${level.color}`}>{level.label}</p>
            <span className="text-xs font-mono text-slate-500">EPA {idx}/6</span>
          </div>
          <div className="mt-3 flex gap-1.5" role="img" aria-label={`Air quality ${idx} of 6: ${level.label}`}>
            {AQI_LEVELS.map((l, i) => (
              <span key={l.label} className={`h-1.5 flex-1 rounded-full ${i < idx ? l.dot : "bg-cockpit-border/60"}`} />
            ))}
          </div>
          {pm25 != null && (
            <p className="mt-2.5 text-xs font-mono text-slate-400">PM2.5 {Number(pm25).toFixed(1)} µg/m³</p>
          )}
        </>
      ) : (
        <p className="text-sm font-mono text-slate-500">Air quality data unavailable</p>
      )}
    </Tile>
  );
}

function HumidityTile({ current, tempUnit }) {
  const dew = Math.round(tempFor(current, tempUnit, "dewpoint"));
  return (
    <Tile icon={Droplets} label="Humidity" accent="text-sky-400">
      <p className="font-mono text-3xl font-semibold text-slate-100">{current.humidity}<span className="text-base text-slate-500">%</span></p>
      <p className="mt-2 text-xs font-mono text-slate-500">Dew point {dew}°</p>
    </Tile>
  );
}

function UVTile({ current }) {
  return (
    <Tile icon={Sun} label="UV index" accent="text-ch-amber">
      <p className="font-mono text-3xl font-semibold text-slate-100">{current.uv}</p>
      <p className={`mt-2 text-xs font-mono font-semibold ${uvTone(current.uv)}`}>{uvLabel(current.uv)}</p>
    </Tile>
  );
}

function ComfortTile({ current, tempUnit }) {
  const r = (v) => (v == null ? "—" : `${Math.round(v)}°`);
  const items = [
    ["Feels", r(tempFor(current, tempUnit, "feelslike"))],
    ["Heat idx", r(tempFor(current, tempUnit, "heatindex"))],
    ["Wind chill", r(tempFor(current, tempUnit, "windchill"))],
    ["Dew", r(tempFor(current, tempUnit, "dewpoint"))],
  ];
  return (
    <Tile icon={Thermometer} label="Feels like" accent="text-ch-magenta">
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-600">{label}</p>
            <p className="text-sm font-mono font-semibold text-slate-200">{value}</p>
          </div>
        ))}
      </div>
    </Tile>
  );
}

function AtmosphereTile({ current, tempUnit }) {
  const pressure = tempUnit === "F"
    ? `${current.pressure_mb} mb`
    : `${(current.pressure_mb * 0.02953).toFixed(2)} inHg`;
  const vis = tempUnit === "F" ? `${current.vis_miles} mi` : `${current.vis_km} km`;
  const items = [
    ["Pressure", pressure],
    ["Visibility", vis],
    ["Cloud", `${current.cloud}%`],
  ];
  return (
    <Tile icon={Gauge} label="Atmosphere" accent="text-slate-300">
      <div className="space-y-2.5">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-600">{label}</span>
            <span className="text-sm font-mono font-semibold text-slate-200">{value}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export default function BentoGrid({ weather, tempUnit }) {
  const { current, forecast } = weather;
  if (!current) return null;
  const today = forecast?.forecastday?.[0];
  const astro = today?.astro;
  const alerts = weather.alerts?.alert ?? [];

  return (
    <section aria-label="Weather details" className="animate-fade-in-up-3">
      <h3 className="section-label px-1">Details</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AlertsTile alerts={alerts} />
        <WindTile current={current} tempUnit={tempUnit} />
        <PrecipTile dayData={today} tempUnit={tempUnit} />
        <SunMoonTile astro={astro} localtime={weather.location?.localtime} />
        <AQITile current={current} />
        <HumidityTile current={current} tempUnit={tempUnit} />
        <UVTile current={current} />
        <ComfortTile current={current} tempUnit={tempUnit} />
        <AtmosphereTile current={current} tempUnit={tempUnit} />
      </div>
    </section>
  );
}
