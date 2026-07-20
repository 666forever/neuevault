import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+src="\/assets\/(index-[^"]+\.js)"/);
if (!entryMatch) throw new Error('Build output is missing the hashed entry script. Run npm run build first.');

const files = (await readdir(path.join(dist, 'assets'))).filter(file => file.endsWith('.js')).sort();
const measurements = [];
for (const file of files) {
  const source = await readFile(path.join(dist, 'assets', file));
  measurements.push({
    file,
    bytes: source.length,
    gzip: gzipSync(source, { level: 9 }).length,
    brotli: brotliCompressSync(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  });
}

const entry = measurements.find(item => item.file === entryMatch[1]);
const lazy = measurements.filter(item => item !== entry);
const totals = measurements.reduce((sum, item) => ({ bytes: sum.bytes + item.bytes, gzip: sum.gzip + item.gzip, brotli: sum.brotli + item.brotli }), { bytes: 0, gzip: 0, brotli: 0 });
const largestLazy = lazy.sort((a, b) => b.bytes - a.bytes)[0] || { file: 'none', bytes: 0, gzip: 0, brotli: 0 };
const budgets = { entryBytes: 490_000, entryGzip: 51_000, totalGzip: 55_000, largestLazyBytes: 10_000 };
const failures = [];
if (entry.bytes > budgets.entryBytes) failures.push(`entry bytes ${entry.bytes} > ${budgets.entryBytes}`);
if (entry.gzip > budgets.entryGzip) failures.push(`entry gzip ${entry.gzip} > ${budgets.entryGzip}`);
if (totals.gzip > budgets.totalGzip) failures.push(`total gzip ${totals.gzip} > ${budgets.totalGzip}`);
if (largestLazy.bytes > budgets.largestLazyBytes) failures.push(`largest lazy chunk ${largestLazy.bytes} > ${budgets.largestLazyBytes}`);

const entrySource = await readFile(path.join(dist, 'assets', entry.file), 'utf8');
for (const forbidden of ['node_modules/zod', 'cloudinary.v2', 'api_secret']) {
  if (entrySource.includes(forbidden)) failures.push(`entry contains forbidden browser marker: ${forbidden}`);
}

console.table(measurements);
console.log(`Entry: ${entry.bytes} bytes (${entry.gzip} gzip, ${entry.brotli} Brotli)`);
console.log(`Total JavaScript: ${totals.bytes} bytes (${totals.gzip} gzip, ${totals.brotli} Brotli)`);
console.log(`Largest lazy chunk: ${largestLazy.file} at ${largestLazy.bytes} bytes`);
if (failures.length) {
  console.error(`Bundle budget failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Bundle budget passed.');
}
