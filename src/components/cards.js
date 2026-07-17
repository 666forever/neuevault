import { escapeHtml, safeUrl } from '../utils/escape.js';

export function collectionCard(collection) {
  return `<a class="collection-card" href="#/collection/${encodeURIComponent(collection.slug)}"><div class="collection-cover"><img src="${escapeHtml(safeUrl(collection.cover))}" alt="" loading="lazy" data-image-fallback>${collection.restricted ? '<span class="badge">Includes restricted originals</span>' : ''}</div><div class="collection-meta"><h3>${escapeHtml(collection.title)}</h3><p>${escapeHtml(collection.description)} · ${Number(collection.count)} in full archive</p></div></a>`;
}
