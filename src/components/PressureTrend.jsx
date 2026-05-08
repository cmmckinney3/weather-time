import React from 'react';
import { Gauge as GaugeIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SPARK_W = 88;
const SPARK_H = 28;

function getPressureSeries(weather) {
  const localtime = weather?.location?.localtime;
  const today = weather?.forecast?.forecastday?.[0];
  if (!localtime || !today) return null;

  const now = new Date(localtime.replace(' ', 'T'));
  const currentHour = now.getHours();
  const todayHours = today.hour ?? [];

  // Last 6 hours through current hour, fall back to first 6 if too early in day
  const start = Math.max(0, currentHour - 5);
  const end = Math.min(todayHours.length, currentHour + 1);
  let slice = todayHours.slice(start, end);
  if (slice.length < 2) slice = todayHours.slice(0, 6);

  const values = slice.map((h) => h.pressure_mb).filter((v) => typeof v === 'number');
  if (values.length < 2) return null;
  return values;
}

function trendInfo(values) {
  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  if (diff > 1) return { dir: 'rising', icon: TrendingUp, color: 'text-ch-emerald', diff };
  if (diff < -1) return { dir: 'falling', icon: TrendingDown, color: 'text-ch-red', diff };
  return { dir: 'steady', icon: Minus, color: 'text-slate-400', diff };
}

const PressureTrend = ({ weather }) => {
  const current = weather?.current;
  if (!current) return null;

  const series = getPressureSeries(weather);
  if (!series) {
    return (
      <div className="glass-panel-flush rounded-lg p-3 flex items-center gap-3">
        <GaugeIcon size={16} className="text-slate-300 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Pressure</p>
          <p className="text-sm font-mono font-semibold text-slate-200">{current.pressure_mb} mb</p>
        </div>
      </div>
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, 0.5);
  const trend = trendInfo(series);
  const TrendIcon = trend.icon;

  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * SPARK_W;
      const y = SPARK_H - ((v - min) / range) * SPARK_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Map trend color to a stroke value (avoid Tailwind class indirection inside SVG)
  const strokeColor =
    trend.dir === 'rising' ? '#34d399' : trend.dir === 'falling' ? '#f87171' : '#94a3b8';

  const diffLabel =
    trend.dir === 'steady' ? 'STEADY' : `${trend.diff > 0 ? '+' : ''}${trend.diff.toFixed(1)}`;

  return (
    <div className="glass-panel-flush rounded-lg p-3 flex items-center gap-3">
      <GaugeIcon size={16} className="text-slate-300 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Pressure</p>
          <TrendIcon size={11} className={`${trend.color}`} aria-label={trend.dir} />
          <span className={`text-[9px] font-mono ${trend.color}`}>{diffLabel}</span>
        </div>
        <p className="text-sm font-mono font-semibold text-slate-200">{current.pressure_mb} mb</p>
      </div>
      <svg
        width={SPARK_W}
        height={SPARK_H}
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={SPARK_W}
          cy={SPARK_H - ((series[series.length - 1] - min) / range) * SPARK_H}
          r="2"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
};

export default PressureTrend;
