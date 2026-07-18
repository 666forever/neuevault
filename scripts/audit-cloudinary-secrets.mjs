import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { walkFiles } from './asset-pipeline/filesystem.mjs';
import { projectRoot } from './asset-pipeline/config.mjs';

const roots = ['src', 'dist'].map(directory => path.join(projectRoot, directory)); const forbidden = ['CLOUDINARY_API_SECRET', 'CLOUDINARY_API_KEY=', 'api_secret']; const violations = [];
for (const root of roots) for (const file of await walkFiles(root)) {
  if (!/\.(js|mjs|json|html|css|map)$/i.test(file)) continue;
  const text = await readFile(file, 'utf8'); for (const token of forbidden) if (text.includes(token)) violations.push(`${path.relative(projectRoot, file)} contains ${token}`);
}
if (violations.length) { console.error(`Cloudinary secret audit failed:\n${violations.map(item => `  - ${item}`).join('\n')}`); process.exitCode = 1; }
else console.log('Cloudinary browser-bundle secret audit passed.');
