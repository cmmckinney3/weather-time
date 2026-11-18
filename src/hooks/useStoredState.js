import { useCallback, useState } from "react";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      // Older builds stored some values as bare strings (e.g. weather_last_city).
      return raw;
    }
  } catch {
    return fallback;
  }
}

/** useState that persists to localStorage. Storage failures are ignored. */
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          if (resolved == null) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Private mode / blocked storage: keep working in memory.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
}
