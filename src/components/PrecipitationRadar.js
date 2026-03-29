import React, { useState } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area, AreaChart } from 'recharts';
import { CloudRain, Droplets, Umbrella, Clock, TrendingUp } from 'lucide-react';

const PrecipitationRadar = ({ weather }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'intensity', 'daily'

  if (!weather) return null;

  const { forecast } = weather;

  // Get precipitation data for selected day
  const getPrecipitationData = (dayIndex) => {
    const day = forecast.forecastday[dayIndex];
    if (!day) return [];

    let hours = day.hour;
    
    // For today, only show current hour onward
    if (dayIndex === 0) {
      const currentHour = new Date().getHours();
      hours = hours.filter(hour => new Date(hour.time).getHours() >= currentHour);
    }

    return hours.map(hour => {
      const time = new Date(hour.time).toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true
      });

      return {
        time,
        timeRaw: new Date(hour.time).getHours(),
        chanceOfRain: hour.chance_of_rain,
        precipitation: hour.precip_in,
        willItRain: hour.will_it_rain,
        chanceOfSnow: hour.chance_of_snow,
        willItSnow: hour.will_it_snow,
        condition: hour.condition.text,
        icon: hour.condition.icon
      };
    });
  };

  // Get daily summary data
  const getDailySummary = () => {
    return forecast.forecastday.map((day, index) => {
      const dayName = index === 0 ? 'Today' : 
                    index === 1 ? 'Tomorrow' : 
                    new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey === 'chanceOfRain' ? 'Rain Chance' : 
                 entry.dataKey === 'precipitation' ? 'Precipitation' : entry.dataKey}: ${entry.value}${
                entry.dataKey === 'chanceOfRain' ? '%' : 
                entry.dataKey === 'precipitation' ? ' in' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CloudRain className="text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Precipitation Forecast</h2>
        </div>
        
        {/* View mode selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('intensity')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'intensity' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Intensity
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Day selector (for timeline and intensity views) */}
      {viewMode !== 'daily' && (
        <div className="flex mb-6 overflow-x-auto">
          {forecast.forecastday.map((day, index) => {
            const dayName = index === 0 ? 'Today' : 
                          index === 1 ? 'Tomorrow' : 
                          new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(index)}
                className={`px-4 py-2 mr-2 rounded-lg font-medium transition-colors ${
                  selectedDay === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                }`}
              >
                {dayName}
              </button>
            );
          })}
        </div>
      )}

      {/* Daily summary card */}
      {viewMode !== 'daily' && selectedDayData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Umbrella className="text-blue-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">
                  {selectedDay === 0 ? "Today's" : selectedDay === 1 ? "Tomorrow's" : "Day's"} Precipitation Summary
                </h3>
                <p className="text-gray-600">
                  {selectedDayData.day.daily_chance_of_rain}% chance of rain • 
                  {selectedDayData.day.totalprecip_in}" total expected
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {selectedDayData.day.daily_will_it_rain ? 'Rain Expected' : 'No Rain Expected'}
              </p>
              <p className="text-sm text-gray-600">{selectedDayData.day.condition.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Views */}
      <div className={`${viewMode === 'daily' ? 'mb-6' : 'h-80 mb-6'}`}>
        {viewMode === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={precipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="chanceOfRain" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                name="Rain Chance (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'intensity' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={precipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="chanceOfRain" fill="#3B82F6" name="Rain Chance (%)" />
              <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke="#1E40AF" strokeWidth={3} name="Precipitation (in)" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'daily' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dailyData.map((day, index) => {
              const maxChance = Math.max(...dailyData.map(d => d.chanceOfRain));
              const barWidth = (day.chanceOfRain / maxChance) * 100;
              const precipAmount = day.totalPrecip;
              const hasSignificantPrecip = precipAmount > 0.1;
              
              return (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                      <h3 className="text-base font-semibold text-gray-800 min-w-[80px]">
                        {day.day}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xl font-bold ${
                          day.chanceOfRain >= 70 ? 'text-blue-700' :
                          day.chanceOfRain >= 40 ? 'text-blue-600' :
                          day.chanceOfRain >= 20 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                          {day.chanceOfRain}%
                        </span>
                        <span className="text-xs text-gray-600">rain</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {hasSignificantPrecip && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-700">{precipAmount}"</p>
                        </div>
                      )}
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        day.willItRain 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {day.willItRain ? 'Expected' : 'No Rain'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual precipitation bar */}
                  <div className="relative mb-2">
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          day.chanceOfRain >= 70 ? 'bg-blue-600' :
                          day.chanceOfRain >= 40 ? 'bg-blue-500' :
                          day.chanceOfRain >= 20 ? 'bg-blue-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Additional details */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600">
                    <span className="truncate">{day.condition}</span>
                    {day.chanceOfSnow > 0 && (
                      <span className="text-blue-600 mt-1 sm:mt-0">
                        {day.chanceOfSnow}% snow
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hourly precipitation details (timeline view only) */}
      {viewMode === 'timeline' && precipData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="mr-2" size={20} />
            Hourly Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {precipData.slice(0, 12).map((hour, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-gray-800">{hour.time}</p>
                <div className="flex items-center justify-center my-2">
                  <Droplets 
                    className={`${hour.chanceOfRain > 70 ? 'text-blue-600' : 
                                 hour.chanceOfRain > 30 ? 'text-blue-400' : 'text-gray-400'}`} 
                    size={20} 
                  />
                </div>
                <p className="text-xs text-gray-600">{hour.chanceOfRain}%</p>
                {hour.precipitation > 0 && (
                  <p className="text-xs font-medium text-blue-600">{hour.precipitation}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rain alerts */}
      {viewMode !== 'daily' && precipData.some(hour => hour.chanceOfRain > 70) && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <TrendingUp className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-800">High Precipitation Alert</h4>
              <p className="text-sm text-blue-700 mt-1">
                High chance of precipitation expected today. Consider bringing an umbrella or adjusting outdoor plans.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecipitationRadar;