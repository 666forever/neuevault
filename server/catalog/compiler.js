const categoriesAllowed = new Set(['Icons', 'Banners', 'Animated', 'Wallpapers']);

export class CatalogCompileError extends Error {
  constructor(errors) { super(`Catalog compilation failed:\n${errors.map(value => `  - ${value.message}`).join('\n')}`); this.name = 'CatalogCompileError'; this.code = 'catalog_compile_invalid'; this.errors = errors; }
}

const issue = (errors, code, message, targetId = null) => errors.push({ code, message, targetId });
const slugFor = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const orientationFor = (width, height) => width === height ? 'Square' : width > height ? 'Landscape' : 'Portrait';
const duplicate = (items, key, errors, label) => { const seen = new Set(); for (const item of items) { const value = item?.[key]; if (seen.has(value)) issue(errors, `duplicate_${label.replaceAll(' ', '_')}`, `Duplicate ${label} "${value}".`, value); seen.add(value); } };

function categoryMembers(category, assets, collections) {
  const filter = category.filter;
  if (!filter) return [];
  if (filter.type === 'folder') return assets.filter(asset => asset.category === filter.category);
  if (filter.type === 'tags') return assets.filter(asset => filter.tags.every(tag => asset.tags.includes(tag)));
  if (filter.type === 'assets') { const byId = new Map(assets.map(asset => [asset.id, asset])); return [...new Set(filter.assetIds)].map(id => byId.get(id)).filter(Boolean); }
  if (filter.type === 'collection') { const collection = collections.find(item => item.id === filter.collectionId); return collection ? assets.filter(asset => asset.collectionSlugs.includes(collection.slug)) : []; }
  return [];
}

function compileAsset(authored, resolved, errors) {
  if (!resolved) { issue(errors, 'resolved_asset_missing', `Missing resolved facts for ${authored.sourceFile}.`, authored.sourceFile); return null; }
  const width = Number(resolved.width); const height = Number(resolved.height); const aspectRatio = Number(resolved.aspectRatio);
  if (![width, height, aspectRatio].every(Number.isFinite) || width <= 0 || height <= 0 || aspectRatio < 0.05 || aspectRatio > 20 || Number((width / height).toFixed(6)) !== aspectRatio) issue(errors, 'resolved_dimensions_invalid', `Invalid resolved dimensions for ${authored.sourceFile}.`, authored.sourceFile);
  if (!/^[a-f0-9]{64}$/i.test(resolved.sourceHash || '')) issue(errors, 'resolved_hash_invalid', `Invalid source hash for ${authored.sourceFile}.`, authored.sourceFile);
  if (authored.id && resolved.id && authored.id !== resolved.id) issue(errors, 'resolved_identity_mismatch', `Resolved identity does not match ${authored.sourceFile}.`, authored.sourceFile);
  const id = authored.id || resolved.id; const title = authored.title || resolved.title; const slug = authored.slug || slugFor(title); const category = authored.category || resolved.category;
  if (!id || !title || !slug || !categoriesAllowed.has(category)) issue(errors, 'resolved_asset_invalid', `Invalid resolved identity for ${authored.sourceFile}.`, authored.sourceFile);
  if (!resolved.previewFile || !resolved.fileType || !resolved.mimeType || !Number.isFinite(Number(resolved.fileSize)) || !resolved.uploadDate) issue(errors, 'resolved_asset_malformed', `Incomplete resolved facts for ${authored.sourceFile}.`, authored.sourceFile);
  if (authored.requiresDiscordAuth && resolved.publicSource !== null) issue(errors, 'restricted_delivery_invalid', `Restricted asset ${id} cannot expose a public original.`, id);
  if (!authored.requiresDiscordAuth && typeof resolved.publicSource !== 'string') issue(errors, 'public_delivery_invalid', `Public asset ${id} requires a public original.`, id);
  return { id, title, slug, sourceFile: authored.sourceFile, previewFile: resolved.previewFile, src: authored.requiresDiscordAuth ? null : resolved.publicSource, category, collectionSlugs: authored.collectionSlugs, tags: [...new Set(authored.tags.map(tag => tag.toLowerCase()))].sort(), width, height, aspectRatio, orientation: orientationFor(width, height), fileType: resolved.fileType, mimeType: resolved.mimeType, fileSize: Number(resolved.fileSize), uploadDate: authored.uploadDate || resolved.uploadDate, animated: authored.animated ?? Boolean(resolved.animated), requiresDiscordAuth: authored.requiresDiscordAuth, ...(authored.protectedDownloadPath ? { protectedDownloadPath: authored.protectedDownloadPath } : {}), ...(authored.attribution ? { attribution: authored.attribution } : {}), ...(authored.sourceNote ? { sourceNote: authored.sourceNote } : {}), ...(resolved.generatedFields || {}) };
}

