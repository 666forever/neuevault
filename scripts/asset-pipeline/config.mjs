import path from 'node:path';

export const projectRoot = path.resolve(import.meta.dirname, '../..');
export const pipelineConfig = {
  sourceRoot: path.join(projectRoot, 'content/assets'),
  metadataRoot: path.join(projectRoot, 'content/metadata'),
  collectionRoot: path.join(projectRoot, 'content/collections'),
  cacheRoot: path.join(projectRoot, 'content/generated/preview-cache'),
  generatedRoot: path.join(projectRoot, 'src/generated'),
  publicPreviewRoot: path.join(projectRoot, 'public/media/previews'),
  publicOriginalRoot: path.join(projectRoot, 'public/media/originals'),
  supportedExtensions: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']),
  preview: { maxWidth: 1200, maxHeight: 1200, quality: 78 },
};
