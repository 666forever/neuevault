import { createHash } from 'node:crypto';
import path from 'node:path';

export const normalizeSlug = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const titleFromFilename = filename => path.basename(filename, path.extname(filename)).replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
export const stableAssetId = buffer => `nv-${createHash('sha256').update(buffer).digest('hex').slice(0, 12)}`;
export const normalizePath = value => value.split(path.sep).join('/');
export const orientationFor = (width, height) => width === height ? 'Square' : width > height ? 'Landscape' : 'Portrait';
export const mimeFor = extension => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' })[extension];
