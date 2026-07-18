import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { pipelineConfig } from '../asset-pipeline/config.mjs';
import { readJson, walkFiles } from '../asset-pipeline/filesystem.mjs';
import { mimeFor, normalizePath, orientationFor, titleFromFilename } from '../asset-pipeline/normalize.mjs';
import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from '../asset-pipeline/schema.mjs';

const categoryByDirectory = { icons: 'Icons', banners: 'Banners', animated: 'Animated', wallpapers: 'Wallpapers' };
const hashBuffer = buffer => createHash('sha256').update(buffer).digest('hex');
const nextIdAllocator = records => {
  let next = Math.max(0, ...records.map(record => /^nv-(\d+)$/.exec(record.id)?.[1]).filter(Boolean).map(Number)) + 1;
  return () => `nv-${String(next++).padStart(3, '0')}`;
};

async function inspectFile(file, config) {
  const relative = normalizePath(path.relative(config.sourceRoot, file)); const extension = path.extname(file).toLowerCase(); const buffer = await readFile(file); const fileStat = await stat(file);
  const metadata = await sharp(buffer, { animated: true }).metadata();
  return { absolute: file, sourceFile: relative, category: categoryByDirectory[relative.split('/')[0].toLowerCase()], title: titleFromFilename(file), sourceHash: hashBuffer(buffer), width: metadata.width, height: metadata.height, fileType: extension.slice(1).toUpperCase().replace('JPEG', 'JPG'), mimeType: mimeFor(extension), fileSize: fileStat.size, orientation: orientationFor(metadata.width, metadata.height), animated: Boolean((metadata.pages || 1) > 1 || extension === '.gif'), uploadDate: new Date(fileStat.mtimeMs).toISOString().slice(0, 10), basename: path.basename(file).toLowerCase() };
}

function chooseReplacement(candidates) { return candidates.length === 1 ? candidates[0].id : null; }

