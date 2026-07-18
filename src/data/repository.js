import generatedAssets from '../generated/assets.json';
import generatedCollections from '../generated/collections.json';
import generatedCategories from '../generated/categories.json';
import { validateGeneratedData } from './schema.js';
import { StaticAssetRepository } from './AssetRepository.js';

const generated = validateGeneratedData({ assets: generatedAssets, collections: generatedCollections, categories: generatedCategories });
const formatBytes = bytes => bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;

const assets = generated.assets.map(asset => ({
  ...asset,
  preview: asset.previewUrl || asset.previewFile,
  previewSrcSet: asset.previewSources?.map(source => `${source.url} ${source.width}w`).join(', ') || '',
  collection: asset.collectionSlugs[0] || '',
  fileSizeBytes: asset.fileSize,
  fileSize: formatBytes(asset.fileSize),
}));
const assetById = new Map(assets.map(asset => [asset.id, asset]));
const collections = generated.collections.filter(collection => collection.public).map(collection => ({
  ...collection,
  cover: assetById.get(collection.coverAssetId)?.preview || '',
  restricted: collection.assetIds.some(id => assetById.get(id)?.requiresDiscordAuth),
}));

export const repository = new StaticAssetRepository({ assets, collections, categories: generated.categories });
