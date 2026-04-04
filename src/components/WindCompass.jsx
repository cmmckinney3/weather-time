import React from 'react';

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 70;
const INNER_RING_R = 62;

// 16-point compass at 22.5° increments
const CARDINAL_LABELS   = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
const INTERCARDINAL_LABELS = { 45: 'NE', 135: 'SE', 225: 'SW', 315: 'NW' };

const TICKS = Array.from({ length: 16 }, (_, i) => {
  const angle = i * 22.5;
  return {
    angle,
    label:      CARDINAL_LABELS[angle]      ?? null,
    interLabel: INTERCARDINAL_LABELS[angle] ?? null,
    isCardinal:      angle % 90  === 0,
    isIntercardinal: angle % 45  === 0 && angle % 90 !== 0,
  };
});

const WindCompass = ({ windDegree = 0, windDir = 'N' }) => (
  <div className="flex flex-col items-center">
    <svg
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label={`Wind direction: ${windDir} at ${windDegree}°`}
    >
      <defs>
        {/* Compass face — dark radial gradient */}
        <radialGradient id="wc-face" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#111827" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#060d1a" stopOpacity="0.97" />
        </radialGradient>

        {/* Needle tip — amber fade-in from center */}
        <linearGradient id="wc-tip" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1"   />
        </linearGradient>

        {/* Needle tail — slate */}
        <linearGradient id="wc-tail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#334155" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.9" />
        </linearGradient>

        {/* Amber glow for needle tip */}
        <filter id="wc-amber-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Red glow for N label */}
        <filter id="wc-north-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Cyan glow for center pivot */}
        <filter id="wc-cyan-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer glow rings */}
      <circle cx={CX} cy={CY} r={OUTER_R + 7} fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.12" />
      <circle cx={CX} cy={CY} r={OUTER_R + 3} fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.25" />

      {/* Compass face */}
      <circle cx={CX} cy={CY} r={OUTER_R} fill="url(#wc-face)" stroke="#06b6d4" strokeWidth="1.5" />

      {/* Inner decorative ring */}
      <circle cx={CX} cy={CY} r={INNER_RING_R} fill="none" stroke="#1e3a5f" strokeWidth="0.75" opacity="0.55" />

      {/* Tick marks + labels */}
      {TICKS.map(({ angle, label, interLabel, isCardinal, isIntercardinal }) => {
        const rad      = (angle - 90) * (Math.PI / 180);
        const outerEdge = OUTER_R - 1;
        const tickLen  = isCardinal ? 13 : isIntercardinal ? 8 : 5;

        const x1 = CX + outerEdge * Math.cos(rad);
        const y1 = CY + outerEdge * Math.sin(rad);
        const x2 = CX + (outerEdge - tickLen) * Math.cos(rad);
        const y2 = CY + (outerEdge - tickLen) * Math.sin(rad);

        const labelR = isCardinal ? 48 : 44;
        const lx = CX + labelR * Math.cos(rad);
        const ly = CY + labelR * Math.sin(rad);
        const isNorth = angle === 0;

        return (
          <g key={angle}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isCardinal ? '#06b6d4' : isIntercardinal ? '#2d4a6b' : '#1e293b'}
              strokeWidth={isCardinal ? 1.5 : 1}
            />
            {label && (
              <text
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fill={isNorth ? '#ef4444' : '#06b6d4'}
                fontSize={isNorth ? '11' : '9'}
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
                filter={isNorth ? 'url(#wc-north-glow)' : undefined}
              >
                {label}
              </text>
            )}
            {interLabel && (
              <text
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fill="#2d4a6b"
                fontSize="7"
                fontWeight="600"
                fontFamily="'JetBrains Mono', monospace"
              >
                {interLabel}
              </text>
            )}
          </g>
        );
      })}

      {/* Rotating needle — transformOrigin uses explicit SVG viewport coords so the
          pivot is exactly CX,CY regardless of the needle's bounding box size.
          Both polygon halves share their wide base at exactly CY. */}
      <g style={{
        transformOrigin: `${CX}px ${CY}px`,
        transform:       `rotate(${windDegree}deg)`,
        transition:      'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Amber kite — tip toward wind source; base wide-points at exactly CY */}
        <polygon
          points={`${CX},${CY - 42} ${CX - 5},${CY} ${CX},${CY - 7} ${CX + 5},${CY}`}
          fill="url(#wc-tip)"
          filter="url(#wc-amber-glow)"
        />
        {/* Slate tail — base wide-points at exactly CY, matching tip */}
        <polygon
          points={`${CX},${CY + 28} ${CX - 4},${CY} ${CX},${CY + 7} ${CX + 4},${CY}`}
          fill="url(#wc-tail)"
        />
      </g>

      {/* Center pivot — two layers */}
      <circle cx={CX} cy={CY} r={6}  fill="#0a0f1e" stroke="#06b6d4" strokeWidth="1.5" filter="url(#wc-cyan-glow)" />
      <circle cx={CX} cy={CY} r={2.5} fill="#06b6d4" />
    </svg>

    <p className="text-xs font-mono text-slate-400 mt-1 tracking-wider">
      {windDir} · {windDegree}°
    </p>
  </div>
);

export default WindCompass;
