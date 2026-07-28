import { canDownloadOriginal, getDisplaySource, isRestricted } from '../data/access.js';
import { assetRoute } from '../routing/routes.js';
import { escapeHtml, safeUrl, slugify } from '../utils/escape.js';
import { bindImageErrors } from '../components/images.js';
import { syncScrollLock } from './dialog.js';
import { enhanceRollingControls } from '../components/rollingControls.js';
import { IconButton } from '../ui/IconButton.js';
import { Button } from '../ui/Button.js';

export class AssetModal {
  constructor(element, repository, toast, auth) {
    this.element = element; this.repository = repository; this.toast = toast;
    this.items = []; this.index = 0; this.origin = null; this.authDialog = null; this.auth = auth; this.routeHandlers = {};
  }
  setAuthDialog(dialog) { this.authDialog = dialog; }
  setRouteHandlers(handlers) { this.routeHandlers = handlers || {}; }
  open(items, index, trigger = null) {
    if (this.element.hidden) this.origin = trigger || document.activeElement;
    this.items = items; this.index = index; this.render();
  }
  render() {
    const asset = this.items[this.index]; if (!asset) return;
    const collection = this.repository.getCollection(asset.collection);
    const restricted = isRestricted(asset);
    const source = safeUrl(getDisplaySource(asset));
    this.element.innerHTML = `<div class="modal-shell"><div class="modal-preview"><img src="${escapeHtml(source)}" alt="${escapeHtml(asset.title)}" data-image-fallback>${IconButton({ icon: 'close', label: 'Close viewer', className: 'modal-close' })}${IconButton({ icon: 'previous', label: 'Previous asset', className: 'modal-nav prev', disabled: this.items.length < 2 })}${IconButton({ icon: 'next', label: 'Next asset', className: 'modal-nav next', disabled: this.items.length < 2 })}</div><aside class="modal-info" data-lenis-prevent><div class="modal-info-content"><p class="eyebrow">${restricted ? 'Restricted preview' : 'Public download'}</p><h2 id="modal-title">${escapeHtml(asset.title)}</h2><dl class="meta-list"><div class="meta-row"><dt>Category</dt><dd>${escapeHtml(asset.category)}</dd></div><div class="meta-row"><dt>Collection</dt><dd>${escapeHtml(collection?.title || 'Independent')}</dd></div><div class="meta-row"><dt>Dimensions</dt><dd>${Number(asset.width)} × ${Number(asset.height)}</dd></div><div class="meta-row"><dt>File</dt><dd>${escapeHtml(asset.fileType)} · ${escapeHtml(asset.fileSize)}</dd></div><div class="meta-row"><dt>Uploaded</dt><dd>${escapeHtml(new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${asset.uploadDate}T12:00:00`)))}</dd></div></dl>${restricted ? '<p class="auth-note">The preview is public. The original is available only after server-side authentication and authorization.</p>' : ''}</div><div class="modal-actions">${Button({ label: restricted ? 'Restricted original' : 'Download original', icon: restricted ? 'restricted' : 'download', variant: 'accent', size: 'large', className: 'download-action' })}${Button({ label: 'Copy link', icon: 'share', variant: 'dark', className: 'share-action' })}</div></aside></div>`;
    this.element.hidden = false; syncScrollLock(this.element, this.authDialog?.element);
    bindImageErrors(this.element);
    this.element.querySelector('.modal-close').onclick = () => this.requestClose();
    this.element.querySelector('.prev').onclick = () => this.step(-1);
    this.element.querySelector('.next').onclick = () => this.step(1);
    this.element.querySelector('.share-action').onclick = () => this.copyLink(asset);
    this.syncAuthState();
    enhanceRollingControls(this.element);
    this.element.querySelector('.modal-close').focus();
  }
  syncAuthState() {
    const asset = this.items[this.index]; let downloadAction = this.element.querySelector('.download-action');
    if (!asset || !downloadAction) return;
    const restricted = isRestricted(asset);
    if (restricted) {
      const label = this.auth.state.authenticated ? 'Download restricted original' : this.auth.state.configured ? 'Sign in to download' : 'Authentication unavailable';
      downloadAction.outerHTML = Button({ label, icon: this.auth.state.authenticated ? 'download' : 'restricted', variant: 'accent', size: 'large', className: 'download-action' });
      downloadAction = this.element.querySelector('.download-action'); enhanceRollingControls(this.element);
    }
    downloadAction.onclick = () => restricted ? (this.auth.state.authenticated ? this.downloadRestricted(asset) : this.authDialog.open(asset)) : this.download(asset);
  }
  step(delta) { this.index = (this.index + delta + this.items.length) % this.items.length; this.render(); this.routeHandlers.step?.(this.items[this.index]); }
  requestClose() { if (this.routeHandlers.close) this.routeHandlers.close(); else this.close(); }
  close({ restoreFocus = true } = {}) {
    if (this.element.hidden) return;
    this.element.hidden = true; this.element.innerHTML = ''; syncScrollLock(this.element, this.authDialog?.element);
    if (restoreFocus && this.origin?.isConnected) this.origin.focus();
    this.origin = null;
  }
  async copyLink(asset) {
    const url = new URL(assetRoute(asset), location.origin).href;
    try { await navigator.clipboard.writeText(url); this.toast('Asset link copied.'); } catch { this.toast(url); }
  }
  async download(asset) {
    if (!canDownloadOriginal(asset)) { this.toast('This original is not publicly available.'); return; }
    this.toast('Preparing original file…');
    try {
      const response = await fetch(safeUrl(asset.downloadUrl || asset.src)); if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `${asset.id}-${slugify(asset.title)}.${asset.fileType.toLowerCase()}`; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); this.toast('Original download started.');
    } catch { this.toast('The original could not be downloaded. Please try again later.'); }
  }
  async downloadRestricted(asset) {
    this.toast('Preparing protected original…');
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(asset.id)}`, { credentials: 'same-origin', redirect: 'follow' });
      if (response.status === 401) { await this.auth.load(); this.authDialog.open(asset); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `${asset.id}-${slugify(asset.title)}.${asset.fileType.toLowerCase()}`; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); this.toast('Protected download started.');
    } catch { this.toast('The protected original could not be downloaded.'); }
  }
}
