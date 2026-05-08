import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet';
import { AlertTriangle, Layers, LocateFixed, RefreshCw, Radar, RadioTower, SlidersHorizontal } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const WMS_ENDPOINT = 'https://opengeo.ncep.noaa.gov/geoserver/ows';
const ACTIVE_ALERTS_ENDPOINT = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert';

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

const ALERT_SEVERITY_RANK = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

const ALERT_EVENT_COLORS = [
  { match: /tornado/i, color: '#ef4444' },
  { match: /severe thunderstorm/i, color: '#f97316' },
  { match: /flash flood/i, color: '#22d3ee' },
  { match: /flood/i, color: '#38bdf8' },
  { match: /winter|snow|ice|blizzard/i, color: '#60a5fa' },
  { match: /fire|red flag/i, color: '#fb7185' },
  { match: /heat/i, color: '#f59e0b' },
  { match: /wind/i, color: '#a78bfa' },
];

const ALERT_SEVERITY_COLORS = {
  Extreme: '#dc2626',
  Severe: '#f97316',
  Moderate: '#fbbf24',
  Minor: '#22d3ee',
  Unknown: '#94a3b8',
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAlertDate(value) {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getAlertColor(properties = {}) {
  const event = properties.event ?? '';
  const eventMatch = ALERT_EVENT_COLORS.find(({ match }) => match.test(event));
  return eventMatch?.color ?? ALERT_SEVERITY_COLORS[properties.severity] ?? ALERT_SEVERITY_COLORS.Unknown;
}

function getAlertStyle(feature) {
  const color = getAlertColor(feature?.properties);
  const severity = feature?.properties?.severity;

  return {
    color,
    fillColor: color,
    fillOpacity: severity === 'Extreme' || severity === 'Severe' ? 0.18 : 0.1,
    opacity: 0.95,
    weight: severity === 'Extreme' || severity === 'Severe' ? 3 : 2,
    dashArray: severity === 'Minor' || severity === 'Unknown' ? '5 4' : undefined,
  };
}

function bindAlertPopup(feature, layer) {
  const properties = feature?.properties ?? {};
  const color = getAlertColor(properties);
  const description = properties.description
    ? `${properties.description.slice(0, 420)}${properties.description.length > 420 ? '…' : ''}`
    : 'No additional alert details are available.';

  layer.bindPopup(`
    <div style="min-width:240px;max-width:320px;color:#0f172a;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="width:10px;height:10px;border-radius:999px;background:${color};display:inline-block;"></span>
        <strong style="font-size:14px;line-height:1.2;">${escapeHtml(properties.event ?? 'NWS Alert')}</strong>
      </div>
      <div style="font-size:12px;line-height:1.35;margin-bottom:8px;color:#475569;">
        ${escapeHtml(properties.areaDesc ?? 'Affected area unavailable')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;font-size:11px;">
        <span><strong>Severity:</strong> ${escapeHtml(properties.severity ?? 'Unknown')}</span>
        <span><strong>Urgency:</strong> ${escapeHtml(properties.urgency ?? 'Unknown')}</span>
        <span><strong>Expires:</strong> ${escapeHtml(formatAlertDate(properties.expires))}</span>
        <span><strong>Source:</strong> ${escapeHtml(properties.senderName ?? 'NWS')}</span>
      </div>
      <p style="white-space:pre-line;font-size:12px;line-height:1.35;margin:0;color:#334155;">
        ${escapeHtml(description)}
      </p>
    </div>
  `);
}

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
  const [showAlerts, setShowAlerts] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState(null);
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(null);

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
  const alertsLastUpdated = alertsRefreshKey
    ? new Date(alertsRefreshKey).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Not loaded';
  const alertFeatureCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: alerts }),
    [alerts]
  );
  const alertSummary = useMemo(() => {
    const counts = alerts.reduce((acc, feature) => {
      const severity = feature?.properties?.severity ?? 'Unknown';
      acc[severity] = (acc[severity] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort(([a], [b]) => (ALERT_SEVERITY_RANK[a] ?? 9) - (ALERT_SEVERITY_RANK[b] ?? 9))
      .map(([severity, count]) => ({ severity, count }));
  }, [alerts]);
  const topAlerts = useMemo(
    () => [...alerts]
      .sort((a, b) => {
        const rankA = ALERT_SEVERITY_RANK[a?.properties?.severity] ?? 9;
        const rankB = ALERT_SEVERITY_RANK[b?.properties?.severity] ?? 9;
        if (rankA !== rankB) return rankA - rankB;
        return new Date(a?.properties?.expires ?? 0) - new Date(b?.properties?.expires ?? 0);
      })
      .slice(0, 4),
    [alerts]
  );

  const loadAlerts = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    setAlertsLoading(true);
    setAlertsError(null);

    try {
      const response = await fetch(ACTIVE_ALERTS_ENDPOINT, {
        headers: { Accept: 'application/geo+json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`NWS alerts request failed (${response.status})`);
      }

      const data = await response.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      const polygonFeatures = features.filter((feature) => {
        const properties = feature?.properties ?? {};
        return (
          feature?.geometry &&
          properties.status === 'Actual' &&
          properties.messageType === 'Alert' &&
          !/test/i.test(properties.event ?? '')
        );
      });

      setAlerts(polygonFeatures);
      setAlertsRefreshKey(Date.now());
    } catch (error) {
      setAlertsError(error.name === 'AbortError' ? 'NWS alerts request timed out.' : error.message);
    } finally {
      window.clearTimeout(timeoutId);
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAlerts) return undefined;

    loadAlerts();
    const refreshId = window.setInterval(loadAlerts, 5 * 60 * 1000);

    return () => window.clearInterval(refreshId);
  }, [loadAlerts, showAlerts]);

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

          <section className="glass-panel p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-ch-amber" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                  Warned Areas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAlerts((current) => !current)}
                className={`rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
                  showAlerts
                    ? 'border-ch-amber bg-ch-amber/10 text-ch-amber'
                    : 'border-cockpit-border bg-cockpit-panel/50 text-slate-500 hover:text-slate-300'
                }`}
              >
                {showAlerts ? 'On' : 'Off'}
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Active NWS alert polygons overlay the radar, colored by warning type and severity.
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Updated <span className="text-slate-300">{alertsLastUpdated}</span>
              </span>
              <button
                type="button"
                onClick={loadAlerts}
                disabled={alertsLoading}
                className="cockpit-btn rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-wider disabled:opacity-50"
              >
                {alertsLoading ? 'Loading' : 'Refresh'}
              </button>
            </div>

            {alertsError && (
              <p className="mt-3 rounded-md border border-ch-red/30 bg-ch-red/10 px-3 py-2 text-[11px] text-ch-red">
                {alertsError}
              </p>
            )}

            {showAlerts && !alertsError && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {alertSummary.length > 0 ? alertSummary.map(({ severity, count }) => (
                    <span
                      key={severity}
                      className="rounded-full border border-cockpit-border bg-cockpit-panel/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300"
                    >
                      <span style={{ color: ALERT_SEVERITY_COLORS[severity] ?? ALERT_SEVERITY_COLORS.Unknown }}>
                        {severity}
                      </span>{' '}
                      {count}
                    </span>
                  )) : (
                    <span className="text-[11px] text-slate-500">No polygon warnings active right now.</span>
                  )}
                </div>

                {topAlerts.length > 0 && (
                  <div className="space-y-2">
                    {topAlerts.map((feature) => {
                      const properties = feature.properties ?? {};
                      return (
                        <div key={properties.id} className="rounded-lg border border-cockpit-border bg-cockpit-panel/30 p-2">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: getAlertColor(properties) }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                                {properties.event}
                              </p>
                              <p className="truncate text-[10px] text-slate-500">
                                {properties.areaDesc}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
              {showAlerts && alerts.length > 0 && (
                <GeoJSON
                  key={`alerts-${alertsRefreshKey ?? 'initial'}`}
                  data={alertFeatureCollection}
                  style={getAlertStyle}
                  onEachFeature={bindAlertPopup}
                />
              )}
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
