import { escapeHtml, safeUrl } from '../utils/escape.js';
import { countDescription } from '../utils/content.js';
const coverBindings = new Map();

function coverMedia(item) {
  const staticCover = item.cover || item.image || '';
  const animated = item.coverAnimated ? `<img class="cover-animated" alt="" data-animated-src="${escapeHtml(safeUrl(item.coverAnimated))}" data-image-fallback>` : '';
  return `<span class="cover-media"><img class="cover-static" src="${escapeHtml(safeUrl(staticCover))}" alt="" loading="lazy" data-image-fallback>${animated}</span>`;
}

export function collectionCard(collection) {
  return `<a class="collection-card" href="#/collection/${encodeURIComponent(collection.slug)}"> <div class="collection-cover">${coverMedia(collection)}${collection.restricted ? '<span class="badge">Includes restricted originals</span>' : ''}</div><div class="collection-meta"><h3>${escapeHtml(collection.title)}</h3><p>${escapeHtml(countDescription(collection.count, collection.description))}</p></div></a>`;
}

export function categoryCard(category) {
  return `<a class="category-card" href="#/category/${encodeURIComponent(category.slug)}">${coverMedia(category)}<span class="category-copy"><small>${escapeHtml(countDescription(category.count, category.description))}</small><h2>${escapeHtml(category.title)}</h2></span></a>`;
}

export function bindAnimatedCovers(scope = document) {
  disposeAnimatedCovers(scope);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups = []; const observer = !reducedMotion && 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) entry.target.__stopAnimatedCover?.(); })) : null;
  scope.querySelectorAll('[data-animated-src]').forEach(animated => {
    const card = animated.closest('.collection-card, .category-card'); if (!card || reducedMotion) return;
    let removeTimer; let active = false;
    const visible = () => { const rect = card.getBoundingClientRect(); return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth; };
    const start = () => { if (!visible() || document.hidden) return; active = true; clearTimeout(removeTimer); if (!animated.src) animated.src = animated.dataset.animatedSrc; const show = () => { if (active && card.isConnected) card.classList.add('cover-playing'); }; if (animated.complete && animated.naturalWidth) show(); else animated.onload = show; };
    const stop = () => { active = false; animated.onload = null; card.classList.remove('cover-playing'); clearTimeout(removeTimer); removeTimer = setTimeout(() => animated.removeAttribute('src'), 220); };
    const focusout = event => { if (!card.contains(event.relatedTarget)) stop(); };
    card.addEventListener('pointerenter', start); card.addEventListener('pointerleave', stop); card.addEventListener('focusin', start); card.addEventListener('focusout', focusout); card.__stopAnimatedCover = stop; observer?.observe(card);
    cleanups.push(() => { card.removeEventListener('pointerenter', start); card.removeEventListener('pointerleave', stop); card.removeEventListener('focusin', start); card.removeEventListener('focusout', focusout); clearTimeout(removeTimer); card.classList.remove('cover-playing'); animated.removeAttribute('src'); delete card.__stopAnimatedCover; });
  });
  coverBindings.set(scope, { observer, cleanup: () => { observer?.disconnect(); cleanups.forEach(cleanup => cleanup()); } });
}

export function disposeAnimatedCovers(scope = document) { coverBindings.get(scope)?.cleanup(); coverBindings.delete(scope); }
export const activeCoverBindingCount = () => coverBindings.size;
export const activeCoverObserverCount = () => [...coverBindings.values()].filter(binding => binding.observer).length;
