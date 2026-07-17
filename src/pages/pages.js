import { renderAssetGrid, disposeAssetGrids, mountAssetGrids } from '../components/AssetGrid.js';
import { collectionCard } from '../components/cards.js';
import { bindImageErrors } from '../components/images.js';
import { debounce, escapeHtml, safeUrl } from '../utils/escape.js';
import { filterAssets, sortAssets } from '../utils/filter.js';

export function createPages(repository, app, openAsset) {
  const assets = repository.getAssets();
  const collections = repository.getCollections();
  const categories = repository.getCategories();
  const mount = () => { mountAssetGrids(app, openAsset); bindImageErrors(app); };

  function home() {
    app.innerHTML = `<div class="page"><section class="hero"><div class="hero-content"><p class="eyebrow">The independent visual archive</p><h1>Collecting the Best Images on the Internet</h1><p>Neuevault® is a growing visual archive shaped by careful curation. Discover icons, banners, animations, wallpapers, and themed collections.</p><a class="button button-accent" href="#/recent">↯ Browse the vault</a></div></section><section class="category-grid" aria-label="Icon categories">${categories.map(category => `<a class="category-card" href="#/search?tag=${encodeURIComponent(category.filterTag)}"><img src="${escapeHtml(safeUrl(category.image))}" alt="" loading="lazy" data-image-fallback><span class="category-copy"><small>${Number(category.count)} in full archive</small><h2>${escapeHtml(category.title)}</h2></span></a>`).join('')}</section></div><section class="section"><div class="section-head"><div><h2>Popular Collections</h2><p>Curated packs worth keeping close.</p></div><a class="text-link" href="#/collections">View all</a></div><div class="collection-grid">${collections.slice(0, 3).map(collectionCard).join('')}</div></section><section class="section recent-section"><div class="section-head"><div><h2>Recently Added</h2><p>The newest finds, in every format.</p></div><a class="text-link" href="#/recent">Browse archive</a></div>${renderAssetGrid(assets.slice(0, 8))}</section>`;
    mount();
  }
  function collectionsPage() {
    app.innerHTML = `<div class="page"><div class="page-title"><p class="eyebrow">Curated sets</p><h1>Collections</h1><p>Counts describe the full archive; cards inside this prototype are labeled as previews.</p></div><div class="collection-grid">${collections.map(collectionCard).join('')}</div></div>`; bindImageErrors(app);
  }
  function collectionPage(slug) {
    const collection = repository.getCollection(slug); if (!collection) return notFound();
    const list = assets.filter(asset => asset.collection === slug);
    app.innerHTML = `<div class="page"><section class="route-hero"><img src="${escapeHtml(safeUrl(collection.cover))}" alt="" data-image-fallback><div class="route-copy"><a class="back-link" href="#/collections">← All collections</a><h1>${escapeHtml(collection.title)}</h1><p>${escapeHtml(collection.description)} ${Number(collection.count)} assets in the full archive.</p><div class="tags">${collection.tags.map(tag => `<a class="tag" href="#/search?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join('')}${collection.restricted ? '<span class="tag">Includes restricted originals</span>' : ''}</div></div></section><div class="toolbar"><p>${list.length} preview asset${list.length === 1 ? '' : 's'} shown</p><label for="sort-assets">Sort</label><select class="select" id="sort-assets"><option value="new">Newest first</option><option value="title">Title A–Z</option></select></div><div id="collection-assets">${renderAssetGrid(list)}</div></div>`;
    const result = app.querySelector('#collection-assets');
    app.querySelector('#sort-assets').onchange = event => { disposeAssetGrids(result); result.innerHTML = renderAssetGrid(sortAssets(list, event.target.value)); mountAssetGrids(result, openAsset); };
    mount();
  }
  function recentPage() {
    app.innerHTML = `<div class="page"><div class="page-title"><p class="eyebrow">Fresh from the vault</p><h1>Recently Added</h1><p>New icons, banners, animations, and wallpapers—ordered by upload date.</p></div>${renderAssetGrid(sortAssets(assets))}</div>`; mount();
  }
  function searchPage(params) {
    const initialQuery = params.get('q') || ''; const initialType = params.get('type') || 'All'; const tag = params.get('tag') || ''; const category = params.get('category') || '';
    app.innerHTML = `<div class="page"><div class="page-title"><p class="eyebrow">Find an image</p><h1>Search the vault</h1><p>Search titles, tags, categories, and collections.</p></div><section class="search-panel"><div class="search-row"><input class="search-input" id="search-input" type="search" value="${escapeHtml(initialQuery)}" placeholder="Try “gothic”, “banner”, or “night”…" aria-label="Search assets"><select class="select" id="access-filter" aria-label="Filter by access"><option value="all">All access</option><option value="public">Public</option><option value="restricted">Restricted originals</option></select></div><div class="filter-list" aria-label="Asset type filters">${['All', 'Icons', 'Banners', 'Animated', 'Wallpapers', 'Portrait', 'Landscape'].map(filter => `<button class="filter ${filter === initialType ? 'active' : ''}" data-filter="${filter}" type="button">${filter}</button>`).join('')}</div></section><div class="section-head"><div><h2 id="results-title">${tag ? `Tag: ${escapeHtml(tag)}` : category ? `Category: ${escapeHtml(category)}` : 'All assets'}</h2><p id="results-count"></p></div></div><div id="search-results"></div></div>`;
    let current = initialType; const results = app.querySelector('#search-results');
    const render = () => {
      disposeAssetGrids(results);
      const list = filterAssets(assets, { query: app.querySelector('#search-input').value, type: current, access: app.querySelector('#access-filter').value, tag, category });
      results.innerHTML = renderAssetGrid(list); app.querySelector('#results-count').textContent = `${list.length} preview result${list.length === 1 ? '' : 's'}`; mountAssetGrids(results, openAsset);
    };
    const debouncedRender = debounce(render, 180);
    app.querySelector('#search-input').addEventListener('input', debouncedRender);
    app.querySelector('#access-filter').addEventListener('change', render);
    app.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { app.querySelector('.filter.active')?.classList.remove('active'); button.classList.add('active'); current = button.dataset.filter; render(); }));
    render(); return () => debouncedRender.cancel();
  }
  function aboutPage() { app.innerHTML = '<div class="page about-wrap"><div><p class="eyebrow">About the archive</p><h1>Saved with intent.</h1></div><div class="about-copy"><p>Neuevault is an independently curated visual archive for images worth returning to.</p><p>Most files are public. Restricted originals remain unavailable while production authentication is intentionally disabled.</p><p>No feed-chasing. No filler. Just a growing, human-made library.</p></div></div>'; }
  function notFound() { app.innerHTML = '<div class="page"><div class="page-title"><p class="eyebrow">404</p><h1>Nothing here.</h1><p>This corner of the vault is empty. <a class="text-link" href="#/">Return home</a></p></div></div>'; }
  return { home, collectionsPage, collectionPage, recentPage, searchPage, aboutPage, notFound, mount };
}
