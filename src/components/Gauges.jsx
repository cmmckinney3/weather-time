// Small SVG visuals for the Details page.
import { compassWords, isWaxing } from "../lib/weather";

/** Compass dial; the arrow points the way the wind is blowing *to*. */
export function WindDial({ degree, dir, speed, unitLabel }) {
  const size = 140;
  const c = size / 2;
  const r = 50; // tick ring; cardinal letters sit outside it
  const rotation = (Number(degree) + 180) % 360;
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  const at = (deg, radius) => {
    const a = (deg * Math.PI) / 180;
    return [c + radius * Math.sin(a), c - radius * Math.cos(a)];
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Wind from the ${compassWords(dir)} at ${speed} ${unitLabel}`}
      className="shrink-0"
    >
      {ticks.map((t) => {
        const major = t % 90 === 0;
        const [x1, y1] = at(t, r - (major ? 7 : 4));
        const [x2, y2] = at(t, r);
        return (
          <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? "var(--faint)" : "var(--line)"}
            strokeWidth={major ? 2 : 1} strokeLinecap="round" />
        );
      })}
      {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, d]) => {
        const [x, y] = at(d, r + 11);
        return (
          <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="600" fill="var(--faint)">
            {l}
          </text>
        );
      })}
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center", transformBox: "view-box", transition: "transform 700ms ease" }}>
        <line x1={c} y1={c + r - 10} x2={c} y2={c - r + 14} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c} ${c - r + 5} l -6 11 h 12 z`} fill="var(--accent)" />
        <circle cx={c} cy={c + r - 10} r="3" fill="var(--accent)" />
      </g>
      <circle cx={c} cy={c} r="19" fill="var(--surface)" stroke="var(--line)" />
      <text x={c} y={c - 3} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)">{speed}</text>
      <text x={c} y={c + 11} textAnchor="middle" fontSize="9" fill="var(--faint)">{unitLabel}</text>
    </svg>
  );
}

/** Moon disc lit according to illumination (0–100) and waxing/waning. */
export function MoonPhase({ illumination, phase, size = 64 }) {
  const f = Math.min(1, Math.max(0, Number(illumination) / 100));
  const r = size / 2 - 2;
  const c = size / 2;
  const rx = r * Math.abs(1 - 2 * f);
  const sweep = f > 0.5 ? 1 : 0;
  // Right-hand lit shape; mirrored for waning phases.
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${sweep} ${c} ${c - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${phase}, ${Math.round(f * 100)}% illuminated`}>
      <circle cx={c} cy={c} r={r} fill="var(--subtle)" stroke="var(--line)" />
      {f > 0.01 && (
        <path
          d={d}
          fill="#f4e7b8"
          stroke="#e2cf8a"
          strokeWidth="0.5"
          transform={isWaxing(phase) ? undefined : `translate(${size} 0) scale(-1 1)`}
        />
      )}
    </svg>
  );
}

/** Arc from sunrise to sunset with the sun's current position. */
export function SunArc({ progress }) {
  const w = 240;
  const h = 92;
  const pad = 14;
  const base = h - 14;
  const rx = (w - pad * 2) / 2;
  const ry = base - 14;
  const cx = w / 2;
  const point = (t) => {
    const a = Math.PI * (1 - t);
    return [cx + rx * Math.cos(a), base - ry * Math.sin(a)];
  };
  const arc = `M ${pad} ${base} A ${rx} ${ry} 0 0 1 ${w - pad} ${base}`;
  const [sx, sy] = progress == null ? [] : point(progress);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[260px]" aria-hidden="true">
      <line x1="0" y1={base} x2={w} y2={base} stroke="var(--line)" />
      <path d={arc} fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
      {progress != null && (
        <>
          <path
            d={`M ${pad} ${base} A ${rx} ${ry} 0 0 1 ${sx} ${sy}`}
            fill="none"
            stroke="var(--warm)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={sx} cy={sy} r="9" fill="var(--warm)" opacity="0.2" />
          <circle cx={sx} cy={sy} r="5.5" fill="var(--warm)" />
        </>
      )}
    </svg>
  );
}
