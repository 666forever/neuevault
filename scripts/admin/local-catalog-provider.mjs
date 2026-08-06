import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from '../asset-pipeline/schema.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const readJson = file => readFile(file, 'utf8').then(JSON.parse);

export function createLocalAdminCatalogProvider({ root = projectRoot, baseCommitSha = null, writable = false } = {}) {
  return {
    async read() {
      const [assetsFile, categoriesFile, collectionsFile, generatedAssets, generatedCategories, generatedCollections, cloudinarySync] = await Promise.all([
        readJson(path.join(root, 'content/metadata/assets.json')).then(value => authoredAssetsFileSchema.parse(value)),
        readJson(path.join(root, 'content/metadata/categories.json')).then(value => authoredCategoriesFileSchema.parse(value)),
        readJson(path.join(root, 'content/collections/collections.json')).then(value => authoredCollectionsFileSchema.parse(value)),
        readJson(path.join(root, 'src/generated/assets.json')),
        readJson(path.join(root, 'src/generated/categories.json')),
        readJson(path.join(root, 'src/generated/collections.json')),
        readJson(path.join(root, 'content/cloudinary-sync.json')),
      ]);
      return { baseCommitSha, source: 'local', readOnly: !writable, catalog: { assets: assetsFile.assets, categories: categoriesFile.categories, collections: collectionsFile.collections }, snapshot: { assetsFile, categoriesFile, collectionsFile, generated: { assets: generatedAssets, categories: generatedCategories, collections: generatedCollections }, cloudinarySync } };
    },
  };
}
