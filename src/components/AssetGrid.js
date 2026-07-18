import { escapeHtml, safeUrl } from '../utils/escape.js';
import { isRestricted } from '../data/access.js';
import { bindImageErrors } from './images.js';

let serial = 0;
const registry = new Map();

function card(asset, index, id) {
  const title = escapeHtml(asset.title);
  const ratio = Number(asset.width) / Number(asset.height); const safeDimensions = Number.isFinite(ratio) && ratio >= 0.05 && ratio <= 20 && asset.width > 0 && asset.height > 0;
  const srcset = asset.previewSrcSet ? ` srcset="${escapeHtml(asset.previewSrcSet)}" sizes="(max-width: 700px) 50vw, (max-width: 1400px) 25vw, 320px"` : '';
  return `<button class="asset-card${safeDimensions ? '' : ' malformed-media'}" data-grid-id="${id}" data-asset-index="${index}" type="button" aria-label="Open ${title}" style="--asset-ratio:${safeDimensions ? `${Number(asset.width)}/${Number(asset.height)}` : '1'}"><span class="asset-thumb"><img src="${escapeHtml(safeUrl(asset.preview))}"${srcset} alt="${title}" loading="lazy" decoding="async"${safeDimensions ? ` width="${Number(asset.width)}" height="${Number(asset.height)}"` : ''} data-image-fallback></span>${asset.animated ? '<span class="format-badge">GIF</span>' : ''}${isRestricted(asset) ? '<span class="lock" aria-label="Restricted original">●</span>' : ''}<span class="asset-overlay"><strong>${title}</strong><span>${escapeHtml(asset.category)} · ${Number(asset.width)}×${Number(asset.height)}</span></span></button>`;
}

export function renderAssetGrid(items, { batchSize = 8 } = {}) {
  if (!items.length) return '<div class="empty">No assets match these filters.</div>';
  const id = `asset-grid-${++serial}`;
  const state = { id, items, batchSize, visible: Math.min(batchSize, items.length), observer: null };
  registry.set(id, state);
  const more = state.visible < items.length;
  return `<section class="asset-grid-component" data-asset-grid="${id}" aria-label="Asset results"><div class="masonry" aria-live="polite">${items.slice(0, state.visible).map((item, index) => card(item, index, id)).join('')}</div><div class="grid-progress" hidden><span class="grid-spinner" aria-hidden="true"></span><span>Loading more assets…</span></div><button class="button button-dark load-more" type="button" ${more ? '' : 'hidden'}>Load more</button><div class="grid-sentinel" aria-hidden="true"></div></section>`;
}

export function mountAssetGrids(scope, onOpen) {
  scope.querySelectorAll('[data-asset-grid]').forEach(root => {
    const state = registry.get(root.dataset.assetGrid);
    if (!state || root.dataset.gridMounted) return;
    root.dataset.gridMounted = 'true';
    const bind = () => root.querySelectorAll('[data-asset-index]').forEach(button => {
      button.onclick = () => onOpen(state.items, Number(button.dataset.assetIndex), button);
    });
    const load = () => {
      if (state.visible >= state.items.length || !root.isConnected) return;
      const next = Math.min(state.visible + state.batchSize, state.items.length);
      root.querySelector('.masonry').insertAdjacentHTML('beforeend', state.items.slice(state.visible, next).map((item, index) => card(item, state.visible + index, state.id)).join(''));
      state.visible = next;
      root.querySelector('.load-more').hidden = state.visible >= state.items.length;
      if (state.visible >= state.items.length) state.observer?.disconnect();
      bind(); bindImageErrors(root);
    };
    root.querySelector('.load-more').onclick = load;
    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) load(); }, { rootMargin: '240px 0px' });
      state.observer.observe(root.querySelector('.grid-sentinel'));
    }
    bind(); bindImageErrors(root);
  });
}

export function disposeAssetGrids(scope = document) {
  scope.querySelectorAll('[data-asset-grid]').forEach(root => {
    const state = registry.get(root.dataset.assetGrid);
    state?.observer?.disconnect();
    registry.delete(root.dataset.assetGrid);
  });
}

export const activeGridCount = () => registry.size;
