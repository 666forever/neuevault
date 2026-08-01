import { renderAssetGrid, disposeAssetGrids, mountAssetGrids } from '../components/AssetGrid.js';
import { bindAnimatedCovers, categoryCard, collectionCard } from '../components/cards.js';
import { bindImageErrors } from '../components/images.js';
import { Button } from '../ui/Button.js';
import { escapeHtml, safeUrl } from '../utils/escape.js';
import { sortAssets } from '../utils/filter.js';
import { countDescription } from '../utils/content.js';
import { loadLazyModule } from '../utils/lazy.js';

export function createPages(repository, app, openAsset) {
  const assets = repository.getAssets();
  const collections = repository.getCollections();
  const categories = repository.getCategories();
  const mount = () => { mountAssetGrids(app, openAsset); bindImageErrors(app); bindAnimatedCovers(app); };

  function home() {
    const featured = collections.filter(collection => collection.featured).slice(0, 3);
    const categorySection = categories.length ? `<section class="category-grid" aria-label="Browse categories">${categories.map(categoryCard).join('')}</section>` : '';
    const collectionSection = featured.length ? `<section class="section collection-section"><div class="section-head"><div><h2>Popular Collections</h2><p>Curated packs worth keeping close.</p></div><a class="text-link" href="/collections">View all</a></div><div class="collection-grid">${featured.map(collectionCard).join('')}</div></section>` : '';
    app.innerHTML = `<div class="page"><section class="hero"><img class="hero-media" src="/assets/video/heronew.gif" alt="" aria-hidden="true"><div class="hero-gradient" aria-hidden="true"></div><div class="hero-content"><h1>Timeless. Bold. Forever.</h1><p class="hero-description"><span>Start digging through alt, emo, dark, soft, strange, cute, messy, and more in the spaces where they all cross.</span> <span>Your identity forms in this borderland.</span></p>${Button({ label: 'Collections', icon: 'bolt', iconClassName: 'hero-cta-icon', href: '/collections', variant: 'accent', size: 'large', className: 'hero-cta' })}</div></section>${categorySection}</div>${collectionSection}<section class="section recent-section"><div class="section-head"><div><h2>Recently Added</h2><p>The newest finds, in every format.</p></div><a class="text-link" href="/recent">Browse archive</a></div>${renderAssetGrid(assets.slice(0, 8))}</section>`;
    mount();
    return () => {};
  }
  function collectionsPage() {
    const content = collections.length ? `<div class="collection-grid">${collections.map(collectionCard).join('')}</div>` : '<section class="route-state route-empty" aria-labelledby="collections-empty-title"><h2 id="collections-empty-title">No public collections yet.</h2><p>Collections will appear here when they are marked public in the local content manager.</p></section>';
    app.innerHTML = `<div class="page route-page"><div class="page-title route-page-title"><p class="eyebrow">Curated sets</p><h1>Collections</h1><p>Counts reflect current membership in the local archive.</p></div>${content}</div>`; bindImageErrors(app); bindAnimatedCovers(app);
  }
  function categoryPage(slug) {
    const category = repository.getCategory(slug); if (!category) return notFound();
    const list = repository.getAssetsForCategory(category);
    app.innerHTML = `<div class="page route-page"><div class="page-title route-page-title">${Button({ label: 'Home', icon: 'back', href: '/', variant: 'text', size: 'compact', className: 'back-link' })}<p class="eyebrow">Category</p><h1>${escapeHtml(category.title)}</h1><p>${escapeHtml(countDescription(category.count, category.description))}</p></div>${list.length ? renderAssetGrid(list) : '<section class="route-state route-empty" aria-labelledby="category-empty-title"><h2 id="category-empty-title">This category is empty.</h2><p>Its filter can be edited in the local content manager.</p></section>'}</div>`;
    mount();
  }
  function collectionPage(slug) {
    const collection = repository.getCollection(slug); if (!collection) return notFound();
    const list = assets.filter(asset => asset.collectionSlugs.includes(slug));
    app.innerHTML = `<div class="page route-page route-detail-page"><section class="route-hero"><img src="${escapeHtml(safeUrl(collection.cover))}" alt="" data-image-fallback><div class="route-copy">${Button({ label: 'All collections', icon: 'back', href: '/collections', variant: 'text', size: 'compact', className: 'back-link' })}<h1>${escapeHtml(collection.title)}</h1><p>${escapeHtml(countDescription(collection.count, collection.description))}</p><div class="tags">${collection.tags.map(tag => `<a class="tag" href="/search?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join('')}${collection.restricted ? '<span class="tag">Includes restricted originals</span>' : ''}</div></div></section><div class="toolbar route-results-toolbar"><p>${list.length} preview asset${list.length === 1 ? '' : 's'} shown</p><label for="sort-assets">Sort</label><select class="select" id="sort-assets"><option value="new">Newest first</option><option value="title">Title A–Z</option></select></div><div id="collection-assets">${renderAssetGrid(list)}</div></div>`;
    const result = app.querySelector('#collection-assets');
    app.querySelector('#sort-assets').onchange = event => { disposeAssetGrids(result); result.innerHTML = renderAssetGrid(sortAssets(list, event.target.value)); mountAssetGrids(result, openAsset); };
    mount();
  }
  function recentPage() {
    app.innerHTML = `<div class="page route-page"><div class="page-title route-page-title"><p class="eyebrow">Fresh from the vault</p><h1>Recently Added</h1><p>New icons, banners, animations, and wallpapers—ordered by upload date.</p></div>${renderAssetGrid(sortAssets(assets))}</div>`; mount();
  }
  async function searchPage(params, isCurrent = () => true) {
    const { renderSearchPage } = await loadLazyModule(() => import('./searchPage.js'));
    if (!isCurrent()) return null;
    return renderSearchPage({ app, assets, openAsset, params });
  }
  function aboutPage() { app.innerHTML = '<div class="page route-page about-wrap"><div class="about-heading"><p class="eyebrow">About the archive</p><h1>Saved with intent.</h1></div><div class="about-copy"><p>Neuevault is an independently curated visual archive for images worth returning to.</p><p>Public originals need no account. Assets explicitly marked as restricted require Discord authentication and a server-side access decision.</p><p>No feed-chasing. No filler. Just a growing, human-made library.</p></div></div>'; }
  async function typePage(type, isCurrent = () => true) {
    const { renderSearchPage } = await loadLazyModule(() => import('./searchPage.js'));
    if (!isCurrent()) return null;
    return renderSearchPage({ app, assets, openAsset, params: new URLSearchParams({ type }), variant: 'archive' });
  }
  function notFound() { app.innerHTML = '<div class="page route-page"><section class="route-state route-not-found" aria-labelledby="not-found-title"><p class="eyebrow">404</p><h1 id="not-found-title">Nothing here.</h1><p>This corner of the vault is empty. <a class="text-link" href="/">Return home</a></p></section></div>'; }
  return { home, collectionsPage, collectionPage, categoryPage, recentPage, typePage, searchPage, aboutPage, notFound, mount };
}
