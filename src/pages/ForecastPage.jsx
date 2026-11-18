import { Clock3, Sunrise, Sunset } from "lucide-react";
import { Card, CardHeader, PageHeader, RangeBar, Stat } from "../components/ui";
import WeatherIcon from "../components/WeatherIcon";
import HourlyChart from "../components/HourlyChart";
import {
  temp, tempValue, speed, precip, snowfall, upcomingHours, parseLocal, dayName,
  monthDay, tidyClock, uvInfo, hourPrecipChance, formatHour, durationLabel, daylightMinutes,
} from "../lib/weather";

export default function ForecastPage({ weather, unit }) {
  const { location } = weather;
  const days = weather.forecast.forecastday;
  const todayDate = parseLocal(location.localtime)?.date;
  const hours = upcomingHours(weather);
  const lows = days.map((d) => tempValue(d.day, "mintemp", unit));
  const highs = days.map((d) => tempValue(d.day, "maxtemp", unit));
  const span = { min: Math.min(...lows), max: Math.max(...highs) };

  return (
    <div>
      <PageHeader title="Forecast" subtitle={`${location.name} · hour by hour through ${dayName(days.at(-1).date, todayDate)}`} />

      <div className="space-y-4 sm:space-y-5">
        <Card className="rise p-4 sm:p-6">
          <CardHeader icon={Clock3} title="Hourly" className="mb-4" />
          <HourlyChart hours={hours} unit={unit} showWind days={days} today={todayDate} />
        </Card>

        <div className="rise grid gap-4 sm:gap-5 lg:grid-cols-3">
          {days.map((d) => (
            <DayCard key={d.date} data={d} todayDate={todayDate} unit={unit} span={span} />
          ))}
        </div>

        <p className="text-center text-xs text-faint">
          The WeatherAPI.com free plan covers today plus the next two days.
        </p>
      </div>
    </div>
  );
}

/** Highlights the wettest stretch of a day, e.g. "Rain most likely 2 PM – 6 PM". */
function wetWindow(dayData) {
  const wet = (dayData.hour ?? []).filter((h) => hourPrecipChance(h) >= 40);
  if (!wet.length) return null;
  const first = formatHour(wet[0].time);
  const last = formatHour(wet.at(-1).time);
  return first === last ? `around ${first}` : `${first} – ${last}`;
}

function DayCard({ data, todayDate, unit, span }) {
  const { day, astro, date } = data;
  const lo = tempValue(day, "mintemp", unit);
  const hi = tempValue(day, "maxtemp", unit);
  const snowy = day.daily_chance_of_snow > day.daily_chance_of_rain || day.totalsnow_cm > 0;
  const chance = snowy ? day.daily_chance_of_snow : day.daily_chance_of_rain;
  const window = wetWindow(data);
  const uv = uvInfo(day.uv);

  return (
    <Card as="article" className="flex flex-col p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{dayName(date, todayDate)}</h2>
          <p className="text-sm text-muted">{monthDay(date)}</p>
        </div>
        <WeatherIcon condition={day.condition} size={40} />
      </header>

      <p className="mt-3 font-medium text-ink">{day.condition.text}</p>

      <div className="tabular mt-3 flex items-center gap-3 text-sm">
        <span className="text-muted">{lo}°</span>
        <RangeBar lo={lo} hi={hi} min={span.min} max={span.max} className="flex-1" />
        <span className="font-semibold text-ink">{hi}°</span>
      </div>

      <div className="mt-4 rounded-xl bg-subtle px-3.5 py-3 text-sm">
        <p className="font-medium text-ink">
          <span className={chance >= 30 ? "text-rain" : ""}>{chance}%</span> chance of {snowy ? "snow" : "rain"}
        </p>
        <p className="text-muted">
          {window ? `Most likely ${window}` : chance >= 20 ? "Possible, but scattered" : "Expected to stay dry"}
          {Number(day.totalprecip_mm) > 0 && ` · ${precip(day, "totalprecip", unit)} expected`}
          {Number(day.totalsnow_cm) > 0 && ` · ${snowfall(day.totalsnow_cm, unit)} snow`}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Average" value={temp(day, "avgtemp", unit)} />
        <Stat label="Max wind" value={speed(day, "maxwind", unit)} />
        <Stat label="Humidity" value={`${day.avghumidity}%`} />
        <Stat label="UV index" value={`${uv.value} · ${uv.label}`} />
      </dl>

      <div className="mt-auto pt-4">
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Sunrise size={15} className="text-warm" aria-hidden="true" />
          <span className="tabular">{tidyClock(astro.sunrise)}</span>
        </span>
        <span className="text-xs text-faint">{durationLabel(daylightMinutes(astro))} daylight</span>
        <span className="flex items-center gap-1.5">
          <Sunset size={15} className="text-warm" aria-hidden="true" />
          <span className="tabular">{tidyClock(astro.sunset)}</span>
        </span>
      </div>
      </div>
    </Card>
  );
}
