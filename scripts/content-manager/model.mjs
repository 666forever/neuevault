import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from '../asset-pipeline/schema.mjs';
export { assetsForCategory, assetsForCollection } from '../asset-pipeline/counts.mjs';

const unique = (items, key, label, errors) => { const seen = new Set(); for (const item of items) { if (seen.has(item[key])) errors.push(`Duplicate ${label}: ${item[key]}`); seen.add(item[key]); } };
const nextId = (items, prefix) => { const max = Math.max(0, ...items.map(item => new RegExp(`^${prefix}-(\\d+)$`).exec(item.id)?.[1]).filter(Boolean).map(Number)); return `${prefix}-${String(max + 1).padStart(3, '0')}`; };

export function createCategory(categories) { return { id: nextId(categories, 'cat'), slug: `category-${categories.length + 1}`, title: 'New category', description: '', coverAssetId: null, visible: false, order: categories.length, filter: { type: 'assets', assetIds: [] } }; }
export function createCollection(collections) { return { id: nextId(collections, 'col'), slug: `collection-${collections.length + 1}`, title: 'New collection', description: '', coverAssetId: null, tags: [], featured: false, featuredOrder: collections.length + 1, public: false, accessNote: '' }; }

export function prepareContentSave(original, candidate) {
  const assetsFile = authoredAssetsFileSchema.parse({ version: 1, assets: candidate.assets }); const categoriesFile = authoredCategoriesFileSchema.parse({ version: 1, categories: candidate.categories }); const collectionsFile = authoredCollectionsFileSchema.parse({ version: 1, collections: candidate.collections });
  const errors = []; unique(categoriesFile.categories, 'id', 'category ID', errors); unique(categoriesFile.categories, 'slug', 'category slug', errors); unique(collectionsFile.collections, 'id', 'collection ID', errors); unique(collectionsFile.collections, 'slug', 'collection slug', errors);
  const assetIds = new Set(assetsFile.assets.map(asset => asset.id)); const collectionIds = new Set(collectionsFile.collections.map(collection => collection.id));
  for (const category of categoriesFile.categories) { if (category.visible && (!category.coverAssetId || !assetIds.has(category.coverAssetId))) errors.push(`Visible category ${category.slug} requires an existing cover asset.`); if (category.filter?.type === 'collection' && !collectionIds.has(category.filter.collectionId)) errors.push(`Category ${category.slug} references a missing collection.`); }
  for (const collection of collectionsFile.collections) if (collection.public && (!collection.coverAssetId || !assetIds.has(collection.coverAssetId))) errors.push(`Public collection ${collection.slug} requires an existing cover asset.`);
  const originalCollections = new Map(original.collections.map(collection => [collection.id, collection])); const nextCollections = new Map(collectionsFile.collections.map(collection => [collection.id, collection]));
  const slugMigrations = new Map(); for (const [id, previous] of originalCollections) { const next = nextCollections.get(id); if (next && next.slug !== previous.slug) slugMigrations.set(previous.slug, next.slug); if (!next) slugMigrations.set(previous.slug, null); }
  const migratedAssets = assetsFile.assets.map(asset => ({ ...asset, collectionSlugs: [...new Set(asset.collectionSlugs.map(slug => slugMigrations.has(slug) ? slugMigrations.get(slug) : slug).filter(Boolean))] }));
  const validSlugs = new Set(collectionsFile.collections.map(collection => collection.slug)); for (const asset of migratedAssets) for (const slug of asset.collectionSlugs) if (!validSlugs.has(slug)) errors.push(`Asset ${asset.id} references missing collection slug ${slug}.`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { assetsFile: { version: 1, assets: migratedAssets }, categoriesFile, collectionsFile, slugMigrations: Object.fromEntries(slugMigrations) };
}

export function summarizeContentDiff(original, next) {
  const summary = { categoriesAdded: 0, categoriesRemoved: 0, categoriesChanged: 0, collectionsAdded: 0, collectionsRemoved: 0, collectionsChanged: 0, membershipsChanged: 0 };
  for (const [key, label] of [['categories', 'categories'], ['collections', 'collections']]) { const before = new Map(original[key].map(item => [item.id, item])); const after = new Map(next[key].map(item => [item.id, item])); summary[`${label}Added`] = [...after.keys()].filter(id => !before.has(id)).length; summary[`${label}Removed`] = [...before.keys()].filter(id => !after.has(id)).length; summary[`${label}Changed`] = [...after].filter(([id, item]) => before.has(id) && JSON.stringify(before.get(id)) !== JSON.stringify(item)).length; }
  const beforeAssets = new Map(original.assets.map(asset => [asset.id, asset.collectionSlugs])); summary.membershipsChanged = next.assets.filter(asset => JSON.stringify(beforeAssets.get(asset.id) || []) !== JSON.stringify(asset.collectionSlugs)).length; return summary;
}
