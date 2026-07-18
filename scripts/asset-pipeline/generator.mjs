import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { pipelineConfig } from './config.mjs';
import { PipelineReport } from './errors.mjs';
import { exists, readJson, walkFiles } from './filesystem.mjs';
import { frameDimensions, mimeFor, normalizePath, normalizeSlug, orientationFor, stableAssetId, titleFromFilename } from './normalize.mjs';
import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from './schema.mjs';
import { assetsForCategory, assetsForCollection } from './counts.mjs';

const categoryByDirectory = { icons: 'Icons', banners: 'Banners', animated: 'Animated', wallpapers: 'Wallpapers' };
const relativeSource = (file, config) => normalizePath(path.relative(config.sourceRoot, file));
const previewExtension = (extension, hasAlpha) => hasAlpha || extension === '.gif' ? '.webp' : '.jpg';
const hashPreviewInput = (buffer, preview) => createHash('sha256').update(buffer).update(JSON.stringify(preview)).digest('hex');

async function buildAsset(authored, config, report, writeOutput) {
  const absolute = path.resolve(config.sourceRoot, authored.sourceFile);
  if (!absolute.startsWith(path.resolve(config.sourceRoot) + path.sep)) { report.error(`Source path escapes content/assets: ${authored.sourceFile}`); return null; }
  if (!await exists(absolute)) { report.error(`Missing source file: ${authored.sourceFile}`); return null; }
  const extension = path.extname(absolute).toLowerCase();
  if (!config.supportedExtensions.has(extension)) { report.error(`Unsupported source file: ${authored.sourceFile}`); return null; }
  const buffer = await readFile(absolute); const image = sharp(buffer, { animated: true }); const metadata = await image.metadata();
  let dimensions; try { dimensions = frameDimensions(metadata); } catch (error) { report.error(`${authored.sourceFile}: ${error.message}`); return null; }
  const id = authored.id || stableAssetId(buffer); const title = authored.title || titleFromFilename(absolute); const slug = authored.slug || normalizeSlug(title);
  const directory = relativeSource(absolute, config).split('/')[0].toLowerCase(); const category = authored.category || categoryByDirectory[directory];
  if (!category) { report.error(`Cannot infer category from ${authored.sourceFile}`); return null; }
  const animated = authored.animated ?? Boolean((metadata.pages || 1) > 1 || extension === '.gif'); const previewExt = previewExtension(extension, metadata.hasAlpha);
  const previewName = `${id}${previewExt}`; const originalName = `${id}${extension === '.jpeg' ? '.jpg' : extension}`;
  const previewPath = path.join(config.publicPreviewRoot, previewName); const cachePath = path.join(config.cacheRoot, `${id}.txt`);
  const cacheKey = hashPreviewInput(buffer, config.preview);
  if (writeOutput) {
    await mkdir(config.publicPreviewRoot, { recursive: true }); await mkdir(config.cacheRoot, { recursive: true });
    const cached = await exists(previewPath) && await exists(cachePath) && await readFile(cachePath, 'utf8') === cacheKey;
    if (!cached) {
      let pipeline = sharp(buffer, { animated: false }).rotate().resize({ width: config.preview.maxWidth, height: config.preview.maxHeight, fit: 'inside', withoutEnlargement: true });
      pipeline = previewExt === '.webp' ? pipeline.webp({ quality: config.preview.quality, alphaQuality: config.preview.quality }) : pipeline.jpeg({ quality: config.preview.quality, mozjpeg: true });
      await pipeline.toFile(previewPath); await writeFile(cachePath, cacheKey);
    }
    if (!authored.requiresDiscordAuth) { await mkdir(config.publicOriginalRoot, { recursive: true }); await copyFile(absolute, path.join(config.publicOriginalRoot, originalName)); }
  }
  const fileStat = await stat(absolute);
  return { id, title, slug, sourceFile: authored.sourceFile, previewFile: `/media/previews/${previewName}`, src: authored.requiresDiscordAuth ? null : `/media/originals/${originalName}`, category, collectionSlugs: authored.collectionSlugs, tags: [...new Set(authored.tags.map(tag => tag.toLowerCase()))].sort(), width: dimensions.width, height: dimensions.height, aspectRatio: dimensions.aspectRatio, orientation: orientationFor(dimensions.width, dimensions.height), fileType: extension.slice(1).toUpperCase().replace('JPEG', 'JPG'), mimeType: mimeFor(extension), fileSize: fileStat.size, uploadDate: authored.uploadDate || new Date(fileStat.mtimeMs).toISOString().slice(0, 10), animated, requiresDiscordAuth: authored.requiresDiscordAuth, ...(authored.protectedDownloadPath ? { protectedDownloadPath: authored.protectedDownloadPath } : {}), ...(authored.attribution ? { attribution: authored.attribution } : {}), ...(authored.sourceNote ? { sourceNote: authored.sourceNote } : {}) };
}

function duplicates(items, key, report, label) {
  const seen = new Map(); for (const item of items) { const value = item[key]; if (seen.has(value)) report.error(`Duplicate ${label} "${value}" (${seen.get(value)} and ${item.sourceFile || item.title})`); else seen.set(value, item.sourceFile || item.title); }
}

