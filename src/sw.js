import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkOnly,
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

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

// JS/CSS - Stale While Revalidate
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.url.match(/\.(?:js|css)$/),
  new StaleWhileRevalidate({
    cacheName: "static-resources",
  })
);
