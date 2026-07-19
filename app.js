import { repository } from './src/data/repository.js';
import { disposeAssetGrids } from './src/components/AssetGrid.js';
import { createPages } from './src/pages/pages.js';
import { parseRoute } from './src/routing/routes.js';
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

const showToast = message => {
  toastElement.textContent = message; toastElement.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toastElement.classList.remove('show'), 2200);
};

const auth = new AuthClient();
const assetModal = new AssetModal(modalElement, repository, showToast, auth);
const authDialog = new AuthDialog(authElement, assetModal, auth, showToast);
assetModal.setAuthDialog(authDialog);
const pages = createPages(repository, app, (items, index, trigger) => assetModal.open(items, index, trigger));
let pageCleanup = null;

function closeMenu() {
  mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation menu');
}

function route() {
  pageCleanup?.(); pageCleanup = null; assetModal.close({ restoreFocus: false }); authDialog.close(); disposeAssetGrids(app); disposeAnimatedCovers(app);
  const current = parseRoute(location.hash);
  document.querySelectorAll('.main-nav a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current.path}`));
  if (current.name === 'home') pageCleanup = pages.home();
  else if (current.name === 'collections') pages.collectionsPage();
  else if (current.name === 'collection') pages.collectionPage(current.params.slug);
  else if (current.name === 'category') pages.categoryPage(current.params.slug);
  else if (current.name === 'recent') pages.recentPage();
  else if (current.name === 'search') pageCleanup = pages.searchPage(current.query);
  else if (current.name === 'about') pages.aboutPage();
  else if (current.name === 'asset') {
    pageCleanup = pages.home(); const asset = repository.getAsset(current.params.id);
    if (asset) assetModal.open(repository.getAssets(), repository.getAssets().findIndex(item => item.id === asset.id), app);
    else pages.notFound();
  } else pages.notFound();
  closeMenu(); window.scrollTo(0, 0);
}

menuToggle.onclick = () => {
  const open = mainNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
};
mainNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
function renderAuthControls() {
  document.querySelectorAll('.sign-in, .sign-in-mobile').forEach(button => {
    const label = auth.state.loading ? 'Checking sign in…' : auth.state.authenticated ? auth.state.user.displayName : auth.state.configured ? 'Sign in with Discord' : 'Sign in unavailable';
    button.replaceChildren();
    if (!auth.state.authenticated) {
      const icon = document.createElement('span'); icon.className = 'nav-control-icon discord-icon'; icon.setAttribute('aria-hidden', 'true'); button.append(icon);
    }
    const text = document.createElement('span'); text.textContent = label; button.append(text);
    button.disabled = auth.state.loading; button.onclick = () => authDialog.open(repository.getAssets().find(asset => asset.requiresDiscordAuth));
  });
}
auth.addEventListener('change', renderAuthControls); renderAuthControls(); auth.load();

document.addEventListener('keydown', event => {
  if (!authElement.hidden) { trapDialogKey(event, authElement, () => authDialog.close()); return; }
  if (!modalElement.hidden) {
    if (trapDialogKey(event, modalElement, () => assetModal.close())) return;
    if (event.key === 'ArrowLeft') assetModal.step(-1);
    if (event.key === 'ArrowRight') assetModal.step(1);
  }
});
window.addEventListener('hashchange', route);
route();
