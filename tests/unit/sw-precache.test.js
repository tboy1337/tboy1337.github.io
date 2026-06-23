import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const swSource = fs.readFileSync(path.join(repoRoot, 'sw.js'), 'utf8');

/** Runtime assets that must be precached for offline navigation and module graphs. */
const REQUIRED_PRECACHE_ASSETS = [
  '/translation.js',
  '/lib/hash-scroll.mjs',
  '/lib/nav-hashes.mjs',
  '/lib/lazy-games-loader.mjs',
  '/lib/bootstrap-site-utils.mjs',
  '/lib/music-studio-audio.mjs',
  '/lib/on-dom-ready.mjs'
];

describe('service worker precache manifest', () => {
  it('includes hash-scroll and other runtime module dependencies', () => {
    for (const asset of REQUIRED_PRECACHE_ASSETS) {
      expect(swSource, `missing precache entry for ${asset}`).toContain(`'${asset}'`);
    }
  });

  it('bumps the cache version when precache assets change', () => {
    expect(swSource).toMatch(/const CACHE_NAME = 'tboy1337-v\d+\.\d+\.\d+';/);
  });
});
