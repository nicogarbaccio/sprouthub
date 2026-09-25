/**
 * Service worker registration and updates.
 *
 * A deploy reaches people through the service worker: once a new one takes control the page
 * needs one reload to run the new code. This module makes that happen soon, and at a moment
 * that won't lose anyone's work:
 *
 * - It checks for a new version whenever the app comes back into view, and every 30 minutes,
 *   instead of only on full page loads (the browser's default), so a tab left open or the
 *   installed app on a phone doesn't sit on an old version.
 * - When a new version has taken over, it reloads on the next in-app navigation, or straight
 *   away if the page is in the background. Never in the middle of what someone is doing.
 *
 * The worker at /sw.js is also OneSignal's (it imports OneSignal's script; see src/sw.ts), and
 * OneSignal registers it with query parameters of its own. Registering plain "/sw.js" on top
 * would count as a different script and swap workers again, so an existing /sw.js
 * registration is only asked to update.
 */

const SCRIPT_PATH = "/sw.js";
const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

let reloadPending = false;

function reloadNow() {
  window.location.reload();
}

/** Reload at the next in-app navigation, or now if nobody is looking */
function scheduleReload() {
  if (reloadPending) return;
  reloadPending = true;

  if (document.visibilityState === "hidden") {
    reloadNow();
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reloadNow();
  });

  // The router changes the URL with pushState before rendering the next page, so reloading
  // here loads that page fresh, on the new version
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      reloadNow();
    };
  }
  window.addEventListener("popstate", reloadNow);
}

async function getOrRegister(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  const worker = existing?.active ?? existing?.waiting ?? existing?.installing;
  if (existing && worker && new URL(worker.scriptURL).pathname === SCRIPT_PATH) {
    // Already ours (possibly registered by OneSignal with its query parameters): just check
    // for a newer version of the same script
    existing.update().catch(() => {});
    return existing;
  }
  return navigator.serviceWorker.register(SCRIPT_PATH, { scope: "/" });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // A first visit also gets a controller (the worker claims the page) but has nothing to
  // reload into, so only react to a worker replacing an existing one
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) scheduleReload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await getOrRegister();
      const checkForUpdate = () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      };
      document.addEventListener("visibilitychange", checkForUpdate);
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
