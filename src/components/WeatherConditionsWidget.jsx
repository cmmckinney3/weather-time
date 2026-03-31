import React, { useState, useEffect } from 'react';
import {
  Wind, Droplets, Thermometer, Eye, Compass, ArrowUp, ArrowDown,
  AlertTriangle, Umbrella, Cloud, ChevronDown, X, Sunrise, Sunset,
  Gauge, Activity
} from 'lucide-react';
import { getWeatherIcon, getPrecipitationSummary, getPrecipitationIntensity } from '../utils/weatherUtils';

const AQI_LEVELS = [
  { label: 'Good',                  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  { label: 'Moderate',              bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { label: 'Unhealthy (Sensitive)', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  { label: 'Unhealthy',             bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  { label: 'Very Unhealthy',        bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { label: 'Hazardous',             bg: 'bg-rose-200',   text: 'text-rose-900',   border: 'border-rose-400' },
];

const SEVERITY_STYLES = {
  Extreme: 'bg-red-100 text-red-800',
  Severe:  'bg-orange-100 text-orange-800',
  Moderate:'bg-amber-100 text-amber-800',
  Minor:   'bg-yellow-100 text-yellow-800',
};

function getUvColor(uv) {
  if (uv <= 2)  return 'bg-green-500';
  if (uv <= 5)  return 'bg-yellow-400';
  if (uv <= 7)  return 'bg-orange-500';
  if (uv <= 10) return 'bg-red-500';
  return 'bg-violet-600';
}

function getUvLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

function getHumidityColor(h) {
  if (h < 40) return 'bg-green-400';
  if (h < 70) return 'bg-blue-400';
  return 'bg-indigo-600';
}

const WeatherConditionsWidget = ({ weather, tempUnit = "F" }) => {
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Reset expanded alert whenever weather changes (new city search)
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
  const uvBarWidth = `${Math.min((current.uv / 11) * 100, 100)}%`;

  const toggleAlert = (i) => setExpandedAlert(expandedAlert === i ? null : i);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md w-full mx-auto">

      {/* Header */}
      <div className="bg-indigo-600 text-white p-4">
        <h2 className="text-xl font-bold">Current Conditions</h2>
        <p className="text-sm opacity-80">Last updated: {current.last_updated}</p>
      </div>

      {/* Current weather snapshot */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          <span aria-hidden="true">{getWeatherIcon(current.condition, 48)}</span>
          <div className="ml-4">
            <h3 className="text-3xl font-bold text-gray-800">
              {tempUnit === "F" ? `${current.temp_f}°F` : `${current.temp_c}°C`}
            </h3>
            <p className="text-gray-600">{current.condition.text}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <ArrowUp className="text-red-500 mr-1" size={16} aria-hidden="true" />
            <span className="font-semibold">
              {tempUnit === "F" ? `${today.day.maxtemp_f}°F` : `${today.day.maxtemp_c}°C`}
            </span>
          </div>
          <div className="flex items-center justify-end">
            <ArrowDown className="text-blue-500 mr-1" size={16} aria-hidden="true" />
            <span className="font-semibold">
              {tempUnit === "F" ? `${today.day.mintemp_f}°F` : `${today.day.mintemp_c}°C`}
            </span>
          </div>
        </div>
      </div>

      {/* Precipitation summary */}
      {precipSummary.chanceOfRain > 0 && (
        <div className={`mx-6 mb-4 p-3 rounded-lg ${precipIntensity.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Umbrella className={precipIntensity.color} size={20} aria-hidden="true" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-800">Rain Today</p>
                <p className="text-xs text-gray-600">{precipSummary.chanceOfRain}% chance</p>
              </div>
            </div>
            {precipSummary.totalPrecip > 0 && (
              <div className="text-right">
                <p className={`text-sm font-bold ${precipIntensity.color}`}>{precipSummary.totalPrecip}"</p>
                <p className="text-xs text-gray-500">expected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Air Quality Index */}
      {aqi && (
        <div className={`mx-6 mb-4 p-3 rounded-lg border ${aqi.bg} ${aqi.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Air Quality</p>
              <p className={`text-sm font-bold ${aqi.text}`}>{aqi.label}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${aqi.bg} ${aqi.text} ${aqi.border}`}>
              EPA {aqiIndex}/6
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gray-200 mx-4" />

      {/* Core metrics grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center">
          <Thermometer className="text-orange-500 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Feels like</p>
            <p className="font-semibold">
              {tempUnit === "F" ? `${current.feelslike_f}°F` : `${current.feelslike_c}°C`}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Wind className="text-blue-500 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Wind</p>
            <p className="font-semibold">{current.wind_mph} mph</p>
          </div>
        </div>

        <div className="flex items-center">
          <Droplets className="text-blue-400 mr-3 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Humidity</p>
            <p className="font-semibold">{current.humidity}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getHumidityColor(current.humidity)}`}
                style={{ width: `${current.humidity}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <Compass className="text-gray-600 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Wind Direction</p>
            <p className="font-semibold">{current.wind_dir} {current.wind_degree}°</p>
          </div>
        </div>

        <div className="flex items-center">
          <Eye className="text-gray-500 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Visibility</p>
            <p className="font-semibold">{current.vis_miles} miles</p>
          </div>
        </div>

        <div className="flex items-center">
          <Cloud className="text-gray-400 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Cloud Cover</p>
            <p className="font-semibold">{current.cloud}%</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mx-4" />

      {/* Extended metrics */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* UV Index with bar */}
        <div className="flex items-start">
          <Activity className="text-yellow-500 mr-3 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">UV Index</p>
            <p className="font-semibold">{current.uv} — {getUvLabel(current.uv)}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getUvColor(current.uv)}`}
                style={{ width: uvBarWidth }}
              />
            </div>
          </div>
        </div>

        {/* Pressure */}
        <div className="flex items-center">
          <Gauge className="text-gray-500 mr-3 flex-shrink-0" size={18} aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Pressure</p>
            <p className="font-semibold">{current.pressure_mb} mb</p>
          </div>
        </div>

        {/* Dew Point */}
        <div className="flex items-center">
          <Thermometer className="text-teal-500 mr-3 flex-shrink-0" size={18} aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Dew Point</p>
            <p className="font-semibold">
              {tempUnit === "F"
                ? `${current.dewpoint_f}°F`
                : `${current.dewpoint_c}°C`}
            </p>
          </div>
        </div>

        {/* Wind Gust */}
        <div className="flex items-center">
          <Wind className="text-indigo-400 mr-3 flex-shrink-0" size={18} aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Wind Gust</p>
            <p className="font-semibold">{current.gust_mph} mph</p>
          </div>
        </div>
      </div>

      {/* Sunrise / Sunset banner */}
      <div className="mx-4 mb-4 mt-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex justify-around">
        <div className="flex items-center gap-2">
          <Sunrise className="text-amber-500" size={20} aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Sunrise</p>
            <p className="font-semibold text-sm text-gray-800">{today.astro.sunrise}</p>
          </div>
        </div>
        <div className="w-px bg-indigo-200" />
        <div className="flex items-center gap-2">
          <Sunset className="text-orange-500" size={20} aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Sunset</p>
            <p className="font-semibold text-sm text-gray-800">{today.astro.sunset}</p>
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="mt-2 mx-4 mb-4" role="region" aria-label="Weather alerts">
          <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
            Weather Alert{alerts.length > 1 ? `s (${alerts.length})` : ''}
          </h4>
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const isOpen = expandedAlert === i;
              const severityStyle = SEVERITY_STYLES[alert.severity] ?? 'bg-amber-100 text-amber-800';
              return (
                <div
                  key={i}
                  className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg overflow-hidden"
                >
                  {/* Alert header row — always visible, clickable */}
                  <button
                    onClick={() => toggleAlert(i)}
                    className="w-full flex items-start justify-between p-3 text-left cursor-pointer hover:bg-amber-100 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} aria-hidden="true" />
                      <span className="text-sm font-medium text-amber-900 leading-snug">{alert.headline}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {alert.severity && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityStyle}`}>
                          {alert.severity}
                        </span>
                      )}
                      {isOpen
                        ? <X size={16} className="text-amber-600" aria-hidden="true" />
                        : <ChevronDown size={16} className="text-amber-600" aria-hidden="true" />
                      }
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-amber-200 pt-3 space-y-2 text-sm text-amber-900">
                      {alert.event && (
                        <p><span className="font-semibold">Event:</span> {alert.event}</p>
                      )}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {alert.effective && (
                          <p><span className="font-semibold">Effective:</span><br />{new Date(alert.effective).toLocaleString()}</p>
                        )}
                        {alert.expires && (
                          <p><span className="font-semibold">Expires:</span><br />{new Date(alert.expires).toLocaleString()}</p>
                        )}
                      </div>
                      {alert.areas && (
                        <p><span className="font-semibold">Areas:</span> {alert.areas}</p>
                      )}
                      {(alert.urgency || alert.certainty) && (
                        <p>
                          {alert.urgency && <><span className="font-semibold">Urgency:</span> {alert.urgency}</>}
                          {alert.urgency && alert.certainty && ' · '}
                          {alert.certainty && <><span className="font-semibold">Certainty:</span> {alert.certainty}</>}
                        </p>
                      )}
                      {alert.desc && (
                        <div>
                          <p className="font-semibold mb-1">Description:</p>
                          <div className="max-h-40 overflow-y-auto bg-amber-100 rounded p-2">
                            <pre className="whitespace-pre-wrap text-xs text-amber-900 font-sans">{alert.desc}</pre>
                          </div>
                        </div>
                      )}
                      {alert.instruction && (
                        <div>
                          <p className="font-semibold mb-1">Instructions:</p>
                          <pre className="whitespace-pre-wrap text-xs text-amber-900 font-sans bg-amber-100 rounded p-2">{alert.instruction}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherConditionsWidget;
