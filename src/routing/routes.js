const TYPE_ROUTES = new Map([['icons', 'Icons'], ['banners', 'Banners'], ['animated', 'Animated'], ['wallpapers', 'Wallpapers']]);

function routeInput(value) {
  if (value instanceof URL) return value;
  if (value && typeof value === 'object' && 'pathname' in value) return new URL(`${value.pathname}${value.search || ''}`, 'https://www.pfseeker.com');
  const raw = String(value || '/');
  return new URL(raw.startsWith('/') ? raw : `/${raw}`, 'https://www.pfseeker.com');
}

export function parseRoute(value = '/') {
  const url = routeInput(value);
  const path = url.pathname.replace(/\/{2,}/g, '/') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(url.search);
  if (!parts.length) return { name: 'home', path: '/', params: {}, query };
  if (TYPE_ROUTES.has(parts[0]) && parts.length === 1) return { name: 'type', path, params: { type: TYPE_ROUTES.get(parts[0]) }, query };
  if (parts[0] === 'collections') return parts[1] ? { name: 'collection', path, params: { slug: parts[1] }, query } : { name: 'collections', path, params: {}, query };
  if (parts[0] === 'categories' && parts[1]) return { name: 'category', path, params: { slug: parts[1] }, query };
  if (parts[0] === 'asset' && parts[1]) return { name: 'asset', path, params: { id: parts[1], slug: parts[2] || '' }, query };
  if (['recent', 'search', 'about'].includes(parts[0]) && parts.length === 1) return { name: parts[0], path, params: {}, query };
  return { name: 'notFound', path, params: {}, query };
}

export function legacyHashPath(hash = '') {
  if (!hash.startsWith('#/')) return null;
  const legacy = new URL(hash.slice(1), 'https://www.pfseeker.com');
  if (legacy.pathname === '/search') {
    const type = legacy.searchParams.get('type')?.toLowerCase();
    if (TYPE_ROUTES.has(type) && [...legacy.searchParams.keys()].every(key => key === 'type')) return `/${type}`;
    return `/search${legacy.search}`;
  }
  if (legacy.pathname.startsWith('/collection/')) return `/collections/${legacy.pathname.slice(12)}${legacy.search}`;
  if (legacy.pathname.startsWith('/category/')) return `/categories/${legacy.pathname.slice(10)}${legacy.search}`;
  return `${legacy.pathname}${legacy.search}`;
}

export const slugifyRoute = value => String(value || '').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').toLowerCase();
export const assetRoute = asset => `/asset/${encodeURIComponent(typeof asset === 'string' ? asset : asset.id)}${typeof asset === 'object' && asset?.title ? `/${encodeURIComponent(slugifyRoute(asset.title))}` : ''}`;
export const categoryRoute = slug => `/categories/${encodeURIComponent(slug)}`;
export const collectionRoute = slug => `/collections/${encodeURIComponent(slug)}`;

export function activeNavigation(route, backgroundRoute = null) {
  const current = route.name === 'asset' && backgroundRoute ? backgroundRoute : route;
  if (current.name === 'type') return current.params.type.toLowerCase();
  if (current.name === 'collection' || current.name === 'collections') return 'collections';
  return current.name;
}
