import React, { useMemo } from 'react';

function classify(condition) {
  const text = (condition?.text ?? '').toLowerCase();
  if (/thunder|storm/.test(text)) return 'storm';
  if (/snow|sleet|blizzard|ice/.test(text)) return 'snow';
  if (/rain|drizzle|shower/.test(text)) return 'rain';
  if (/fog|mist|haze/.test(text)) return 'fog';
  if (/sun|clear/.test(text)) return 'clear';
  if (/cloud|overcast/.test(text)) return 'cloud';
  return 'cloud';
}

const RAIN_DROPS = Array.from({ length: 60 });
const SNOW_FLAKES = Array.from({ length: 45 });
const STARS = Array.from({ length: 70 });
const CLOUDS = Array.from({ length: 5 });

const Rain = () => (
  <div className="weather-bg-layer">
    {RAIN_DROPS.map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 0.6 + Math.random() * 0.6;
      const opacity = 0.25 + Math.random() * 0.45;
      return (
        <span
          key={i}
          className="rain-drop"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            opacity,
          }}
        />
      );
    })}
  </div>
);

const Snow = () => (
  <div className="weather-bg-layer">
    {SNOW_FLAKES.map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 8 + Math.random() * 10;
      const size = 4 + Math.random() * 5;
      const drift = -20 + Math.random() * 40;
      return (
        <span
          key={i}
          className="snow-flake"
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            '--drift': `${drift}px`,
          }}
        />
      );
    })}
  </div>
);

const Stars = () => (
  <div className="weather-bg-layer">
    {STARS.map((_, i) => {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 4;
      const duration = 2 + Math.random() * 4;
      const size = 1 + Math.random() * 2;
      return (
        <span
          key={i}
          className="star"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        />
      );
    })}
  </div>
);

const Clouds = () => (
  <div className="weather-bg-layer">
    {CLOUDS.map((_, i) => {
      const top = 5 + Math.random() * 50;
      const delay = Math.random() * -60;
      const duration = 70 + Math.random() * 80;
      const scale = 0.6 + Math.random() * 0.8;
      const opacity = 0.06 + Math.random() * 0.08;
      return (
        <span
          key={i}
          className="cloud"
          style={{
            top: `${top}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            transform: `scale(${scale})`,
            opacity,
          }}
        />
      );
    })}
  </div>
);

const SunRays = () => (
  <div className="weather-bg-layer">
    <div className="sun-glow" />
    <div className="sun-rays" />
  </div>
);

const Lightning = () => (
  <div className="weather-bg-layer lightning" aria-hidden="true" />
);

const WeatherBackground = ({ weather }) => {
  const kind = classify(weather?.current?.condition);
  const isDay = weather?.current?.is_day === 1;
  const themeMode = useMemo(() => {
    if (!weather) return 'idle';
    return isDay ? 'day' : 'night';
  }, [weather, isDay]);

  return (
    <div
      className={`weather-bg pointer-events-none fixed inset-0 z-0 overflow-hidden weather-bg-${kind} weather-bg-${themeMode}`}
      aria-hidden="true"
    >
      <div className="weather-bg-tint" />
      {kind === 'clear' && isDay && <SunRays />}
      {kind === 'clear' && !isDay && <Stars />}
      {kind === 'cloud' && <Clouds />}
      {kind === 'fog' && <Clouds />}
      {kind === 'rain' && (
        <>
          <Clouds />
          <Rain />
        </>
      )}
      {kind === 'snow' && (
        <>
          <Clouds />
          <Snow />
        </>
      )}
      {kind === 'storm' && (
        <>
          <Clouds />
          <Rain />
          <Lightning />
        </>
      )}
    </div>
  );
};

export default WeatherBackground;
