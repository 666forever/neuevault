import { describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '../../server/auth.js';
import { signPayload } from '../../server/crypto.js';
import { onRequest as bootstrapHandler } from '../../functions/api/admin/bootstrap.js';
import { onRequest as catalogHandler } from '../../functions/api/admin/catalog.js';
import { parseRoute } from '../../src/routing/routes.js';

const secret = 'a sufficiently long read-only admin test secret';
const ownerId = '1137950746751537152'; const delegatedId = '2237950746751537152'; const ordinaryId = '3237950746751537152';
async function requestFor(id, { method = 'GET', headers = {}, url = 'https://www.pfseeker.com/api/admin/bootstrap' } = {}) {
  const token = id ? await signPayload({ user: { id, displayName: 'Test user', avatarUrl: 'https://cdn.discordapp.com/avatar.png', access_token: 'not-public' }, csrf: 'csrf-token', exp: 9_999_999_999 }, secret) : null;
  return new Request(url, { method, headers: { ...(token ? { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` } : {}), ...headers } });
}
function db({ delegated = [], fail = false } = {}) {
  return { prepare: vi.fn(() => ({ bind(id) { return { first: async () => { if (fail) throw new Error('private sql failure'); return delegated.includes(id) ? { discord_id: id } : null; } }; } })) };
}
const env = database => ({ SESSION_SECRET: secret, ADMIN_OWNER_DISCORD_ID: ownerId, ADMIN_DB: database, ADMIN_ENVIRONMENT: 'test' });
const catalog = {
  assets: [{ id: 'nv-public', sourceFile: 'icons/public.png', collectionSlugs: [], tags: [], requiresDiscordAuth: false }, { id: 'nv-restricted', sourceFile: 'icons/restricted.png', collectionSlugs: [], tags: [], requiresDiscordAuth: true }],
  categories: [{ id: 'cat-001', slug: 'icons', title: 'Icons', coverAssetId: 'nv-restricted', visible: true, order: 0, filter: { type: 'folder', category: 'Icons' } }],
  collections: [{ id: 'col-001', slug: 'saved', title: 'Saved', description: '', coverAssetId: 'nv-restricted', tags: [], featured: true, public: true }],
};
const provider = { read: vi.fn(async () => ({ baseCommitSha: null, source: 'local', catalog })) };

describe('read-only admin bootstrap endpoint', () => {
  it('returns 401 signed out and 403 for an ordinary authenticated user', async () => {
    expect((await bootstrapHandler({ request: await requestFor(null), env: env(db()), data: {} })).status).toBe(401);
    expect((await bootstrapHandler({ request: await requestFor(ordinaryId), env: env(db()), data: {} })).status).toBe(403);
  });
  it('returns sanitized delegated and owner roles with no write capability', async () => {
    for (const [id, role, database] of [[ownerId, 'owner', db()], [delegatedId, 'delegated', db({ delegated: [delegatedId] })]]) {
      const response = await bootstrapHandler({ request: await requestFor(id), env: env(database), data: {} }); const body = await response.json();
      expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(body).toMatchObject({ role, user: { id, displayName: 'Test user', avatarUrl: 'https://cdn.discordapp.com/avatar.png' }, readOnly: true });
      expect(body.capabilities.uploadRestrictedAssets).toBe(false);
      expect(Object.entries(body.capabilities).filter(([, value]) => value).map(([key]) => key)).toEqual(role === 'owner' ? ['readCatalog', 'readDelegatedAdmins'] : ['readCatalog']); expect(JSON.stringify(body)).not.toContain('not-public');
    }
  });
  it('fails closed for owner configuration and delegated D1 failures and ignores supplied IDs', async () => {
    const missingOwner = await bootstrapHandler({ request: await requestFor(delegatedId), env: { ...env(db()), ADMIN_OWNER_DISCORD_ID: '' }, data: {} }); expect(missingOwner.status).toBe(503);
    const databaseFailure = await bootstrapHandler({ request: await requestFor(delegatedId), env: env(db({ fail: true })), data: {} }); expect(databaseFailure.status).toBe(503); expect(await databaseFailure.text()).not.toContain('private sql failure');
    const supplied = await requestFor(ordinaryId, { url: `https://www.pfseeker.com/api/admin/bootstrap?discordId=${ownerId}`, headers: { 'X-Discord-ID': ownerId } }); expect((await bootstrapHandler({ request: supplied, env: env(db()), data: {} })).status).toBe(403);
  });
  it('rejects unsupported methods with a sanitized no-store response', async () => {
    const response = await bootstrapHandler({ request: await requestFor(ownerId, { method: 'POST' }), env: env(db()), data: {} });
    expect(response.status).toBe(405); expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('read-only admin catalog endpoint', () => {
  it('independently rejects signed-out and ordinary users', async () => {
    const signedOut = await catalogHandler({ request: await requestFor(null, { url: 'https://www.pfseeker.com/api/admin/catalog' }), env: env(db()), data: { adminCatalogProvider: provider } }); expect(signedOut.status).toBe(401);
    const ordinary = await catalogHandler({ request: await requestFor(ordinaryId, { url: 'https://www.pfseeker.com/api/admin/catalog' }), env: env(db()), data: { adminCatalogProvider: provider } }); expect(ordinary.status).toBe(403); expect(provider.read).not.toHaveBeenCalled();
  });
  it('returns the untransformed authored catalog through an injected local provider', async () => {
    const response = await catalogHandler({ request: await requestFor(ownerId, { url: 'https://www.pfseeker.com/api/admin/catalog' }), env: env(db()), data: { adminCatalogProvider: provider } }); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(body).toMatchObject({ baseCommitSha: null, source: 'local', readOnly: true, catalog });
    expect(JSON.stringify(body)).not.toMatch(/signed|cloudinaryPublicId|api[_-]?secret/i);
  });
  it('fails safely when production or preview has no GitHub provider', async () => {
    for (const environment of ['production', 'preview']) {
      const response = await catalogHandler({ request: await requestFor(ownerId, { url: 'https://www.pfseeker.com/api/admin/catalog' }), env: { ...env(db()), ADMIN_ENVIRONMENT: environment }, data: { adminCatalogProvider: provider } });
      expect(response.status).toBe(503); expect(response.headers.get('Cache-Control')).toBe('no-store'); expect((await response.json()).code).toBe('admin_catalog_unavailable');
    }
  });
  it('recognizes the clean direct admin route without changing public route contracts', () => {
    expect(parseRoute('/admin')).toMatchObject({ name: 'admin', path: '/admin' }); expect(parseRoute('/icons')).toMatchObject({ name: 'type' });
  });
});
