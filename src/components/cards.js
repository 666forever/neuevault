import { escapeHtml, safeUrl } from '../utils/escape.js';
import { countDescription } from '../utils/content.js';
import { categoryRoute, collectionRoute } from '../routing/routes.js';
const coverBindings = new Map();

function coverMedia(item, className = '') {
  const staticCover = item.cover || item.image || '';
  const animated = item.coverAnimated ? `<img class="cover-animated" alt="" data-animated-src="${escapeHtml(safeUrl(item.coverAnimated))}" data-image-fallback>` : '';
  return `<span class="cover-media${className ? ` ${className}` : ''}"><img class="cover-static" src="${escapeHtml(safeUrl(staticCover))}" alt="" loading="lazy" data-image-fallback>${animated}</span>`;
}

export function collectionCard(collection) {
  const defaultAnimated = collection.coverAnimated ? `<img class="cover-animated" alt="" data-animated-src="${escapeHtml(safeUrl(collection.coverAnimated))}" data-image-fallback>` : '';
  const defaultMedia = `<span class="cover-media collection-media-frame media-default"><img class="cover-static" src="${escapeHtml(safeUrl(collection.cover))}" alt="" loading="lazy" data-image-fallback>${defaultAnimated}</span>`;
  const alternateAnimated = collection.altGif ? `<img class="cover-animated" alt="" data-animated-src="${escapeHtml(safeUrl(collection.altGif))}" data-image-fallback>` : '';
  const alternateMedia = collection.alt ? `<span class="cover-media collection-media-frame media-alternate"><img class="cover-static cover-alternate" alt="" data-alternate-src="${escapeHtml(safeUrl(collection.alt))}" data-image-fallback>${alternateAnimated}</span>` : '';
  const media = `${defaultMedia}${alternateMedia}`;
  return `<a class="collection-card" href="${collectionRoute(collection.slug)}"> <div class="collection-cover">${media}${collection.restricted ? '<span class="badge">Includes restricted originals</span>' : ''}</div><div class="collection-meta"><h3>${escapeHtml(collection.title)}</h3><p>${escapeHtml(countDescription(collection.count, collection.description))}</p></div></a>`;
}

export function categoryCard(category) {
  const title = escapeHtml(category.title);
  return `<a class="category-card" href="${categoryRoute(category.slug)}" aria-label="${title}">${coverMedia(category)}<span class="category-copy"><span class="category-copy-inner"><small>${escapeHtml(countDescription(category.count, category.description))}</small><h2>${title}</h2></span></span></a>`;
}

