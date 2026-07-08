import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { CloudRain, Gauge, Layers, RefreshCw, Thermometer, Wind } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const MAP_PRODUCTS = [
  {
    id: 'precip',
    label: 'Precipitation',
    shortLabel: 'Precip',
    icon: CloudRain,
    accent: 'text-ch-magenta',
    description: 'Rain and snow bands',
  },
  {
    id: 'tmp2m',
    label: 'Temperature',
    shortLabel: 'Temp',
    icon: Thermometer,
    accent: 'text-ch-amber',
    description: '2 m air temperature',
  },
  {
    id: 'wind',
    label: 'Wind Speed',
    shortLabel: 'Wind',
    icon: Wind,
    accent: 'text-ch-cyan',
    description: 'Forecast wind field',
  },
  {
    id: 'pressure',
    label: 'Pressure',
    shortLabel: 'Pressure',
    icon: Gauge,
    accent: 'text-slate-300',
    description: 'Surface pressure pattern',
  },
];

const TIME_OFFSETS = [0, 3, 6, 12, 24, 36, 48, 60, 72];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getUtcTileStamp(offsetHours) {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  date.setUTCMinutes(0, 0, 0);

  const day = [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join('');

  return {
    path: `${day}${pad2(date.getUTCHours())}`,
    label: date.toLocaleString([], {
      weekday: 'short',
      hour: 'numeric',
      hour12: true,
      timeZoneName: 'short',
    }),
  };
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 6, { animate: true });
  }, [center, map]);

  return null;
}

function WeatherMaps({ weather }) {
  const [productId, setProductId] = useState('precip');
  const [offsetHours, setOffsetHours] = useState(0);
  const [opacity, setOpacity] = useState(78);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const center = useMemo(() => {
    const lat = Number(weather?.location?.lat);
    const lon = Number(weather?.location?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
    return [39.2, -97.5];
  }, [weather]);

  const product = MAP_PRODUCTS.find((item) => item.id === productId) ?? MAP_PRODUCTS[0];
  const stamp = getUtcTileStamp(offsetHours);
  const tileUrl = `https://weathermaps.weatherapi.com/${product.id}/tiles/${stamp.path}/{z}/{x}/{y}.png`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-ch-cyan" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              WeatherAPI Maps
            </h2>
            <span className="live-dot bg-ch-emerald shadow-glow-emerald" />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Forecast map overlays centered on {weather.location.name}, including precipitation,
            temperature, pressure, and wind.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass-panel-flush rounded-lg px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Tile time <span className="text-slate-300">{stamp.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey(Date.now())}
            className="cockpit-btn rounded-lg px-3 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-2"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-ch-cyan" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Overlay
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
              {MAP_PRODUCTS.map((item) => {
                const Icon = item.icon;
                const isActive = productId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProductId(item.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      isActive
                        ? 'border-ch-cyan bg-ch-cyan/10 text-ch-cyan shadow-glow-cyan'
                        : 'border-cockpit-border bg-cockpit-panel/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider">
                      <Icon size={13} className={isActive ? 'text-ch-cyan' : item.accent} />
                      {item.shortLabel}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={14} className="text-ch-magenta" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Forecast Hour
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OFFSETS.map((offset) => {
                const isActive = offsetHours === offset;
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => setOffsetHours(offset)}
                    className={`rounded-md border px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-all ${
                      isActive
                        ? 'border-ch-magenta bg-ch-magenta/10 text-ch-magenta'
                        : 'border-cockpit-border bg-cockpit-panel/40 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {offset === 0 ? 'Now' : `+${offset}h`}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass-panel p-4">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
              Overlay opacity <span className="text-slate-300">{opacity}%</span>
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Map tiles are provided by WeatherAPI.com and are free to use without an API key.
            </p>
          </section>
        </aside>

        <section className="glass-panel overflow-hidden p-2 scanlines">
          <div className="relative h-[68vh] min-h-[520px] overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-deep">
            <MapContainer
              center={center}
              zoom={6}
              minZoom={2}
              maxZoom={10}
              scrollWheelZoom
              className="h-full w-full bg-cockpit-deep"
            >
              <RecenterMap center={center} />
              <TileLayer
                attribution='Map tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.46}
              />
              <TileLayer
                key={`${product.id}-${stamp.path}-${refreshKey}`}
                attribution='Weather overlay &copy; <a href="https://www.weatherapi.com/">WeatherAPI.com</a>'
                url={tileUrl}
                opacity={opacity / 100}
                zIndex={30}
              />
            </MapContainer>

            <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-cockpit-border bg-slate-950/80 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <product.icon size={12} className={product.accent} />
                WeatherAPI overlay
              </div>
              <p className="mt-1 text-sm font-mono font-semibold text-slate-100">{product.label}</p>
              <p className="text-[11px] text-slate-400">{stamp.label}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WeatherMaps;
