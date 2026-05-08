import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet';
import { Layers, LocateFixed, RefreshCw, Radar, RadioTower, SlidersHorizontal } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const WMS_ENDPOINT = 'https://opengeo.ncep.noaa.gov/geoserver/ows';

const REGIONS = [
  {
    id: 'conus',
    label: 'Lower 48',
    shortLabel: 'CONUS',
    center: [39.2, -97.5],
    zoom: 4,
    bounds: [[23.5, -125], [50.5, -66]],
    layers: {
      base: 'conus:conus_bref_qcd',
      composite: 'conus:conus_cref_qcd',
    },
  },
  {
    id: 'alaska',
    label: 'Alaska',
    shortLabel: 'AK',
    center: [63.3, -152],
    zoom: 4,
    bounds: [[50, -176], [72, -126]],
    layers: {
      base: 'alaska:alaska_bref_qcd',
      composite: 'alaska:alaska_cref_qcd',
    },
  },
  {
    id: 'hawaii',
    label: 'Hawaii',
    shortLabel: 'HI',
    center: [20.8, -157.5],
    zoom: 7,
    bounds: [[18.8, -161.2], [22.4, -154.6]],
    layers: {
      base: 'hawaii:hawaii_bref_qcd',
      composite: 'hawaii:hawaii_cref_qcd',
    },
  },
  {
    id: 'carib',
    label: 'Puerto Rico / USVI',
    shortLabel: 'PR/VI',
    center: [18.2, -66.2],
    zoom: 7,
    bounds: [[16.4, -68.4], [19.4, -64.3]],
    layers: {
      base: 'carib:carib_bref_qcd',
      composite: 'carib:carib_cref_qcd',
    },
  },
  {
    id: 'guam',
    label: 'Guam',
    shortLabel: 'GU',
    center: [13.45, 144.78],
    zoom: 8,
    bounds: [[12.6, 143.8], [14.3, 145.8]],
    layers: {
      base: 'guam:guam_bref_qcd',
      composite: 'guam:guam_cref_qcd',
    },
  },
];

const RADAR_PRODUCTS = [
  {
    id: 'base',
    label: 'Base Reflectivity',
    description: 'Lowest radar tilt; best for seeing near-surface precipitation structure.',
  },
  {
    id: 'composite',
    label: 'Composite Reflectivity',
    description: 'Strongest return in the column; useful for storm cores and broader coverage.',
  },
];

function FitRegionBounds({ region }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(region.bounds, { padding: [18, 18], animate: true });
  }, [map, region]);

  return null;
}

function USRadar({ weather }) {
  const [regionId, setRegionId] = useState('conus');
  const [productId, setProductId] = useState('base');
  const [opacity, setOpacity] = useState(0.72);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const region = useMemo(
    () => REGIONS.find((item) => item.id === regionId) ?? REGIONS[0],
    [regionId]
  );
  const product = RADAR_PRODUCTS.find((item) => item.id === productId) ?? RADAR_PRODUCTS[0];
  const layerName = region.layers[productId] ?? region.layers.base;
  const searchedCountry = weather?.location?.country;
  const isSearchedLocationUs = searchedCountry === 'United States of America';
  const lastUpdated = new Date(refreshKey).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const legendUrl = `${WMS_ENDPOINT}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&width=500&height=30&layer=${encodeURIComponent(layerName)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radar size={16} className="text-ch-cyan" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              U.S. Radar
            </h2>
            <span className="live-dot bg-ch-emerald shadow-glow-emerald" />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Live NOAA/NCEP MRMS radar for the United States, with regional coverage for the lower 48,
            Alaska, Hawaii, Puerto Rico/USVI, and Guam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass-panel-flush rounded-lg px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Last refresh <span className="text-slate-300">{lastUpdated}</span>
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

      {!isSearchedLocationUs && searchedCountry && (
        <div className="glass-panel border-l-2 border-l-ch-amber p-4 flex items-start gap-3">
          <LocateFixed size={16} className="text-ch-amber flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono font-bold text-ch-amber mb-1">U.S. COVERAGE ONLY</p>
            <p className="text-xs text-slate-400">
              Your searched location is in {searchedCountry}. This radar view is limited to NOAA/NWS
              United States radar regions.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <LocateFixed size={14} className="text-ch-cyan" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Region
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
              {REGIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRegionId(item.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    regionId === item.id
                      ? 'border-ch-cyan bg-ch-cyan/10 text-ch-cyan shadow-glow-cyan'
                      : 'border-cockpit-border bg-cockpit-panel/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    {item.shortLabel}
                  </span>
                  <span className="block text-xs font-mono font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-ch-magenta" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Radar Product
              </h3>
            </div>
            <div className="space-y-2">
              {RADAR_PRODUCTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProductId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    productId === item.id
                      ? 'border-ch-magenta bg-ch-magenta/10 text-ch-magenta shadow-glow-magenta'
                      : 'border-cockpit-border bg-cockpit-panel/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-xs font-mono font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={14} className="text-ch-emerald" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Overlay
              </h3>
            </div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
              Radar opacity <span className="text-slate-300">{Math.round(opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="35"
              max="100"
              value={Math.round(opacity * 100)}
              onChange={(event) => setOpacity(Number(event.target.value) / 100)}
              className="w-full accent-cyan-400"
            />
            <div className="mt-4 overflow-hidden rounded-md border border-cockpit-border bg-cockpit-deep/70 p-2">
              <img src={legendUrl} alt={`${product.label} legend`} className="h-5 w-full object-fill opacity-90" />
            </div>
          </section>
        </aside>

        <section className="glass-panel overflow-hidden p-2 scanlines">
          <div className="relative h-[68vh] min-h-[520px] overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-deep">
            <MapContainer
              key={region.id}
              center={region.center}
              zoom={region.zoom}
              minZoom={3}
              maxZoom={10}
              scrollWheelZoom
              className="h-full w-full bg-cockpit-deep"
            >
              <FitRegionBounds region={region} />
              <TileLayer
                attribution='Map tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.42}
              />
              <WMSTileLayer
                key={`${layerName}-${refreshKey}`}
                url={WMS_ENDPOINT}
                layers={layerName}
                styles="radar_reflectivity"
                format="image/png"
                transparent
                version="1.3.0"
                opacity={opacity}
                zIndex={20}
                updateWhenIdle
                cacheBust={refreshKey}
              />
            </MapContainer>

            <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-cockpit-border bg-slate-950/80 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <RadioTower size={12} className="text-ch-emerald" />
                NOAA / NCEP MRMS
              </div>
              <p className="mt-1 text-sm font-mono font-semibold text-slate-100">{region.label}</p>
              <p className="text-[11px] text-slate-400">{product.label}</p>
            </div>
          </div>
        </section>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500 font-mono">
        Radar imagery is provided by NOAA/NWS/NCEP MRMS through public WMS services. Use for planning and
        situational awareness; always follow official alerts and local emergency guidance during severe weather.
      </p>
    </div>
  );
}

export default USRadar;
