import { useCallback, useEffect, useRef, useState } from "react";
import { fetchForecastWeather, fetchHistoryWeather } from "../services/weatherApi";
import { parseLocal, previousDate } from "../lib/weather";

const REFRESH_MS = 15 * 60 * 1000;

export function formatLocationLabel(location) {
  if (!location?.name) return "";
  const parts = [location.name, location.region, location.country].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

/**
 * Owns the loaded location's forecast (+ yesterday, for comparisons).
 * Refreshes silently every 15 minutes and when the tab becomes visible again
 * after being stale.
 */
export function useWeather({ onLoaded } = {}) {
  const [weather, setWeather] = useState(null);
  const [yesterday, setYesterday] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const queryRef = useRef(null);
  const fetchedAtRef = useRef(0);
  const requestRef = useRef(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const loadYesterday = useCallback(async (data, signal) => {
    const today = parseLocal(data?.location?.localtime)?.date;
    if (!today) return;
    try {
      const { lat, lon } = data.location;
      const hist = await fetchHistoryWeather(`${lat},${lon}`, previousDate(today), { signal });
      setYesterday(hist);
    } catch {
      // Non-essential: comparisons just won't show.
    }
  }, []);

  const load = useCallback(
    async (query, { label, silent = false } = {}) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      if (!silent) {
        setStatus("loading");
        setError(null);
      }
      try {
        const data = await fetchForecastWeather(query, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const locationChanged = queryRef.current !== query;
        queryRef.current = query;
        fetchedAtRef.current = Date.now();
        setWeather(data);
        setStatus("ready");
        if (locationChanged) {
          setYesterday(null);
          loadYesterday(data, controller.signal);
        }
        if (!silent) {
          // "auto:ip" isn't stable across networks; remember the resolved coordinates instead.
          const stableQuery = query === "auto:ip" ? `${data.location.lat},${data.location.lon}` : query;
          onLoadedRef.current?.(data, label || formatLocationLabel(data.location) || query, stableQuery);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (silent) return; // keep showing the last good data
        setError(err.message || "Could not load the weather.");
        setStatus("error");
      }
    },
    [loadYesterday]
  );

  const refresh = useCallback(() => {
    if (queryRef.current) load(queryRef.current, { silent: true });
  }, [load]);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - fetchedAtRef.current > REFRESH_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      requestRef.current?.abort();
    };
  }, [refresh]);

  return { weather, yesterday, status, error, load, clearError: () => setError(null) };
}
