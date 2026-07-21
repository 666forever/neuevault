import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { collectHashedBuildAssets, immutableCacheControl, viteHashPattern } from './cache-header-policy.mjs';

const dist = path.resolve('dist');
const manifest = JSON.parse(await readFile(path.join(dist, '.vite', 'manifest.json'), 'utf8'));
const headers = await readFile(path.join(dist, '_headers'), 'utf8');
const expected = collectHashedBuildAssets(manifest);
const blocks = headers.split(/\r?\n\r?\n/).map(block => block.split(/\r?\n/).filter(line => !line.trimStart().startsWith('#'))).filter(lines => lines.length);
const immutable = blocks.filter(lines => lines.slice(1).some(line => line.trim() === `Cache-Control: ${immutableCacheControl}`));
const paths = immutable.map(lines => lines[0].trim());
const errors = [];

for (const file of expected) if (!paths.includes(file)) errors.push(`missing immutable rule: ${file}`);
for (const file of paths) {
  if (!file.startsWith('/')) errors.push(`path is not root-relative: ${file}`);
  if (file.includes('\\')) errors.push(`path contains a Windows separator: ${file}`);
  if (!viteHashPattern.test(file)) errors.push(`immutable rule is not a hashed JS/CSS output: ${file}`);
  if (file.endsWith('.html') || file.startsWith('/api/') || file.startsWith('/fonts/') || file.startsWith('/media/') || /\/assets\/(?:brand|icons|textures|video)\//.test(file)) errors.push(`unsafe immutable rule: ${file}`);
}
if (new Set(paths).size !== paths.length) errors.push('duplicate immutable paths found');
if (paths.length !== expected.length) errors.push(`expected ${expected.length} immutable rules, found ${paths.length}`);
if (immutable.some(lines => lines.some(line => /must-revalidate/i.test(line)))) errors.push('immutable rule contains must-revalidate');

const emitted = (await readdir(path.join(dist, 'assets'))).filter(file => /\.(?:js|css)$/.test(file)).map(file => `/assets/${file}`).sort();
for (const file of emitted) if (!expected.includes(file)) errors.push(`emitted JS/CSS is absent from the Vite manifest policy: ${file}`);

if (errors.length) {
  console.error(`Cache-header audit failed:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Cache-header audit passed: ${paths.length} hashed Vite assets are immutable; HTML, APIs, fonts, and versionless public assets are excluded.`);
}
