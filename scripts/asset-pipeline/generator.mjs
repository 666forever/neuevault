import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compileCatalog, CatalogCompileError } from '../../server/catalog/compiler.js';
import { reconstructHostedAssetFacts } from '../../server/catalog/hosted-adapter.js';
import { pipelineConfig } from './config.mjs';
import { PipelineReport } from './errors.mjs';
import { exists, readJson, walkFiles } from './filesystem.mjs';
import { resolveLocalAsset } from './local-adapter.mjs';
import { normalizePath } from './normalize.mjs';
import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from './schema.mjs';

const relativeSource = (file, config) => normalizePath(path.relative(config.sourceRoot, file));

const isHostedDelivery = (authored, generated, remote) => {
  const publicDelivery = authored.requiresDiscordAuth ? generated?.src === null : /^https:\/\//.test(generated?.src || '');
  return generated?.id === authored.id && generated?.sourceFile === authored.sourceFile && generated?.previewFile === generated?.previewUrl && /^https:\/\//.test(generated?.previewFile || '') && publicDelivery && /^[a-f0-9]{64}$/i.test(authored.sourceHash || '') && remote?.sourceHash === authored.sourceHash && remote?.original?.publicId === generated?.cloudinaryPublicId && remote?.original?.deliveryType === generated?.cloudinaryDeliveryType;
};

async function resolvePipelineAssets(authoredAssets, config, report, writeOutput = false, hostedFallback = new Map()) {
  let generatedAssets = []; let remoteAssets = {};
  try { generatedAssets = await readJson(path.join(config.generatedRoot, 'assets.json')); } catch {}
  try { remoteAssets = (await readJson(path.join(path.dirname(config.metadataRoot), 'cloudinary-sync.json'))).assets || {}; } catch {}
  const generatedBySource = new Map(generatedAssets.map(asset => [asset.sourceFile, asset]));
  const resolved = await Promise.all(authoredAssets.map(async (authored, sourceOrder) => {
    const absolute = path.resolve(config.sourceRoot, authored.sourceFile);
    if (await exists(absolute)) return resolveLocalAsset(authored, sourceOrder, config, report, writeOutput);
    if (hostedFallback.has(authored.sourceFile)) return { ...hostedFallback.get(authored.sourceFile), sourceOrder };
    const generated = generatedBySource.get(authored.sourceFile);
    if (isHostedDelivery(authored, generated, remoteAssets[authored.id])) return { ...reconstructHostedAssetFacts([authored], [generated])[0], sourceOrder };
    return resolveLocalAsset(authored, sourceOrder, config, report, writeOutput);
  }));
  return resolved.filter(Boolean);
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
  const resolvedAssets = await resolvePipelineAssets(authoredFile.assets, config, report, false); report.assertValid();
  let compiled;
  try { compiled = compileCatalog({ assets: authoredFile.assets, categories: categoriesFile.categories, collections: collectionsFile.collections, resolvedAssets }); }
  catch (error) { if (!(error instanceof CatalogCompileError)) throw error; for (const value of error.errors) report.error(value.message); report.assertValid(); }
  const { assets, collections, categories } = compiled;
  if (writeOutput) {
    if (clean) await Promise.all([rm(config.generatedRoot, { recursive: true, force: true }), rm(path.dirname(config.publicPreviewRoot), { recursive: true, force: true }), rm(config.cacheRoot, { recursive: true, force: true })]);
    await rm(config.publicOriginalRoot, { recursive: true, force: true });
    const expectedPreviews = new Set(assets.filter(asset => asset.previewFile.startsWith('/media/previews/')).map(asset => path.resolve(config.publicPreviewRoot, path.basename(asset.previewFile))));
    for (const preview of await walkFiles(config.publicPreviewRoot)) if (!expectedPreviews.has(path.resolve(preview))) await rm(preview, { force: true });
    await mkdir(config.generatedRoot, { recursive: true });
    const hostedFallback = new Map(resolvedAssets.filter(asset => /^https:\/\//.test(asset.previewFile || '')).map(asset => [asset.sourceFile, asset]));
    await resolvePipelineAssets(authoredFile.assets, config, report, true, hostedFallback); report.assertValid();
    if (writeManifests) {
      await writeFile(path.join(config.generatedRoot, 'assets.json'), `${JSON.stringify(assets, null, 2)}\n`);
      await writeFile(path.join(config.generatedRoot, 'collections.json'), `${JSON.stringify(collections, null, 2)}\n`);
      await writeFile(path.join(config.generatedRoot, 'categories.json'), `${JSON.stringify(categories, null, 2)}\n`);
    }
  }
  return { assets, collections, categories, report };
}
