import { describe, expect, it } from 'vitest';
import {
  shouldSkipFetch,
  isHtmlRequest,
  isScriptRequest,
  getStaleCacheNames
} from '../../lib/sw-utils.mjs';

describe('shouldSkipFetch', () => {
  it('skips non-GET requests', () => {
    expect(shouldSkipFetch('POST', 'https://tboy1337.github.io/')).toBe(true);
  });

  it('skips external CDN and translate URLs', () => {
    expect(shouldSkipFetch('GET', 'https://translate.google.com/translate.js')).toBe(true);
    expect(shouldSkipFetch('GET', 'https://cdn.tailwindcss.com/')).toBe(true);
    expect(shouldSkipFetch('GET', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css')).toBe(true);
  });

  it('allows local asset requests', () => {
    expect(shouldSkipFetch('GET', 'https://tboy1337.github.io/games.js')).toBe(false);
    expect(shouldSkipFetch('GET', 'http://127.0.0.1:4173/index.html')).toBe(false);
  });
});

describe('isHtmlRequest', () => {
  it('detects HTML navigation requests', () => {
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/'), 'document')).toBe(true);
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/index.html'), '')).toBe(true);
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/'), '')).toBe(true);
  });

  it('detects non-HTML asset requests', () => {
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/games.js'), 'script')).toBe(false);
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/games.css'), 'style')).toBe(false);
    expect(isHtmlRequest(new URL('https://tboy1337.github.io/games'))).toBe(false);
  });
});

describe('isScriptRequest', () => {
  it('detects JavaScript module and script assets', () => {
    expect(isScriptRequest(new URL('https://tboy1337.github.io/games.js'))).toBe(true);
    expect(isScriptRequest(new URL('https://tboy1337.github.io/lib/music-studio-audio.mjs'))).toBe(true);
    expect(isScriptRequest(new URL('https://tboy1337.github.io/games.css'))).toBe(false);
  });
});

describe('getStaleCacheNames', () => {
  it('returns cache names that do not match the active cache', () => {
    const stale = getStaleCacheNames(
      ['tboy1337-v1.1.2', 'tboy1337-v1.2.0', 'other-cache'],
      'tboy1337-v1.2.0'
    );
    expect(stale).toEqual(['tboy1337-v1.1.2']);
  });
});
