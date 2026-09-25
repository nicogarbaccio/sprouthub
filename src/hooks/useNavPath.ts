import { useSyncExternalStore } from "react";

/**
 * The path in the address bar, for highlighting the current nav item.
 *
 * The router navigates inside startTransition, so useLocation() keeps returning the old path
 * until the next page's code has loaded. Nav highlighted from it stays on the previous item
 * after a click, which reads as the highlight flickering back. The URL itself changes the
 * moment you navigate (the router pushes history synchronously), so the nav follows that.
 */

const URL_CHANGE_EVENT = "sprouthub:urlchange";

let patched = false;

/** Announce pushState/replaceState, which don't fire any event of their own */
function patchHistory() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    };
  }
}

function subscribe(onChange: () => void) {
  patchHistory();
  window.addEventListener(URL_CHANGE_EVENT, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(URL_CHANGE_EVENT, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getPathname = () => window.location.pathname;

export function useNavPath(): string {
  return useSyncExternalStore(subscribe, getPathname, () => "/");
}

/** Whether a nav item for `to` should be highlighted at `path` */
export function isNavActive(path: string, to: string): boolean {
  return to === "/" ? path === "/" : path.startsWith(to);
}
