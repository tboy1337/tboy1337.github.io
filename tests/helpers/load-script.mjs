import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * @param {string} relativePath
 * @param {Record<string, unknown>} [extraGlobals]
 */
export function loadBrowserScript(relativePath, extraGlobals = {}) {
  const code = readFileSync(join(rootDir, relativePath), 'utf8');
  const sandbox = {
    window: {},
    self: {},
    globalThis: {},
    console,
    Math,
    Date,
    JSON,
    parseInt,
    Number,
    Array,
    Set,
    Map,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...extraGlobals
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: relativePath });
  return sandbox;
}
