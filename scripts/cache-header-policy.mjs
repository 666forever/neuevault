import path from 'node:path';

export const immutableCacheControl = 'public, max-age=31536000, immutable';
export const viteHashPattern = /-[A-Za-z0-9_-]{8}\.(?:js|css)$/;

export function normalizeAssetPath(file) {
  return `/${file.split(path.sep).join('/')}`;
}

export function collectHashedBuildAssets(manifest) {
  const candidates = new Set();
  for (const entry of Object.values(manifest)) {
    if (entry.file?.match(/\.(?:js|css)$/)) candidates.add(entry.file);
    for (const css of entry.css || []) candidates.add(css);
  }

  const files = [...candidates].sort();
  if (!files.length) throw new Error('Vite manifest contains no JavaScript or CSS build outputs.');
  for (const file of files) {
    if (!viteHashPattern.test(file)) throw new Error(`Refusing to cache non-hashed Vite output as immutable: ${file}`);
  }
  return files.map(normalizeAssetPath);
}

export function renderImmutableRules(paths) {
  return paths.map(file => `${file}\n  Cache-Control: ${immutableCacheControl}`).join('\n\n');
}
