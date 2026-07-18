import path from 'node:path';
import { pipelineConfig } from '../asset-pipeline/config.mjs';
import { exists, readJson } from '../asset-pipeline/filesystem.mjs';
import { listNamespace } from './remote.mjs';
import { syncStatePath } from './sync.mjs';

export async function verifyCloudinary({ transport, stateFile = syncStatePath, manifestFile = path.join(pipelineConfig.generatedRoot, 'assets.json') } = {}) {
  if (!await exists(stateFile)) throw new Error('Cloudinary synchronization state does not exist. Run cloudinary:sync first.');
  const state = await readJson(stateFile); const manifest = await readJson(manifestFile); const remote = await listNamespace(transport); const byPublicId = new Map(remote.map(resource => [resource.public_id, resource]));
  const errors = [];
  for (const asset of manifest) {
    const record = state.assets?.[asset.id]; if (!record) { errors.push(`${asset.id}: missing synchronization state`); continue; }
    if (!byPublicId.has(record.original.publicId)) errors.push(`${asset.id}: original ${record.original.publicId} not found remotely`);
    if (asset.requiresDiscordAuth) {
      if (asset.src !== null) errors.push(`${asset.id}: restricted src must be null`);
      if (!record.preview || !byPublicId.has(record.preview.publicId)) errors.push(`${asset.id}: public restricted preview is missing`);
      if (asset.previewUrl?.includes('/authenticated/') || asset.previewUrl?.includes('/restricted/')) errors.push(`${asset.id}: preview URL points at restricted delivery`);
    }
  }
  if (errors.length) throw new Error(`Cloudinary verification failed:\n${errors.map(error => `  - ${error}`).join('\n')}`);
  return { assets: manifest.length, remote: remote.length };
}
