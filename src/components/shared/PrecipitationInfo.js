import React from 'react';
import { CloudRain, Droplets, Umbrella } from 'lucide-react';
import { getPrecipitationIntensity } from '../../utils/weatherUtils';

/**
 * Compact precipitation info display
 */
const PrecipitationInfo = ({ dayData, showDetails = false, className = "" }) => {
  if (!dayData) return null;

  const rainChance = dayData.day.daily_chance_of_rain;
  const totalPrecip = dayData.day.totalprecip_in;
  const willItRain = dayData.day.daily_will_it_rain;
  const intensity = getPrecipitationIntensity(rainChance);

  // Compact version - just the essential info
  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CloudRain className={`${intensity.color} ${rainChance > 0 ? '' : 'opacity-50'}`} size={16} />
        <span className={`text-sm font-medium ${intensity.color}`}>
          {rainChance}%
        </span>
        {totalPrecip > 0 && (
          <span className="text-xs text-gray-500">({totalPrecip}")</span>
        )}
      </div>
    );
  }

  // Detailed version
  return (
    <div className={`${intensity.bg} border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Umbrella className={intensity.color} size={20} />
          <div>
            <p className="text-sm font-medium text-gray-800">
              Precipitation: {intensity.label}
            </p>
            <p className="text-xs text-gray-600">
              {rainChance}% chance {willItRain ? '• Rain expected' : ''}
            </p>
          </div>
        </div>
        {totalPrecip > 0 && (
          <div className="text-right">
            <p className="text-sm font-bold text-blue-600">{totalPrecip}"</p>
            <p className="text-xs text-gray-500">expected</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hourly precipitation indicator
 */
export const HourlyPrecipIndicator = ({ hour, compact = false }) => {
  const rainChance = hour.chance_of_rain;
  const intensity = getPrecipitationIntensity(rainChance);
  
  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <Droplets className={intensity.color} size={12} />
        <span className={`text-xs ${intensity.color}`}>{rainChance}%</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <Droplets className={intensity.color} size={16} />
      <span className={`text-xs ${intensity.color} font-medium`}>{rainChance}%</span>
      {hour.precip_in > 0 && (
        <span className="text-xs text-blue-600 font-bold">{hour.precip_in}"</span>
      )}
    </div>
  );
};

export default PrecipitationInfo;