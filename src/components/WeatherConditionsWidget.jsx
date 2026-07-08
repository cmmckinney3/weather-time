import React, { useState, useEffect } from 'react';
import {
  Wind, Droplets, Thermometer, Eye, Compass, ArrowUp, ArrowDown,
  AlertTriangle, Umbrella, Cloud, ChevronDown, X, Sunrise, Sunset,
  Gauge as GaugeIcon, Activity, Zap
} from 'lucide-react';
import { getWeatherIcon, getPrecipitationSummary, getPrecipitationIntensity } from '../utils/weatherUtils';
import WindCompass from './WindCompass';

const AQI_LEVELS = [
  { label: 'Good',                  color: 'text-ch-emerald', bg: 'bg-ch-emerald/10', border: 'border-ch-emerald/30', glow: 'glow-emerald', dot: 'bg-ch-emerald' },
  { label: 'Moderate',              color: 'text-ch-amber',   bg: 'bg-ch-amber/10',   border: 'border-ch-amber/30',   glow: 'glow-amber',   dot: 'bg-ch-amber' },
  { label: 'Unhealthy (Sensitive)', color: 'text-orange-400', bg: 'bg-orange-400/10',  border: 'border-orange-400/30', glow: '',             dot: 'bg-orange-400' },
  { label: 'Unhealthy',             color: 'text-ch-red',     bg: 'bg-ch-red/10',      border: 'border-ch-red/30',     glow: '',             dot: 'bg-ch-red' },
  { label: 'Very Unhealthy',        color: 'text-purple-400', bg: 'bg-purple-400/10',  border: 'border-purple-400/30', glow: '',             dot: 'bg-purple-400' },
  { label: 'Hazardous',             color: 'text-rose-400',   bg: 'bg-rose-400/10',    border: 'border-rose-400/30',   glow: '',             dot: 'bg-rose-400' },
];

const SEVERITY_STYLES = {
  Extreme: 'bg-ch-red/20 text-ch-red border-ch-red/40',
  Severe:  'bg-orange-400/20 text-orange-400 border-orange-400/40',
  Moderate:'bg-ch-amber/20 text-ch-amber border-ch-amber/40',
  Minor:   'bg-yellow-400/20 text-yellow-400 border-yellow-400/40',
};

