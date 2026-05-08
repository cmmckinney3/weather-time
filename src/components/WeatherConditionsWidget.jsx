import React, { useState, useEffect } from 'react';
import {
  Wind, Droplets, Thermometer, Eye, Compass, ArrowUp, ArrowDown,
  AlertTriangle, Umbrella, Cloud, ChevronDown, X,
  Gauge as GaugeIcon, Activity, Zap
} from 'lucide-react';
import { getWeatherIcon, getPrecipitationSummary, getPrecipitationIntensity } from '../utils/weatherUtils';
import WindCompass from './WindCompass';
import SunArcWidget from './SunArcWidget';
import PressureTrend from './PressureTrend';

const AQI_LEVELS = [
  { label: 'Good',                  color: 'text-ch-emerald', bg: 'bg-ch-emerald/10', border: 'border-ch-emerald/30', glow: 'glow-emerald' },
  { label: 'Moderate',              color: 'text-ch-amber',   bg: 'bg-ch-amber/10',   border: 'border-ch-amber/30',   glow: 'glow-amber' },
  { label: 'Unhealthy (Sensitive)', color: 'text-orange-400', bg: 'bg-orange-400/10',  border: 'border-orange-400/30', glow: '' },
  { label: 'Unhealthy',             color: 'text-ch-red',     bg: 'bg-ch-red/10',      border: 'border-ch-red/30',     glow: '' },
  { label: 'Very Unhealthy',        color: 'text-purple-400', bg: 'bg-purple-400/10',  border: 'border-purple-400/30', glow: '' },
  { label: 'Hazardous',             color: 'text-rose-400',   bg: 'bg-rose-400/10',    border: 'border-rose-400/30',   glow: '' },
];

const SEVERITY_STYLES = {
  Extreme: 'bg-ch-red/20 text-ch-red border-ch-red/40',
  Severe:  'bg-orange-400/20 text-orange-400 border-orange-400/40',
  Moderate:'bg-ch-amber/20 text-ch-amber border-ch-amber/40',
  Minor:   'bg-yellow-400/20 text-yellow-400 border-yellow-400/40',
};

function getUvColor(uv) {
  if (uv <= 2) return '#34d399';
  if (uv <= 5) return '#fbbf24';
  if (uv <= 7) return '#fb923c';
  if (uv <= 10) return '#f87171';
  return '#a78bfa';
}

function getUvLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

/* SVG radial gauge component */
function RadialGauge({ value, max, label, unit, color, size = 100 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth="6"
        />
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-mono font-bold" style={{ color }}>{value}</span>
        <span className="text-[9px] text-slate-500 font-mono uppercase">{unit}</span>
      </div>
      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  );
}

