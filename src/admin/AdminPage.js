import './admin.css';
import { AdminClient } from './AdminClient.js';
import { escapeHtml } from '../utils/escape.js';

const stateShell = (title, copy, action = '') => `<div class="page admin-page"><section class="admin-state" aria-labelledby="admin-state-title" aria-live="polite"><p class="admin-kicker">Administration · Read-only</p><h1 id="admin-state-title">${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p>${action}</section></div>`;
const retryButton = '<button class="button button-dark button-compact" type="button" data-admin-retry><span>Retry</span></button>';

function catalogMarkup(bootstrap, result) {
  const { assets, categories, collections } = result.catalog;
  const role = bootstrap.role === 'owner' ? 'Owner' : 'Delegated administrator';
  const categoryItems = categories.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.id)} · ${item.visible ? 'Visible' : 'Hidden'} · Cover ${escapeHtml(item.coverAssetId || 'none')}</span></li>`).join('');
  const collectionItems = collections.map(item => {
    const members = assets.filter(asset => asset.collectionSlugs.includes(item.slug)).length;
    return `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.id)} · ${item.public ? 'Public' : 'Private'} · ${item.featured ? 'Featured' : 'Standard'} · ${members} member${members === 1 ? '' : 's'} · Cover ${escapeHtml(item.coverAssetId || 'none')}</span></li>`;
  }).join('');
  const restricted = assets.filter(item => item.requiresDiscordAuth).length;
  const access = bootstrap.role === 'owner' ? '<section class="admin-access-mount" aria-live="polite"><p>Loading administrator access…</p></section>' : '<section class="admin-access-summary"><h2>Admin access</h2><p>You have delegated administrator access. Only the permanent owner can manage administrator access.</p></section>';
  return `<div class="page admin-page"><header class="admin-header"><div><p class="admin-kicker">Administration · Read-only catalog</p><h1>Content manager</h1><p>Canonical authored catalog from the ${escapeHtml(result.source)} provider.</p></div><div class="admin-identity"><strong>${escapeHtml(bootstrap.user.displayName)}</strong><span>${escapeHtml(role)}</span></div></header>${access}<section class="admin-summary" aria-label="Catalog summary"><article><strong>${assets.length}</strong><span>Assets</span></article><article><strong>${categories.length}</strong><span>Categories</span></article><article><strong>${collections.length}</strong><span>Collections</span></article><article><strong>${restricted}</strong><span>Restricted</span></article></section><div class="admin-columns"><section aria-labelledby="admin-categories-title"><h2 id="admin-categories-title">Categories</h2><ul>${categoryItems || '<li><span>No categories.</span></li>'}</ul></section><section aria-labelledby="admin-collections-title"><h2 id="admin-collections-title">Collections</h2><ul>${collectionItems || '<li><span>No collections.</span></li>'}</ul></section></div><section class="admin-assets" aria-labelledby="admin-assets-title"><h2 id="admin-assets-title">Assets</h2><p>${assets.length} authored records. ${restricted} restricted original${restricted === 1 ? '' : 's'}.</p><div class="admin-asset-list">${assets.slice(0, 100).map(asset => `<article><strong>${escapeHtml(asset.title || asset.id)}</strong><span>${escapeHtml(asset.id)} · ${escapeHtml(asset.category || 'Uncategorized')} · ${asset.animated ? 'Animated' : 'Static'}${asset.requiresDiscordAuth ? ' · Restricted' : ''}</span></article>`).join('')}</div>${assets.length > 100 ? `<p class="admin-note">Showing the first 100 of ${assets.length} assets in this read-only phase.</p>` : ''}</section></div>`;
}

export function renderAdminPage(app, { client = new AdminClient() } = {}) {
  let controller = null; let disposed = false;
  const set = html => { if (!disposed) app.innerHTML = html; };
  const bindRetry = () => { const retry = app.querySelector('[data-admin-retry]'); if (retry) retry.onclick = load; };
  const load = async () => {
    controller?.abort(); controller = new AbortController(); const { signal } = controller;
    set(stateShell('Checking access…', 'Confirming your administrator session.'));
    try {
      const bootstrapResponse = await client.bootstrap(signal);
      if (signal.aborted || disposed) return;
      if (bootstrapResponse.status === 401) {
        set(stateShell('Sign in required', 'Sign in with Discord to request administrator access.', '<a class="button button-light button-compact" href="/api/auth/discord?returnTo=%2Fadmin"><span>Sign In</span></a>')); return;
      }
      if (bootstrapResponse.status === 403) { set(stateShell('Access denied', 'This account does not have access to Neuevault administration.')); return; }
      if (!bootstrapResponse.ok) { set(stateShell('Administration unavailable', 'Administrator access could not be checked safely. Please try again.', retryButton)); bindRetry(); return; }
      const bootstrap = await bootstrapResponse.json();
      if (signal.aborted || disposed) return;
      set(stateShell('Loading catalog…', 'Loading the canonical authored catalog.'));
      const catalogResponse = await client.catalog(signal);
      if (signal.aborted || disposed) return;
      if (!catalogResponse.ok) { set(stateShell('Catalog unavailable', 'The read-only catalog provider is unavailable. Please try again.', retryButton)); bindRetry(); return; }
      const result = await catalogResponse.json();
      if (signal.aborted || disposed) return;
      set(catalogMarkup(bootstrap, result));
      if (bootstrap.capabilities.writeCatalog && result.readOnly === false) {
        const mount = document.createElement('section'); mount.className = 'admin-editor-mount'; mount.setAttribute('aria-live', 'polite'); mount.innerHTML = '<p>Loading catalog editorâ€¦</p>'; app.querySelector('.admin-header')?.after(mount);
        const { mountAdminCatalogEditor } = await import('./AdminCatalogEditor.js');
        if (!signal.aborted && !disposed) mountAdminCatalogEditor(mount, { bootstrap, result, client, signal });
      }
      if (bootstrap.role === 'owner') {
        const { mountAdminAccess } = await import('./AdminAccess.js');
        if (!signal.aborted && !disposed) {
          mountAdminAccess(app.querySelector('.admin-access-mount'), { bootstrap, signal });
          if (bootstrap.environment === 'production') app.onclick = event => { if (event.target.matches('[data-ready-run]')) client.fetcher('/api/admin/readiness').then(response => response.json()).then(value => { app.querySelector('[data-ready]').textContent = JSON.stringify(value); }); };
        }
      }
    } catch (error) {
      if (signal.aborted || disposed || error?.name === 'AbortError') return;
      set(stateShell('Network error', 'The administration service could not be reached. Please try again.', retryButton)); bindRetry();
    }
  };
  load();
  return () => { disposed = true; controller?.abort(); app.onclick = null; };
}
