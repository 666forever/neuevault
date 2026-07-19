import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { generateAssets } from '../asset-pipeline/generator.mjs';
import { pipelineConfig, projectRoot } from '../asset-pipeline/config.mjs';
import { exists, readJson } from '../asset-pipeline/filesystem.mjs';
import { applyCloudinaryTransformation, originalDownloadUrl, responsivePreviewSources } from '../../src/data/mediaUrls.js';
import { cloudinaryOriginalPublicId, cloudinaryPreviewPublicId, expectedDeliveryType } from './identity.mjs';
import { withRetry } from './retry.mjs';

export const syncStatePath = path.join(projectRoot, 'content/cloudinary-sync.json');
const hashFile = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const uploadRecord = response => ({ assetId: response.asset_id, publicId: response.public_id, version: response.version, format: response.format, bytes: response.bytes, width: response.width, height: response.height, resourceType: response.resource_type, deliveryType: response.type, secureUrl: response.secure_url });

async function readState(file) { return await exists(file) ? readJson(file) : { version: 1, assets: {} }; }
function stateMatches(previous, hash, asset) { return previous?.sourceHash === hash && previous.original?.publicId === cloudinaryOriginalPublicId(asset) && previous.original?.deliveryType === expectedDeliveryType(asset) && (!asset.requiresDiscordAuth || previous.preview?.publicId === cloudinaryPreviewPublicId(asset)); }

export async function syncCloudinary({ transport, dryRun = false, config = pipelineConfig, stateFile = syncStatePath } = {}) {
  const local = await generateAssets({ config, writeOutput: !dryRun, writeManifests: false }); const previousState = await readState(stateFile);
  const plan = []; const hashes = new Map();
  for (const asset of local.assets) {
    const hash = await hashFile(path.join(config.sourceRoot, asset.sourceFile)); hashes.set(asset.id, hash);
    if (!stateMatches(previousState.assets[asset.id], hash, asset)) plan.push(asset);
  }
  if (dryRun) return { dryRun: true, planned: plan.map(asset => ({ id: asset.id, publicId: cloudinaryOriginalPublicId(asset), deliveryType: expectedDeliveryType(asset), restrictedPreviewPublicId: asset.requiresDiscordAuth ? cloudinaryPreviewPublicId(asset) : null })), assets: local.assets };
  if (!transport) throw new Error('Cloudinary transport is required for synchronization. No upload was attempted.');
  const nextState = structuredClone(previousState); nextState.version = 1; nextState.assets ||= {}; const completed = [];
  try {
    for (const asset of plan) {
      const original = await withRetry(() => transport.upload(path.join(config.sourceRoot, asset.sourceFile), { public_id: cloudinaryOriginalPublicId(asset), resource_type: 'image', type: expectedDeliveryType(asset), overwrite: true, unique_filename: false, use_filename: false, invalidate: true, tags: ['neuevault', asset.requiresDiscordAuth ? 'restricted' : 'public'] }));
      let preview = null;
      if (asset.requiresDiscordAuth) preview = await withRetry(() => transport.upload(path.join(config.publicPreviewRoot, path.basename(asset.previewFile)), { public_id: cloudinaryPreviewPublicId(asset), resource_type: 'image', type: 'upload', overwrite: true, unique_filename: false, use_filename: false, invalidate: true, tags: ['neuevault', 'restricted-preview'] }));
      nextState.assets[asset.id] = { sourceHash: hashes.get(asset.id), original: uploadRecord(original), ...(preview ? { preview: uploadRecord(preview) } : {}) }; completed.push(asset.id);
    }
  } catch (error) { throw new Error(`Cloudinary synchronization stopped after ${completed.length} successful asset(s) [${completed.join(', ')}]. State and manifests were not updated. Re-run safely after resolving: ${error.message}`); }
  const migratedAssets = local.assets.map(asset => {
    const remote = nextState.assets[asset.id]; const publicPreview = asset.requiresDiscordAuth ? remote.preview.secureUrl : remote.original.secureUrl;
    const staticFrame = asset.animated && !asset.requiresDiscordAuth; const previewUrl = applyCloudinaryTransformation(publicPreview, `${staticFrame ? 'pg_1,' : ''}f_auto,q_auto,w_1200,c_limit`);
    const src = asset.requiresDiscordAuth ? null : remote.original.secureUrl;
    const publicDelivery = asset.requiresDiscordAuth ? {} : { cloudinaryAssetId: remote.original.assetId, cloudinaryPublicId: remote.original.publicId, cloudinaryVersion: remote.original.version };
    return { ...asset, previewUrl, previewSources: responsivePreviewSources(publicPreview, { staticFrame }), src, downloadUrl: asset.requiresDiscordAuth ? null : originalDownloadUrl(src, `${asset.slug}.${asset.fileType.toLowerCase()}`), ...publicDelivery, cloudinaryDeliveryType: remote.original.deliveryType, originalDelivery: asset.requiresDiscordAuth ? { resourceType: remote.original.resourceType, deliveryType: remote.original.deliveryType } : { url: remote.original.secureUrl, resourceType: remote.original.resourceType, deliveryType: remote.original.deliveryType } };
  });
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(path.join(config.generatedRoot, 'assets.json'), `${JSON.stringify(migratedAssets, null, 2)}\n`);
  await writeFile(path.join(config.generatedRoot, 'collections.json'), `${JSON.stringify(local.collections, null, 2)}\n`);
  await writeFile(path.join(config.generatedRoot, 'categories.json'), `${JSON.stringify(local.categories, null, 2)}\n`);
  await writeFile(stateFile, `${JSON.stringify(nextState, null, 2)}\n`);
  return { dryRun: false, uploaded: completed, skipped: local.assets.filter(asset => !plan.includes(asset)).map(asset => asset.id), assets: migratedAssets };
}
