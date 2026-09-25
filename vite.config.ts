import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: 'localhost',
      port: 8080,
      strictPort: true, // Fail if port is already in use
    },
    build: {
      rollupOptions: {
        output: {
          // Merge tiny chunks (single icons, small UI wrappers) into the chunks that always load
          // with them, to cut down on the number of ~1 KB requests per page.
          experimentalMinChunkSize: 20_000,
          // Only React gets a hand-made chunk: it's needed on every page and rarely changes
          // between deploys, so it stays cached. Everything else (Radix, date-fns, Capacitor, ...)
          // is split automatically by where it's used, so libraries only lazy pages need
          // aren't downloaded on first load.
          manualChunks(id) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'vendor';
            }
          },
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      sourcemap: 'hidden', // Source maps uploaded to Sentry but not served to browsers
      terserOptions: {
        compress: {
          // Remove console.* calls in production (except console.error and console.warn)
          drop_console: ['log', 'debug', 'info'],
          drop_debugger: true,
        },
      },
    },
    plugins: [
      react(),
      sentryVitePlugin({
        org: "sprouthub",
        project: "node-express",
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
      VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // Registered by src/utils/registerServiceWorker.ts, which also handles updates
      injectRegister: false,
      injectManifest: {
        minify: false,
        // Keep index.html out of the precache: served from there, a page load gets the
        // previous deploy's HTML (and so its code) until a second reload. Navigations go
        // network-first instead (see sw.ts), with the cached copy only when offline.
        globIgnores: ['**/node_modules/**/*', '**/index.html'],
      },
      manifest: {
        name: 'sprouthub - Plant Care Tracker',
        short_name: 'sprouthub',
        description: 'Track, care for, and grow your plant collection with intelligent reminders and insights',
        // Forest green to match the nav and the icon, so the install splash doesn't flash white
        theme_color: '#1d3c28',
        background_color: '#1d3c28',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        icons: [
          {
            src: '/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        categories: ['lifestyle', 'productivity', 'utilities'],
        screenshots: [
          {
            src: '/screenshot-mobile-1.png',
            sizes: '640x1136',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: '/screenshot-desktop-1.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html',
      },
    })
  ].filter(Boolean),
    define: {
      // Netlify sets CONTEXT during its builds (production, deploy-preview, branch-deploy).
      // Builds made anywhere else, e.g. a local `npm run build` + preview, report to Sentry
      // as "local" so testing doesn't mix with real production errors.
      "import.meta.env.VITE_SENTRY_ENVIRONMENT": JSON.stringify(process.env.CONTEXT ?? "local"),
    },
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,playwright}.config.*'
      ],
    },
  };
});
