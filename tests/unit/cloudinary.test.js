import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { cloudinaryOriginalPublicId, cloudinaryPreviewPublicId, expectedDeliveryType } from '../../scripts/cloudinary/identity.mjs';
import { executeCloudinaryPrune, planCloudinaryPrune, writePrunePlan } from '../../scripts/cloudinary/prune.mjs';
import { syncCloudinary } from '../../scripts/cloudinary/sync.mjs';
import { applyCloudinaryTransformation, originalDownloadUrl, responsivePreviewSources } from '../../src/data/mediaUrls.js';

const roots = [];
afterEach(async () => Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))));

async function cloudFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'neuevault-cloud-')); roots.push(root);
  const sourceRoot = path.join(root, 'content/assets'); const metadataRoot = path.join(root, 'content/metadata'); const collectionRoot = path.join(root, 'content/collections');
  await Promise.all([mkdir(path.join(sourceRoot, 'icons'), { recursive: true }), mkdir(metadataRoot, { recursive: true }), mkdir(collectionRoot, { recursive: true })]);
  await sharp({ create: { width: 80, height: 40, channels: 3, background: '#fff' } }).jpeg().toFile(path.join(sourceRoot, 'icons/public.jpg'));
  await sharp({ create: { width: 40, height: 80, channels: 3, background: '#000' } }).jpeg().toFile(path.join(sourceRoot, 'icons/restricted.jpg'));
  const assets = [
    { id: 'nv-public', sourceFile: 'icons/public.jpg', title: 'Public', collectionSlugs: ['fixture'], uploadDate: '2026-01-02' },
    { id: 'nv-restricted', sourceFile: 'icons/restricted.jpg', title: 'Restricted', collectionSlugs: ['fixture'], uploadDate: '2026-01-01', requiresDiscordAuth: true, protectedDownloadPath: '/api/assets/nv-restricted/download' },
  ];
  await writeFile(path.join(metadataRoot, 'assets.json'), JSON.stringify({ version: 1, assets }));
  await writeFile(path.join(metadataRoot, 'categories.json'), JSON.stringify({ version: 1, categories: [{ id: 'cat-1', slug: 'fixture', title: 'Fixture', archiveCount: 2, coverAssetId: 'nv-restricted', visible: true, order: 1, filter: { type: 'folder', category: 'Icons' } }] }));
  await writeFile(path.join(collectionRoot, 'collections.json'), JSON.stringify({ version: 1, collections: [{ id: 'col-1', slug: 'fixture', title: 'Fixture', description: '', coverAssetId: 'nv-restricted', featured: true, featuredOrder: 1, public: true }] }));
  return { root, stateFile: path.join(root, 'content/cloudinary-sync.json'), config: { sourceRoot, metadataRoot, collectionRoot, cacheRoot: path.join(root, 'content/generated/cache'), generatedRoot: path.join(root, 'src/generated'), publicPreviewRoot: path.join(root, 'public/media/previews'), publicOriginalRoot: path.join(root, 'public/media/originals'), supportedExtensions: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']), preview: { maxWidth: 1200, maxHeight: 1200, quality: 78 } } };
}

class MockCloudinaryTransport {
  uploads = []; deletes = []; resources = [];
  constructor({ failAt = 0, resources = [] } = {}) { this.failAt = failAt; this.resources = resources; }
  async upload(file, options) {
    this.uploads.push({ file, options }); if (this.failAt && this.uploads.length >= this.failAt) throw new Error('mock upload failure');
    const response = { asset_id: `asset-${options.public_id}`, public_id: options.public_id, version: this.uploads.length, format: 'jpg', bytes: 123, width: 80, height: 40, resource_type: 'image', type: options.type, secure_url: `https://res.cloudinary.com/demo/image/${options.type}/v${this.uploads.length}/${options.public_id}.jpg` };
    this.resources.push(response); return response;
  }
  async list({ type }) { return { resources: this.resources.filter(resource => resource.type === type) }; }
  async deleteByAssetIds(ids) { this.deletes.push(ids); return { deleted: Object.fromEntries(ids.map(id => [id, 'deleted'])) }; }
}

describe('Cloudinary identity and URLs', () => {
  const publicAsset = { id: 'nv-1', category: 'Icons', requiresDiscordAuth: false };
  const restrictedAsset = { id: 'nv-2', category: 'Animated', requiresDiscordAuth: true };
  it('creates deterministic public IDs and strict delivery types', () => {
    expect(cloudinaryOriginalPublicId(publicAsset)).toBe('neuevault/public/icons/nv-1');
    expect(cloudinaryOriginalPublicId(restrictedAsset)).toBe('neuevault/restricted/animated/nv-2');
    expect(cloudinaryPreviewPublicId(restrictedAsset)).toBe('neuevault/previews/animated/nv-2');
    expect(expectedDeliveryType(publicAsset)).toBe('upload'); expect(expectedDeliveryType(restrictedAsset)).toBe('authenticated');
  });
  it('builds responsive previews and original-quality attachment URLs', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v7/neuevault/public/icons/nv-1.jpg';
    expect(responsivePreviewSources(url)).toHaveLength(4);
    expect(applyCloudinaryTransformation(url, 'f_auto,q_auto,w_640,c_limit')).toContain('/upload/f_auto,q_auto,w_640,c_limit/v7/');
    expect(originalDownloadUrl(url, 'asset.jpg')).toBe('https://res.cloudinary.com/demo/image/upload/fl_attachment:asset/v7/neuevault/public/icons/nv-1.jpg');
  });
  it.each([
    ['JPEG', 'jpg'],
    ['PNG', 'png'],
    ['GIF', 'gif'],
    ['animated WebP', 'webp'],
  ])('preserves the original %s format outside the attachment flag', (_label, extension) => {
    const src = `https://res.cloudinary.com/demo/image/upload/v42/neuevault/public/nested/folder/nv-1.${extension}`;
    const result = originalDownloadUrl(src, `Archive image.${extension}`);
    expect(result).toBe(`https://res.cloudinary.com/demo/image/upload/fl_attachment:Archive-image/v42/neuevault/public/nested/folder/nv-1.${extension}`);
    expect(result).not.toMatch(new RegExp(`fl_attachment:[^/]*\\.${extension}(?:/|$)`, 'i'));
    expect(result).not.toContain('f_auto');
  });
  it('sanitizes a supplied filename without changing versioned nested public IDs', () => {
    const src = 'https://res.cloudinary.com/demo/image/upload/v123/neuevault/public/folder.with-dots/nv-9.png';
    expect(originalDownloadUrl(src, 'nested/path/Météor.final.png')).toBe('https://res.cloudinary.com/demo/image/upload/fl_attachment:Meteor-final/v123/neuevault/public/folder.with-dots/nv-9.png');
  });
});

