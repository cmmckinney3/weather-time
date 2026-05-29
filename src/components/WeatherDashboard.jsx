import React, { useState } from 'react';
import {
  Droplets, ThermometerSun, ThermometerSnowflake, Calendar, Clock,
  ChevronDown, ChevronUp, Sunrise, Sunset, Moon, MoonStar, CloudSnow, Umbrella
} from 'lucide-react';
import { getWeatherIcon, formatTime, getDayName, filterHourlyData } from '../utils/weatherUtils';
import { HourlyPrecipIndicator } from './shared/PrecipitationInfo';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isExpected = (value) => toNumber(value) === 1 || value === true;

const formatAmount = (value, suffix, decimals = 2) => {
  const amount = toNumber(value);
  if (amount <= 0) return `0${suffix}`;
  return `${amount.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}${suffix}`;
};

const getHourlyPrecipWindow = (hours = [], mode = 'rain') => {
  const activeHours = hours
    .filter((hour) => {
      const chance = toNumber(mode === 'snow' ? hour.chance_of_snow : hour.chance_of_rain);
      const willIt = isExpected(mode === 'snow' ? hour.will_it_snow : hour.will_it_rain);
      const amount = mode === 'snow' ? toNumber(hour.snow_cm) : toNumber(hour.precip_in);
      return willIt || chance >= 40 || amount > 0;
    })
    .map((hour) => ({
      time: hour.time,
      chance: toNumber(mode === 'snow' ? hour.chance_of_snow : hour.chance_of_rain),
    }));

  if (activeHours.length === 0) return null;

  const first = activeHours[0];
  const last = activeHours[activeHours.length - 1];
  const peak = activeHours.reduce((highest, hour) => (hour.chance > highest.chance ? hour : highest), first);

  const start = formatTime(first.time);
  const end = formatTime(last.time);
  return {
    range: start === end ? start : `${start}-${end}`,
    peak: `${formatTime(peak.time)} peak`,
    peakChance: peak.chance,
  };
};

