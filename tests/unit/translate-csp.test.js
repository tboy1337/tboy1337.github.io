import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  TRANSLATE_CSP_REQUIREMENTS,
  findMissingCspRequirements
} from '../../lib/translate-csp.mjs';

const indexHtml = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../../index.html'),
  'utf8'
);

const cspMatch = indexHtml.match(
  /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/
);

describe('translate-csp requirements', () => {
  it('exports the Google Translate CSP requirement fragments', () => {
    expect(TRANSLATE_CSP_REQUIREMENTS.length).toBeGreaterThanOrEqual(3);
    expect(TRANSLATE_CSP_REQUIREMENTS.some((entry) => entry.includes('frame-src'))).toBe(true);
    expect(TRANSLATE_CSP_REQUIREMENTS.some((entry) => entry.includes('unsafe-inline'))).toBe(true);
    expect(TRANSLATE_CSP_REQUIREMENTS.some((entry) => entry.includes('www.gstatic.com'))).toBe(true);
  });

  it('findMissingCspRequirements reports absent fragments', () => {
    const missing = findMissingCspRequirements(
      "default-src 'self'; script-src 'self'",
      ['frame-src https://translate.google.com']
    );
    expect(missing).toEqual(['frame-src https://translate.google.com']);
  });

  it('index.html CSP includes every Google Translate requirement', () => {
    expect(cspMatch).not.toBeNull();
    const cspContent = cspMatch?.[1] ?? '';
    const missing = findMissingCspRequirements(cspContent);
    expect(missing).toEqual([]);
  });

  it('index.html CSP allows Google translate frames and scripts', () => {
    const cspContent = cspMatch?.[1] ?? '';
    expect(cspContent).toContain('frame-src \'self\' https://translate.google.com');
    expect(cspContent).toContain("'unsafe-inline'");
    expect(cspContent).toContain('https://translate-pa.googleapis.com');
    expect(cspContent).toContain('https://www.gstatic.com');
    expect(cspContent).toContain('https://translate.google.com');
  });
});
