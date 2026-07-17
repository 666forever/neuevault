import { escapeHtml } from '../utils/escape.js';
import { syncScrollLock } from './dialog.js';

export class AuthDialog {
  constructor(element, assetModal) { this.element = element; this.assetModal = assetModal; }
  open(asset) {
    this.element.innerHTML = `<div class="auth-dialog-card"><button class="auth-close" type="button" aria-label="Close sign-in dialog">×</button><p class="eyebrow">Restricted asset</p><h2 id="auth-title">Authentication unavailable</h2><p><strong>${escapeHtml(asset.title)}</strong> has a preview available, but its original is restricted. Production authentication is intentionally disabled.</p><button class="button button-accent auth-continue" type="button" disabled>Discord sign-in unavailable</button><p class="integration-status">A future trusted backend will own OAuth, sessions, access checks, and protected file delivery. This prototype does not call those placeholder routes.</p></div>`;
    this.element.hidden = false; syncScrollLock(this.element, this.assetModal.element);
    this.element.querySelector('.auth-close').onclick = () => this.close();
    this.element.querySelector('.auth-close').focus();
  }
  close() {
    this.element.hidden = true; this.element.innerHTML = ''; syncScrollLock(this.element, this.assetModal.element);
    this.assetModal.element.querySelector('.download-action')?.focus();
  }
}
