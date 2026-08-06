import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(dist, '.vite', 'manifest.json'), 'utf8'));
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
const byFile = new Map(measurements.map(item => [`assets/${item.file}`, item]));
const entryKey = Object.keys(manifest).find(key => manifest[key].isEntry);
const adminKey = Object.keys(manifest).find(key => manifest[key].src === 'src/admin/AdminPage.js' && manifest[key].isDynamicEntry);
const adminEditorKey = Object.keys(manifest).find(key => manifest[key].src === 'src/admin/AdminCatalogEditor.js' && manifest[key].isDynamicEntry);
const adminAccessKey = Object.keys(manifest).find(key => manifest[key].src === 'src/admin/AdminAccess.js' && manifest[key].isDynamicEntry);
const adminUploadKey = Object.keys(manifest).find(key => manifest[key].src === 'src/admin/AdminAssetUpload.js' && manifest[key].isDynamicEntry);
const adminPublicationKey = Object.keys(manifest).find(key => manifest[key].src === 'src/admin/AdminPublicationStatus.js' && manifest[key].isDynamicEntry);
function reachable(starts, blocked = new Set()) {
  const found = new Set(); const visit = key => { if (!key || found.has(key) || blocked.has(key)) return; found.add(key); const item = manifest[key]; if (!item) return; [...(item.imports || []), ...(item.dynamicImports || [])].forEach(visit); }; starts.forEach(visit); return found;
}
const publicRoots = (manifest[entryKey]?.dynamicImports || []).filter(key => key !== adminKey);
const publicKeys = reachable([entryKey, ...publicRoots], new Set([adminKey]));
const adminReachable = reachable([adminKey], new Set([entryKey]));
const adminKeys = new Set([...adminReachable].filter(key => !publicKeys.has(key) && key !== entryKey));
const leakedAdminKeys = [...adminReachable].filter(key => key !== adminKey && publicKeys.has(key));
const sumKeys = keys => [...keys].map(key => byFile.get(manifest[key]?.file)).filter(Boolean).reduce((sum, item) => ({ bytes: sum.bytes + item.bytes, gzip: sum.gzip + item.gzip, brotli: sum.brotli + item.brotli }), { bytes: 0, gzip: 0, brotli: 0 });
const publicTotals = sumKeys(publicKeys); const adminTotals = sumKeys(adminKeys);
const publicLazy = [...publicKeys].map(key => byFile.get(manifest[key]?.file)).filter(item => item && item !== entry);
const largestLazy = publicLazy.sort((a, b) => b.bytes - a.bytes)[0] || { file: 'none', bytes: 0, gzip: 0, brotli: 0 };
const adminShell = byFile.get(manifest[adminKey]?.file);
const adminEditor = byFile.get(manifest[adminEditorKey]?.file);
const adminAccess = byFile.get(manifest[adminAccessKey]?.file);
const adminUpload = byFile.get(manifest[adminUploadKey]?.file);
const adminPublication = byFile.get(manifest[adminPublicationKey]?.file);
const adminNested = [...adminKeys].filter(key => key !== adminKey).map(key => byFile.get(manifest[key]?.file)).filter(Boolean);
const largestAdminNested = adminNested.sort((a, b) => b.gzip - a.gzip)[0] || { file: 'none', bytes: 0, gzip: 0, brotli: 0 };
const budgets = { entryBytes: 490_000, entryGzip: 51_500, publicGzip: 55_500, largestPublicLazyBytes: 10_000, adminShellGzip: 2_450, adminEditorGzip: 2_200, adminAccessGzip: 2_000, adminUploadGzip: 2_275, adminPublicationGzip: 800, adminAggregateGzip: 9_600 };
const failures = [];
if (!entryKey || !entry) failures.push('entry manifest graph is missing');
if (!adminKey || !(manifest[entryKey]?.dynamicImports || []).includes(adminKey)) failures.push('admin shell is not an entry-level dynamic boundary');
if (leakedAdminKeys.length) failures.push(`admin feature entered the public graph: ${leakedAdminKeys.join(', ')}`);
if (entry.bytes > budgets.entryBytes) failures.push(`entry bytes ${entry.bytes} > ${budgets.entryBytes}`);
if (entry.gzip > budgets.entryGzip) failures.push(`entry gzip ${entry.gzip} > ${budgets.entryGzip}`);
if (publicTotals.gzip > budgets.publicGzip) failures.push(`public-path gzip ${publicTotals.gzip} > ${budgets.publicGzip}`);
if (largestLazy.bytes > budgets.largestPublicLazyBytes) failures.push(`largest public lazy chunk ${largestLazy.bytes} > ${budgets.largestPublicLazyBytes}`);
if (!adminShell) failures.push('admin shell chunk is missing');
else if (adminShell.gzip > budgets.adminShellGzip) failures.push(`admin shell gzip ${adminShell.gzip} > ${budgets.adminShellGzip}`);
for (const [label, chunk, budget] of [['catalog editor',adminEditor,budgets.adminEditorGzip],['owner access',adminAccess,budgets.adminAccessGzip],['asset upload',adminUpload,budgets.adminUploadGzip],['publication verifier',adminPublication,budgets.adminPublicationGzip]]) {
  if (!chunk) failures.push(`${label} chunk is missing`);
  else if (chunk.gzip > budget) failures.push(`${label} gzip ${chunk.gzip} > ${budget}`);
}
if (!(manifest[adminEditorKey]?.dynamicImports || []).includes(adminUploadKey)) failures.push('asset upload is not lazy behind the catalog editor');
if ((manifest[adminKey]?.dynamicImports || []).includes(adminUploadKey)) failures.push('asset upload became eager from the admin shell');
if (!(manifest[adminEditorKey]?.dynamicImports || []).includes(adminPublicationKey) || !(manifest[adminUploadKey]?.dynamicImports || []).includes(adminPublicationKey)) failures.push('publication verification is not lazy behind write interactions');
if ((manifest[adminKey]?.dynamicImports || []).includes(adminPublicationKey)) failures.push('publication verification became eager from the admin shell');
if (adminTotals.gzip > budgets.adminAggregateGzip) failures.push(`admin aggregate gzip ${adminTotals.gzip} > ${budgets.adminAggregateGzip}`);

