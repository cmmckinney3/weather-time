import React from 'react';
import { Wind, Droplets, Thermometer, Eye, Compass, ArrowUp, ArrowDown, AlertTriangle, Umbrella, Cloud } from 'lucide-react';
import { getWeatherIcon, getPrecipitationSummary, getPrecipitationIntensity } from '../utils/weatherUtils';

const WeatherConditionsWidget = ({ weather }) => {
  if (!weather) return null;
  
  const { current, forecast } = weather;
  
  // Get today's forecast data
  const today = forecast.forecastday[0];
  const precipSummary = getPrecipitationSummary(today);
  const precipIntensity = getPrecipitationIntensity(precipSummary.chanceOfRain);
  
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
          {getWeatherIcon(current.condition, 48)}
          <div className="ml-4">
            <h3 className="text-3xl font-bold text-gray-800">{current.temp_f}°F</h3>
            <p className="text-gray-600">{current.condition.text}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <ArrowUp className="text-red-500 mr-1" size={16} />
            <span className="font-semibold">{today.day.maxtemp_f}°F</span>
          </div>
          <div className="flex items-center justify-end">
            <ArrowDown className="text-blue-500 mr-1" size={16} />
            <span className="font-semibold">{today.day.mintemp_f}°F</span>
          </div>
        </div>
      </div>
      
      {/* Precipitation summary */}
      {precipSummary.chanceOfRain > 0 && (
        <div className={`mx-6 mb-4 p-3 rounded-lg ${precipIntensity.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Umbrella className={precipIntensity.color} size={20} />
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
      
      {/* Divider */}
      <div className="h-px bg-gray-200 mx-4"></div>
      
      {/* Weather metrics grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <Thermometer className="text-orange-500 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Feels like</p>
            <p className="font-semibold">{current.feelslike_f}°F</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Wind className="text-blue-500 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Wind</p>
            <p className="font-semibold">{current.wind_mph} mph</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Droplets className="text-blue-400 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Humidity</p>
            <p className="font-semibold">{current.humidity}%</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Compass className="text-gray-600 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Wind Direction</p>
            <p className="font-semibold">{current.wind_dir} {current.wind_degree}°</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Eye className="text-gray-500 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Visibility</p>
            <p className="font-semibold">{current.vis_miles} miles</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Cloud className="text-gray-400 mr-3" />
          <div>
            <p className="text-xs text-gray-500">Cloud Cover</p>
            <p className="font-semibold">{current.cloud}%</p>
          </div>
        </div>
      </div>
      
      {/* Alert section if available */}
      {weather.alerts && weather.alerts.alert && weather.alerts.alert.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r">
          <div className="flex items-start">
            <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800">Weather Alert</h4>
              <p className="text-sm text-amber-700">{weather.alerts.alert[0].headline}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherConditionsWidget;