/**
 * Content-Security-Policy tokens required for the Google Translate widget.
 * Unit tests assert index.html includes every entry to prevent regressions.
 */

/** @type {readonly string[]} */
export const TRANSLATE_CSP_REQUIREMENTS = [
  "frame-src 'self' https://translate.google.com https://translate.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com",
  "connect-src 'self' https://formspree.io https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.google.com"
];

/**
 * @param {string} cspContent
 * @param {readonly string[]} requirements
 * @returns {string[]}
 */
export function findMissingCspRequirements(cspContent, requirements = TRANSLATE_CSP_REQUIREMENTS) {
  return requirements.filter((requirement) => !cspContent.includes(requirement));
}
