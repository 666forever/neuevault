import { escapeHtml } from '../utils/escape.js';
import { syncScrollLock } from './dialog.js';
import { enhanceRollingControls } from '../components/rollingControls.js';

export class AuthDialog {
  constructor(element, assetModal, auth, toast) { this.element = element; this.assetModal = assetModal; this.auth = auth; this.toast = toast; }
  open(asset) {
    const { loading, configured, authenticated, user } = this.auth.state;
    const context = asset ? `<strong>${escapeHtml(asset.title)}</strong> has a public preview, but its original requires an authenticated Discord account.` : 'Discord sign-in unlocks originals that are marked as restricted.';
    const title = loading ? 'Checking authentication' : authenticated ? 'Signed in' : configured ? 'Sign in with Discord' : 'Authentication unavailable';
    const action = authenticated ? '<button class="button button-dark auth-logout" type="button">Sign out</button>' : `<button class="button button-accent auth-continue" type="button" ${configured && !loading ? '' : 'disabled'}>${configured ? 'Continue with Discord' : 'Discord sign-in unavailable'}</button>`;
    const status = authenticated ? `Signed in as <strong>${escapeHtml(user.displayName)}</strong>.` : configured ? 'Discord handles identity; Neuevault never sends OAuth tokens to the browser.' : 'The required server secrets have not been configured. Restricted originals remain unavailable.';
    this.element.innerHTML = `<div class="auth-dialog-card" data-lenis-prevent><button class="auth-close" type="button" aria-label="Close sign-in dialog">×</button><p class="eyebrow">Restricted access</p><h2 id="auth-title">${title}</h2><p>${context}</p>${action}<p class="integration-status">${status}</p></div>`;
    this.element.hidden = false; syncScrollLock(this.element, this.assetModal.element);
    enhanceRollingControls(this.element);
    this.element.querySelector('.auth-close').onclick = () => this.close();
    this.element.querySelector('.auth-continue')?.addEventListener('click', event => { event.currentTarget.disabled = true; this.auth.signIn(`${location.pathname}${location.search}`); }, { once: true });
    this.element.querySelector('.auth-logout')?.addEventListener('click', async () => { try { await this.auth.logout(); this.close(); this.toast('Signed out.'); } catch { this.toast('Sign out could not be completed.'); } });
    this.element.querySelector('.auth-close').focus();
  }
  close() {
    this.element.hidden = true; this.element.innerHTML = ''; syncScrollLock(this.element, this.assetModal.element);
    this.assetModal.element.querySelector('.download-action')?.focus();
  }
}
