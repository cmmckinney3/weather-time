import React, { useState, useRef } from 'react';
import WeatherDashboard from './WeatherDashboard';
import DetailedForecast from './DetailedForecast';
import WeatherConditionsWidget from './WeatherConditionsWidget';
import PrecipitationRadar from './PrecipitationRadar';
import USRadar from './USRadar';
import { LayoutDashboard, LineChart, Gauge, CloudRain, AlertTriangle, Radar } from 'lucide-react';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'DASH', icon: LayoutDashboard },
  { id: 'forecast', label: 'Forecast', shortLabel: 'FCST', icon: LineChart },
  { id: 'conditions', label: 'Conditions', shortLabel: 'COND', icon: Gauge },
  { id: 'precipitation', label: 'Precipitation', shortLabel: 'PRCP', icon: CloudRain },
  { id: 'radar', label: 'U.S. Radar', shortLabel: 'RADR', icon: Radar },
];

const SEVERE_SEVERITIES = new Set(['Extreme', 'Severe']);

const WeatherAppLayout = ({ weather, tempUnit }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const tabRefs = useRef([]);

  if (!weather) return null;

  const alerts = weather.alerts?.alert ?? [];
  const severeAlert = alerts.find((a) => SEVERE_SEVERITIES.has(a.severity));

  const handleTabKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % VIEWS.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = VIEWS.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      setActiveView(VIEWS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const activePanelId = `tabpanel-${activeView}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Severe weather banner — shown for Extreme/Severe alerts (tornado, hurricane, etc.) */}
      {severeAlert && (
        <button
          onClick={() => setActiveView('conditions')}
          className="w-full mb-4 glass-panel border border-ch-red/50 bg-ch-red/10 p-3 flex items-center gap-3 text-left hover:bg-ch-red/15 transition-colors"
        >
          <AlertTriangle size={16} className="text-ch-red flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-bold text-ch-red uppercase tracking-widest">
              {severeAlert.severity} Weather Alert
            </p>
            <p className="text-xs text-slate-300 truncate">{severeAlert.headline}</p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">VIEW &rarr;</span>
        </button>
      )}

      {/* Instrument-panel tab bar */}
      <div
        role="tablist"
        aria-label="Weather views"
        aria-orientation="horizontal"
        className="flex items-center gap-1 mb-6 p-1 glass-panel-flush rounded-xl overflow-x-auto"
      >
        {VIEWS.map((view, index) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          const showBadge = view.id === 'conditions' && alerts.length > 0;
          return (
            <button
              key={view.id}
              ref={(el) => (tabRefs.current[index] = el)}
              id={`tab-${view.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${view.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveView(view.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`relative flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-medium uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ch-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-cockpit-deep ${
                isActive
                  ? 'cockpit-btn-active'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-ch-cyan' : ''} aria-hidden="true" />
              <span className="hidden sm:inline">{view.label}</span>
              <span className="sm:hidden">{view.shortLabel}</span>
              {showBadge && (
                <>
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ch-red shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">({alerts.length} active alert{alerts.length > 1 ? 's' : ''})</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Active view */}
      <div
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`tab-${activeView}`}
        tabIndex={0}
        className="animate-fade-in-up focus:outline-none"
      >
        {activeView === 'dashboard' && <WeatherDashboard weather={weather} tempUnit={tempUnit} />}
        {activeView === 'forecast' && <DetailedForecast weather={weather} tempUnit={tempUnit} />}
        {activeView === 'conditions' && <WeatherConditionsWidget weather={weather} tempUnit={tempUnit} />}
        {activeView === 'precipitation' && <PrecipitationRadar weather={weather} />}
        {activeView === 'radar' && <USRadar weather={weather} />}
      </div>
    </div>
  );
};

export default WeatherAppLayout;
