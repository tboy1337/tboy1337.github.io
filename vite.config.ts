import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  root: '.',
  plugins: [
    istanbul({
      // Lib modules are covered by unit tests; instrument only app entry points here
      // so merged Istanbul maps do not double-count divergent branch layouts.
      include: ['games.js', 'sw.js'],
      exclude: ['node_modules/**', 'tests/**', 'translation.js'],
      extension: ['.js', '.mjs'],
      requireEnv: false,
      forceBuildInstrument: true
    })
  ],
  server: {
    port: 4173,
    strictPort: true
  }
});
