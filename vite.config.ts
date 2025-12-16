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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'utils': ['date-fns'],
          'capacitor': ['@capacitor/core', '@capacitor/camera', '@capacitor/haptics', '@capacitor/status-bar', '@capacitor/toast']
        }
      }
    },
    chunkSizeWarningLimit: 1000
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
