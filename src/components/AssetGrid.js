import { escapeHtml, safeUrl } from '../utils/escape.js';
import { Icon } from '../ui/Icon.js';
import { Button } from '../ui/Button.js';
import { isRestricted } from '../data/access.js';
import { bindImageErrors } from './images.js';
import { appendMasonryLayout, createMasonryLayout, resolveMasonryColumnCount } from '../utils/masonryLayout.js';

let serial = 0;
const registry = new Map();
const APPEND_BATCH_SIZE = 16;

export function renderAssetCard(asset, index) {
  const title = escapeHtml(asset.title);
  const ratio = Number(asset.width) / Number(asset.height);
  const safeDimensions = ratio >= 0.05 && ratio <= 20 && asset.width > 0 && asset.height > 0;
  const srcset = asset.previewSrcSet ? ` srcset="${escapeHtml(asset.previewSrcSet)}" sizes="(max-width: 700px) 50vw, (max-width: 1400px) 25vw, 320px"` : '';
  const animated = asset.animatedPlayback ? `<img class="asset-animated" alt="" data-gallery-animated-src="${escapeHtml(safeUrl(asset.animatedPlayback))}" decoding="async" data-image-fallback>` : '';
  return `<button class="asset-card${safeDimensions ? '' : ' malformed-media'}" data-asset-id="${escapeHtml(asset.id)}" data-asset-index="${index}" type="button" aria-label="Open ${title}"><span class="asset-thumb"><img class="asset-static" src="${escapeHtml(safeUrl(asset.preview))}"${srcset} alt="${title}" loading="lazy" decoding="async"${safeDimensions ? ` width="${Number(asset.width)}" height="${Number(asset.height)}"` : ''} data-image-fallback>${animated}</span>${asset.animated ? '<span class="format-badge">GIF</span>' : ''}${isRestricted(asset) ? `<span class="lock" aria-label="Restricted original">${Icon('restricted', { size: 'compact' })}</span>` : ''}<span class="asset-overlay"><strong>${title}</strong><span>${escapeHtml(asset.category)} · ${Number(asset.width)}×${Number(asset.height)}</span></span></button>`;
}

async function imageReady(image) {
  if (!image.isConnected || !image.complete || !image.naturalWidth) return;
  try { await image.decode?.(); } catch { /* A loaded image remains usable when browser decode rejects. */ }
  return image.isConnected && image.complete && image.naturalWidth;
}

async function revealImage(image) {
  if (await imageReady(image)) image.classList.add('media-ready');
}

function bindStaticMedia(root) {
  root.querySelectorAll('.asset-static:not([data-ready])').forEach(image => {
    image.dataset.ready = 'bound';
    image.addEventListener('load', () => { void revealImage(image); }, { once: true });
    if (image.complete) void revealImage(image);
  });
}

function stopAnimation(card, state, immediate = false) {
  const animated = card.querySelector('[data-gallery-animated-src]'); if (!animated) return;
  card.classList.remove('asset-playing'); clearTimeout(state.timers.get(card));
  const unload = () => { animated.removeAttribute('src'); state.timers.delete(card); };
  if (immediate) unload(); else state.timers.set(card, setTimeout(unload, 220));
}

function startAnimation(card, state) {
  const animated = card.querySelector('[data-gallery-animated-src]'); if (!animated || state.reduced) return;
  clearTimeout(state.timers.get(card)); state.timers.delete(card);
  if (!animated.hasAttribute('src')) animated.setAttribute('src', animated.dataset.galleryAnimatedSrc);
  const show = async () => {
    if (await imageReady(animated) && card.isConnected && animated.hasAttribute('src')) card.classList.add('asset-playing');
  };
  if (animated.complete && animated.naturalWidth) void show();
  else animated.addEventListener('load', () => { void show(); }, { once: true });
}

function bindAnimations(root, state) {
  if (state.reduced || !state.animator) return;
  root.querySelectorAll('[data-gallery-animated-src]').forEach(image => {
    const card = image.closest('.asset-card');
    if (!card.dataset.anim) { card.dataset.anim = 'true'; state.animator.observe(card); }
  });
}

export function renderAssetGrid(items, { batchSize = 8 } = {}) {
  if (!items.length) return '<div class="empty">No assets match these filters.</div>';
  const id = `asset-grid-${++serial}`;
  const state = { items, visible: Math.min(batchSize, items.length), loader: null, animator: null, resizer: null, frame: 0, plan: null, timers: new Map(), reduced: false };
  registry.set(id, state);
  const more = state.visible < items.length;
  return `<section class="asset-grid-component" data-asset-grid="${id}" aria-label="Asset results"><div class="masonry">${items.slice(0, state.visible).map((item, index) => renderAssetCard(item, index)).join('')}</div>${Button({ label: 'Load more', variant: 'dark', className: 'load-more', attributes: more ? '' : 'hidden' })}<div class="grid-sentinel" aria-hidden="true"></div></section>`;
}

