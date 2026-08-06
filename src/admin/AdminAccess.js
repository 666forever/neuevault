import { escapeHtml } from '../utils/escape.js';

const messageFor = (status, code) => status === 409 || code === 'delegated_admin_exists' ? 'This Discord ID already has delegated access.' : code === 'delegated_admin_owner_permanent' ? 'The permanent owner cannot be delegated or removed.' : status === 404 ? 'This Discord ID does not have delegated access.' : status === 403 ? 'This action is unavailable in this environment.' : status === 400 ? 'Enter a valid Discord ID.' : 'Administrator access could not be updated. Please try again.';

export function mountAdminAccess(root, { bootstrap, signal }) {
  const api = (path = '', options = {}) => fetch(`/api/admin/delegated-admins${path}`, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', ...options.headers }, ...options });
  const client = {
    delegatedAdmins: requestSignal => api('', { signal: requestSignal }),
    addDelegatedAdmin: (discordId, csrfToken, requestSignal) => api('', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ discordId }), signal: requestSignal }),
    removeDelegatedAdmin: (discordId, csrfToken, requestSignal) => api(`/${encodeURIComponent(discordId)}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken }, signal: requestSignal }),
  };
  let busy = false; let rows = []; let controller;
  const writable = bootstrap.capabilities.manageDelegatedAdmins === true;
  const setStatus = (text, error = false) => { const node = root.querySelector('[data-access-status]'); if (node) { node.textContent = text; node.dataset.error = String(error); } };
  const setBusy = value => root.querySelectorAll('button,input').forEach(control => { control.disabled = value; });
  const render = () => {
    root.innerHTML = `<div class="admin-access-heading"><div><h2>Admin access</h2><p><strong>${escapeHtml(bootstrap.user.displayName)}</strong> · Permanent owner</p></div><span class="admin-readonly-badge">${writable ? 'Owner managed' : 'Read-only here'}</span></div>${writable ? '<form class="admin-access-form" novalidate><label for="delegated-discord-id">Discord ID</label><div><input id="delegated-discord-id" name="discordId" inputmode="numeric" autocomplete="off" aria-describedby="delegated-id-help delegated-id-error"><button class="button button-dark button-compact" type="submit">Add access</button></div><p id="delegated-id-help">Enter a 17–20 digit Discord account ID.</p><p id="delegated-id-error" class="admin-field-error" aria-live="polite"></p></form>' : '<p>Delegated access can be viewed here, but changes are disabled in this environment.</p>'}<div class="admin-access-list" aria-label="Delegated administrators">${rows.length ? rows.map(item => `<article data-admin-row="${escapeHtml(item.discordId)}"><div><strong>${escapeHtml(item.discordId)}</strong><span>Added ${escapeHtml(item.createdAt)} by ${escapeHtml(item.createdBy)}</span></div>${writable ? `<button class="button button-dark button-compact" type="button" data-remove="${escapeHtml(item.discordId)}" aria-label="Remove delegated access for ${escapeHtml(item.discordId)}">Remove</button>` : ''}</article>`).join('') : '<p>No delegated administrators.</p>'}</div><p class="admin-access-status" data-access-status aria-live="polite"></p>`;
    bind();
  };
  const request = async operation => {
    if (busy || signal.aborted) return null; busy = true; setBusy(true);
    try { return await operation(); } finally { busy = false; setBusy(false); }
  };
  const load = async status => {
    controller?.abort(); controller = new AbortController(); signal.addEventListener('abort', () => controller.abort(), { once: true });
    const response = await request(() => client.delegatedAdmins(controller.signal));
    if (!response || signal.aborted) return;
    if (!response.ok) { setStatus('Administrator access is unavailable. Retry by reloading the page.', true); return; }
    rows = (await response.json()).delegatedAdmins || []; render(); if (status) setStatus(status);
  };
  const bind = () => {
    const form = root.querySelector('form');
    if (form) form.onsubmit = async event => {
      event.preventDefault(); const input = form.elements.discordId; const value = input.value.trim(); const fieldError = root.querySelector('#delegated-id-error');
      if (!/^\d{17,20}$/.test(value)) { fieldError.textContent = 'Enter a valid 17–20 digit Discord ID.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      fieldError.textContent = ''; input.removeAttribute('aria-invalid'); const response = await request(() => client.addDelegatedAdmin(value, bootstrap.csrfToken, signal));
      if (!response || signal.aborted) return; const body = await response.json();
      if (!response.ok) { fieldError.textContent = messageFor(response.status, body.code); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.value = ''; await load('Delegated access added.');
    };
    root.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => {
      const id = button.dataset.remove; const row = button.closest('[data-admin-row]');
      row.querySelector('.admin-confirm')?.remove(); row.insertAdjacentHTML('beforeend', `<div class="admin-confirm" role="group" aria-label="Confirm removal for ${escapeHtml(id)}"><p>Remove delegated access for ${escapeHtml(id)}?</p><button class="button button-dark button-compact" type="button" data-confirm-remove>Confirm</button><button class="button button-dark button-compact" type="button" data-cancel-remove>Cancel</button></div>`);
      const confirm = row.querySelector('[data-confirm-remove]'); const cancel = row.querySelector('[data-cancel-remove]'); confirm.focus();
      cancel.onclick = () => { row.querySelector('.admin-confirm').remove(); button.focus(); };
      confirm.onclick = async () => { const response = await request(() => client.removeDelegatedAdmin(id, bootstrap.csrfToken, signal)); if (!response || signal.aborted) return; const body = await response.json(); if (!response.ok) { setStatus(messageFor(response.status, body.code), true); button.focus(); return; } await load('Delegated access removed.'); };
    });
  };
  render(); setStatus('Loading administrator access…'); load();
  return () => controller?.abort();
}