const entrySource = await readFile(path.join(dist, 'assets', entry.file), 'utf8');
for (const forbidden of ['node_modules/zod', 'cloudinary.v2', 'api_secret']) {
  if (entrySource.includes(forbidden)) failures.push(`entry contains forbidden browser marker: ${forbidden}`);
}

console.table(measurements);
console.log(`Entry: ${entry.bytes} bytes (${entry.gzip} gzip, ${entry.brotli} Brotli)`);
console.log(`Public path: ${publicTotals.bytes} bytes (${publicTotals.gzip} gzip, ${publicTotals.brotli} Brotli)`);
console.log(`Admin feature: ${adminTotals.bytes} bytes (${adminTotals.gzip} gzip, ${adminTotals.brotli} Brotli)`);
console.log(`All emitted JavaScript (informational): ${totals.bytes} bytes (${totals.gzip} gzip, ${totals.brotli} Brotli)`);
console.log(`Largest public lazy chunk: ${largestLazy.file} at ${largestLazy.bytes} bytes`);
if (adminShell) console.log(`Admin shell: ${adminShell.file} at ${adminShell.gzip} gzip bytes`);
if (adminEditor) console.log(`Catalog editor: ${adminEditor.file} at ${adminEditor.gzip} gzip bytes`);
if (adminAccess) console.log(`Owner access: ${adminAccess.file} at ${adminAccess.gzip} gzip bytes`);
if (adminUpload) console.log(`Asset upload: ${adminUpload.file} at ${adminUpload.gzip} gzip bytes`);
if (adminPublication) console.log(`Publication verifier: ${adminPublication.file} at ${adminPublication.gzip} gzip bytes`);
if (failures.length) {
  console.error(`Bundle budget failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Bundle budget passed.');
}
