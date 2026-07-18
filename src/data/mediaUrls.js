const cloudinaryMarker = '/image/';
export const galleryWidths = [320, 640, 960, 1200];

export function applyCloudinaryTransformation(url, transformation) {
  if (!url?.startsWith('https://') || !url.includes(cloudinaryMarker)) return url || '';
  const [prefix, delivery] = url.split(cloudinaryMarker); const segments = delivery.split('/');
  if (!['upload', 'private', 'authenticated'].includes(segments[0])) return url;
  return `${prefix}${cloudinaryMarker}${segments[0]}/${transformation}/${segments.slice(1).join('/')}`;
}

export function responsivePreviewSources(previewUrl, { staticFrame = false } = {}) {
  if (!previewUrl?.includes('res.cloudinary.com')) return [];
  const prefix = staticFrame ? 'pg_1,' : '';
  return galleryWidths.map(width => ({ width, url: applyCloudinaryTransformation(previewUrl, `${prefix}f_auto,q_auto,w_${width},c_limit`) }));
}

export function originalDownloadUrl(src, filename) {
  if (!src?.includes('res.cloudinary.com')) return src || '';
  const safeName = String(filename).replace(/[^a-zA-Z0-9._-]+/g, '-');
  return applyCloudinaryTransformation(src, `fl_attachment:${encodeURIComponent(safeName)}`);
}

export function animatedCoverUrl(asset) {
  if (!asset?.animated || asset.requiresDiscordAuth || !asset.src) return '';
  return asset.src.includes('res.cloudinary.com') ? applyCloudinaryTransformation(asset.src, 'f_auto,q_auto,w_1200,c_limit') : asset.src;
}