export async function reconcileAssetMetadata({ config = pipelineConfig } = {}) {
  const [assetsFile, categoriesFile, collectionsFile] = await Promise.all([
    readJson(path.join(config.metadataRoot, 'assets.json')).then(value => authoredAssetsFileSchema.parse(value)),
    readJson(path.join(config.metadataRoot, 'categories.json')).then(value => authoredCategoriesFileSchema.parse(value)),
    readJson(path.join(config.collectionRoot, 'collections.json')).then(value => authoredCollectionsFileSchema.parse(value)),
  ]);
  const allFiles = await walkFiles(config.sourceRoot); const unsupported = allFiles.filter(file => !config.supportedExtensions.has(path.extname(file).toLowerCase())).map(file => normalizePath(path.relative(config.sourceRoot, file)));
  const supported = allFiles.filter(file => config.supportedExtensions.has(path.extname(file).toLowerCase())); const inspected = await Promise.all(supported.map(file => inspectFile(file, config)));
  const byPath = new Map(inspected.map(item => [item.sourceFile, item])); const metadataByPath = new Map(assetsFile.assets.map(record => [normalizePath(record.sourceFile), record])); const allocateId = nextIdAllocator(assetsFile.assets);
  const added = []; const changed = []; const unchanged = []; const indexed = []; const removed = []; const editorialReview = []; const warnings = [];
  const nextAssets = [];
  for (const file of inspected.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile))) {
    const existing = metadataByPath.get(file.sourceFile);
    if (!existing) {
      const record = { id: allocateId(), sourceFile: file.sourceFile, title: file.title, category: file.category, collectionSlugs: [], tags: [], uploadDate: file.uploadDate, requiresDiscordAuth: false, animated: file.animated, sourceHash: file.sourceHash };
      added.push({ ...file, id: record.id }); nextAssets.push(record); continue;
    }
    const next = { ...existing, category: existing.category || file.category, sourceHash: file.sourceHash };
    if (!existing.sourceHash) indexed.push({ sourceFile: file.sourceFile, id: existing.id });
    else if (existing.sourceHash !== file.sourceHash) changed.push({ ...file, id: existing.id });
    else unchanged.push({ sourceFile: file.sourceFile, id: existing.id });
    nextAssets.push(next);
  }
  for (const record of assetsFile.assets) if (!byPath.has(normalizePath(record.sourceFile))) {
    const sourceAlignedPlaceholder = path.basename(record.sourceFile, path.extname(record.sourceFile)).toLowerCase() === record.id.toLowerCase() && added.length > 0;
    if (record.sourceHash || sourceAlignedPlaceholder) removed.push({ sourceFile: record.sourceFile, id: record.id, record, placeholder: sourceAlignedPlaceholder });
    else { editorialReview.push(`Missing legacy source ${record.sourceFile} (${record.id}) has no prior scan hash; removal is not yet considered clearly intentional.`); nextAssets.push(record); }
  }
  const hashes = new Map();
  for (const file of inspected) { const group = hashes.get(file.sourceHash) || []; group.push(file.sourceFile); hashes.set(file.sourceHash, group); }
  for (const [hash, files] of hashes) if (files.length > 1) editorialReview.push(`Cryptographic duplicate ${hash.slice(0, 12)}: ${files.join(', ')}`);
  const names = new Map(); for (const file of inspected) { const group = names.get(file.basename) || []; group.push(file.sourceFile); names.set(file.basename, group); }
  for (const files of names.values()) if (files.length > 1) warnings.push(`Suspicious filename collision: ${files.join(', ')}`);
  for (const file of unsupported) editorialReview.push(`Unsupported file: ${file}`);
  const removedIds = new Set(removed.map(item => item.id)); const addedRecords = nextAssets.filter(record => added.some(item => item.id === record.id));
  const nextCategories = categoriesFile.categories.map(category => {
    if (!removedIds.has(category.coverAssetId) || !category.visible) return category;
    const filterTags = category.filter?.type === 'tags' ? category.filter.tags : [];
    const newCandidates = addedRecords.filter(record => filterTags.length && filterTags.every(tag => record.tags?.includes(tag)));
    const existingCandidates = nextAssets.filter(record => filterTags.length && filterTags.every(tag => record.tags?.includes(tag)));
    const replacement = chooseReplacement(newCandidates) || chooseReplacement(existingCandidates);
    if (!replacement) { editorialReview.push(`Category ${category.slug} lost cover ${category.coverAssetId}; no single obvious newly added tagged replacement exists.`); return category; }
    return { ...category, coverAssetId: replacement };
  });
  const nextCollections = collectionsFile.collections.map(collection => {
    const cleanedAssetIds = collection.assetIds?.filter(id => !removedIds.has(id));
    if (!removedIds.has(collection.coverAssetId) || !collection.public) return { ...collection, ...(cleanedAssetIds ? { assetIds: cleanedAssetIds } : {}) };
    const remainingMembers = nextAssets.filter(record => record.collectionSlugs?.includes(collection.slug)); const newMembers = addedRecords.filter(record => record.collectionSlugs?.includes(collection.slug));
    const replacement = chooseReplacement(newMembers) || chooseReplacement(remainingMembers);
    if (!replacement) { editorialReview.push(`Collection ${collection.slug} lost cover ${collection.coverAssetId}; no single obvious replacement exists.`); return { ...collection, ...(cleanedAssetIds ? { assetIds: cleanedAssetIds } : {}) }; }
    return { ...collection, coverAssetId: replacement, ...(cleanedAssetIds ? { assetIds: cleanedAssetIds } : {}) };
  });
  return { assetsFile: { version: 1, assets: nextAssets }, categoriesFile: { version: 1, categories: nextCategories }, collectionsFile: { version: 1, collections: nextCollections }, report: { added, changed, removed, unchanged, indexed, unsupported, warnings, editorialReview } };
}
