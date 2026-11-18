import { useState } from "react";
import {
  Leaf, SunMedium, Wind, Droplets, Thermometer, Gauge, Eye, CloudRain, Sun, Moon,
  History, MapPin, TriangleAlert, ChevronDown, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { Card, CardHeader, PageHeader, ScaleBar, Stat } from "../components/ui";
import { WindDial, MoonPhase, SunArc } from "../components/Gauges";
import {
  temp, speed, speedValue, speedUnit, precip, snowfall, distance, pressure,
  aqiInfo, uvInfo, windDescription, dewPointComfort, visibilityDescription, pressureTrend,
  feelsLikeReason, compassWords, tidyClock, daylightMinutes, durationLabel, sunProgress,
  compareToYesterday, formatClock, parseLocal,
} from "../lib/weather";

const AQI_COLORS = ["#22a06b", "#d4a10a", "#e8730c", "#d93838", "#8e44ad", "#7d1d3f"];
const UV_COLORS = ["#22a06b", "#d4a10a", "#e8730c", "#d93838", "#8e44ad"];

export default function DetailsPage({ weather, yesterday, unit }) {
  const { location, current } = weather;
  const today = weather.forecast.forecastday[0];
  const tomorrow = weather.forecast.forecastday[1];
  const alerts = weather.alerts?.alert ?? [];

  return (
    <div>
      <PageHeader
        title="Details"
        subtitle={`${location.name} · conditions as of ${formatClock(current.last_updated)} local time`}
      />

      {alerts.length > 0 && <Alerts alerts={alerts} />}

      <div className="rise grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <AirQualityCard aq={current.air_quality} />
        <UvCard current={current} today={today} />
        <WindCard current={current} unit={unit} />
        <HumidityCard current={current} unit={unit} />
        <FeelsLikeCard current={current} unit={unit} />
        <PressureCard weather={weather} unit={unit} />
        <VisibilityCard current={current} unit={unit} />
        <PrecipCard current={current} today={today} unit={unit} />
        <YesterdayCard weather={weather} yesterday={yesterday} unit={unit} />
        <SunCard today={today} tomorrow={tomorrow} localtime={location.localtime} />
        <MoonCard astro={today.astro} />
        <LocationCard location={location} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DetailCard({ icon, title, value, caption, children, className = "" }) {
  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <CardHeader icon={icon} title={title} />
      {value != null && <p className="tabular mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>}
      {caption && <p className="mt-1 text-[15px] font-medium text-ink">{caption}</p>}
      {children}
    </Card>
  );
}

function Note({ children }) {
  return <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>;
}

function Alerts({ alerts }) {
  const [open, setOpen] = useState(0);
  return (
    <section aria-label="Weather alerts" className="mb-5 space-y-2">
      {alerts.map((a, i) => {
        const expanded = open === i;
        return (
          <div
            key={`${a.event}-${i}`}
            className="overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <button
              type="button"
              onClick={() => setOpen(expanded ? -1 : i)}
              aria-expanded={expanded}
              className="flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <TriangleAlert size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{a.event || a.headline}</span>
                {a.expires && (
                  <span className="text-sm opacity-75">
                    Until {new Date(a.expires).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    {a.areas ? ` · ${a.areas}` : ""}
                  </span>
                )}
              </span>
              <ChevronDown size={18} className={`mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {expanded && (
              <div className="space-y-3 px-4 pb-4 pl-12 text-sm leading-relaxed">
                {a.headline && a.headline !== a.event && <p className="font-medium">{a.headline}</p>}
                {a.desc && <p className="whitespace-pre-line opacity-90">{a.desc}</p>}
                {a.instruction && <p className="whitespace-pre-line opacity-90">{a.instruction}</p>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function AirQualityCard({ aq }) {
  const info = aqiInfo(aq?.["us-epa-index"]);
  if (!aq || !info) {
    return (
      <DetailCard icon={Leaf} title="Air quality" value="--">
        <Note>Air quality data isn't available for this location.</Note>
      </DetailCard>
    );
  }
  const pollutants = [
    ["PM2.5", aq.pm2_5],
    ["PM10", aq.pm10],
    ["Ozone", aq.o3],
    ["NO₂", aq.no2],
    ["SO₂", aq.so2],
    ["CO", aq.co],
  ];
  return (
    <DetailCard icon={Leaf} title="Air quality">
      <p className="mt-3 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink">
        <span className="h-3 w-3 rounded-full" style={{ background: info.color }} aria-hidden="true" />
        {info.label}
      </p>
      <ScaleBar colors={AQI_COLORS} position={(info.index - 0.5) / 6} label={`US EPA index ${info.index} of 6`} />
      <Note>{info.advice}</Note>
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-line pt-4">
        {pollutants.map(([label, v]) => (
          <Stat key={label} label={label} value={v == null ? "--" : Number(v).toFixed(v < 10 ? 1 : 0)} />
        ))}
      </dl>
      <p className="mt-3 text-xs text-faint">
        Pollutants in μg/m³ · US EPA index {info.index} of 6 · UK DEFRA {aq["gb-defra-index"] ?? "--"} of 10
      </p>
    </DetailCard>
  );
}

function UvCard({ current, today }) {
  const now = uvInfo(current.uv);
  const peak = uvInfo(today.day.uv);
  return (
    <DetailCard icon={SunMedium} title="UV index" value={now.value} caption={now.label}>
      <ScaleBar colors={UV_COLORS} position={Math.min(now.value, 11) / 11} label={`UV index ${now.value}`} />
      <Note>
        {now.advice} Today's peak: {peak.value} ({peak.label.toLowerCase()}).
      </Note>
    </DetailCard>
  );
}

function WindCard({ current, unit }) {
  return (
    <DetailCard icon={Wind} title="Wind">
      <div className="mt-3 flex items-center gap-5">
        <WindDial
          degree={current.wind_degree}
          dir={current.wind_dir}
          speed={speedValue(current, "wind", unit)}
          unitLabel={speedUnit(unit)}
        />
        <dl className="space-y-3">
          <Stat label="Direction" value={`From ${current.wind_dir}`} hint={`${current.wind_degree}°`} />
          <Stat label="Gusts" value={speed(current, "gust", unit)} />
        </dl>
      </div>
      <Note>
        {windDescription(current.wind_mph)} blowing from the {compassWords(current.wind_dir)}.
      </Note>
    </DetailCard>
  );
}

function HumidityCard({ current, unit }) {
  return (
    <DetailCard icon={Droplets} title="Humidity" value={`${current.humidity}%`} caption={`Air feels ${dewPointComfort(current.dewpoint_f).toLowerCase()}`}>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
        <div className="h-full rounded-full bg-rain" style={{ width: `${current.humidity}%` }} />
      </div>
      <Note>
        {`Dew point ${temp(current, "dewpoint", unit)}, the best guide to how humid it actually feels.`}
        {current.wetbulb_f != null && ` Wet-bulb temperature ${temp(current, "wetbulb", unit)}.`}
      </Note>
    </DetailCard>
  );
}

function FeelsLikeCard({ current, unit }) {
  return (
    <DetailCard icon={Thermometer} title="Feels like" value={temp(current, "feelslike", unit)}>
      <Note>
        {feelsLikeReason(current, unit)} Actual temperature: {temp(current, "temp", unit)}.
      </Note>
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3">
        <Stat label="Wind chill" value={temp(current, "windchill", unit)} />
        <Stat label="Heat index" value={temp(current, "heatindex", unit)} />
      </dl>
    </DetailCard>
  );
}

function PressureCard({ weather, unit }) {
  const trend = pressureTrend(weather);
  const TrendIcon = trend === "Rising" ? ArrowUp : trend === "Falling" ? ArrowDown : Minus;
  const meaning =
    trend === "Rising"
      ? "Rising pressure usually means settling, drier weather."
      : trend === "Falling"
        ? "Falling pressure often comes before unsettled weather."
        : "Steady pressure: little change expected.";
  return (
    <DetailCard icon={Gauge} title="Pressure" value={pressure(weather.current, unit)}>
      <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-ink">
        <TrendIcon size={16} aria-hidden="true" /> {trend}
      </p>
      <Note>{meaning}</Note>
    </DetailCard>
  );
}

function VisibilityCard({ current, unit }) {
  return (
    <DetailCard icon={Eye} title="Visibility" value={distance(current, "vis", unit)} caption={visibilityDescription(current.vis_miles)}>
      <Note>Cloud cover is {current.cloud}%.</Note>
    </DetailCard>
  );
}

function PrecipCard({ current, today, unit }) {
  const day = today.day;
  return (
    <DetailCard icon={CloudRain} title="Precipitation today" value={precip(day, "totalprecip", unit)}>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Chance of rain" value={`${day.daily_chance_of_rain}%`} />
        <Stat label="Chance of snow" value={`${day.daily_chance_of_snow}%`} />
        <Stat label="Last hour" value={precip(current, "precip", unit)} />
        <Stat label="Snowfall" value={snowfall(day.totalsnow_cm, unit)} />
      </dl>
    </DetailCard>
  );
}

function YesterdayCard({ weather, yesterday, unit }) {
  const cmp = compareToYesterday(weather, yesterday, unit);
  const today = weather.forecast.forecastday[0].day;
  if (!cmp) {
    return (
      <DetailCard icon={History} title="Compared with yesterday">
        <Note>Yesterday's observations aren't available yet.</Note>
      </DetailCard>
    );
  }
  const y = cmp.yesterday;
  const verdict =
    cmp.diff === 0 ? "Same high as yesterday" : `${Math.abs(cmp.diff)}° ${cmp.diff > 0 ? "warmer" : "cooler"} than yesterday`;
  return (
    <DetailCard icon={History} title="Compared with yesterday" caption={verdict}>
      <table className="tabular mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-[13px] text-muted">
            <th className="pb-1.5 font-normal"><span className="sr-only">Day</span></th>
            <th className="pb-1.5 font-normal">High</th>
            <th className="pb-1.5 font-normal">Low</th>
            <th className="pb-1.5 font-normal">Rain</th>
          </tr>
        </thead>
        <tbody className="text-ink">
          <tr>
            <th className="py-1 text-left font-medium">Today</th>
            <td className="font-semibold">{temp(today, "maxtemp", unit)}</td>
            <td>{temp(today, "mintemp", unit)}</td>
            <td>{precip(today, "totalprecip", unit)}</td>
          </tr>
          <tr className="text-muted">
            <th className="py-1 text-left font-medium">Yesterday</th>
            <td>{temp(y, "maxtemp", unit)}</td>
            <td>{temp(y, "mintemp", unit)}</td>
            <td>{precip(y, "totalprecip", unit)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-faint">Today is forecast; yesterday is observed.</p>
    </DetailCard>
  );
}

function SunCard({ today, tomorrow, localtime }) {
  const astro = today.astro;
  const length = daylightMinutes(astro);
  const tomorrowLength = daylightMinutes(tomorrow?.astro);
  const delta = length != null && tomorrowLength != null ? tomorrowLength - length : null;
  const progress = sunProgress(astro, localtime);
  return (
    <DetailCard icon={Sun} title="Sun">
      <div className="mt-3 flex justify-center">
        <SunArc progress={progress} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-3">
        <Stat label="Sunrise" value={tidyClock(astro.sunrise)} />
        <Stat label="Sunset" value={tidyClock(astro.sunset)} />
        <Stat label="Daylight" value={durationLabel(length)} />
      </dl>
      {delta != null && delta !== 0 && (
        <Note>
          Tomorrow brings {Math.abs(delta)} minute{Math.abs(delta) === 1 ? "" : "s"} {delta > 0 ? "more" : "less"} daylight.
        </Note>
      )}
    </DetailCard>
  );
}

function MoonCard({ astro }) {
  return (
    <DetailCard icon={Moon} title="Moon">
      <div className="mt-3 flex items-center gap-4">
        <MoonPhase illumination={astro.moon_illumination} phase={astro.moon_phase} />
        <div>
          <p className="text-[17px] font-semibold text-ink">{astro.moon_phase}</p>
          <p className="text-sm text-muted">{astro.moon_illumination}% illuminated</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <Stat label="Moonrise" value={tidyClock(astro.moonrise)} />
        <Stat label="Moonset" value={tidyClock(astro.moonset)} />
      </dl>
    </DetailCard>
  );
}

function LocationCard({ location }) {
  const p = parseLocal(location.localtime);
  return (
    <DetailCard icon={MapPin} title="Location">
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Place" value={location.name} hint={[location.region, location.country].filter(Boolean).join(", ")} />
        <Stat label="Local time" value={formatClock(location.localtime)} hint={p?.date} />
        <Stat label="Coordinates" value={`${Number(location.lat).toFixed(2)}, ${Number(location.lon).toFixed(2)}`} />
        <Stat label="Time zone" value={location.tz_id?.replace(/_/g, " ")} />
      </dl>
    </DetailCard>
  );
}
