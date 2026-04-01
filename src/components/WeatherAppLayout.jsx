import React, { useState } from 'react';
import WeatherDashboard from './WeatherDashboard';
import DetailedForecast from './DetailedForecast';
import WeatherConditionsWidget from './WeatherConditionsWidget';
import PrecipitationRadar from './PrecipitationRadar';
import { LayoutDashboard, LineChart, Gauge, CloudRain } from 'lucide-react';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'DASH', icon: LayoutDashboard },
  { id: 'forecast', label: 'Forecast', shortLabel: 'FCST', icon: LineChart },
  { id: 'conditions', label: 'Conditions', shortLabel: 'COND', icon: Gauge },
  { id: 'precipitation', label: 'Precipitation', shortLabel: 'PRCP', icon: CloudRain },
];

const WeatherAppLayout = ({ weather, tempUnit }) => {
  const [activeView, setActiveView] = useState('dashboard');

  if (!weather) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Instrument-panel tab bar */}
      <div className="flex items-center gap-1 mb-6 p-1 glass-panel-flush rounded-xl overflow-x-auto">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-medium uppercase tracking-wider transition-all ${
                isActive
                  ? 'cockpit-btn-active'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-ch-cyan' : ''} />
              <span className="hidden sm:inline">{view.label}</span>
              <span className="sm:hidden">{view.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Active view */}
      <div className="animate-fade-in-up">
        {activeView === 'dashboard' && <WeatherDashboard weather={weather} tempUnit={tempUnit} />}
        {activeView === 'forecast' && <DetailedForecast weather={weather} tempUnit={tempUnit} />}
        {activeView === 'conditions' && <WeatherConditionsWidget weather={weather} tempUnit={tempUnit} />}
        {activeView === 'precipitation' && <PrecipitationRadar weather={weather} />}
      </div>
    </div>
  );
};

export default WeatherAppLayout;
