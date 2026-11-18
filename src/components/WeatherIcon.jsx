import {
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudHail, CloudSnow, CloudLightning,
} from "lucide-react";
import { conditionKind } from "../lib/weather";

const ICONS = {
  clear: [Sun, Moon],
  partly: [CloudSun, CloudMoon],
  cloudy: [Cloud, Cloud],
  fog: [CloudFog, CloudFog],
  drizzle: [CloudDrizzle, CloudDrizzle],
  rain: [CloudRain, CloudRain],
  sleet: [CloudHail, CloudHail],
  snow: [CloudSnow, CloudSnow],
  storm: [CloudLightning, CloudLightning],
};

// Colors chosen to read on both light and dark surfaces.
const COLORS = {
  clear: ["text-warm", "text-cool"],
  partly: ["text-warm", "text-cool"],
  cloudy: ["text-faint", "text-faint"],
  fog: ["text-faint", "text-faint"],
  drizzle: ["text-rain", "text-rain"],
  rain: ["text-rain", "text-rain"],
  sleet: ["text-sky-500", "text-sky-400"],
  snow: ["text-sky-500", "text-sky-400"],
  storm: ["text-violet-500", "text-violet-400"],
};

/**
 * Condition icon. `plain` renders in currentColor (used on the hero gradient).
 * isDay accepts WeatherAPI's 1/0 or a boolean.
 */
export default function WeatherIcon({ condition, isDay = true, size = 24, plain = false, className = "" }) {
  const kind = conditionKind(condition);
  const day = isDay === true || Number(isDay) === 1;
  const Icon = ICONS[kind][day ? 0 : 1];
  const color = plain ? "" : COLORS[kind][day ? 0 : 1];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={`${color} ${className}`}
      aria-label={condition?.text}
      role="img"
    />
  );
}
