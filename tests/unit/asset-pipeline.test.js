import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { generateAssets } from '../../scripts/asset-pipeline/generator.mjs';
import { normalizeSlug, stableAssetId, titleFromFilename } from '../../scripts/asset-pipeline/normalize.mjs';

const temporaryRoots = [];
afterEach(async () => Promise.all(temporaryRoots.splice(0).map(root => rm(root, { recursive: true, force: true }))));

async function fixture({ files = [{ name: 'icons/fixture.jpg', color: '#a7ff1e' }], assets, collections } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'neuevault-assets-')); temporaryRoots.push(root);
  const sourceRoot = path.join(root, 'content/assets'); const metadataRoot = path.join(root, 'content/metadata'); const collectionRoot = path.join(root, 'content/collections');
  await Promise.all([mkdir(sourceRoot, { recursive: true }), mkdir(metadataRoot, { recursive: true }), mkdir(collectionRoot, { recursive: true })]);
  for (const file of files) { const target = path.join(sourceRoot, file.name); await mkdir(path.dirname(target), { recursive: true }); if (file.raw) await writeFile(target, file.raw); else await sharp({ create: { width: file.width || 40, height: file.height || 20, channels: 4, background: file.color } }).jpeg().toFile(target); }
  const authoredAssets = assets || [{ id: 'nv-fixture', sourceFile: 'icons/fixture.jpg', collectionSlugs: ['fixture'], tags: ['test'], uploadDate: '2026-01-01' }];
  const authoredCollections = (collections || [{ slug: 'fixture', title: 'Fixture', description: 'Fixture collection.', coverAssetId: authoredAssets[0]?.id || 'nv-fixture', tags: [], featured: true, featuredOrder: 1, public: true }]).map((collection, index) => ({ id: `col-${index + 1}`, ...collection }));
  await writeFile(path.join(metadataRoot, 'assets.json'), JSON.stringify({ version: 1, assets: authoredAssets }));
  await writeFile(path.join(metadataRoot, 'categories.json'), JSON.stringify({ version: 1, categories: [{ id: 'cat-1', slug: 'fixture', title: 'Fixture', archiveCount: 1, coverAssetId: authoredAssets[0]?.id || 'nv-fixture', visible: true, order: 1, filter: { type: 'tags', tags: ['test'] } }] }));
  await writeFile(path.join(collectionRoot, 'collections.json'), JSON.stringify({ version: 1, collections: authoredCollections }));
  return { root, config: { sourceRoot, metadataRoot, collectionRoot, cacheRoot: path.join(root, 'content/generated/cache'), generatedRoot: path.join(root, 'src/generated'), publicPreviewRoot: path.join(root, 'public/media/previews'), publicOriginalRoot: path.join(root, 'public/media/originals'), supportedExtensions: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']), preview: { maxWidth: 1200, maxHeight: 1200, quality: 78 } } };
}

describe('asset metadata normalization', () => {
  it('keeps content-derived IDs stable across filename and title edits', () => {
    const bytes = Buffer.from('same image bytes'); expect(stableAssetId(bytes)).toBe(stableAssetId(bytes));
    expect(normalizeSlug('  Äfter Image!  ')).toBe('after-image'); expect(titleFromFilename('my_asset-file.jpg')).toBe('My Asset File');
  });
  it('generates canonical dimensions, paths, and deterministic sorting', async () => {
    const { config } = await fixture({ files: [{ name: 'icons/later.jpg', color: '#fff' }, { name: 'icons/earlier.jpg', color: '#000' }], assets: [
      { id: 'nv-later', sourceFile: 'icons/later.jpg', uploadDate: '2026-02-01' }, { id: 'nv-earlier', sourceFile: 'icons/earlier.jpg', uploadDate: '2026-01-01' },
    ], collections: [{ slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-later', assetIds: ['nv-later', 'nv-earlier'], featured: true, featuredOrder: 1, public: true }] });
    const result = await generateAssets({ config }); expect(result.assets.map(asset => asset.id)).toEqual(['nv-later', 'nv-earlier']);
    expect(result.assets[0]).toMatchObject({ slug: 'later', width: 40, height: 20, aspectRatio: 2, orientation: 'Landscape', previewFile: '/media/previews/nv-later.jpg', src: '/media/originals/nv-later.jpg' });
  });

  it('derives generated collection and category counts from actual assets', async () => {
    const countFixture = await fixture({
      files: [{ name: 'icons/fixture.jpg', color: '#a7ff1e' }, { name: 'icons/second.jpg', color: '#777' }],
      assets: [
        { id: 'nv-one', sourceFile: 'icons/fixture.jpg', collectionSlugs: ['fixture'], tags: ['test'], uploadDate: '2026-01-01' },
        { id: 'nv-two', sourceFile: 'icons/second.jpg', collectionSlugs: [], tags: ['test'], uploadDate: '2026-01-02' },
      ],
    });
    const generated = await generateAssets({ config: countFixture.config, writeOutput: false });
    expect(generated.collections[0].count).toBe(1);
    expect(generated.collections[0].assetIds).toEqual(['nv-one']);
    expect(generated.categories[0].count).toBe(2);
  });
});

describe('pipeline validation', () => {
  it('reports duplicate IDs and slugs', async () => {
    const { config } = await fixture({ files: [{ name: 'icons/a.jpg', color: '#fff' }, { name: 'icons/b.jpg', color: '#000' }], assets: [
      { id: 'nv-duplicate', sourceFile: 'icons/a.jpg', title: 'Same' }, { id: 'nv-duplicate', sourceFile: 'icons/b.jpg', title: 'Same' },
    ], collections: [{ slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-duplicate', featured: false, public: true }] });
    await expect(generateAssets({ config, writeOutput: false })).rejects.toThrow(/Duplicate asset ID.*Duplicate asset slug/s);
  });
  it('rejects unsupported, missing, and orphan source files', async () => {
    const { config } = await fixture({ files: [{ name: 'icons/orphan.jpg', color: '#fff' }, { name: 'icons/readme.txt', raw: 'no' }], assets: [{ id: 'nv-missing', sourceFile: 'icons/missing.jpg' }], collections: [{ slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-missing', public: true }] });
    await expect(generateAssets({ config, writeOutput: false })).rejects.toThrow(/Unsupported file.*Orphan source file.*Missing source file/s);
  });
  it('rejects invalid collection references', async () => {
    const { config } = await fixture({ collections: [{ slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-missing', assetIds: ['nv-also-missing'], public: true }] });
    await expect(generateAssets({ config, writeOutput: false })).rejects.toThrow(/missing cover asset.*missing asset/s);
  });
});

describe('public output access policy', () => {
  it('copies public originals and excludes restricted originals while publishing both previews', async () => {
    const { config } = await fixture({ files: [{ name: 'icons/public.jpg', color: '#fff' }, { name: 'icons/restricted.jpg', color: '#000' }], assets: [
      { id: 'nv-public', sourceFile: 'icons/public.jpg', collectionSlugs: ['fixture'] },
      { id: 'nv-restricted', sourceFile: 'icons/restricted.jpg', collectionSlugs: ['fixture'], requiresDiscordAuth: true },
    ], collections: [{ slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-restricted', assetIds: ['nv-public', 'nv-restricted'], public: true }] });
    const { assets } = await generateAssets({ config }); const restricted = assets.find(asset => asset.id === 'nv-restricted');
    expect(restricted.src).toBeNull(); expect(await readFile(path.join(config.publicPreviewRoot, 'nv-restricted.jpg'))).toBeTruthy();
    await expect(readFile(path.join(config.publicOriginalRoot, 'nv-restricted.jpg'))).rejects.toThrow();
    expect(await readFile(path.join(config.publicOriginalRoot, 'nv-public.jpg'))).toBeTruthy();
  });
});
