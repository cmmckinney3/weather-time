// Small presentational building blocks shared by every page.
import { ChevronRight } from "lucide-react";
import { Link } from "../lib/router";

export function Card({ as: Tag = "section", className = "", children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Tag>
  );
}

/** Card title row with an optional icon and right-aligned action link. */
export function CardHeader({ icon: Icon, title, action, className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {Icon && <Icon size={15} strokeWidth={2} aria-hidden="true" className="text-faint" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function TextLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline underline-offset-4 ${className}`}
    >
      {children}
      <ChevronRight size={15} aria-hidden="true" />
    </Link>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <header className="mb-5 sm:mb-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
    </header>
  );
}

/** °F / °C segmented control. */
export function UnitToggle({ unit, onChange }) {
  return (
    <div role="group" aria-label="Temperature unit" className="inline-flex rounded-lg bg-subtle p-0.5 text-sm">
      {["F", "C"].map((u) => {
        const active = unit === u;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            aria-pressed={active}
            aria-label={u === "F" ? "Fahrenheit" : "Celsius"}
            className={`min-w-9 rounded-md px-2 py-1 font-medium transition-colors ${
              active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            °{u}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Low/high bar positioned within an overall min/max span.
 * `marker` (optional) draws a dot for the current temperature.
 */
export function RangeBar({ lo, hi, min, max, marker, className = "" }) {
  const span = Math.max(1, max - min);
  const left = ((lo - min) / span) * 100;
  const width = Math.max(4, ((hi - lo) / span) * 100);
  const markerPos = marker == null ? null : Math.min(100, Math.max(0, ((marker - min) / span) * 100));
  return (
    <div className={`relative h-1.5 rounded-full bg-subtle ${className}`} aria-hidden="true">
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          background: "linear-gradient(90deg, var(--cool), var(--warm))",
        }}
      />
      {markerPos != null && (
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink"
          style={{ left: `${markerPos}%` }}
        />
      )}
    </div>
  );
}

/** Colored scale (e.g. UV, AQI) with a marker at `position` (0..1). */
export function ScaleBar({ colors, position, label }) {
  return (
    <div className="relative mt-3" role="img" aria-label={label}>
      <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${colors.join(", ")})` }} />
      <div
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink shadow"
        style={{ left: `${Math.min(100, Math.max(0, position * 100))}%` }}
      />
    </div>
  );
}

/** Label/value pair used in stat grids. */
export function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="tabular mt-0.5 truncate text-[15px] font-semibold text-ink">{value}</dd>
      {hint && <dd className="text-xs text-faint">{hint}</dd>}
    </div>
  );
}
