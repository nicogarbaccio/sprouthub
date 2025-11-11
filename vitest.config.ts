import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Ensure TypeScript types are available
    typecheck: {
      include: ['**/*.{test,spec}.{ts,tsx}']
    },
    include: [
      'src/**/*.{test,spec}.ts',
      'src/**/*.{test,spec}.tsx',
      'src/**/__tests__/*.{test,spec}.ts',
      'src/**/__tests__/*.{test,spec}.tsx',
      'tests/**/*.{test,spec}.ts',
      'tests/**/*.{test,spec}.tsx',
    ],
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage-unit',
    },
  },
});