describe('Cloudinary synchronization', () => {
  it('migrates manifests, uploads only once, and never exposes restricted src', async () => {
    const fixture = await cloudFixture(); const transport = new MockCloudinaryTransport();
    const first = await syncCloudinary({ transport, config: fixture.config, stateFile: fixture.stateFile });
    expect(first.uploaded).toEqual(['nv-public', 'nv-restricted']); expect(transport.uploads).toHaveLength(3);
    expect(transport.uploads.map(item => item.options.type)).toEqual(['upload', 'authenticated', 'upload']);
    const restricted = first.assets.find(asset => asset.id === 'nv-restricted');
    expect(restricted).toMatchObject({ src: null, downloadUrl: null, cloudinaryDeliveryType: 'authenticated', protectedDownloadPath: '/api/assets/nv-restricted/download' });
    expect(restricted.previewUrl).toContain('/upload/'); expect(restricted.previewUrl).not.toContain('/restricted/');
    const second = await syncCloudinary({ transport, config: fixture.config, stateFile: fixture.stateFile });
    expect(second.uploaded).toEqual([]); expect(second.skipped).toHaveLength(2); expect(transport.uploads).toHaveLength(3);
  });
  it('uploads only a changed source', async () => {
    const fixture = await cloudFixture(); const transport = new MockCloudinaryTransport(); await syncCloudinary({ transport, config: fixture.config, stateFile: fixture.stateFile });
    await sharp({ create: { width: 90, height: 45, channels: 3, background: '#f00' } }).jpeg().toFile(path.join(fixture.config.sourceRoot, 'icons/public.jpg'));
    const result = await syncCloudinary({ transport, config: fixture.config, stateFile: fixture.stateFile });
    expect(result.uploaded).toEqual(['nv-public']); expect(transport.uploads).toHaveLength(4);
  });
  it('does not commit state or manifests after a partial failure', async () => {
    const fixture = await cloudFixture(); const transport = new MockCloudinaryTransport({ failAt: 2 }); const sentinel = '[{"sentinel":true}]\n';
    await mkdir(fixture.config.generatedRoot, { recursive: true }); await writeFile(path.join(fixture.config.generatedRoot, 'assets.json'), sentinel);
    await expect(syncCloudinary({ transport, config: fixture.config, stateFile: fixture.stateFile })).rejects.toThrow(/State and manifests were not updated/);
    expect(await readFile(path.join(fixture.config.generatedRoot, 'assets.json'), 'utf8')).toBe(sentinel);
    await expect(readFile(fixture.stateFile)).rejects.toThrow();
  });
});

describe('Cloudinary prune safeguards', () => {
  it('is dry-run by construction, protects restricted assets, and requires an exact confirmation file', async () => {
    const transport = new MockCloudinaryTransport({ resources: [
      { asset_id: 'public-orphan', public_id: 'neuevault/public/icons/orphan', type: 'upload' },
      { asset_id: 'restricted-orphan', public_id: 'neuevault/restricted/icons/orphan', type: 'authenticated' },
    ] });
    const plan = await planCloudinaryPrune({ transport, state: { assets: {} } });
    expect(plan.candidates.map(item => item.assetId)).toEqual(['public-orphan']); expect(plan.protectedRestricted.map(item => item.assetId)).toEqual(['restricted-orphan']); expect(transport.deletes).toEqual([]);
    await expect(executeCloudinaryPrune({ transport, currentPlan: plan })).rejects.toThrow(/requires --plan/);
    const root = await mkdtemp(path.join(os.tmpdir(), 'neuevault-prune-')); roots.push(root); const confirmation = path.join(root, 'plan.json'); await writePrunePlan(confirmation, plan);
    const result = await executeCloudinaryPrune({ transport, currentPlan: plan, confirmationFile: confirmation }); expect(result.deleted).toHaveLength(1); expect(transport.deletes).toEqual([['public-orphan']]);
  });
});
