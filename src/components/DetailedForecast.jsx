import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Wind, CalendarDays, Droplets } from 'lucide-react';
import { getWeatherIcon, formatTime, getShortDayName, filterHourlyData, getPrecipitationSummary } from '../utils/weatherUtils';
import PrecipitationInfo from './shared/PrecipitationInfo';

const CockpitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-xs font-mono border border-cockpit-border shadow-lg">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value}°
        </p>
      ))}
    </div>
  );
};

const displayNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(decimals);
};

const displayPercent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

const getSnowSignal = (chanceOfSnow, willItSnow) => {
  if (willItSnow === 1) return 'Expected';
  if (chanceOfSnow >= 40) return 'Likely';
  if (chanceOfSnow > 0) return 'Possible';
  return 'None';
};

const DetailedForecast = ({ weather, tempUnit = "F" }) => {
  const [selectedDay, setSelectedDay] = useState(0);

  if (!weather) return null;

  const { forecast } = weather;
  const relevantDays = forecast.forecastday;
  const dayData = relevantDays[selectedDay];
  const precipSummary = getPrecipitationSummary(dayData);

  const filteredHours = filterHourlyData(dayData.hour, selectedDay, weather.location?.localtime);

  const formattedHourlyData = filteredHours.map(hour => ({
    time: formatTime(hour.time),
    temp: tempUnit === "F" ? hour.temp_f : hour.temp_c,
    feelsLike: tempUnit === "F" ? hour.feelslike_f : hour.feelslike_c,
    condition: hour.condition.text,
    chanceOfRain: hour.chance_of_rain,
    chanceOfSnow: hour.chance_of_snow,
    willItSnow: hour.will_it_snow,
    precipAmount: hour.precip_in,
    wind: hour.wind_mph,
    windDir: hour.wind_dir,
    gust: hour.gust_mph,
    humidity: hour.humidity,
    cloud: hour.cloud,
    uv: hour.uv,
    visibility: hour.vis_miles,
    pressure: hour.pressure_mb,
    dewPoint: tempUnit === "F" ? hour.dewpoint_f : hour.dewpoint_c,
    heatIndex: tempUnit === "F" ? hour.heatindex_f : hour.heatindex_c,
    windChill: tempUnit === "F" ? hour.windchill_f : hour.windchill_c,
    icon: hour.condition.icon
  }));

  const chartData = formattedHourlyData.map(hour => ({
    time: hour.time,
    Temperature: hour.temp,
    'Feels Like': hour.feelsLike
  }));

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex items-center gap-1 p-1 glass-panel-flush rounded-xl">
        {relevantDays.map((day, index) => {
          const dayName = getShortDayName(index, day.date);
          const isActive = selectedDay === index;
          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`flex-1 px-4 py-2 rounded-lg font-mono text-xs font-medium uppercase tracking-wider transition-all ${
                isActive
                  ? 'cockpit-btn-active'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {dayName}
            </button>
          );
        })}
      </div>

      {/* Day summary strip */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-cockpit-deep/50 border border-cockpit-border">
              {getWeatherIcon(dayData.day.condition, 32)}
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-slate-200">{dayData.day.condition.text}</p>
              <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                <span className="text-ch-red">H: {tempUnit === "F" ? `${dayData.day.maxtemp_f}°F` : `${dayData.day.maxtemp_c}°C`}</span>
                <span className="text-ch-cyan">L: {tempUnit === "F" ? `${dayData.day.mintemp_f}°F` : `${dayData.day.mintemp_c}°C`}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wind size={14} className="text-ch-amber" />
              <span className="text-xs font-mono text-ch-amber">{dayData.day.maxwind_mph} mph</span>
            </div>
            <PrecipitationInfo dayData={dayData} />
          </div>
        </div>
      </div>

      {/* Temperature chart */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={14} className="text-ch-cyan" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Temperature Trend</h3>
        </div>
        {/* text-ch-cyan supplies currentColor so the chart line tracks the atmosphere accent */}
        <div className="h-64 text-ch-cyan">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                unit={tempUnit === "F" ? "°F" : "°C"}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CockpitTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              {selectedDay === 0 && (
                <ReferenceLine
                  x={new Date().toLocaleString('en-US', { hour: 'numeric', hour12: true })}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  label={{ value: 'NOW', position: 'insideTopRight', fill: 'currentColor', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="Temperature"
                stroke="currentColor"
                strokeWidth={2}
                dot={{ r: 3, fill: 'currentColor', stroke: 'currentColor' }}
                activeDot={{ r: 5, fill: 'currentColor', stroke: '#0f172a', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="Feels Like"
                stroke="#f472b6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f472b6', stroke: '#f472b6' }}
                activeDot={{ r: 5, fill: '#f472b6', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly table */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-3">Hourly Data</h3>
        <div className="scroll-fade-x overflow-x-auto rounded-lg border border-cockpit-border">
          <table className="min-w-[1320px] w-full">
            <thead>
              <tr className="bg-cockpit-deep/60">
                {['Time', 'Condition', 'Temp', 'Feels', 'Heat', 'Chill', 'Dew', 'Precip', 'Snow', 'Wind', 'Gust', 'Cloud', 'UV', 'Vis', 'Pressure', 'Humid'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit-border/50">
              {formattedHourlyData.map((hour, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-xs font-mono font-medium text-slate-300 whitespace-nowrap">{hour.time}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                    <img src={hour.icon} alt={hour.condition} className="w-6 h-6" />
                    <span className="hidden md:inline truncate max-w-[140px]">{hour.condition}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-ch-cyan font-semibold whitespace-nowrap">{displayNumber(hour.temp)}°{tempUnit}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.feelsLike)}°{tempUnit}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-ch-amber whitespace-nowrap">{displayNumber(hour.heatIndex)}°{tempUnit}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.windChill)}°{tempUnit}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.dewPoint)}°{tempUnit}</td>
                  <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">
                    <span className={hour.chanceOfRain >= 40 ? 'text-ch-magenta font-semibold' : 'text-slate-500'}>
                      {displayPercent(hour.chanceOfRain)}
                    </span>
                    {hour.precipAmount > 0 && (
                      <span className="text-ch-magenta text-[10px] ml-1">{hour.precipAmount}"</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">
                    <span className={hour.willItSnow === 1 || hour.chanceOfSnow >= 40 ? 'text-ch-cyan font-semibold' : 'text-slate-500'}>
                      {displayPercent(hour.chanceOfSnow)}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-1">{getSnowSignal(hour.chanceOfSnow, hour.willItSnow)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-ch-amber whitespace-nowrap">
                    {displayNumber(hour.wind)} mph
                    {hour.windDir && <span className="text-[10px] text-slate-500 ml-1">{hour.windDir}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-ch-amber whitespace-nowrap">{displayNumber(hour.gust)} mph</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayPercent(hour.cloud)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.uv, 1)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.visibility, 1)} mi</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayNumber(hour.pressure)} mb</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-400 whitespace-nowrap">{displayPercent(hour.humidity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailedForecast;
