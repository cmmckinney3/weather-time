// Minimal pathname router: three static routes don't justify a dependency.
// Firebase hosting rewrites every path to index.html, and Vite's dev server
// does the same, so deep links like /forecast work on reload.
import { useSyncExternalStore } from "react";

const NAV_EVENT = "app:navigate";

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

const getPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => "/");
}

export function navigate(to) {
  if (to === getPath()) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo({ top: 0 });
}

/** <a> that navigates client-side but still works as a normal link (new tab, copy URL). */
export function Link({ to, onClick, ...props }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...props}
    />
  );
}
