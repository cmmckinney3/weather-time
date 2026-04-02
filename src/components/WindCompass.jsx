import React from 'react';

const SIZE = 140;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RING_R = 56;

const TICKS = [
  { angle: 0,   label: 'N', major: true },
  { angle: 45,  label: null, major: false },
  { angle: 90,  label: 'E', major: true },
  { angle: 135, label: null, major: false },
  { angle: 180, label: 'S', major: true },
  { angle: 225, label: null, major: false },
  { angle: 270, label: 'W', major: true },
  { angle: 315, label: null, major: false },
];

const WindCompass = ({ windDegree = 0, windDir = 'N' }) => (
  <div className="flex flex-col items-center">
    <svg width={SIZE} height={SIZE} role="img" aria-label={`Wind direction: ${windDir} at ${windDegree}°`}>
      {/* Outer glow ring */}
      <circle cx={CX} cy={CY} r={RING_R + 5} fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.2" />
      {/* Main compass face */}
      <circle cx={CX} cy={CY} r={RING_R} fill="rgba(15,23,42,0.85)" stroke="#06b6d4" strokeWidth="1.5" />

      {/* Tick marks and cardinal labels */}
      {TICKS.map(({ angle, label, major }) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = CX + 53 * Math.cos(rad);
        const y1 = CY + 53 * Math.sin(rad);
        const x2 = CX + (major ? 46 : 50) * Math.cos(rad);
        const y2 = CY + (major ? 46 : 50) * Math.sin(rad);
        const lx = CX + 38 * Math.cos(rad);
        const ly = CY + 38 * Math.sin(rad);
        return (
          <g key={angle}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={major ? '#06b6d4' : '#334155'}
              strokeWidth={major ? 1.5 : 1}
            />
            {label && (
              <text x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fill="#06b6d4" fontSize="9" fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* Rotating needle — transformBox:fill-box makes transformOrigin:center relative to
          the element's own bounding box, fixing broken rotation in Safari and Firefox */}
      <g style={{
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transform: `rotate(${windDegree}deg)`,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Amber tip — points toward wind source direction */}
        <polygon
          points={`${CX},${CY - 34} ${CX - 5},${CY + 2} ${CX + 5},${CY + 2}`}
          fill="#f59e0b"
          opacity="0.95"
        />
        {/* Slate tail */}
        <polygon
          points={`${CX},${CY + 22} ${CX - 5},${CY - 2} ${CX + 5},${CY - 2}`}
          fill="#475569"
          opacity="0.85"
        />
      </g>

      {/* Center pivot */}
      <circle cx={CX} cy={CY} r={4} fill="#06b6d4"
        style={{ filter: 'drop-shadow(0 0 4px #06b6d4)' }}
      />
    </svg>

    <p className="text-xs font-mono text-slate-400 mt-1 tracking-wider">
      {windDir} · {windDegree}°
    </p>
  </div>
);

export default WindCompass;
