import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { exists } from './filesystem.mjs';
import { frameDimensions, mimeFor, normalizePath, stableAssetId, titleFromFilename } from './normalize.mjs';

const categoryByDirectory = { icons: 'Icons', banners: 'Banners', animated: 'Animated', wallpapers: 'Wallpapers' };
const previewExtension = (extension, hasAlpha) => hasAlpha || extension === '.gif' ? '.webp' : '.jpg';
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

export async function resolveLocalAsset(authored, sourceOrder, config, report, writeOutput = false) {
  const absolute = path.resolve(config.sourceRoot, authored.sourceFile);
  if (!absolute.startsWith(path.resolve(config.sourceRoot) + path.sep)) { report.error(`Source path escapes content/assets: ${authored.sourceFile}`); return null; }
  if (!await exists(absolute)) { report.error(`Missing source file: ${authored.sourceFile}`); return null; }
  const extension = path.extname(absolute).toLowerCase();
  if (!config.supportedExtensions.has(extension)) { report.error(`Unsupported source file: ${authored.sourceFile}`); return null; }
  const buffer = await readFile(absolute); const metadata = await sharp(buffer, { animated: true }).metadata(); let dimensions;
  try { dimensions = frameDimensions(metadata); } catch (error) { report.error(`${authored.sourceFile}: ${error.message}`); return null; }
  const id = authored.id || stableAssetId(buffer); const previewExt = previewExtension(extension, metadata.hasAlpha); const previewName = `${id}${previewExt}`; const originalName = `${id}${extension === '.jpeg' ? '.jpg' : extension}`;
  const previewPath = path.join(config.publicPreviewRoot, previewName); const cachePath = path.join(config.cacheRoot, `${id}.txt`); const sourceHash = hash(buffer); const cacheKey = createHash('sha256').update(buffer).update(JSON.stringify(config.preview)).digest('hex');
  if (writeOutput) {
    await mkdir(config.publicPreviewRoot, { recursive: true }); await mkdir(config.cacheRoot, { recursive: true });
    if (!(await exists(previewPath) && await exists(cachePath) && await readFile(cachePath, 'utf8') === cacheKey)) {
      let pipeline = sharp(buffer, { animated: false }).rotate().resize({ width: config.preview.maxWidth, height: config.preview.maxHeight, fit: 'inside', withoutEnlargement: true });
      pipeline = previewExt === '.webp' ? pipeline.webp({ quality: config.preview.quality, alphaQuality: config.preview.quality }) : pipeline.jpeg({ quality: config.preview.quality, mozjpeg: true }); await pipeline.toFile(previewPath); await writeFile(cachePath, cacheKey);
    }
    if (!authored.requiresDiscordAuth) { await mkdir(config.publicOriginalRoot, { recursive: true }); await copyFile(absolute, path.join(config.publicOriginalRoot, originalName)); }
  }
  const fileStat = await stat(absolute); const relative = normalizePath(path.relative(config.sourceRoot, absolute));
  return { sourceOrder, sourceFile: authored.sourceFile, sourceHash, id, title: titleFromFilename(absolute), category: categoryByDirectory[relative.split('/')[0].toLowerCase()], width: dimensions.width, height: dimensions.height, aspectRatio: dimensions.aspectRatio, fileType: extension.slice(1).toUpperCase().replace('JPEG', 'JPG'), mimeType: mimeFor(extension), fileSize: fileStat.size, uploadDate: new Date(fileStat.mtimeMs).toISOString().slice(0, 10), animated: Boolean((metadata.pages || 1) > 1 || extension === '.gif'), previewFile: `/media/previews/${previewName}`, publicSource: authored.requiresDiscordAuth ? null : `/media/originals/${originalName}` };
}

export const resolveLocalAssets = async (assets, config, report, writeOutput = false) => (await Promise.all(assets.map((asset, index) => resolveLocalAsset(asset, index, config, report, writeOutput)))).filter(Boolean);
