import { useEffect, useId, useRef, useState } from "react";
import { Search, MapPin, LocateFixed, Star, Clock, X, LoaderCircle } from "lucide-react";
import { searchLocations } from "../services/weatherApi";
import { formatLocationLabel } from "../hooks/useWeather";
import WeatherIcon from "./WeatherIcon";

/**
 * Location combobox. With an empty box it offers "use my location",
 * favorites and recent searches; once you type it shows suggestions.
 *
 * Saved places are { label, query } objects.
 */
export default function LocationSearch({
  favorites,
  recents,
  favoriteWeather,
  unit,
  onSelect,
  onLocate,
  onRemoveRecent,
  busy,
  size = "md",
  autoFocus = false,
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  // Debounced autocomplete
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const data = await searchLocations(q, { signal: controller.signal });
        setResults(data);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [text]);

  // Close when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const typing = text.trim().length >= 2;
  const options = typing
    ? (results ?? []).map((r) => ({
        kind: "result",
        key: `r-${r.id}`,
        label: formatLocationLabel(r),
        query: r.id ? `id:${r.id}` : formatLocationLabel(r),
        primary: r.name,
        secondary: [r.region, r.country].filter(Boolean).join(", "),
      }))
    : [
        { kind: "locate", key: "locate", primary: "Use my current location" },
        ...favorites.map((f) => ({ kind: "favorite", key: `f-${f.label}`, ...f, primary: f.label })),
        ...recents
          .filter((r) => !favorites.some((f) => f.label.toLowerCase() === r.label.toLowerCase()))
          .map((r) => ({ kind: "recent", key: `h-${r.label}`, ...r, primary: r.label })),
      ];

  const choose = (opt) => {
    setOpen(false);
    setText("");
    setActive(-1);
    inputRef.current?.blur();
    if (opt.kind === "locate") onLocate();
    else onSelect(opt.query, opt.label);
  };

  const submitFreeText = () => {
    const q = text.trim();
    if (!q) return;
    if (typing && results?.length) choose(options[0]);
    else choose({ kind: "text", query: q, label: undefined });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && options[active]) choose(options[active]);
      else submitFreeText();
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const large = size === "lg";
  const showList = open && (options.length > 0 || (typing && results !== null));

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <Search
          size={large ? 20 : 17}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint ${large ? "left-4" : "left-3"}`}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label="Search for a city, ZIP code, or place"
          placeholder={large ? "Search a city, ZIP code, or place" : "Search location"}
          autoComplete="off"
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-xl border border-line bg-surface text-ink placeholder:text-faint transition-shadow focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden ${
            large ? "py-3.5 pl-12 pr-12 text-base shadow-card" : "py-2 pl-9 pr-9 text-sm bg-subtle border-transparent focus:bg-surface"
          }`}
        />
        {(searching || busy) && (
          <LoaderCircle
            size={large ? 20 : 16}
            className={`absolute top-1/2 -translate-y-1/2 animate-spin text-faint ${large ? "right-4" : "right-3"}`}
            aria-label="Loading"
          />
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Locations"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,26rem)] overflow-y-auto rounded-xl border border-line bg-surface py-1.5 shadow-lg"
        >
          {typing && results !== null && options.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">
              No places match “{text.trim()}”. Press Enter to search anyway.
            </li>
          )}
          {options.map((opt, i) => {
            const prev = options[i - 1];
            const heading =
              opt.kind !== prev?.kind && (opt.kind === "favorite" ? "Favorites" : opt.kind === "recent" ? "Recent" : null);
            const fw = opt.kind === "favorite" ? favoriteWeather[opt.label] : null;
            return (
              <li key={opt.key} role="presentation">
                {heading && (
                  <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-faint">{heading}</div>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                  onMouseEnter={() => setActive(i)}
                  className={`group flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm ${
                    active === i ? "bg-subtle" : ""
                  }`}
                >
                  <OptionIcon kind={opt.kind} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className={opt.kind === "locate" ? "font-medium text-accent" : "text-ink"}>{opt.primary}</span>
                    {opt.secondary && <span className="ml-2 text-faint">{opt.secondary}</span>}
                  </span>
                  {fw && !fw.error && (
                    <span className="tabular flex items-center gap-1.5 text-muted">
                      <WeatherIcon condition={fw.condition} isDay={fw.is_day} size={16} />
                      {Math.round(unit === "F" ? fw.temp_f : fw.temp_c)}°
                    </span>
                  )}
                  {opt.kind === "recent" && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecent(opt.label);
                      }}
                      aria-label={`Remove ${opt.label} from recent searches`}
                      className="rounded p-1 text-faint opacity-0 hover:text-ink focus:opacity-100 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OptionIcon({ kind }) {
  const cls = "shrink-0";
  if (kind === "locate") return <LocateFixed size={16} className={`${cls} text-accent`} aria-hidden="true" />;
  if (kind === "favorite") return <Star size={16} className={`${cls} text-warm`} fill="currentColor" aria-hidden="true" />;
  if (kind === "recent") return <Clock size={16} className={`${cls} text-faint`} aria-hidden="true" />;
  return <MapPin size={16} className={`${cls} text-faint`} aria-hidden="true" />;
}
