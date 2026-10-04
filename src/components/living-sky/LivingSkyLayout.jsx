import React from "react";
import { AlertTriangle } from "lucide-react";
import SkyHero from "./SkyHero";
import HourlyStrip from "./HourlyStrip";
import DayRows from "./DayRows";
import BentoGrid from "./BentoGrid";
import SkyView from "./SkyView";
import { getNext24Hours } from "./skyUtils";

const SEVERE = new Set(["Extreme", "Severe"]);

export default function LivingSkyLayout({
  weather,
  tempUnit,
  atmosphere,
  toggleFavorite,
  isFavorite,
}) {
  if (!weather) return null;

  const alerts = weather.alerts?.alert ?? [];
  const severeAlert = alerts.find((a) => SEVERE.has(a.severity));
  const hours24 = getNext24Hours(weather);

  return (
    <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
      {severeAlert && (
        <div
          role="alert"
          className="tile !border-ch-red/40 !p-4 flex items-center gap-3 animate-fade-in-up"
        >
          <AlertTriangle size={18} className="text-ch-red flex-shrink-0 animate-pulse" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-bold text-ch-red uppercase tracking-[0.2em]">
              {severeAlert.severity} weather alert
            </p>
            <p className="text-sm text-slate-200 truncate mt-0.5">{severeAlert.headline}</p>
          </div>
        </div>
      )}

      <SkyHero
        weather={weather}
        tempUnit={tempUnit}
        atmosphere={atmosphere}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />
      <HourlyStrip hours={hours24} tempUnit={tempUnit} />
      <DayRows weather={weather} tempUnit={tempUnit} />
      <BentoGrid weather={weather} tempUnit={tempUnit} />
      <SkyView weather={weather} />
    </div>
  );
}