export async function generateAssets({ config = pipelineConfig, writeOutput = true, writeManifests = true, clean = false } = {}) {
  const report = new PipelineReport();
  let authoredFile; let collectionsFile; let categoriesFile;
  try { authoredFile = authoredAssetsFileSchema.parse(await readJson(path.join(config.metadataRoot, 'assets.json'))); } catch (error) { report.error(`Invalid assets metadata: ${error.message}`); report.assertValid(); }
  try { collectionsFile = authoredCollectionsFileSchema.parse(await readJson(path.join(config.collectionRoot, 'collections.json'))); } catch (error) { report.error(`Invalid collections metadata: ${error.message}`); report.assertValid(); }
  try { categoriesFile = authoredCategoriesFileSchema.parse(await readJson(path.join(config.metadataRoot, 'categories.json'))); } catch (error) { report.error(`Invalid categories metadata: ${error.message}`); report.assertValid(); }
  const allSourceFiles = await walkFiles(config.sourceRoot);
  for (const file of allSourceFiles) if (!config.supportedExtensions.has(path.extname(file).toLowerCase())) report.error(`Unsupported file in asset source directories: ${relativeSource(file, config)}`);
  const sourceFiles = allSourceFiles.filter(file => config.supportedExtensions.has(path.extname(file).toLowerCase()));
  const authoredPaths = new Set(authoredFile.assets.map(asset => normalizePath(asset.sourceFile)));
  for (const file of sourceFiles) { const relative = relativeSource(file, config); if (!authoredPaths.has(relative)) report.error(`Orphan source file is not represented in metadata: ${relative}`); }
  duplicates(authoredFile.assets, 'sourceFile', report, 'source path');
  const assets = (await Promise.all(authoredFile.assets.map(asset => buildAsset(asset, config, report, false)))).filter(Boolean);
  duplicates(assets, 'id', report, 'asset ID'); duplicates(assets, 'slug', report, 'asset slug');
  const assetIds = new Set(assets.map(asset => asset.id)); const collectionSlugs = new Set();
  const collections = collectionsFile.collections.map(collection => {
    if (collectionSlugs.has(collection.slug)) report.error(`Duplicate collection slug "${collection.slug}"`); collectionSlugs.add(collection.slug);
    if (collection.public && (!collection.coverAssetId || !assetIds.has(collection.coverAssetId))) report.error(`Visible collection ${collection.slug} references missing cover asset ${collection.coverAssetId || '(none)'}`);
    for (const id of collection.assetIds || []) if (!assetIds.has(id)) report.error(`Collection ${collection.slug} references missing asset ${id}`);
    const members = assetsForCollection(collection, assets);
    return { ...collection, assetIds: members.map(asset => asset.id), count: members.length };
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999) || a.slug.localeCompare(b.slug));
  for (const asset of assets) for (const slug of asset.collectionSlugs) if (!collectionSlugs.has(slug)) report.error(`Asset ${asset.id} references missing collection ${slug}`);
  const categorySlugs = new Set();
  const categories = categoriesFile.categories.map(category => {
    if (categorySlugs.has(category.slug)) report.error(`Duplicate category slug "${category.slug}"`); categorySlugs.add(category.slug);
    const cover = assets.find(asset => asset.id === category.coverAssetId); if (category.visible && !cover) report.error(`Visible category ${category.slug} references missing cover asset ${category.coverAssetId || '(none)'}`);
    if (category.filter?.type === 'collection' && !collections.some(collection => collection.id === category.filter.collectionId)) report.error(`Category ${category.slug} references missing collection ID ${category.filter.collectionId}`);
    const matches = assetsForCategory(category, assets, collections);
    return { ...category, count: matches.length, image: cover?.previewFile || '' };
  }).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  report.assertValid();
  const sortedAssets = assets.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate) || a.id.localeCompare(b.id));
  if (writeOutput) {
    if (clean) await Promise.all([rm(config.generatedRoot, { recursive: true, force: true }), rm(path.dirname(config.publicPreviewRoot), { recursive: true, force: true }), rm(config.cacheRoot, { recursive: true, force: true })]);
    await rm(config.publicOriginalRoot, { recursive: true, force: true });
    const expectedPreviews = new Set(sortedAssets.map(asset => path.resolve(config.publicPreviewRoot, path.basename(asset.previewFile))));
    for (const preview of await walkFiles(config.publicPreviewRoot)) if (!expectedPreviews.has(path.resolve(preview))) await rm(preview, { force: true });
    await mkdir(config.generatedRoot, { recursive: true });
    for (const authored of authoredFile.assets) await buildAsset(authored, config, report, true);
    if (writeManifests) {
      await writeFile(path.join(config.generatedRoot, 'assets.json'), `${JSON.stringify(sortedAssets, null, 2)}\n`);
      await writeFile(path.join(config.generatedRoot, 'collections.json'), `${JSON.stringify(collections, null, 2)}\n`);
      await writeFile(path.join(config.generatedRoot, 'categories.json'), `${JSON.stringify(categories, null, 2)}\n`);
    }
  }
  return { assets: sortedAssets, collections, categories, report };
}
