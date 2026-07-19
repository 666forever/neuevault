import { repository } from './src/data/repository.js';
import { disposeAssetGrids } from './src/components/AssetGrid.js';
import { createPages } from './src/pages/pages.js';
import { activeNavigation, assetRoute, legacyHashPath, parseRoute } from './src/routing/routes.js';
import { AssetModal } from './src/overlays/AssetModal.js';
import { AuthDialog } from './src/overlays/AuthDialog.js';
import { trapDialogKey } from './src/overlays/dialog.js';
import { disposeAnimatedCovers } from './src/components/cards.js';
import { AuthClient } from './src/auth/AuthClient.js';

const app = document.querySelector('#app');
const modalElement = document.querySelector('#asset-modal');
const authElement = document.querySelector('#auth-dialog');
const toastElement = document.querySelector('#toast');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const BASE_TITLE = 'Banners & Icons with intent';
const allAssets = repository.getAssets();

const showToast = message => {
  toastElement.textContent = message; toastElement.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toastElement.classList.remove('show'), 2200);
};

const auth = new AuthClient();
const assetModal = new AssetModal(modalElement, repository, showToast, auth);
const authDialog = new AuthDialog(authElement, assetModal, auth, showToast);
assetModal.setAuthDialog(authDialog);
let pageCleanup = null;

function closeMenu() {
  mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation menu');
}

function currentUrl() { return `${location.pathname}${location.search}`; }
function cleanBackground(value) {
  if (!value || typeof value !== 'string') return null;
  const route = parseRoute(value); return route.name === 'asset' || route.name === 'notFound' ? null : value;
}
function defaultAssetContext(asset) {
  const type = String(asset.category || '').toLowerCase();
  return ['icons', 'banners', 'animated', 'wallpapers'].includes(type) ? `/${type}` : '/recent';
}
function itemsForContext(value) {
  const route = parseRoute(value);
  if (route.name === 'type') return allAssets.filter(asset => asset.category === route.params.type);
  if (route.name === 'collection') return allAssets.filter(asset => asset.collectionSlugs.includes(route.params.slug));
  if (route.name === 'category') { const category = repository.getCategory(route.params.slug); return category ? repository.getAssetsForCategory(category) : allAssets; }
  return allAssets;
}

function disposePage() {
  pageCleanup?.(); pageCleanup = null; disposeAssetGrids(app); disposeAnimatedCovers(app);
}

const pages = createPages(repository, app, (items, index, trigger) => {
  const asset = items[index]; if (!asset) return;
  const backgroundUrl = currentUrl();
  history.pushState({ assetModal: true, backgroundUrl }, '', assetRoute(asset));
  assetModal.open(items, index, trigger); updateRouteMetadata(parseRoute(location));
});

function renderPage(route) {
  if (route.name === 'home') pageCleanup = pages.home();
  else if (route.name === 'collections') pages.collectionsPage();
  else if (route.name === 'collection') pages.collectionPage(route.params.slug);
  else if (route.name === 'category') pages.categoryPage(route.params.slug);
  else if (route.name === 'recent') pages.recentPage();
  else if (route.name === 'type') pageCleanup = pages.typePage(route.params.type);
  else if (route.name === 'search') pageCleanup = pages.searchPage(route.query);
  else if (route.name === 'about') pages.aboutPage();
  else pages.notFound();
}

