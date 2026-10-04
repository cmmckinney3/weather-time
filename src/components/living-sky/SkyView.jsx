import React, { useState, lazy, Suspense } from "react";
import { Map as MapIcon, Radar } from "lucide-react";

const WeatherMaps = lazy(() => import("../WeatherMaps"));
const USRadar = lazy(() => import("../USRadar"));

const TABS = [
  { id: "maps", label: "Maps", icon: MapIcon },
  { id: "radar", label: "U.S. Radar", icon: Radar },
];

export default function SkyView({ weather }) {
  const [view, setView] = useState("maps");

  return (
    <section aria-label="Sky view" className="animate-fade-in-up-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="section-label">Sky view</h3>
        <div
          role="tablist"
          aria-label="Map views"
          className="inline-flex items-center rounded-xl border border-cockpit-border bg-cockpit-panel/60 p-1"
        >
          {TABS.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  active
                    ? "bg-ch-cyan/15 text-ch-cyan shadow-glow-cyan"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.icon size={13} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tile !p-3 sm:!p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24 text-slate-500" role="status">
              <span className="font-mono text-xs uppercase tracking-wider">Loading view…</span>
            </div>
          }
        >
          {view === "maps" ? <WeatherMaps weather={weather} /> : <USRadar weather={weather} />}
        </Suspense>
      </div>
    </section>
  );
}
