import { createHash } from 'node:crypto';
import path from 'node:path';

export const normalizeSlug = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const titleFromFilename = filename => path.basename(filename, path.extname(filename)).replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
export const stableAssetId = buffer => `nv-${createHash('sha256').update(buffer).digest('hex').slice(0, 12)}`;
export const normalizePath = value => value.split(path.sep).join('/');
export const orientationFor = (width, height) => width === height ? 'Square' : width > height ? 'Landscape' : 'Portrait';
export const mimeFor = extension => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' })[extension];
export function frameDimensions(metadata) {
  const width = Number(metadata.width); const pages = Number(metadata.pages || 1); const format = String(metadata.format || '').toLowerCase();
  let height = Number(metadata.height); const pageHeight = Number(metadata.pageHeight);
  if (pageHeight > 0) height = pageHeight;
  else if (['gif', 'webp'].includes(format) && pages > 1 && Number.isInteger(height / pages)) height /= pages;
  const aspectRatio = width / height;
  if (![width, height, aspectRatio].every(Number.isFinite) || width <= 0 || height <= 0 || aspectRatio < 0.05 || aspectRatio > 20) throw new Error(`Invalid displayed-frame dimensions ${width}×${height} (${format || 'unknown'})`);
  return { width, height, aspectRatio: Number(aspectRatio.toFixed(6)) };
}
