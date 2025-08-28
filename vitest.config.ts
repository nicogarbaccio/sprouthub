import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.ts',
      'src/**/*.{test,spec}.tsx',
      'src/**/__tests__/*.{test,spec}.ts',
      'src/**/__tests__/*.{test,spec}.tsx',
    ],
    exclude: [
      'node_modules',
      'dist',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage-unit',
    },
  },
});