export function bindAnimatedCovers(scope = document) {
  disposeAnimatedCovers(scope);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverCapable = matchMedia('(hover: hover)').matches;
  const cleanups = []; const observer = !reducedMotion && 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.__startAnimatedCover?.(entry); else entry.target.__stopAnimatedCover?.(entry); })) : null;
  const hero = scope.querySelector('.hero-media');
  if (hero) {
    let visible = true;
    const update = entry => {
      if (entry) visible = entry.isIntersecting;
      if (!reducedMotion && !document.hidden && visible) hero.play()?.catch(() => {});
      else hero.pause();
    };
    hero.__startAnimatedCover = hero.__stopAnimatedCover = update;
    observer?.observe(hero); hero.addEventListener('loadeddata', update, { once: true });
    cleanups.push(() => hero.pause());
  }
  scope.querySelectorAll('.collection-card').forEach(card => {
    const alternate = card.querySelector('[data-alternate-src]');
    const defaultAnimated = card.querySelector('.media-default .cover-animated');
    const alternateAnimated = card.querySelector('.media-alternate .cover-animated');
    if (reducedMotion || !hoverCapable) return;
    let active = false; let removeTimer;
    const startDefault = () => {
      if (document.hidden) return;
      if (defaultAnimated && !defaultAnimated.src) defaultAnimated.src = defaultAnimated.dataset.animatedSrc;
    };
    const startAlternate = () => {
      if (!alternate) return;
      active = true; clearTimeout(removeTimer);
      if (!alternate.src) alternate.src = alternate.dataset.alternateSrc;
      const show = () => {
        if (!active || !alternate.naturalWidth) return;
        card.classList.add('cover-playing');
        if (alternateAnimated && !alternateAnimated.src) alternateAnimated.src = alternateAnimated.dataset.animatedSrc;
      };
      if (alternate.complete && alternate.naturalWidth) show(); else alternate.onload = show;
    };
    const stopAlternate = () => {
      active = false; alternate && (alternate.onload = null);
      card.classList.remove('cover-playing');
      clearTimeout(removeTimer); removeTimer = setTimeout(() => alternateAnimated?.removeAttribute('src'), 1000);
    };
    const stopAll = () => { stopAlternate(); defaultAnimated?.removeAttribute('src'); };
    const focusout = event => { if (!card.contains(event.relatedTarget)) stopAlternate(); };
    card.addEventListener('pointerenter', startAlternate); card.addEventListener('pointerleave', stopAlternate); card.addEventListener('focusin', startAlternate); card.addEventListener('focusout', focusout);
    card.__startAnimatedCover = startDefault; card.__stopAnimatedCover = stopAll; observer?.observe(card); if (!observer) startDefault();
    cleanups.push(() => { card.removeEventListener('pointerenter', startAlternate); card.removeEventListener('pointerleave', stopAlternate); card.removeEventListener('focusin', startAlternate); card.removeEventListener('focusout', focusout); clearTimeout(removeTimer); card.classList.remove('cover-playing'); alternate?.removeAttribute('src'); defaultAnimated?.removeAttribute('src'); alternateAnimated?.removeAttribute('src'); });
  });
  scope.querySelectorAll('.category-card [data-animated-src]').forEach(animated => {
    const card = animated.closest('.category-card');
    if (!card || reducedMotion || !hoverCapable) return;
    let removeTimer; let active = false;
    const start = () => { if (document.hidden) return; active = true; clearTimeout(removeTimer); if (!animated.src) animated.src = animated.dataset.animatedSrc; const show = () => { if (active) card.classList.add('cover-playing'); }; if (animated.complete && animated.naturalWidth) show(); else animated.onload = show; };
    const stop = () => { active = false; animated.onload = null; card.classList.remove('cover-playing'); clearTimeout(removeTimer); removeTimer = setTimeout(() => animated.removeAttribute('src'), 220); };
    const focusout = event => { if (!card.contains(event.relatedTarget)) stop(); };
    card.addEventListener('pointerenter', start); card.addEventListener('pointerleave', stop); card.addEventListener('focusin', start); card.addEventListener('focusout', focusout); card.__stopAnimatedCover = stop; observer?.observe(card);
    cleanups.push(() => { card.removeEventListener('pointerenter', start); card.removeEventListener('pointerleave', stop); card.removeEventListener('focusin', start); card.removeEventListener('focusout', focusout); clearTimeout(removeTimer); card.classList.remove('cover-playing'); animated.removeAttribute('src'); });
  });
  const visibilityChange = () => scope.querySelectorAll('.hero-media, .collection-card, .category-card').forEach(card => { if (document.hidden) card.__stopAnimatedCover?.(); else card.__startAnimatedCover?.(); });
  if (cleanups.length) document.addEventListener('visibilitychange', visibilityChange);
  coverBindings.set(scope, { observer, cleanup: () => { observer?.disconnect(); document.removeEventListener('visibilitychange', visibilityChange); cleanups.forEach(cleanup => cleanup()); } });
}

export function disposeAnimatedCovers(scope = document) { coverBindings.get(scope)?.cleanup(); coverBindings.delete(scope); }
export const activeCoverBindingCount = () => coverBindings.size;
export const activeCoverObserverCount = () => [...coverBindings.values()].filter(binding => binding.observer).length;