const WeatherConditionsWidget = ({ weather, tempUnit = "F" }) => {
  const [expandedAlert, setExpandedAlert] = useState(null);

  useEffect(() => {
    setExpandedAlert(null);
  }, [weather]);

  if (!weather) return null;

  const { current, forecast } = weather;
  const today = forecast.forecastday[0];
  const precipSummary = getPrecipitationSummary(today);
  const precipIntensity = getPrecipitationIntensity(precipSummary.chanceOfRain);

  const aqiIndex = current.air_quality?.['us-epa-index'];
  const aqi = aqiIndex >= 1 && aqiIndex <= 6 ? AQI_LEVELS[aqiIndex - 1] : null;
  const alerts = weather.alerts?.alert ?? [];

  const toggleAlert = (i) => setExpandedAlert(expandedAlert === i ? null : i);

  return (
    <div className="space-y-4">
      {/* Gauges row */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <GaugeIcon size={14} className="text-ch-cyan" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
            Instrument Panel
          </h2>
          <div className="flex-1" />
          <span className="text-[10px] text-slate-600 font-mono">Updated: {current.last_updated}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
          <div className="relative">
            <RadialGauge
              value={current.humidity}
              max={100}
              label="Humidity"
              unit="%"
              color="#f472b6"
              size={100}
            />
          </div>
          <div className="relative">
            <RadialGauge
              value={current.uv}
              max={11}
              label="UV Index"
              unit={getUvLabel(current.uv)}
              color={getUvColor(current.uv)}
              size={100}
            />
          </div>
          <div className="relative">
            <RadialGauge
              value={current.wind_mph}
              max={60}
              label="Wind"
              unit="mph"
              color="#fbbf24"
              size={100}
            />
          </div>
          <div className="relative">
            <RadialGauge
              value={current.cloud}
              max={100}
              label="Cloud Cover"
              unit="%"
              color="#94a3b8"
              size={100}
            />
          </div>
        </div>
      </div>

      {/* Wind direction compass */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={14} className="text-ch-cyan" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
            Wind Direction
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <WindCompass windDegree={current.wind_degree} windDir={current.wind_dir} />
          <div className="flex flex-col gap-3 flex-1">
            <div className="glass-panel-flush rounded-lg p-3 flex items-center gap-3">
              <Wind size={16} className="text-ch-amber flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Wind Speed</p>
                <p className="text-sm font-mono font-semibold text-ch-amber">{current.wind_mph} mph</p>
              </div>
            </div>
            <div className="glass-panel-flush rounded-lg p-3 flex items-center gap-3">
              <Wind size={16} className="text-ch-amber/60 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Gust</p>
                <p className="text-sm font-mono font-semibold text-ch-amber/80">{current.gust_mph} mph</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Readout grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            icon: Thermometer, iconColor: 'text-ch-cyan', label: 'Feels Like',
            value: tempUnit === "F" ? `${current.feelslike_f}°F` : `${current.feelslike_c}°C`,
            valueColor: 'text-ch-cyan'
          },
          {
            icon: Eye, iconColor: 'text-slate-300', label: 'Visibility',
            value: `${current.vis_miles} mi`,
            valueColor: 'text-slate-200'
          },
          {
            icon: Thermometer, iconColor: 'text-teal-400', label: 'Dew Point',
            value: tempUnit === "F" ? `${current.dewpoint_f}°F` : `${current.dewpoint_c}°C`,
            valueColor: 'text-teal-400'
          },
          {
            icon: ArrowUp, iconColor: 'text-ch-red', label: 'High',
            value: tempUnit === "F" ? `${today.day.maxtemp_f}°F` : `${today.day.maxtemp_c}°C`,
            valueColor: 'text-ch-red'
          },
          {
            icon: ArrowDown, iconColor: 'text-ch-cyan', label: 'Low',
            value: tempUnit === "F" ? `${today.day.mintemp_f}°F` : `${today.day.mintemp_c}°C`,
            valueColor: 'text-ch-cyan'
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel-flush rounded-lg p-3 flex items-center gap-3">
            <metric.icon size={16} className={`${metric.iconColor} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{metric.label}</p>
              <p className={`text-sm font-mono font-semibold ${metric.valueColor}`}>{metric.value}</p>
            </div>
          </div>
        ))}
        <PressureTrend weather={weather} />
      </div>

      {/* Sun arc + Precipitation row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SunArcWidget astro={today.astro} localtime={weather.location.localtime} isDay={current.is_day} />

        {/* Precipitation summary */}
        {precipSummary.chanceOfRain > 0 ? (
          <div className="glass-panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Umbrella size={18} className="text-ch-magenta" />
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Rain Today</p>
                <p className="text-sm font-mono font-semibold text-ch-magenta">{precipSummary.chanceOfRain}% chance</p>
              </div>
            </div>
            {precipSummary.totalPrecip > 0 && (
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-ch-magenta glow-magenta">{precipSummary.totalPrecip}"</p>
                <p className="text-[10px] text-slate-500 font-mono">EXPECTED</p>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel p-4 flex items-center gap-3">
            <Umbrella size={18} className="text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Precipitation</p>
              <p className="text-sm font-mono text-slate-400">No rain expected</p>
            </div>
          </div>
        )}
      </div>

      {/* Air Quality */}
      {aqi && (
        <div className={`glass-panel p-4 border ${aqi.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={16} className={aqi.color} />
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Air Quality Index</p>
                <p className={`text-sm font-mono font-bold ${aqi.color} ${aqi.glow}`}>{aqi.label}</p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${aqi.bg} ${aqi.color} border ${aqi.border}`}>
              EPA {aqiIndex}/6
            </span>
          </div>
        </div>
      )}

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div role="region" aria-label="Weather alerts" className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-ch-amber" />
            <h4 className="text-[10px] font-semibold text-ch-amber uppercase tracking-widest font-mono">
              Alert{alerts.length > 1 ? `s (${alerts.length})` : ''}
            </h4>
          </div>
          {alerts.map((alert, i) => {
            const isOpen = expandedAlert === i;
            const severityStyle = SEVERITY_STYLES[alert.severity] ?? 'bg-ch-amber/20 text-ch-amber border-ch-amber/40';
            return (
              <div key={alert.headline || i} className="glass-panel overflow-hidden border-l-2 border-l-ch-amber">
                <button
                  onClick={() => toggleAlert(i)}
                  className="w-full flex items-start justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <AlertTriangle className="text-ch-amber flex-shrink-0 mt-0.5" size={14} />
                    <span className="text-xs font-display text-slate-200 leading-snug">{alert.headline}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {alert.severity && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${severityStyle}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    )}
                    {isOpen
                      ? <X size={14} className="text-slate-500" />
                      : <ChevronDown size={14} className="text-slate-500" />
                    }
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-cockpit-border pt-3 space-y-2 text-xs">
                    {alert.event && (
                      <p className="text-slate-300"><span className="text-slate-500 font-mono">EVENT:</span> {alert.event}</p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {alert.effective && (
                        <p className="text-slate-400 font-mono text-[11px]">
                          <span className="text-slate-500">EFF:</span> {new Date(alert.effective).toLocaleString()}
                        </p>
                      )}
                      {alert.expires && (
                        <p className="text-slate-400 font-mono text-[11px]">
                          <span className="text-slate-500">EXP:</span> {new Date(alert.expires).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {alert.areas && (
                      <p className="text-slate-400"><span className="text-slate-500 font-mono">AREAS:</span> {alert.areas}</p>
                    )}
                    {alert.desc && (
                      <div className="max-h-40 overflow-y-auto bg-cockpit-deep/60 rounded-lg p-3 border border-cockpit-border">
                        <pre className="whitespace-pre-wrap text-[11px] text-slate-400 font-mono">{alert.desc}</pre>
                      </div>
                    )}
                    {alert.instruction && (
                      <div className="bg-ch-amber/5 border border-ch-amber/20 rounded-lg p-3">
                        <p className="text-[10px] text-ch-amber font-mono font-bold mb-1">INSTRUCTIONS:</p>
                        <pre className="whitespace-pre-wrap text-[11px] text-slate-300 font-mono">{alert.instruction}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeatherConditionsWidget;
