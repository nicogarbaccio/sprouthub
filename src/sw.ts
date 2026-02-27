import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkOnly,
  NetworkFirst,
  CacheFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

declare const self: any;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

// Supabase Auth - Network Only
registerRoute(
  ({ url }) => url.href.match(/^https:\/\/.*\.supabase\.co\/auth\/.*/i),
  new NetworkOnly()
);

// Supabase API - Network First
registerRoute(
  ({ url }) => url.href.match(/^https:\/\/.*\.supabase\.co\/.*/i),
  new NetworkFirst({
    cacheName: "supabase-api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// Images - Cache First
registerRoute(
  ({ request }) =>
    request.destination === "image" ||
    request.url.match(/\.(?:png|jpg|jpeg|svg|webp)$/),
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// JS/CSS assets are handled by precacheAndRoute via Vite's content-hashed
// filenames — no additional runtime caching needed. A StaleWhileRevalidate
// route here would serve stale bundles after deploys.

// Offline fallback for navigation requests — serve the cached app shell
// so the SPA can handle routing even without network
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);
