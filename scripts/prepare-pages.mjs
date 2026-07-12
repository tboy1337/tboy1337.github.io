import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(rootDir, '..');
const siteDir = path.join(repoRoot, '_site');

/** @type {ReadonlySet<string>} */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'tests',
  'scripts',
  '.github',
  'src',
  'types',
  'coverage',
  'coverage-e2e',
  'coverage-merged',
  'playwright-report',
  'test-results',
  'htmlcov',
  '.vite',
  '_site',
  '.git'
]);

/** @type {ReadonlySet<string>} */
const EXCLUDED_FILES = new Set([
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.sw.json',
  'vitest.config.ts',
  'playwright.config.ts',
  'vite.config.ts',
  'eslint.config.js',
  'tailwind.config.js',
  '.htmlvalidate.json',
  '.stylelintrc.json',
  'games-css-w3c.json',
  'README.md',
  '.gitignore'
]);

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
function shouldExclude(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.some((segment) => EXCLUDED_DIRS.has(segment))) {
    return true;
  }

  const fileName = path.basename(relativePath);
  if (EXCLUDED_FILES.has(fileName)) {
    return true;
  }

  if (fileName.endsWith('.ts')) {
    return true;
  }

  return false;
}

/**
 * @param {string} sourceRoot
 * @param {string} destinationRoot
 * @param {string} [relativePath='']
 */
function copyDeployableFiles(sourceRoot, destinationRoot, relativePath = '') {
  const sourcePath = path.join(sourceRoot, relativePath);
  const destinationPath = path.join(destinationRoot, relativePath);

  if (shouldExclude(relativePath)) {
    return;
  }

  const stats = statSync(sourcePath);
  if (stats.isDirectory()) {
    mkdirSync(destinationPath, { recursive: true });
    for (const entry of readdirSync(sourcePath)) {
      copyDeployableFiles(sourceRoot, destinationRoot, path.join(relativePath, entry));
    }
    return;
  }

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath);
}

function preparePagesSite() {
  if (existsSync(siteDir)) {
    rmSync(siteDir, { recursive: true, force: true });
  }

  mkdirSync(siteDir, { recursive: true });
  copyDeployableFiles(repoRoot, siteDir);
  writeFileSync(path.join(siteDir, '.nojekyll'), '');

  console.log(`Prepared GitHub Pages artifact at ${siteDir}`);
}

preparePagesSite();