const getDailyHydroIntel = (dayData, tempUnit) => {
  const day = dayData.day;
  const rainChance = toNumber(day.daily_chance_of_rain);
  const snowChance = toNumber(day.daily_chance_of_snow);
  const willRain = isExpected(day.daily_will_it_rain);
  const willSnow = isExpected(day.daily_will_it_snow);
  const precipTotal = tempUnit === 'F'
    ? formatAmount(day.totalprecip_in, '"')
    : formatAmount(day.totalprecip_mm, ' mm', 1);
  const snowTotal = formatAmount(day.totalsnow_cm, ' cm', 1);
  const rainWindow = getHourlyPrecipWindow(dayData.hour, 'rain');
  const snowWindow = getHourlyPrecipWindow(dayData.hour, 'snow');

  const signals = [];
  if (willRain || rainChance > 0) {
    signals.push(`${willRain ? 'Rain expected' : 'Rain possible'} (${rainChance}%)${rainWindow ? ` around ${rainWindow.range}` : ''}`);
  }
  if (willSnow || snowChance > 0 || toNumber(day.totalsnow_cm) > 0) {
    signals.push(`${willSnow ? 'Snow expected' : 'Snow possible'} (${snowChance}%)${snowWindow ? ` around ${snowWindow.range}` : ''}`);
  }

  return {
    rainChance,
    snowChance,
    willRain,
    willSnow,
    precipTotal,
    snowTotal,
    rainWindow,
    snowWindow,
    summary: signals.length > 0 ? signals.join(' • ') : 'No rain or snow signal in the daily forecast.',
  };
};

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
      chanceOfSnow: hour.chance_of_snow,
      precip_in: hour.precip_in,
      snow_cm: hour.snow_cm,
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
        const isToday = index === 0;
        // When the card is "today", show the date in the heading so the TODAY
        // badge isn't redundant with a "Today" label.
        const dayName = isToday
          ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
          : getDayName(index, day.date);
        const isExpanded = expandedDay === index;
        const hourlyData = isExpanded ? getHourlyData(index) : [];
        const hydroIntel = getDailyHydroIntel(day, tempUnit);
        const rainChance = hydroIntel.rainChance;
        const snowChance = hydroIntel.snowChance;

        return (
          <div
            key={day.date}
            className={`glass-panel overflow-hidden transition-all duration-300 ${
              isToday ? 'border-l-2 border-l-ch-cyan' : ''
            } ${
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-200 font-display text-sm">{dayName}</p>
                    {isToday && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-ch-cyan/15 text-ch-cyan border border-ch-cyan/30">
                        <span className="live-dot bg-ch-cyan" aria-hidden="true" />
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{day.day.condition.text}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-5">
                {/* Hydro channels */}
                <div className="hidden sm:flex items-center gap-3" aria-label={`Rain chance ${rainChance} percent, snow chance ${snowChance} percent`}>
                  <div className="flex items-center gap-1.5">
                    <Droplets size={12} className={hydroIntel.willRain ? 'text-ch-magenta' : 'text-slate-500'} />
                    <span className={`text-xs font-mono font-medium ${
                      rainChance >= 60 || hydroIntel.willRain ? 'text-ch-magenta glow-magenta' : 'text-slate-400'
                    }`}>
                      {rainChance}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CloudSnow size={12} className={hydroIntel.willSnow ? 'text-ch-cyan' : 'text-slate-500'} />
                    <span className={`text-xs font-mono font-medium ${
                      snowChance >= 40 || hydroIntel.willSnow ? 'text-ch-cyan' : 'text-slate-400'
                    }`}>
                      {snowChance}%
                    </span>
                  </div>
                </div>

                <div className="sm:hidden flex items-center gap-1.5" aria-label={`Highest rain or snow chance ${Math.max(rainChance, snowChance)} percent`}>
                  {snowChance > rainChance ? (
                    <CloudSnow size={12} className={hydroIntel.willSnow ? 'text-ch-cyan' : 'text-slate-500'} />
                  ) : (
                    <Droplets size={12} className={hydroIntel.willRain ? 'text-ch-magenta' : 'text-slate-500'} />
                  )}
                  <span className={`text-xs font-mono font-medium ${
                    Math.max(rainChance, snowChance) >= 60 ? 'text-ch-magenta glow-magenta' : 'text-slate-400'
                  }`}>
                    {Math.max(rainChance, snowChance)}%
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
                {/* Daily precipitation / snow intelligence */}
                <div className="glass-panel-flush rounded-lg p-3 border border-cockpit-border/70" role="group" aria-label={`${dayName} precipitation and snow summary`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-cockpit-deep/60 border border-cockpit-border">
                        {hydroIntel.willSnow ? (
                          <CloudSnow size={18} className="text-ch-cyan" />
                        ) : (
                          <Umbrella size={18} className={hydroIntel.willRain ? 'text-ch-magenta' : 'text-slate-500'} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Hydro Intel</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{hydroIntel.summary}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:min-w-[360px]">
                      {[
                        { label: hydroIntel.willRain ? 'Rain Expected' : 'Rain Chance', value: `${rainChance}%`, color: rainChance >= 60 || hydroIntel.willRain ? 'text-ch-magenta' : 'text-slate-400', icon: Droplets },
                        { label: hydroIntel.willSnow ? 'Snow Expected' : 'Snow Chance', value: `${snowChance}%`, color: snowChance >= 40 || hydroIntel.willSnow ? 'text-ch-cyan' : 'text-slate-400', icon: CloudSnow },
                        { label: 'Liquid Total', value: hydroIntel.precipTotal, color: 'text-ch-magenta', icon: Droplets },
                        { label: 'Snow Total', value: hydroIntel.snowTotal, color: 'text-ch-cyan', icon: CloudSnow },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md bg-cockpit-deep/50 border border-cockpit-border/60 p-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <item.icon size={11} className={item.color} />
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono truncate">{item.label}</p>
                          </div>
                          <p className={`text-xs font-mono font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg Temp', value: tempUnit === "F" ? `${day.day.avgtemp_f}°F` : `${day.day.avgtemp_c}°C`, color: 'text-ch-cyan' },
                    { label: 'Humidity', value: `${day.day.avghumidity}%`, color: 'text-ch-magenta' },
                    { label: 'Max Wind', value: `${day.day.maxwind_mph} mph`, color: 'text-ch-amber' },
                    { label: 'UV Index', value: day.day.uv, color: 'text-ch-amber' },
                    { label: 'Rain Flag', value: hydroIntel.willRain ? 'YES' : 'NO', color: hydroIntel.willRain ? 'text-ch-magenta' : 'text-slate-400' },
                    { label: 'Snow Flag', value: hydroIntel.willSnow ? 'YES' : 'NO', color: hydroIntel.willSnow ? 'text-ch-cyan' : 'text-slate-400' },
                    { label: 'Rain Peak', value: hydroIntel.rainWindow ? `${hydroIntel.rainWindow.peakChance}% ${hydroIntel.rainWindow.peak}` : 'None', color: hydroIntel.rainWindow ? 'text-ch-magenta' : 'text-slate-500' },
                    { label: 'Snow Peak', value: hydroIntel.snowWindow ? `${hydroIntel.snowWindow.peakChance}% ${hydroIntel.snowWindow.peak}` : 'None', color: hydroIntel.snowWindow ? 'text-ch-cyan' : 'text-slate-500' },
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
                  <div className="scroll-fade-x overflow-x-auto rounded-lg border border-cockpit-border">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-cockpit-deep/60">
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Time</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cond</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Temp</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rain</th>
                          <th className="py-2 px-3 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider">Snow</th>
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
                            <td className="py-2 px-3 text-xs font-mono">
                              <div className="flex items-center gap-1">
                                <CloudSnow className={toNumber(hour.chanceOfSnow) > 0 || toNumber(hour.snow_cm) > 0 ? 'text-ch-cyan' : 'text-slate-600'} size={10} />
                                <span className={toNumber(hour.chanceOfSnow) > 0 || toNumber(hour.snow_cm) > 0 ? 'text-ch-cyan' : 'text-slate-500'}>
                                  {toNumber(hour.chanceOfSnow)}%
                                </span>
                                {toNumber(hour.snow_cm) > 0 && (
                                  <span className="text-[10px] text-slate-400">{formatAmount(hour.snow_cm, ' cm', 1)}</span>
                                )}
                              </div>
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
