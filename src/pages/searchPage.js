import { disposeAssetGrids, mountAssetGrids, renderAssetGrid } from '../components/AssetGrid.js';
import { debounce, escapeHtml } from '../utils/escape.js';
import { filterAssets } from '../utils/filter.js';

export const SEARCH_TYPES = Object.freeze(['All', 'Icons', 'Banners', 'Animated', 'Wallpapers', 'Portrait', 'Landscape']);

export function readSearchState(params) {
  return {
    query: params.get('q') || '',
    type: params.get('type') || 'All',
    tag: params.get('tag') || '',
    category: params.get('category') || '',
  };
}

export function renderSearchPage({ app, assets, openAsset, params, variant = 'search' }) {
  const { query: initialQuery, type: initialType, tag, category } = readSearchState(params);
  const archive = variant === 'archive';
  const heading = archive && SEARCH_TYPES.includes(initialType) && initialType !== 'All' ? initialType : 'Search the vault';
  app.innerHTML = `<div class="page search-page ${archive ? 'route-page route-archive-page' : ''}"><div class="search-content"><div class="page-title ${archive ? 'route-page-title' : ''}"><p class="eyebrow">Find an image</p><h1>${escapeHtml(heading)}</h1><p>Search titles, tags, categories, and collections.</p></div><form class="search-panel" role="search"><div class="search-row"><label class="visually-hidden" for="search-input">Search assets</label><input class="search-input" id="search-input" type="search" value="${escapeHtml(initialQuery)}" placeholder="Try “gothic”, “banner”, or “night”…"><label class="visually-hidden" for="access-filter">Filter by access</label><select class="select" id="access-filter"><option value="all">All access</option><option value="public">Public</option><option value="restricted">Restricted originals</option></select></div><div class="filter-group" role="group" aria-labelledby="asset-type-filter-label"><span class="visually-hidden" id="asset-type-filter-label">Asset type filters</span><div class="filter-list">${SEARCH_TYPES.map(filter => `<button class="filter ${filter === initialType ? 'active' : ''}" data-filter="${filter}" type="button" aria-pressed="${filter === initialType}">${filter}</button>`).join('')}</div></div></form><div class="section-head search-results-toolbar"><div><h2 id="results-title">${tag ? `Tag: ${escapeHtml(tag)}` : category ? `Category: ${escapeHtml(category)}` : 'All assets'}</h2><p id="results-count"></p></div></div></div><div id="search-results"></div></div>`;
  let current = initialType;
  const results = app.querySelector('#search-results');
  const render = () => {
    disposeAssetGrids(results);
    const list = filterAssets(assets, { query: app.querySelector('#search-input').value, type: current, access: app.querySelector('#access-filter').value, tag, category });
    results.innerHTML = list.length
      ? renderAssetGrid(list)
      : '<section class="search-empty" aria-labelledby="search-empty-title"><h2 id="search-empty-title">No matching assets</h2><p>No assets match these filters.</p></section>';
    app.querySelector('#results-count').textContent = `${list.length} preview result${list.length === 1 ? '' : 's'}`;
    mountAssetGrids(results, openAsset);
  };
  const debouncedRender = debounce(render, 180);
  app.querySelector('.search-panel').addEventListener('submit', event => event.preventDefault());
  app.querySelector('#search-input').addEventListener('input', debouncedRender);
  app.querySelector('#access-filter').addEventListener('change', render);
  app.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    app.querySelector('.filter.active')?.classList.remove('active');
    app.querySelector('.filter[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
    button.classList.add('active'); button.setAttribute('aria-pressed', 'true'); current = button.dataset.filter; render();
  }));
  render();
  return () => debouncedRender.cancel();
}
