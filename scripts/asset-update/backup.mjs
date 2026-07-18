import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { exists } from '../asset-pipeline/filesystem.mjs';
import { pipelineConfig, projectRoot } from '../asset-pipeline/config.mjs';
import { syncStatePath } from '../cloudinary/sync.mjs';

const timestamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');

export async function backupAssetControlFiles({ now = new Date(), config = pipelineConfig, stateFile = syncStatePath, backupRoot = path.join(projectRoot, 'content/backups') } = {}) {
  const target = path.join(backupRoot, `assets-update-${timestamp(now)}`); await mkdir(target, { recursive: true });
  const files = [path.join(config.metadataRoot, 'assets.json'), path.join(config.metadataRoot, 'categories.json'), path.join(config.collectionRoot, 'collections.json'), stateFile];
  for (const file of files) {
    const name = file === stateFile ? 'cloudinary-sync.json' : path.basename(file);
    if (await exists(file)) await copyFile(file, path.join(target, name)); else await writeFile(path.join(target, `${name}.missing`), 'File did not exist at backup time.\n');
  }
  return target;
}
