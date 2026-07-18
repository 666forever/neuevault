import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { backupAssetControlFiles } from '../../scripts/asset-update/backup.mjs';
import { reconcileAssetMetadata } from '../../scripts/asset-update/reconcile.mjs';

const roots = []; afterEach(async () => Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function updateFixture({ assets, files, categories, collections } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'neuevault-update-')); roots.push(root); const sourceRoot = path.join(root, 'content/assets'); const metadataRoot = path.join(root, 'content/metadata'); const collectionRoot = path.join(root, 'content/collections');
  await Promise.all([mkdir(sourceRoot, { recursive: true }), mkdir(metadataRoot, { recursive: true }), mkdir(collectionRoot, { recursive: true })]);
  for (const file of files || []) { const target = path.join(sourceRoot, file.name); await mkdir(path.dirname(target), { recursive: true }); if (file.raw) await writeFile(target, file.raw); else await sharp({ create: { width: file.width || 40, height: file.height || 20, channels: 3, background: file.color || '#fff' } }).jpeg().toFile(target); }
  await writeFile(path.join(metadataRoot, 'assets.json'), JSON.stringify({ version: 1, assets: assets || [] }));
  await writeFile(path.join(metadataRoot, 'categories.json'), JSON.stringify({ version: 1, categories: (categories || []).map((category, index) => ({ id: `cat-${index + 1}`, visible: true, order: index, ...(category.filterTag ? { filter: { type: 'tags', tags: [category.filterTag] } } : {}), ...category, filterTag: undefined })) }));
  await writeFile(path.join(collectionRoot, 'collections.json'), JSON.stringify({ version: 1, collections: (collections || []).map((collection, index) => ({ id: `col-${index + 1}`, ...collection })) }));
  return { root, config: { sourceRoot, metadataRoot, collectionRoot, cacheRoot: path.join(root, 'cache'), generatedRoot: path.join(root, 'generated'), publicPreviewRoot: path.join(root, 'public/previews'), publicOriginalRoot: path.join(root, 'public/originals'), supportedExtensions: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']), preview: { maxWidth: 1200, maxHeight: 1200, quality: 78 } } };
}

describe('automatic asset reconciliation', () => {
  it('preserves authored metadata, detects changes, and allocates the next numeric IDs', async () => {
    const original = await sharp({ create: { width: 30, height: 30, channels: 3, background: '#000' } }).jpeg().toBuffer(); const changed = await sharp({ create: { width: 60, height: 30, channels: 3, background: '#f00' } }).jpeg().toBuffer();
    const fixture = await updateFixture({ files: [{ name: 'icons/existing.jpg', raw: changed }, { name: 'banners/new-file.jpg', color: '#fff' }], assets: [{ id: 'nv-010', sourceFile: 'icons/existing.jpg', title: 'Manual title', tags: ['manual'], collectionSlugs: ['manual-set'], uploadDate: '2020-01-01', requiresDiscordAuth: true, sourceHash: hash(original) }] });
    const before = await readFile(path.join(fixture.config.metadataRoot, 'assets.json'), 'utf8'); const result = await reconcileAssetMetadata({ config: fixture.config }); const existing = result.assetsFile.assets.find(asset => asset.id === 'nv-010'); const added = result.assetsFile.assets.find(asset => asset.id === 'nv-011');
    expect(existing).toMatchObject({ title: 'Manual title', tags: ['manual'], collectionSlugs: ['manual-set'], uploadDate: '2020-01-01', requiresDiscordAuth: true, category: 'Icons' });
    expect(added).toMatchObject({ sourceFile: 'banners/new-file.jpg', category: 'Banners', tags: [], collectionSlugs: [], requiresDiscordAuth: false }); expect(result.report.changed.map(item => item.id)).toEqual(['nv-010']);
    expect(await readFile(path.join(fixture.config.metadataRoot, 'assets.json'), 'utf8')).toBe(before);
  });
  it('removes previously indexed missing files and repairs objectively unique covers', async () => {
    const current = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#fff' } }).jpeg().toBuffer(); const fixture = await updateFixture({ files: [{ name: 'icons/current.jpg', raw: current }], assets: [
      { id: 'nv-001', sourceFile: 'icons/removed.jpg', title: 'Removed', tags: [], collectionSlugs: ['set'], sourceHash: 'a'.repeat(64) },
      { id: 'nv-002', sourceFile: 'icons/current.jpg', title: 'Current', category: 'Icons', tags: ['gothic'], collectionSlugs: ['set'], sourceHash: hash(current) },
    ], categories: [{ slug: 'gothic', filterTag: 'gothic', title: 'Gothic', archiveCount: 2, coverAssetId: 'nv-001' }], collections: [{ slug: 'set', title: 'Set', description: '', coverAssetId: 'nv-001', featured: false, public: true }] });
    const result = await reconcileAssetMetadata({ config: fixture.config }); expect(result.report.removed.map(item => item.id)).toEqual(['nv-001']); expect(result.categoriesFile.categories[0].coverAssetId).toBe('nv-002'); expect(result.collectionsFile.collections[0].coverAssetId).toBe('nv-002'); expect(result.report.editorialReview).toEqual([]);
  });
  it('reports cryptographic duplicates, unsupported files, and ambiguous covers', async () => {
    const same = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#fff' } }).jpeg().toBuffer(); const fixture = await updateFixture({ files: [{ name: 'icons/a.jpg', raw: same }, { name: 'icons/b.jpg', raw: same }, { name: 'icons/readme.txt', raw: 'unsupported' }], assets: [{ id: 'nv-001', sourceFile: 'icons/removed.jpg', sourceHash: 'a'.repeat(64) }], categories: [{ slug: 'gothic', filterTag: 'gothic', title: 'Gothic', archiveCount: 1, coverAssetId: 'nv-001' }] });
    const result = await reconcileAssetMetadata({ config: fixture.config }); expect(result.report.editorialReview.join('\n')).toMatch(/Cryptographic duplicate.*Unsupported file.*lost cover/s);
  });
});

describe('asset update backups', () => {
  it('backs up all control files and marks a missing sync state', async () => {
    const fixture = await updateFixture(); const stateFile = path.join(fixture.root, 'content/cloudinary-sync.json'); const target = await backupAssetControlFiles({ now: new Date('2026-07-18T10:20:30Z'), config: fixture.config, stateFile, backupRoot: path.join(fixture.root, 'content/backups') });
    expect(await readFile(path.join(target, 'assets.json'), 'utf8')).toContain('"version":1'); expect(await readFile(path.join(target, 'cloudinary-sync.json.missing'), 'utf8')).toContain('did not exist');
  });
});
