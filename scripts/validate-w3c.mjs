import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cssValidator from 'w3c-css-validator';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {readonly string[]} */
const HTML_FILES = ['index.html'];

/** @type {readonly string[]} */
const XML_FILES = ['sitemap.xml'];

/** Built CSS served by GitHub Pages (not Tailwind source directives). */
/** @type {readonly string[]} */
export const W3C_CSS_FILES = ['games.css', 'tailwind.css'];

/** W3C profile that accepts modern properties such as clip-path and pointer-events. */
export const W3C_CSS_PROFILE = 'css3svg';

const W3C_NU_URL = 'https://validator.w3.org/nu/?out=json&level=error';

/** @type {import('w3c-css-validator/dist/types/options').OptionsWithoutWarnings} */
export const W3C_CSS_OPTIONS = {
  warningLevel: 0,
  profile: W3C_CSS_PROFILE
};

/**
 * @param {unknown} payload
 * @returns {Array<{ type: string, message: string, line?: number, column?: number }>}
 */
export function extractW3cMessages(payload) {
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) {
    return [];
  }

  const messages = payload.messages;
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return { type: 'error', message: 'Invalid validator response entry' };
    }

    const record = /** @type {Record<string, unknown>} */ (entry);
    return {
      type: typeof record.type === 'string' ? record.type : 'error',
      message: typeof record.message === 'string' ? record.message : 'Unknown validator message',
      line: typeof record.lastLine === 'number' ? record.lastLine : undefined,
      column: typeof record.lastColumn === 'number' ? record.lastColumn : undefined
    };
  });
}

/**
 * @param {Array<{ type: string, message: string, line?: number, column?: number }>} messages
 * @returns {Array<{ type: string, message: string, line?: number, column?: number }>}
 */
export function filterW3cErrors(messages) {
  return messages.filter((message) => message.type === 'error');
}

/**
 * @param {readonly { line: number, message: string }[]} errors
 * @param {string} relativePath
 * @returns {string}
 */
export function formatCssValidationErrors(errors, relativePath) {
  return errors
    .map((error) => `  ${relativePath}:${error.line} ${error.message}`)
    .join('\n');
}

/**
 * @param {string} relativePath
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function validateCssText(relativePath, content) {
  const result = await cssValidator.validateText(content, W3C_CSS_OPTIONS);

  if (!result.valid) {
    console.error(`W3C CSS errors in ${relativePath}:`);
    console.error(formatCssValidationErrors(result.errors, relativePath));
    throw new Error(`W3C CSS validation failed for ${relativePath}`);
  }

  console.log(`W3C CSS: ${relativePath} — 0 errors (${W3C_CSS_PROFILE} profile)`);
}

/**
 * @param {string} relativePath
 * @param {string} content
 * @param {string} contentType
 * @returns {Promise<Array<{ type: string, message: string, line?: number, column?: number }>>}
 */
async function postToW3cHtmlValidator(relativePath, content, contentType) {
  const response = await fetch(W3C_NU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`
    },
    body: content
  });

  if (!response.ok) {
    throw new Error(`W3C validator request failed for ${relativePath}: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return extractW3cMessages(payload);
}

/**
 * @param {string} relativePath
 * @returns {Promise<void>}
 */
async function validateHtmlFile(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  const messages = await postToW3cHtmlValidator(relativePath, content, 'text/html');
  const errors = filterW3cErrors(messages);

  if (errors.length > 0) {
    console.error(`W3C HTML errors in ${relativePath}:`);
    for (const error of errors) {
      const location = error.line ? `:${error.line}:${error.column ?? 0}` : '';
      console.error(`  ${relativePath}${location} ${error.message}`);
    }
    throw new Error(`W3C HTML validation failed for ${relativePath}`);
  }

  console.log(`W3C Nu HTML: ${relativePath} — 0 errors`);
}

/**
 * @param {string} relativePath
 * @returns {Promise<void>}
 */
async function validateCssFile(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  await validateCssText(relativePath, content);
}

/**
 * @returns {Promise<typeof DOMParser>}
 */
async function getDomParserClass() {
  if (typeof DOMParser !== 'undefined') {
    return DOMParser;
  }

  const { JSDOM } = await import('jsdom');
  return new JSDOM().window.DOMParser;
}

/**
 * @param {typeof DOMParser} DomParserClass
 * @param {string} relativePath
 */
function validateXmlWellFormed(DomParserClass, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = readFileSync(absolutePath, 'utf8');

  if (!content.trim().startsWith('<?xml')) {
    throw new Error(`${relativePath} is missing an XML declaration`);
  }

  const parser = new DomParserClass();
  const document = parser.parseFromString(content, 'application/xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) {
    throw new Error(`XML parse error in ${relativePath}: ${parseError.textContent ?? 'unknown error'}`);
  }

  console.log(`W3C XML: ${relativePath} — well-formed`);
}

/**
 * @param {string} relativePath
 */
function validateWebManifest(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  /** @type {Record<string, unknown>} */
  let manifest;

  try {
    manifest = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${relativePath}: ${message}`);
  }

  const requiredKeys = ['name', 'short_name', 'start_url', 'display', 'icons'];
  const missing = requiredKeys.filter((key) => !(key in manifest));
  if (missing.length > 0) {
    throw new Error(`${relativePath} is missing required manifest keys: ${missing.join(', ')}`);
  }

  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    throw new Error(`${relativePath} must define at least one icon`);
  }

  console.log(`W3C manifest: ${relativePath} — valid JSON with required fields`);
}

async function main() {
  const DomParserClass = await getDomParserClass();

  for (const file of HTML_FILES) {
    await validateHtmlFile(file);
  }

  for (const file of XML_FILES) {
    validateXmlWellFormed(DomParserClass, file);
  }

  validateWebManifest('site.webmanifest');

  for (const file of W3C_CSS_FILES) {
    await validateCssFile(file);
  }

  console.log('W3C validation complete');
}

const isCliEntry = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  await main();
}