const AIR_POLLUTANTS = [
  { key: 'pm2_5', label: 'PM2.5', unit: 'µg/m³', accent: 'text-ch-magenta' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', accent: 'text-ch-amber' },
  { key: 'o3', label: 'O₃', unit: 'µg/m³', accent: 'text-ch-cyan' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³', accent: 'text-orange-400' },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³', accent: 'text-purple-400' },
  { key: 'co', label: 'CO', unit: 'µg/m³', accent: 'text-slate-200' },
];

const ALERT_METADATA_FIELDS = [
  { key: 'urgency', label: 'Urgency' },
  { key: 'certainty', label: 'Certainty' },
  { key: 'category', label: 'Category' },
  { key: 'msgtype', label: 'Type' },
];

function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

function formatPollutant(value) {
  if (!Number.isFinite(Number(value))) return value;
  const number = Number(value);
  if (number >= 100) return Math.round(number).toLocaleString();
  if (number >= 10) return number.toFixed(1);
  return number.toFixed(2);
}

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
    <div
      className="flex flex-col items-center relative"
      role="img"
      aria-label={`${label}: ${value} ${unit}`}
    >
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
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
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
        <span className="text-lg font-mono font-bold" style={{ color }}>{value}</span>
        <span className="text-[9px] text-slate-500 font-mono uppercase">{unit}</span>
      </div>
      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1.5" aria-hidden="true">{label}</p>
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
  const gbDefraIndex = current.air_quality?.['gb-defra-index'];
  const aqi = aqiIndex >= 1 && aqiIndex <= 6 ? AQI_LEVELS[aqiIndex - 1] : null;
  const pollutants = AIR_POLLUTANTS
    .map((pollutant) => ({ ...pollutant, value: current.air_quality?.[pollutant.key] }))
    .filter((pollutant) => isPresent(pollutant.value));
  const hasAirQuality = Boolean(aqi || isPresent(gbDefraIndex) || pollutants.length > 0);
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
            icon: GaugeIcon, iconColor: 'text-slate-300', label: 'Pressure',
            value: `${current.pressure_mb} mb`,
            valueColor: 'text-slate-200'
          },
          {
            icon: Thermometer, iconColor: 'text-teal-400', label: 'Dew Point',
            value: tempUnit === "F" ? `${current.dewpoint_f}°F` : `${current.dewpoint_c}°C`,
            valueColor: 'text-teal-400'
          },
          {
            icon: Thermometer, iconColor: 'text-ch-amber', label: 'Heat Index',
            value: tempUnit === "F" ? `${current.heatindex_f}°F` : `${current.heatindex_c}°C`,
            valueColor: 'text-ch-amber'
          },
          {
            icon: Thermometer, iconColor: 'text-slate-300', label: 'Wind Chill',
            value: tempUnit === "F" ? `${current.windchill_f}°F` : `${current.windchill_c}°C`,
            valueColor: 'text-slate-300'
          },
          {
            icon: Cloud, iconColor: 'text-slate-400', label: 'Precip Now',
            value: `${current.precip_in} in`,
            valueColor: current.precip_in > 0 ? 'text-ch-magenta' : 'text-slate-400'
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
      </div>

      {/* Sunrise / Sunset + Precipitation row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sun strip */}
        <div className="glass-panel p-4 flex items-center justify-around">
          <div className="flex items-center gap-2">
            <Sunrise size={18} className="text-ch-amber" />
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Sunrise</p>
              <p className="text-sm font-mono font-semibold text-ch-amber">{today.astro.sunrise}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-cockpit-border" />
          <div className="flex items-center gap-2">
            <Sunset size={18} className="text-orange-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Sunset</p>
              <p className="text-sm font-mono font-semibold text-orange-400">{today.astro.sunset}</p>
            </div>
          </div>
          <div className="hidden lg:block w-px h-8 bg-cockpit-border" />
          <div className="hidden lg:flex items-center gap-2">
            <Sunrise size={18} className={today.astro.is_sun_up ? 'text-ch-amber' : 'text-slate-500'} />
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Sun</p>
              <p className="text-sm font-mono font-semibold text-slate-300">{today.astro.is_sun_up ? 'Up' : 'Down'}</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Moon size={18} className={today.astro.is_moon_up ? 'text-indigo-300' : 'text-slate-500'} />
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Moon</p>
              <p className="text-sm font-mono font-semibold text-slate-300">{today.astro.is_moon_up ? 'Up' : 'Down'}</p>
            </div>
          </div>
        </div>

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
      {hasAirQuality && (
        <div className={`glass-panel p-4 border ${aqi?.border ?? 'border-cockpit-border'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Activity size={16} className={`${aqi?.color ?? 'text-ch-cyan'} flex-shrink-0`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Air Quality Index</p>
                <p className={`text-sm font-mono font-bold ${aqi?.color ?? 'text-slate-300'} ${aqi?.glow ?? ''}`}>
                  {aqi?.label ?? 'Details available'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
              {/* Tier dots — colorblind-friendly severity indicator */}
              {aqi && (
                <>
                  <div
                    className="flex items-center gap-0.5"
                    role="img"
                    aria-label={`Severity ${aqiIndex} of 6`}
                  >
                    {[1, 2, 3, 4, 5, 6].map((tier) => (
                      <span
                        key={tier}
                        aria-hidden="true"
                        className={`w-1.5 h-3 rounded-sm transition-colors ${
                          tier <= aqiIndex ? aqi.dot : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${aqi.bg} ${aqi.color} border ${aqi.border}`}>
                    EPA {aqiIndex}/6
                  </span>
                </>
              )}
              {isPresent(gbDefraIndex) && (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800/70 text-slate-300 border border-cockpit-border" title="UK DEFRA Daily Air Quality Index">
                  DEFRA {gbDefraIndex}/10
                </span>
              )}
            </div>
          </div>
          {pollutants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cockpit-border" aria-label="Air pollutant concentrations">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Pollutants</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {pollutants.map((pollutant) => (
                  <div key={pollutant.key} className="glass-panel-flush rounded-lg p-2.5 min-w-0">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{pollutant.label}</p>
                    <p className={`text-sm font-mono font-semibold ${pollutant.accent}`}>
                      {formatPollutant(pollutant.value)}
                    </p>
                    <p className="text-[9px] text-slate-600 font-mono">{pollutant.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            const alertMetadata = ALERT_METADATA_FIELDS.filter(({ key }) => isPresent(alert[key]));
            const alertPanelId = `weather-alert-${i}`;
            return (
              <div key={alert.headline || i} className="glass-panel overflow-hidden border-l-2 border-l-ch-amber">
                <button
                  onClick={() => toggleAlert(i)}
                  className="w-full flex items-start justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={alertPanelId}
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
                  <div id={alertPanelId} className="px-4 pb-4 border-t border-cockpit-border pt-3 space-y-2 text-xs">
                    {alert.event && (
                      <p className="text-slate-300"><span className="text-slate-500 font-mono">EVENT:</span> {alert.event}</p>
                    )}
                    {alertMetadata.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Alert metadata">
                        {alertMetadata.map(({ key, label }) => (
                          <div key={key} className="bg-cockpit-deep/50 rounded-md border border-cockpit-border px-2 py-1.5">
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">{label}</p>
                            <p className="text-[11px] text-slate-300 font-mono font-semibold truncate" title={alert[key]}>{alert[key]}</p>
                          </div>
                        ))}
                      </div>
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
                    {alert.note && (
                      <p className="text-slate-400"><span className="text-slate-500 font-mono">NOTE:</span> {alert.note}</p>
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
