import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipelineConfig } from '../asset-pipeline/config.mjs';
import { backupAssetControlFiles } from '../asset-update/backup.mjs';

async function atomicJson(file, value) { const temporary = `${file}.${process.pid}.tmp`; await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`); await rename(temporary, file); }
export async function persistContentFiles(prepared, { config = pipelineConfig, backup = true } = {}) {
  const backupPath = backup ? await backupAssetControlFiles({ config }) : null;
  await Promise.all([atomicJson(path.join(config.metadataRoot, 'assets.json'), prepared.assetsFile), atomicJson(path.join(config.metadataRoot, 'categories.json'), prepared.categoriesFile), atomicJson(path.join(config.collectionRoot, 'collections.json'), prepared.collectionsFile)]);
  return backupPath;
}
