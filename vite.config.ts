import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  root: '.',
  plugins: [
    istanbul({
      include: ['games.js', 'sw.js', 'lib/**/*.mjs'],
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