function updateRouteMetadata(route, backgroundRoute = null, asset = null) {
  const active = activeNavigation(route, backgroundRoute);
  document.querySelectorAll('[data-nav]').forEach(link => {
    const selected = link.dataset.nav === active;
    link.classList.toggle('active', selected); if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  const title = asset?.title || ({ recent: 'Recently Added', icons: 'Icons', banners: 'Banners', animated: 'Animated', wallpapers: 'Wallpapers', search: 'Search', about: 'About', collections: 'Collections' })[active];
  document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
  const canonical = document.querySelector('#canonical-url');
  if (canonical) canonical.href = `https://www.pfseeker.com${location.pathname}`;
}

function route({ scroll = true } = {}) {
  const current = parseRoute(location);
  authDialog.close();
  if (current.name === 'asset') {
    const asset = repository.getAsset(current.params.id);
    if (!asset) { disposePage(); assetModal.close({ restoreFocus: false }); pages.notFound(); updateRouteMetadata(current); return; }
    const canonicalAssetPath = assetRoute(asset);
    if (location.pathname !== canonicalAssetPath) history.replaceState(history.state, '', canonicalAssetPath);
    const backgroundUrl = cleanBackground(history.state?.backgroundUrl) || defaultAssetContext(asset);
    const backgroundRoute = parseRoute(backgroundUrl);
    if (app.dataset.route !== backgroundUrl) {
      disposePage(); renderPage(backgroundRoute); app.dataset.route = backgroundUrl;
    }
    const items = itemsForContext(backgroundUrl); const index = items.findIndex(item => item.id === asset.id);
    assetModal.open(index >= 0 ? items : allAssets, index >= 0 ? index : allAssets.findIndex(item => item.id === asset.id), null);
    updateRouteMetadata(current, backgroundRoute, asset); closeMenu(); return;
  }
  if (app.dataset.route === currentUrl() && !modalElement.hidden) {
    assetModal.close(); updateRouteMetadata(current); closeMenu(); return;
  }
  disposePage(); assetModal.close({ restoreFocus: false }); renderPage(current); app.dataset.route = currentUrl();
  updateRouteMetadata(current); closeMenu(); if (scroll) window.scrollTo(0, 0);
}

assetModal.setRouteHandlers({
  close: () => history.state?.assetModal ? history.back() : navigate(cleanBackground(history.state?.backgroundUrl) || '/recent', { replace: true }),
  step: asset => { history.replaceState({ ...history.state, assetModal: true }, '', assetRoute(asset)); updateRouteMetadata(parseRoute(location), parseRoute(history.state?.backgroundUrl || defaultAssetContext(asset)), asset); },
});

function navigate(url, { replace = false } = {}) {
  const target = new URL(url, location.origin);
  if (target.origin !== location.origin) { location.assign(target.href); return; }
  history[replace ? 'replaceState' : 'pushState']({}, '', `${target.pathname}${target.search}`); route();
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const target = new URL(link.href, location.href);
  if (target.origin !== location.origin || target.pathname.startsWith('/api/')) return;
  event.preventDefault(); navigate(target.href);
});

menuToggle.onclick = () => {
  const open = mainNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
};
mainNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

function renderAuthControls() {
  document.querySelectorAll('.sign-in, .sign-in-mobile').forEach(button => {
    const label = auth.state.loading ? 'Checking sign in…' : auth.state.authenticated ? auth.state.user.displayName : auth.state.configured ? 'Sign in' : 'Sign in unavailable';
    const accessibleLabel = auth.state.configured && !auth.state.authenticated ? 'Sign in with Discord' : label;
    button.replaceChildren();
    if (!auth.state.authenticated) { const icon = document.createElement('span'); icon.className = 'nav-control-icon discord-icon'; icon.setAttribute('aria-hidden', 'true'); button.append(icon); }
    const text = document.createElement('span'); text.textContent = label; button.append(text);
    button.setAttribute('aria-label', accessibleLabel); button.disabled = auth.state.loading;
    button.onclick = () => authDialog.open(allAssets.find(asset => asset.requiresDiscordAuth));
  });
}
auth.addEventListener('change', () => { renderAuthControls(); assetModal.syncAuthState(); }); renderAuthControls(); auth.load();

document.addEventListener('keydown', event => {
  if (!authElement.hidden) { trapDialogKey(event, authElement, () => authDialog.close()); return; }
  if (!modalElement.hidden) {
    if (trapDialogKey(event, modalElement, () => assetModal.requestClose())) return;
    if (event.key === 'ArrowLeft') assetModal.step(-1);
    if (event.key === 'ArrowRight') assetModal.step(1);
  }
});
window.addEventListener('popstate', () => route({ scroll: false }));

const migrated = legacyHashPath(location.hash);
if (migrated) history.replaceState({}, '', migrated);
route();
