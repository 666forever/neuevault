import { rm } from 'node:fs/promises';
import path from 'node:path';
import { pipelineConfig } from './asset-pipeline/config.mjs';

const allowedRoot = path.resolve(pipelineConfig.sourceRoot, '../..');
for (const target of [pipelineConfig.generatedRoot, path.dirname(pipelineConfig.publicPreviewRoot), path.dirname(pipelineConfig.cacheRoot)]) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(allowedRoot + path.sep)) throw new Error(`Refusing to clean outside project: ${resolved}`);
  await rm(resolved, { recursive: true, force: true });
}
console.log('Removed generated manifests and public media.');
