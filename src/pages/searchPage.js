import { disposeAssetGrids, mountAssetGrids, renderAssetGrid } from '../components/AssetGrid.js';
import { debounce, escapeHtml } from '../utils/escape.js';
import { filterAssets } from '../utils/filter.js';

export function renderSearchPage({ app, assets, openAsset, params }) {
  const initialQuery = params.get('q') || '';
  const initialType = params.get('type') || 'All';
  const tag = params.get('tag') || '';
  const category = params.get('category') || '';
  app.innerHTML = `<div class="page"><div class="page-title"><p class="eyebrow">Find an image</p><h1>Search the vault</h1><p>Search titles, tags, categories, and collections.</p></div><section class="search-panel"><div class="search-row"><input class="search-input" id="search-input" type="search" value="${escapeHtml(initialQuery)}" placeholder="Try “gothic”, “banner”, or “night”…" aria-label="Search assets"><select class="select" id="access-filter" aria-label="Filter by access"><option value="all">All access</option><option value="public">Public</option><option value="restricted">Restricted originals</option></select></div><div class="filter-list" aria-label="Asset type filters">${['All', 'Icons', 'Banners', 'Animated', 'Wallpapers', 'Portrait', 'Landscape'].map(filter => `<button class="filter ${filter === initialType ? 'active' : ''}" data-filter="${filter}" type="button">${filter}</button>`).join('')}</div></section><div class="section-head"><div><h2 id="results-title">${tag ? `Tag: ${escapeHtml(tag)}` : category ? `Category: ${escapeHtml(category)}` : 'All assets'}</h2><p id="results-count"></p></div></div><div id="search-results"></div></div>`;
  let current = initialType;
  const results = app.querySelector('#search-results');
  const render = () => {
    disposeAssetGrids(results);
    const list = filterAssets(assets, { query: app.querySelector('#search-input').value, type: current, access: app.querySelector('#access-filter').value, tag, category });
    results.innerHTML = renderAssetGrid(list);
    app.querySelector('#results-count').textContent = `${list.length} preview result${list.length === 1 ? '' : 's'}`;
    mountAssetGrids(results, openAsset);
  };
  const debouncedRender = debounce(render, 180);
  app.querySelector('#search-input').addEventListener('input', debouncedRender);
  app.querySelector('#access-filter').addEventListener('change', render);
  app.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    app.querySelector('.filter.active')?.classList.remove('active');
    button.classList.add('active'); current = button.dataset.filter; render();
  }));
  render();
  return () => debouncedRender.cancel();
}
