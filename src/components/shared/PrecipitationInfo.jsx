import React from 'react';
import { CloudRain, Droplets, Umbrella } from 'lucide-react';
import { getPrecipitationIntensity } from '../../utils/weatherUtils';

const INTENSITY_COLORS = {
  'very-high': 'text-ch-magenta',
  'high': 'text-ch-magenta',
  'moderate': 'text-ch-magenta/70',
  'low': 'text-slate-400',
  'none': 'text-slate-600',
};

function getIntensityColor(level) {
  return INTENSITY_COLORS[level] || 'text-slate-500';
}

const PrecipitationInfo = ({ dayData, showDetails = false, className = "" }) => {
  if (!dayData) return null;

  const rainChance = dayData.day.daily_chance_of_rain;
  const totalPrecip = dayData.day.totalprecip_in;
  const willItRain = dayData.day.daily_will_it_rain;
  const intensity = getPrecipitationIntensity(rainChance);
  const colorClass = getIntensityColor(intensity.level);

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Droplets className={`${colorClass} ${rainChance > 0 ? '' : 'opacity-40'}`} size={14} />
        <span className={`text-xs font-mono font-medium ${colorClass}`}>
          {rainChance}%
        </span>
        {totalPrecip > 0 && (
          <span className="text-[10px] text-slate-500 font-mono">({totalPrecip}")</span>
        )}
      </div>
    );
  }

  return (
    <div className={`glass-panel-flush rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Umbrella className={colorClass} size={16} />
          <div>
            <p className="text-xs font-mono text-slate-300">
              Precip: <span className={colorClass}>{intensity.label}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {rainChance}% {willItRain ? '• EXPECTED' : ''}
            </p>
          </div>
        </div>
        {totalPrecip > 0 && (
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-ch-magenta">{totalPrecip}"</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase">Expected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const HourlyPrecipIndicator = ({ hour, compact = false }) => {
  const rainChance = hour.chance_of_rain;
  const intensity = getPrecipitationIntensity(rainChance);
  const colorClass = getIntensityColor(intensity.level);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Droplets className={colorClass} size={10} />
        <span className={`text-xs font-mono ${colorClass}`}>{rainChance}%</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Droplets className={colorClass} size={14} />
      <span className={`text-xs font-mono font-medium ${colorClass}`}>{rainChance}%</span>
      {hour.precip_in > 0 && (
        <span className="text-[10px] font-mono text-ch-cyan font-bold">{hour.precip_in}"</span>
      )}
    </div>
  );
};

export default PrecipitationInfo;
