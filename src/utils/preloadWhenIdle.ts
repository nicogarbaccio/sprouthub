// Extra wait after the window load event, so preloads don't compete for bandwidth with the
// current page's own code and data (which is often still loading when the load event fires)
const AFTER_LOAD_DELAY_MS = 2000;

/**
 * Runs lazy imports once the initial page has loaded and the browser is idle, so code
 * that's split out of the main bundle is already downloaded by the time the user needs it.
 * Returns a cleanup function that cancels the pending preload.
 */
export function preloadWhenIdle(imports: Array<() => Promise<unknown>>): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idleId: number | undefined;

  const preload = () => {
    if (cancelled) return;
    for (const importFn of imports) {
      importFn().catch(() => {}); // a failed preload is retried when the code is actually needed
    }
  };

  const scheduleWhenIdle = () => {
    timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(preload, { timeout: 3000 });
      } else {
        preload();
      }
    }, AFTER_LOAD_DELAY_MS);
  };

  if (document.readyState === "complete") {
    scheduleWhenIdle();
  } else {
    window.addEventListener("load", scheduleWhenIdle, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener("load", scheduleWhenIdle);
    clearTimeout(timer);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
  };
}
