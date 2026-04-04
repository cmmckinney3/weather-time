import React, { useState } from 'react';
import {
  Droplets, ThermometerSun, ThermometerSnowflake, Calendar, Clock,
  ChevronDown, ChevronUp, Wind, Eye, Sunrise, Sunset, Moon, MoonStar
} from 'lucide-react';
import { getWeatherIcon, formatTime, getDayName, filterHourlyData } from '../utils/weatherUtils';
import PrecipitationInfo, { HourlyPrecipIndicator } from './shared/PrecipitationInfo';

const WeatherDashboard = ({ weather, tempUnit = "F" }) => {
  const [expandedDay, setExpandedDay] = useState(null);

  if (!weather) return null;

  const { forecast } = weather;

  const toggleExpand = (index) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const getHourlyData = (dayIndex) => {
    const day = forecast.forecastday[dayIndex];
    if (!day) return [];
    const filteredHours = filterHourlyData(day.hour, dayIndex);
    return filteredHours.map(hour => ({
      time: formatTime(hour.time),
      temp: tempUnit === "F" ? hour.temp_f : hour.temp_c,
      feelsLike: tempUnit === "F" ? hour.feelslike_f : hour.feelslike_c,
      condition: hour.condition.text,
      icon: hour.condition.icon,
      chanceOfRain: hour.chance_of_rain,
      precip_in: hour.precip_in,
      wind: hour.wind_mph,
      humidity: hour.humidity,
      hourData: hour
    }));
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={14} className="text-ch-cyan" />
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
          3-Day Forecast
        </h2>
      </div>

      {/* Forecast day strips */}
      {forecast.forecastday.map((day, index) => {
        const dayName = getDayName(index, day.date);
        const isExpanded = expandedDay === index;
        const hourlyData = isExpanded ? getHourlyData(index) : [];
        const rainChance = day.day.daily_chance_of_rain;

        return (
          <div
            key={day.date}
            className={`glass-panel overflow-hidden transition-all duration-300 ${
              isExpanded ? 'shadow-glow-cyan' : 'hover:border-slate-600'
            }`}
          >
            {/* Strip header */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors text-left"
              aria-expanded={isExpanded}
              aria-label={`${dayName} forecast, click to ${isExpanded ? 'collapse' : 'expand'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-lg bg-cockpit-deep/50 border border-cockpit-border">
                  {getWeatherIcon(day.day.condition, 28)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 font-display text-sm">{dayName}</p>
                  <p className="text-xs text-slate-500 truncate">{day.day.condition.text}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                {/* Rain channel */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <Droplets size={12} className="text-ch-magenta" />
                  <span className={`text-xs font-mono font-medium ${
                    rainChance >= 60 ? 'text-ch-magenta glow-magenta' : 'text-slate-400'
                  }`}>
                    {rainChance}%
                  </span>
                </div>

                {/* Temp range */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <ThermometerSun size={12} className="text-ch-amber" />
                    <span className="text-sm font-mono font-semibold text-ch-amber">
                      {tempUnit === "F" ? `${day.day.maxtemp_f}°` : `${day.day.maxtemp_c}°`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThermometerSnowflake size={12} className="text-ch-cyan" />
                    <span className="text-sm font-mono font-medium text-ch-cyan-dim">
                      {tempUnit === "F" ? `${day.day.mintemp_f}°` : `${day.day.mintemp_c}°`}
                    </span>
                  </div>
                </div>

                {/* Expand icon */}
                {isExpanded ? (
                  <ChevronUp size={16} className="text-ch-cyan" />
                ) : (
                  <ChevronDown size={16} className="text-slate-500" />
                )}
              </div>
            </button>

            {/* Expanded detail panel */}
            {isExpanded && (
              <div className="border-t border-cockpit-border p-4 space-y-4 bg-cockpit-deep/30">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg Temp', value: tempUnit === "F" ? `${day.day.avgtemp_f}°F` : `${day.day.avgtemp_c}°C`, color: 'text-ch-cyan' },
                    { label: 'Humidity', value: `${day.day.avghumidity}%`, color: 'text-ch-magenta' },
                    { label: 'Max Wind', value: `${day.day.maxwind_mph} mph`, color: 'text-ch-amber' },
                    { label: 'UV Index', value: day.day.uv, color: 'text-ch-amber' },
                    { label: 'Precip', value: `${day.day.totalprecip_in}"`, color: 'text-ch-magenta' },
                    { label: 'Rain', value: `${day.day.daily_chance_of_rain}%`, color: 'text-ch-magenta' },
                    { label: 'Snow', value: `${day.day.daily_chance_of_snow}%`, color: 'text-blue-300' },
                    { label: 'Visibility', value: `${day.day.avgvis_miles} mi`, color: 'text-slate-300' },
                  ].map((metric) => (
                    <div key={metric.label} className="glass-panel-flush rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-1">{metric.label}</p>
                      <p className={`text-sm font-mono font-semibold ${metric.color}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>

                {/* Astro strip */}
                <div className="glass-panel-flush rounded-lg p-3 flex flex-wrap justify-around gap-4">
                  {[
                    { icon: Sunrise, label: 'Sunrise', value: day.astro.sunrise, color: 'text-ch-amber' },
                    { icon: Sunset, label: 'Sunset', value: day.astro.sunset, color: 'text-orange-400' },
                    { icon: Moon, label: 'Moonrise', value: day.astro.moonrise, color: 'text-slate-300' },
                    { icon: MoonStar, label: 'Moonset', value: day.astro.moonset, color: 'text-slate-500' },
                  ].map((astro) => (
                    <div key={astro.label} className="flex items-center gap-2">
                      <astro.icon size={14} className={astro.color} />
                      <div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{astro.label}</p>
                        <p className="text-xs font-mono text-slate-300">{astro.value}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <MoonStar size={14} className="text-indigo-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Moon Phase</p>
                      <p className="text-xs font-mono text-indigo-300">{day.astro.moon_phase}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon size={14} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Illumination</p>
                      <p className="text-xs font-mono text-slate-300">{day.astro.moon_illumination}%</p>
                    </div>
                  </div>
                </div>

                {/* Hourly table */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={12} className="text-ch-cyan" />
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">
                      Hourly Breakdown
                    </h4>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-cockpit-border">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-cockpit-deep/60">
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Time</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cond</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Temp</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rain</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Wind</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cockpit-border/50">
                        {hourlyData.map((hour, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2 px-3 text-xs font-mono font-medium text-slate-300">{hour.time}</td>
                            <td className="py-2 px-3 text-xs text-slate-400 flex items-center gap-2">
                              <img src={hour.icon} alt={hour.condition} className="w-5 h-5" />
                              <span className="hidden md:inline truncate max-w-[120px]">{hour.condition}</span>
                            </td>
                            <td className="py-2 px-3 text-xs font-mono text-ch-cyan">
                              {hour.temp}°{tempUnit}
                            </td>
                            <td className="py-2 px-3 text-xs font-mono">
                              <HourlyPrecipIndicator hour={hour.hourData} compact={true} />
                            </td>
                            <td className="py-2 px-3 text-xs font-mono text-ch-amber">{hour.wind} mph</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeatherDashboard;
