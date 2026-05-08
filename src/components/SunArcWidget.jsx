import React from 'react';
import { Sunrise, Sunset, Moon } from 'lucide-react';

const SIZE_W = 280;
const SIZE_H = 140;
const PAD_X = 28;
const ARC_Y = 110;
const ARC_RX = (SIZE_W - PAD_X * 2) / 2;
const ARC_RY = 80;
const CX = SIZE_W / 2;

function parseAstroTime(astroStr, baseDate) {
  // astroStr format: "06:12 AM" — combine with the base date
  if (!astroStr) return null;
  const match = astroStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function pointOnArc(progress) {
  // progress in [0, 1] — sweeps a half-ellipse from left to right
  const angle = Math.PI * (1 - progress); // π → 0
  const x = CX - ARC_RX * Math.cos(angle);
  const y = ARC_Y - ARC_RY * Math.sin(angle);
  return { x, y };
}

function MoonIcon({ phase, illum }) {
  // Render simple moon glyph; rely on lucide for clarity
  return <Moon size={14} className="text-slate-300" aria-label={`${phase}, ${illum}% illuminated`} />;
}

const SunArcWidget = ({ astro, localtime, isDay }) => {
  if (!astro || !localtime) return null;

  const base = new Date(localtime.replace(' ', 'T'));
  const sunrise = parseAstroTime(astro.sunrise, base);
  const sunset = parseAstroTime(astro.sunset, base);

  if (!sunrise || !sunset) return null;

  const span = sunset - sunrise;
  let progress = (base - sunrise) / span;
  progress = Math.max(0, Math.min(1, progress));
  const showSun = isDay === 1 && base >= sunrise && base <= sunset;
  const point = pointOnArc(progress);

  // Day length string
  const totalMinutes = Math.round(span / 60000);
  const dayHours = Math.floor(totalMinutes / 60);
  const dayMinutes = totalMinutes % 60;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        {showSun ? (
          <Sunrise size={14} className="text-ch-amber" />
        ) : (
          <Moon size={14} className="text-slate-300" />
        )}
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
          {showSun ? 'Sun Path' : 'Night Sky'}
        </h2>
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-slate-500">
          DAY {dayHours}H {dayMinutes.toString().padStart(2, '0')}M
        </span>
      </div>

      <div className="flex justify-center">
        <svg
          width="100%"
          viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            showSun
              ? `Sun is ${Math.round(progress * 100)} percent across its arc`
              : `Night — moon phase ${astro.moon_phase}, ${astro.moon_illumination}% illuminated`
          }
          style={{ maxWidth: '320px' }}
        >
          <defs>
            <linearGradient id="sa-arc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="sa-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <filter id="sa-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>

          {/* Horizon line */}
          <line
            x1={PAD_X - 8}
            y1={ARC_Y}
            x2={SIZE_W - (PAD_X - 8)}
            y2={ARC_Y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {/* Full arc track */}
          <path
            d={`M ${PAD_X} ${ARC_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${SIZE_W - PAD_X} ${ARC_Y}`}
            fill="none"
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth="1.5"
          />

          {/* Filled progress */}
          {showSun && (
            <path
              d={`M ${PAD_X} ${ARC_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${point.x} ${point.y}`}
              fill="none"
              stroke="url(#sa-arc)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Sunrise / sunset markers */}
          <circle cx={PAD_X} cy={ARC_Y} r="3" fill="#fbbf24" opacity="0.7" />
          <circle cx={SIZE_W - PAD_X} cy={ARC_Y} r="3" fill="#fb923c" opacity="0.7" />

          {/* Sun */}
          {showSun && (
            <>
              <circle cx={point.x} cy={point.y} r="14" fill="url(#sa-sun)" filter="url(#sa-glow)" opacity="0.7" />
              <circle cx={point.x} cy={point.y} r="6" fill="#fde68a" />
            </>
          )}

          {/* Sunrise label */}
          <text
            x={PAD_X}
            y={ARC_Y + 22}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
          >
            {astro.sunrise}
          </text>
          <text
            x={SIZE_W - PAD_X}
            y={ARC_Y + 22}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
          >
            {astro.sunset}
          </text>
        </svg>
      </div>

      {/* Footer: rise/set + moon */}
      <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-cockpit-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sunrise size={12} className="text-ch-amber flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-500 font-mono uppercase">Rise</p>
            <p className="text-[11px] font-mono font-semibold text-ch-amber truncate">{astro.sunrise}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sunset size={12} className="text-orange-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-500 font-mono uppercase">Set</p>
            <p className="text-[11px] font-mono font-semibold text-orange-400 truncate">{astro.sunset}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <MoonIcon phase={astro.moon_phase} illum={astro.moon_illumination} />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-500 font-mono uppercase">Moon</p>
            <p className="text-[11px] font-mono font-semibold text-slate-300 truncate" title={astro.moon_phase}>
              {astro.moon_illumination}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunArcWidget;
