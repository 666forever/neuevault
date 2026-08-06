import { describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '../../server/auth.js';
import { signPayload } from '../../server/crypto.js';
import { onRequest as readinessHandler } from '../../functions/api/admin/readiness.js';

const secret = 'a sufficiently long readiness test session secret';
const ownerId = '1137950746751537152';
const delegatedId = '2237950746751537152';
const sha = 'a'.repeat(40);
const digest = 'b'.repeat(64);

async function request(id, method = 'GET') {
  const token = id ? await signPayload({ user: { id }, csrf: 'csrf', exp: 9_999_999_999 }, secret) : null;
  return new Request('https://www.pfseeker.com/api/admin/readiness', { method, headers: token ? { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` } : {} });
}

function database(delegated = []) {
  const schema = [
    ...['admin_audit_log', 'd1_migrations', 'delegated_admins', 'publication_jobs', 'upload_jobs'].map(name => ({ name, type: 'table' })),
    ...['admin_audit_created', 'publication_actor_idempotency', 'publication_commit_pending', 'upload_jobs_actor_idempotency', 'upload_commit_pending'].map(name => ({ name, type: 'index' })),
  ];
  return { prepare: vi.fn(sql => ({
    bind(id) { return { first: async () => delegated.includes(id) ? { discord_id: id } : null }; },
    async all() { return { results: schema }; },
    async first() { return { count: 4 }; },
  })) };
}

function context(id, { delegated = [], writes = 'false' } = {}) {
  const original = { publicId: 'neuevault/restricted/icons/nv-166', deliveryType: 'authenticated', version: 1 };
  const preview = { publicId: 'neuevault/previews/icons/nv-166', deliveryType: 'upload', version: 1 };
  const publicOriginal = { publicId: 'neuevault/public/icons/nv-001', deliveryType: 'upload', version: 1 };
  const snapshot = {
    assetsFile: { assets: [{ id: 'nv-001', requiresDiscordAuth: false }, ...Array.from({ length: 233 }, (_, index) => ({ id: index === 165 ? 'nv-166' : `nv-${index + 2}`, requiresDiscordAuth: index === 165 }))] },
    categoriesFile: { categories: Array(4).fill({}) }, collectionsFile: { collections: Array(4).fill({}) },
    cloudinarySync: { assets: { 'nv-001': { original: publicOriginal }, 'nv-166': { original, preview } } },
  };
  const cloudinary = { verifyResource: vi.fn(async input => input), createUploadAuthorization: vi.fn() };
  const git = { readHead: vi.fn(async () => sha), readSnapshot: vi.fn(async () => snapshot) };
  const verifier = { verify: vi.fn(async () => ({ state: 'live', deployedCommitSha: sha })) };
  return {
    request: request(id),
    env: {
      SESSION_SECRET: secret, ADMIN_OWNER_DISCORD_ID: ownerId, ADMIN_DB: database(delegated), ADMIN_ENVIRONMENT: 'production', ADMIN_PRODUCTION_WRITES_ENABLED: writes,
      DISCORD_CLIENT_ID: 'client', DISCORD_CLIENT_SECRET: 'secret', DISCORD_REDIRECT_URI: 'https://www.pfseeker.com/api/auth/discord/callback',
    },
    data: { adminGitProvider: git, adminCloudinaryProvider: cloudinary, deploymentVerifier: verifier, catalogMarker: { version: 1, catalogDigest: digest } },
  };
}

describe('deployed production readiness endpoint', () => {
  it('is owner-only, GET-only, sanitized, and no-store', async () => {
    expect((await readinessHandler({ ...(await context(null)), request: await request(null) })).status).toBe(401);
    expect((await readinessHandler({ ...(await context(delegatedId, { delegated: [delegatedId] })), request: await request(delegatedId) })).status).toBe(403);
    const methodContext = await context(ownerId); methodContext.request = await request(ownerId, 'POST'); expect((await readinessHandler(methodContext)).status).toBe(405);
    const owner = await context(ownerId); owner.request = await request(ownerId); const response = await readinessHandler(owner); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toMatchObject({ ready: true, environment: 'production', catalog: { assets: 234, categories: 4, collections: 4 } });
    expect(Object.values(body.capabilities).every(value => value === false)).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/token|private|publicId|commitSha|accountId|installation/i);
  });

  it('performs reads only and fails closed if the kill switch changes', async () => {
    const owner = await context(ownerId); owner.request = await request(ownerId); await readinessHandler(owner);
    expect(owner.data.adminGitProvider.readHead).toHaveBeenCalledOnce(); expect(owner.data.adminGitProvider.readSnapshot).toHaveBeenCalledWith(sha);
    expect(owner.data.adminCloudinaryProvider.verifyResource).toHaveBeenCalledTimes(3); expect(owner.data.deploymentVerifier.verify).toHaveBeenCalledOnce();
    expect(owner.data.adminGitProvider.createCommit).toBeUndefined(); expect(owner.data.adminCloudinaryProvider.createUploadAuthorization).not.toHaveBeenCalled();
    const enabled = await context(ownerId, { writes: 'true' }); enabled.request = await request(ownerId); const response = await readinessHandler(enabled);
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('true');
  });
});