function gridGeometry(root) {
  const masonry = root.querySelector('.masonry');
  const width = masonry.getBoundingClientRect().width;
  const compact = matchMedia('(max-width: 700px)').matches;
  const gap = compact ? 8 : 15;
  return { width, gap, columnCount: resolveMasonryColumnCount(width, { compact, gap }) };
}

function applyLayout(root, state, layout) {
  root.querySelectorAll('.asset-card').forEach((card, index) => {
    const placement = layout.placements[index]; if (!placement) return;
    card.dataset.column = String(placement.column);
    Object.assign(card.style, { left: `${placement.x}px`, top: `${placement.y}px`, width: `${placement.width}px`, height: `${placement.height}px` });
  });
  root.querySelector('.masonry').style.height = `${layout.containerHeight}px`;
  state.plan = layout;
}

function relayout(root, state) {
  const geometry = gridGeometry(root);
  if (!geometry.width || (state.plan && Math.abs(geometry.width - state.plan.width) < 1 && geometry.columnCount === state.plan.columnCount)) return;
  const anchor = [...root.querySelectorAll('.asset-card')].find(card => card.getBoundingClientRect().bottom > 0);
  const before = anchor?.getBoundingClientRect().top;
  applyLayout(root, state, createMasonryLayout(state.items.slice(0, state.visible), geometry));
  if (anchor && before != null) { const delta = anchor.getBoundingClientRect().top - before; if (Math.abs(delta) > 1) window.scrollBy(0, delta); }
}

export function mountAssetGrids(scope, onOpen) {
  scope.querySelectorAll('[data-asset-grid]').forEach(root => {
    const state = registry.get(root.dataset.assetGrid);
    if (!state || root.dataset.gridMounted) return;
    root.dataset.gridMounted = 'true';
    const bind = () => root.querySelectorAll('[data-asset-index]').forEach(button => { button.onclick = () => onOpen(state.items, Number(button.dataset.assetIndex), button); });
    const load = () => {
      if (state.visible >= state.items.length || !root.isConnected) return;
      const next = Math.min(state.visible + APPEND_BATCH_SIZE, state.items.length);
      const added = state.items.slice(state.visible, next);
      root.querySelector('.masonry').insertAdjacentHTML('beforeend', added.map((item, index) => renderAssetCard(item, state.visible + index)).join(''));
      const geometry = gridGeometry(root);
      const compatible = state.plan && Math.abs(geometry.width - state.plan.width) < 1 && geometry.columnCount === state.plan.columnCount && geometry.gap === state.plan.gap;
      applyLayout(root, state, compatible ? appendMasonryLayout(state.plan, added) : createMasonryLayout(state.items.slice(0, next), geometry));
      state.visible = next;
      root.querySelector('.load-more').hidden = state.visible >= state.items.length;
      if (state.visible >= state.items.length) state.loader?.disconnect();
      bind(); bindImageErrors(root); bindStaticMedia(root); bindAnimations(root, state);
    };
    root.querySelector('.load-more').onclick = load;
    if ('IntersectionObserver' in window) {
      state.loader = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) load(); }, { rootMargin: '600px 0px' });
      state.loader.observe(root.querySelector('.grid-sentinel'));
      state.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!state.reduced) state.animator = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting && entry.intersectionRatio >= 0.35) startAnimation(entry.target, state); else if (!entry.isIntersecting) stopAnimation(entry.target, state); }), { threshold: [0, 0.35] });
    }
    relayout(root, state);
    if ('ResizeObserver' in window) {
      state.resizer = new ResizeObserver(() => { cancelAnimationFrame(state.frame); state.frame = requestAnimationFrame(() => relayout(root, state)); });
      state.resizer.observe(root.querySelector('.masonry'));
    }
    bind(); bindImageErrors(root); bindStaticMedia(root); bindAnimations(root, state);
  });
}

export function disposeAssetGrids(scope = document) {
  scope.querySelectorAll('[data-asset-grid]').forEach(root => {
    const state = registry.get(root.dataset.assetGrid);
    state?.loader?.disconnect(); state?.animator?.disconnect(); state?.resizer?.disconnect();
    if (state?.frame) cancelAnimationFrame(state.frame);
    root.querySelectorAll('.asset-card').forEach(card => state && stopAnimation(card, state, true));
    registry.delete(root.dataset.assetGrid);
  });
}

export const activeAnimationObserverCount = () => [...registry.values()].filter(state => state.animator).length;
