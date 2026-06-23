import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const gamesCssPath = path.join(rootDir, '..', 'games.css');
const gamesCssSourcePath = path.join(rootDir, '..', 'src', 'games.css');
const source = readFileSync(gamesCssSourcePath, 'utf8');

const result = await build({
  stdin: {
    contents: source,
    loader: 'css',
    resolveDir: rootDir
  },
  write: false,
  minify: true,
  bundle: true
});

const output = result.outputFiles[0]?.text;
if (!output) {
  throw new Error('Failed to minify games.css');
}

writeFileSync(gamesCssPath, output);
