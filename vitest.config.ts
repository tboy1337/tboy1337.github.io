import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'istanbul',
      include: ['lib/**/*.mjs'],
      exclude: ['tests/**', 'node_modules/**', 'lib/bootstrap-site-utils.mjs'],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90
      },
      reporter: ['text', 'json', 'html']
    },
    testTimeout: 10000
  }
});