export function compileCatalog({ assets: authoredAssets, categories: authoredCategories, collections: authoredCollections, resolvedAssets }) {
  const errors = [];
  if (![authoredAssets, authoredCategories, authoredCollections, resolvedAssets].every(Array.isArray)) throw new CatalogCompileError([{ code: 'catalog_input_invalid', message: 'Catalog compiler inputs must be arrays.', targetId: null }]);
  duplicate(authoredAssets, 'sourceFile', errors, 'source path'); duplicate(authoredCategories, 'id', errors, 'category ID'); duplicate(authoredCategories, 'slug', errors, 'category slug'); duplicate(authoredCollections, 'id', errors, 'collection ID'); duplicate(authoredCollections, 'slug', errors, 'collection slug'); duplicate(resolvedAssets, 'sourceFile', errors, 'resolved source path');
  const resolvedBySource = new Map(resolvedAssets.map(item => [item.sourceFile, item]));
  const compileOrder = [...authoredAssets].sort((a, b) => (resolvedBySource.get(a.sourceFile)?.sourceOrder ?? Number.MAX_SAFE_INTEGER) - (resolvedBySource.get(b.sourceFile)?.sourceOrder ?? Number.MAX_SAFE_INTEGER) || a.sourceFile.localeCompare(b.sourceFile));
  const assets = compileOrder.map(authored => compileAsset(authored, resolvedBySource.get(authored.sourceFile), errors)).filter(Boolean);
  duplicate(assets, 'id', errors, 'asset ID'); duplicate(assets, 'slug', errors, 'asset slug');
  const assetIds = new Set(assets.map(asset => asset.id)); const collectionSlugs = new Set(authoredCollections.map(collection => collection.slug));
  for (const asset of assets) for (const slug of asset.collectionSlugs) if (!collectionSlugs.has(slug)) issue(errors, 'unknown_collection', `Asset ${asset.id} references missing collection ${slug}.`, asset.id);
  const collections = authoredCollections.map(collection => {
    if (collection.public && (!collection.coverAssetId || !assetIds.has(collection.coverAssetId))) issue(errors, 'collection_cover_invalid', `Visible collection ${collection.slug} references missing cover asset ${collection.coverAssetId || '(none)'}.`, collection.id);
    for (const id of collection.assetIds || []) if (!assetIds.has(id)) issue(errors, 'collection_asset_missing', `Collection ${collection.slug} references missing asset ${id}.`, collection.id);
    const members = assets.filter(asset => asset.collectionSlugs.includes(collection.slug)); return { ...collection, assetIds: members.map(asset => asset.id), count: members.length };
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999) || a.slug.localeCompare(b.slug));
  const collectionIds = new Set(collections.map(collection => collection.id));
  const categories = authoredCategories.map(category => {
    const cover = assets.find(asset => asset.id === category.coverAssetId); if (category.visible && !cover) issue(errors, 'category_cover_invalid', `Visible category ${category.slug} references missing cover asset ${category.coverAssetId || '(none)'}.`, category.id);
    if (category.filter?.type === 'collection' && !collectionIds.has(category.filter.collectionId)) issue(errors, 'category_collection_missing', `Category ${category.slug} references missing collection ID ${category.filter.collectionId}.`, category.id);
    if (category.filter?.type === 'assets') for (const id of category.filter.assetIds) if (!assetIds.has(id)) issue(errors, 'category_asset_missing', `Category ${category.slug} references missing asset ${id}.`, category.id);
    return { ...category, count: categoryMembers(category, assets, collections).length, image: cover?.previewFile || '' };
  }).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  if (errors.length) throw new CatalogCompileError(errors);
  return { assets: assets.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate) || a.id.localeCompare(b.id)), collections, categories };
}
