import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectHashedBuildAssets, renderImmutableRules } from './cache-header-policy.mjs';

const dist = path.resolve('dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const headersPath = path.join(dist, '_headers');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const authoredHeaders = (await readFile(path.resolve('public', '_headers'), 'utf8')).trimEnd();
const immutablePaths = collectHashedBuildAssets(manifest);
const generated = `${authoredHeaders}\n\n# Generated from dist/.vite/manifest.json; do not edit dist/_headers.\n${renderImmutableRules(immutablePaths)}\n`;

await writeFile(headersPath, generated, 'utf8');
console.log(`Generated immutable cache rules for ${immutablePaths.length} hashed Vite assets.`);
