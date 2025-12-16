import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 8080,
    strictPort: true, // Fail if port is already in use
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        minify: false,
      },
      manifest: {
        name: 'SproutHub - Plant Care Tracker',
        short_name: 'SproutHub',
        description: 'Track, care for, and grow your plant collection with intelligent reminders and insights',
        theme_color: '#4a6741',
        background_color: '#ffffff',
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
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
}));
