import { Star, Umbrella, Wind, Sunrise, Sunset, Leaf, TriangleAlert, ChevronRight, Clock3, CalendarDays } from "lucide-react";
import { Card, CardHeader, TextLink, RangeBar } from "../components/ui";
import WeatherIcon from "../components/WeatherIcon";
import HourlyChart from "../components/HourlyChart";
import { Link } from "../lib/router";
import {
  temp, tempValue, speed, skyTheme, nearTermSummary, upcomingHours, hourPrecipChance,
  formatHour, formatClock, parseLocal, dayName, nextSunEvent, aqiInfo, compassWords,
  windDescription,
} from "../lib/weather";

export default function NowPage({ weather, yesterday, unit, isFavorite, onToggleFavorite }) {
  const { location, current } = weather;
  const days = weather.forecast.forecastday;
  const today = days[0];
  const todayDate = parseLocal(location.localtime)?.date;
  const next24 = upcomingHours(weather, 24);
  const summary = nearTermSummary(weather, unit, yesterday);
  const alerts = weather.alerts?.alert ?? [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* Hero */}
      <section
        aria-label={`Current weather in ${location.name}`}
        className={`sky sky-${skyTheme(current.condition, current.is_day === 1)} rise overflow-hidden rounded-3xl p-5 sm:p-8`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{location.name}</h1>
            <p className="truncate text-sm text-white/80">
              {[location.region, location.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="shrink-0 rounded-full bg-white/15 p-2.5 backdrop-blur transition-colors hover:bg-white/25"
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4 sm:mt-8">
          <div className="flex items-start">
            <span className="tabular text-[96px] font-light leading-[0.85] tracking-tighter sm:text-[120px]">
              {tempValue(current, "temp", unit)}
            </span>
            <span className="mt-2 text-4xl font-light sm:text-5xl">°{unit}</span>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2.5">
              <WeatherIcon condition={current.condition} isDay={current.is_day} size={30} plain />
              <span className="text-xl font-medium sm:text-2xl">{current.condition.text}</span>
            </div>
            <p className="tabular mt-1.5 text-[15px] text-white/85">
              Feels like {temp(current, "feelslike", unit)}
              <span className="mx-2 text-white/40">·</span>
              H {temp(today.day, "maxtemp", unit)}
              <span className="mx-1.5 text-white/40">/</span>
              L {temp(today.day, "mintemp", unit)}
            </p>
          </div>
        </div>

        {summary && (
          <p className="mt-6 border-t border-white/20 pt-4 text-[15px] leading-relaxed text-white/95 sm:text-base">
            {summary}
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
          <Clock3 size={12} aria-hidden="true" />
          Local time {formatClock(location.localtime)} · Updated {formatClock(current.last_updated)}
        </p>
      </section>

      {/* Next 24 hours */}
      <Card className="rise p-4 sm:p-6">
        <CardHeader
          icon={Clock3}
          title="Next 24 hours"
          action={<TextLink to="/forecast">Full forecast</TextLink>}
          className="mb-4"
        />
        <HourlyChart hours={next24} unit={unit} />
      </Card>

      {/* Quick facts */}
      <div className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <PrecipTile hours={upcomingHours(weather, 12)} />
        <QuickTile
          icon={Wind}
          label="Wind"
          value={speed(current, "wind", unit)}
          detail={`${windDescription(current.wind_mph)} from the ${compassWords(current.wind_dir)}`}
        />
        <SunTile weather={weather} />
        <AirTile current={current} />
      </div>

      {/* Coming days */}
      <Card className="rise p-4 sm:p-6">
        <CardHeader
          icon={CalendarDays}
          title={`${days.length}-day outlook`}
          action={<TextLink to="/forecast">Details</TextLink>}
          className="mb-2"
        />
        <DayList days={days} todayDate={todayDate} unit={unit} currentTemp={tempValue(current, "temp", unit)} />
      </Card>

      <Link
        to="/details"
        className="rise flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-4 text-sm shadow-card transition-colors hover:bg-subtle sm:px-6"
      >
        <span>
          <span className="font-semibold text-ink">More conditions</span>
          <span className="text-muted">: air quality, UV, humidity, pressure, sun &amp; moon</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden="true" />
      </Link>
    </div>
  );
}

function AlertBanner({ alerts }) {
  const first = alerts[0];
  return (
    <Link
      to="/details"
      className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <TriangleAlert size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{first.event || first.headline}</span>
        <span className="text-sm opacity-80">
          {alerts.length > 1 ? `${alerts.length - 1} more alert${alerts.length > 2 ? "s" : ""} · ` : ""}
          Tap for details
        </span>
      </span>
      <ChevronRight size={18} className="mt-0.5 shrink-0 opacity-60" aria-hidden="true" />
    </Link>
  );
}

function QuickTile({ icon: Icon, label, value, detail, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <Icon size={15} aria-hidden="true" className={accent ?? "text-faint"} />
        {label}
      </div>
      <p className="tabular mt-2 text-xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">{detail}</p>
    </Card>
  );
}

function PrecipTile({ hours }) {
  const peak = hours.reduce((a, b) => (hourPrecipChance(b) > hourPrecipChance(a) ? b : a), hours[0]);
  const chance = peak ? hourPrecipChance(peak) : 0;
  const detail =
    chance >= 50
      ? `Most likely around ${formatHour(peak.time)}`
      : chance >= 20
        ? `Low chance, peaking ${formatHour(peak.time)}`
        : "Unlikely in the next 12 hours";
  return <QuickTile icon={Umbrella} label="Precipitation" value={`${chance}%`} detail={detail} accent="text-rain" />;
}

function SunTile({ weather }) {
  const evt = nextSunEvent(weather);
  if (!evt) return null;
  const rise = evt.type === "sunrise";
  return (
    <QuickTile
      icon={rise ? Sunrise : Sunset}
      label={rise ? "Sunrise" : "Sunset"}
      value={evt.time}
      detail={evt.when === "tomorrow" ? "Tomorrow morning" : rise ? "Later this morning" : "Later today"}
      accent="text-warm"
    />
  );
}

function AirTile({ current }) {
  const aqi = aqiInfo(current.air_quality?.["us-epa-index"]);
  if (!aqi) return <QuickTile icon={Leaf} label="Air quality" value="--" detail="Not available here" />;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <Leaf size={15} aria-hidden="true" className="text-faint" />
        Air quality
      </div>
      <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-ink">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: aqi.color }} aria-hidden="true" />
        <span className="truncate">{aqi.index <= 2 ? aqi.label : `AQI ${aqi.index}`}</span>
      </p>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">{aqi.index <= 2 ? "US EPA index" : aqi.label}</p>
    </Card>
  );
}

function DayList({ days, todayDate, unit, currentTemp }) {
  const lows = days.map((d) => tempValue(d.day, "mintemp", unit));
  const highs = days.map((d) => tempValue(d.day, "maxtemp", unit));
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  return (
    <ul className="divide-y divide-line">
      {days.map((d, i) => {
        const chance = Math.max(d.day.daily_chance_of_rain, d.day.daily_chance_of_snow);
        return (
          <li key={d.date}>
            <Link to="/forecast" className="grid grid-cols-[4.75rem_1.75rem_2.25rem_1fr] items-center gap-2 py-3 sm:grid-cols-[8rem_2rem_3.5rem_1fr] sm:gap-3">
              <span className="font-medium text-ink">{dayName(d.date, todayDate, { short: true })}</span>
              <WeatherIcon condition={d.day.condition} size={24} />
              <span className={`tabular text-sm ${chance >= 30 ? "font-medium text-rain" : "text-faint"}`}>
                {chance > 0 ? `${chance}%` : ""}
              </span>
              <span className="tabular flex items-center gap-2 text-sm sm:gap-3">
                <span className="w-7 text-right text-muted sm:w-8">{lows[i]}°</span>
                <RangeBar lo={lows[i]} hi={highs[i]} min={min} max={max} marker={i === 0 ? currentTemp : null} className="flex-1" />
                <span className="w-7 font-semibold text-ink sm:w-8">{highs[i]}°</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
