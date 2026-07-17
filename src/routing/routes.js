export function parseRoute(hash = '') {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return { name: 'home', path, params: {}, query: new URLSearchParams(query) };
  const names = { collections: 'collections', collection: 'collection', recent: 'recent', search: 'search', about: 'about', asset: 'asset' };
  return { name: names[parts[0]] || 'notFound', path, params: { slug: parts[1], id: parts[1] }, query: new URLSearchParams(query) };
}

export const assetRoute = id => `#/asset/${encodeURIComponent(id)}`;
