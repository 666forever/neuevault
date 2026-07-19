import { canDownloadOriginal, getDisplaySource, isRestricted } from '../data/access.js';
import { assetRoute } from '../routing/routes.js';
import { escapeHtml, safeUrl, slugify } from '../utils/escape.js';
import { bindImageErrors } from '../components/images.js';
import { syncScrollLock } from './dialog.js';

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
    this.element.innerHTML = `<div class="modal-shell"><div class="modal-preview"><img src="${escapeHtml(source)}" alt="${escapeHtml(asset.title)}" data-image-fallback><button class="modal-close" type="button" aria-label="Close viewer">×</button><button class="modal-nav prev" type="button" aria-label="Previous asset">←</button><button class="modal-nav next" type="button" aria-label="Next asset">→</button></div><aside class="modal-info"><p class="eyebrow">${restricted ? 'Restricted preview' : 'Public download'}</p><h2 id="modal-title">${escapeHtml(asset.title)}</h2><dl class="meta-list"><div class="meta-row"><dt>Category</dt><dd>${escapeHtml(asset.category)}</dd></div><div class="meta-row"><dt>Collection</dt><dd>${escapeHtml(collection?.title || 'Independent')}</dd></div><div class="meta-row"><dt>Dimensions</dt><dd>${Number(asset.width)} × ${Number(asset.height)}</dd></div><div class="meta-row"><dt>File</dt><dd>${escapeHtml(asset.fileType)} · ${escapeHtml(asset.fileSize)}</dd></div><div class="meta-row"><dt>Uploaded</dt><dd>${escapeHtml(new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${asset.uploadDate}T12:00:00`)))}</dd></div></dl><div class="modal-actions"><button class="button button-accent download-action" type="button">${restricted ? 'Restricted original' : '↓ Download original'}</button><button class="button button-dark share-action" type="button">↗ Copy link</button></div>${restricted ? '<p class="auth-note">The preview is public. The original is available only after server-side authentication and authorization.</p>' : ''}</aside></div>`;
    this.element.hidden = false; syncScrollLock(this.element, this.authDialog?.element);
    bindImageErrors(this.element);
    this.element.querySelector('.modal-close').onclick = () => this.requestClose();
    this.element.querySelector('.prev').onclick = () => this.step(-1);
    this.element.querySelector('.next').onclick = () => this.step(1);
    this.element.querySelector('.share-action').onclick = () => this.copyLink(asset);
    this.syncAuthState();
    this.element.querySelector('.modal-close').focus();
  }
  syncAuthState() {
    const asset = this.items[this.index]; const downloadAction = this.element.querySelector('.download-action');
    if (!asset || !downloadAction) return;
    const restricted = isRestricted(asset);
    if (restricted) downloadAction.textContent = this.auth.state.authenticated ? '↓ Download restricted original' : this.auth.state.configured ? 'Sign in to download' : 'Authentication unavailable';
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
