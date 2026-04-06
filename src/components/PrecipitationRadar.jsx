import React, { useState } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area, AreaChart, ReferenceLine } from 'recharts';
import { CloudRain, Droplets, Umbrella, Clock, TrendingUp } from 'lucide-react';
import { formatTime, filterHourlyData } from '../utils/weatherUtils';

const CockpitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-xs font-mono border border-cockpit-border shadow-lg">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.dataKey === 'chanceOfRain' ? 'Rain Chance' :
           entry.dataKey === 'precipitation' ? 'Precipitation' : entry.dataKey}:{' '}
          {entry.value}{entry.dataKey === 'chanceOfRain' ? '%' : entry.dataKey === 'precipitation' ? ' in' : ''}
        </p>
      ))}
    </div>
  );
};

const PrecipitationRadar = ({ weather }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState('timeline');

  if (!weather) return null;

  const { forecast } = weather;

  // FIX: Use shared filterHourlyData instead of duplicating the logic
  const getPrecipitationData = (dayIndex) => {
    const day = forecast.forecastday[dayIndex];
    if (!day) return [];

    const filteredHours = filterHourlyData(day.hour, dayIndex);

    return filteredHours.map(hour => ({
      time: formatTime(hour.time),
      timeRaw: new Date(hour.time).getHours(),
      chanceOfRain: hour.chance_of_rain,
      precipitation: hour.precip_in,
      willItRain: hour.will_it_rain,
      chanceOfSnow: hour.chance_of_snow,
      willItSnow: hour.will_it_snow,
      condition: hour.condition.text,
      icon: hour.condition.icon
    }));
  };

  const getDailySummary = () => {
    return forecast.forecastday.map((day, index) => {
      const dayName = index === 0 ? 'Today' :
                    index === 1 ? 'Tomorrow' :
                    new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      return {
        day: dayName,
        totalPrecip: day.day.totalprecip_in,
        chanceOfRain: day.day.daily_chance_of_rain,
        willItRain: day.day.daily_will_it_rain,
        chanceOfSnow: day.day.daily_chance_of_snow,
        condition: day.day.condition.text
      };
    });
  };

  const precipData = getPrecipitationData(selectedDay);
  const dailyData = getDailySummary();
  const selectedDayData = forecast.forecastday[selectedDay];

  const VIEW_MODES = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'intensity', label: 'Intensity' },
    { id: 'daily', label: 'Daily' },
  ];

  return (
    <div className="space-y-4">
      {/* Header with view selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain size={14} className="text-ch-magenta" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
            Precipitation Forecast
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 glass-panel-flush rounded-lg">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                viewMode === mode.id
                  ? 'cockpit-btn-active'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day selector */}
      {viewMode !== 'daily' && (
        <div className="flex items-center gap-1 p-1 glass-panel-flush rounded-xl">
          {forecast.forecastday.map((day, index) => {
            const dayName = index === 0 ? 'Today' :
                          index === 1 ? 'Tomorrow' :
                          new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
      )}

      {/* Summary card */}
      {viewMode !== 'daily' && selectedDayData && (
        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Umbrella size={18} className="text-ch-magenta" />
            <div>
              <p className="text-xs font-display font-medium text-slate-300">
                {selectedDay === 0 ? "Today's" : selectedDay === 1 ? "Tomorrow's" : "Day's"} Summary
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedDayData.day.daily_chance_of_rain}% chance &bull; {selectedDayData.day.totalprecip_in}" expected
              </p>
            </div>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-md ${
            selectedDayData.day.daily_will_it_rain
              ? 'bg-ch-magenta/15 text-ch-magenta border border-ch-magenta/30'
              : 'bg-cockpit-panel text-slate-400 border border-cockpit-border'
          }`}>
            {selectedDayData.day.daily_will_it_rain ? 'RAIN EXPECTED' : 'NO RAIN'}
          </span>
        </div>
      )}

      {/* Charts */}
      <div className={`glass-panel p-5 ${viewMode === 'daily' ? '' : ''}`}>
        <div className={viewMode === 'daily' ? '' : 'h-80'}>
          {viewMode === 'timeline' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={precipData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CockpitTooltip />} />
                {selectedDay === 0 && (
                  <ReferenceLine
                    x={new Date().toLocaleString('en-US', { hour: 'numeric', hour12: true })}
                    stroke="#22d3ee"
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                    label={{ value: 'NOW', position: 'insideTopRight', fill: '#22d3ee', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  />
                )}
                <defs>
                  <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="chanceOfRain"
                  stroke="#f472b6"
                  fill="url(#precipGradient)"
                  strokeWidth={2}
                  name="Rain Chance (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'intensity' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={precipData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CockpitTooltip />} />
                {selectedDay === 0 && (
                  <ReferenceLine
                    yAxisId="left"
                    x={new Date().toLocaleString('en-US', { hour: 'numeric', hour12: true })}
                    stroke="#22d3ee"
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                    label={{ value: 'NOW', position: 'insideTopRight', fill: '#22d3ee', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  />
                )}
                <Bar yAxisId="left" dataKey="chanceOfRain" fill="#f472b680" stroke="#f472b6" name="Rain Chance (%)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke="#22d3ee" strokeWidth={2} name="Precipitation (in)" dot={{ r: 3, fill: '#22d3ee' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'daily' && (
            <div className="space-y-3">
              {dailyData.map((day, index) => {
                const maxChance = Math.max(...dailyData.map(d => d.chanceOfRain), 1);
                const barWidth = (day.chanceOfRain / maxChance) * 100;

                return (
                  <div key={index} className="glass-panel-flush rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-slate-200 min-w-[80px]">{day.day}</span>
                        <span className={`text-lg font-mono font-bold ${
                          day.chanceOfRain >= 60 ? 'text-ch-magenta glow-magenta' :
                          day.chanceOfRain >= 30 ? 'text-ch-magenta' : 'text-slate-500'
                        }`}>
                          {day.chanceOfRain}%
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {day.totalPrecip > 0.1 && (
                          <span className="text-sm font-mono font-bold text-ch-cyan">{day.totalPrecip}"</span>
                        )}
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${
                          day.willItRain
                            ? 'bg-ch-magenta/15 text-ch-magenta border-ch-magenta/30'
                            : 'bg-cockpit-panel text-slate-500 border-cockpit-border'
                        }`}>
                          {day.willItRain ? 'EXPECTED' : 'CLEAR'}
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-cockpit-deep rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          day.chanceOfRain >= 60 ? 'bg-ch-magenta shadow-glow-magenta' :
                          day.chanceOfRain >= 30 ? 'bg-ch-magenta/70' : 'bg-slate-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{day.condition}</span>
                      {day.chanceOfSnow > 0 && (
                        <span className="text-blue-300">{day.chanceOfSnow}% snow</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hourly grid (timeline view) */}
      {viewMode === 'timeline' && precipData.length > 0 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-ch-magenta" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Hourly Details</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {precipData.slice(0, 12).map((hour, index) => (
              <div key={index} className="glass-panel-flush rounded-lg p-3 text-center">
                <p className="text-[10px] font-mono text-slate-400 mb-1">{hour.time}</p>
                <Droplets
                  size={18}
                  className={`mx-auto mb-1 ${
                    hour.chanceOfRain > 70 ? 'text-ch-magenta' :
                    hour.chanceOfRain > 30 ? 'text-ch-magenta/60' : 'text-slate-600'
                  }`}
                />
                <p className={`text-xs font-mono font-semibold ${
                  hour.chanceOfRain > 50 ? 'text-ch-magenta' : 'text-slate-400'
                }`}>
                  {hour.chanceOfRain}%
                </p>
                {hour.precipitation > 0 && (
                  <p className="text-[10px] font-mono text-ch-cyan mt-0.5">{hour.precipitation}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High precip alert */}
      {viewMode !== 'daily' && precipData.some(hour => hour.chanceOfRain > 70) && (
        <div className="glass-panel border-l-2 border-l-ch-magenta p-4 flex items-start gap-3">
          <TrendingUp size={16} className="text-ch-magenta flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono font-bold text-ch-magenta mb-1">HIGH PRECIPITATION ALERT</p>
            <p className="text-xs text-slate-400">
              Significant precipitation expected. Consider adjusting outdoor plans.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecipitationRadar;
