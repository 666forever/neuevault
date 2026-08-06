import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '../../server/auth.js';
import { signPayload } from '../../server/crypto.js';
import { adminCapabilities, requireAdminWriteCapability } from '../../server/admin/capabilities.js';
import { requireAdmin } from '../../server/admin/authorization.js';
import { adminErrorResponse, adminJson } from '../../server/admin/errors.js';
import { batchAdminStateWithAudit, normalizeAuditEvent } from '../../server/admin/audit.js';
import { parseBoundedJson, validateMutationRequest } from '../../server/admin/request.js';
import { retentionStatements } from '../../server/admin/retention.js';

const secret = 'a sufficiently long administration test secret';
const ownerId = '1137950746751537152'; const delegatedId = '2237950746751537152'; const ordinaryId = '3237950746751537152';

async function signedRequest(id, options = {}) {
  const token = await signPayload({ user: { id }, csrf: 'csrf-token', exp: 9_999_999_999 }, secret);
  return new Request(options.url || 'https://www.pfseeker.com/api/future-admin', { method: options.method || 'GET', headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}`, ...(options.headers || {}) }, body: options.body });
}

function mockDb({ delegated = [], fail = false } = {}) {
  const statements = [];
  const db = {
    prepare: vi.fn(sql => ({
      sql, values: [],
      bind(...values) { this.values = values; statements.push(this); return this; },
      async first() { if (fail) throw new Error('secret database detail'); return delegated.includes(String(this.values[0])) ? { discord_id: String(this.values[0]) } : null; },
      async run() { return { success: true }; },
    })),
    batch: vi.fn(async values => values.map(() => ({ success: true }))),
  };
  return { db, statements };
}
const env = db => ({ SESSION_SECRET: secret, ADMIN_OWNER_DISCORD_ID: ownerId, ADMIN_DB: db });

describe('admin authorization foundation', () => {
  it('rejects missing and invalid sessions with 401', async () => {
    await expect(requireAdmin(new Request('https://www.pfseeker.com'), env(mockDb().db))).rejects.toMatchObject({ status: 401 });
    const request = new Request('https://www.pfseeker.com', { headers: { Cookie: `${SESSION_COOKIE}=invalid` } });
    await expect(requireAdmin(request, env(mockDb().db))).rejects.toMatchObject({ status: 401 });
  });
  it('allows the owner without querying D1 and keeps the ID a string', async () => {
    const { db } = mockDb(); const result = await requireAdmin(await signedRequest(ownerId), env(db));
    expect(result).toMatchObject({ discordId: ownerId, role: 'owner' }); expect(typeof result.discordId).toBe('string'); expect(db.prepare).not.toHaveBeenCalled();
  });
  it('allows delegated administrators and rejects ordinary users', async () => {
    const { db } = mockDb({ delegated: [delegatedId] });
    await expect(requireAdmin(await signedRequest(delegatedId), env(db))).resolves.toMatchObject({ role: 'delegated' });
    await expect(requireAdmin(await signedRequest(ordinaryId), env(db))).rejects.toMatchObject({ status: 403, code: 'admin_access_denied' });
  });
  it('enforces owner-only access', async () => {
    const { db } = mockDb({ delegated: [delegatedId] });
    await expect(requireAdmin(await signedRequest(delegatedId), env(db), { ownerOnly: true })).rejects.toMatchObject({ status: 403 });
    await expect(requireAdmin(await signedRequest(ownerId), env(db), { ownerOnly: true })).resolves.toMatchObject({ role: 'owner' });
  });
  it('fails closed for missing/malformed owner configuration, malformed identity, or D1 failure', async () => {
    await expect(requireAdmin(await signedRequest(delegatedId), { SESSION_SECRET: secret, ADMIN_DB: mockDb({ delegated: [delegatedId] }).db })).rejects.toMatchObject({ status: 503, code: 'admin_owner_unconfigured' });
    await expect(requireAdmin(await signedRequest(delegatedId), { ...env(mockDb().db), ADMIN_OWNER_DISCORD_ID: 'not-a-discord-id' })).rejects.toMatchObject({ status: 503 });
    await expect(requireAdmin(await signedRequest('123'), env(mockDb().db))).rejects.toMatchObject({ status: 403, code: 'admin_identity_invalid' });
    await expect(requireAdmin(await signedRequest(delegatedId), env(mockDb({ fail: true }).db))).rejects.toMatchObject({ status: 503, code: 'admin_database_unavailable' });
  });
  it('ignores browser-supplied identities', async () => {
    const request = await signedRequest(ordinaryId, { url: `https://www.pfseeker.com/api/future-admin?discordId=${ownerId}`, headers: { 'X-Discord-ID': ownerId } });
    await expect(requireAdmin(request, env(mockDb().db))).rejects.toMatchObject({ status: 403 });
  });
});

describe('admin request integrity and responses', () => {
  it('accepts same-origin JSON mutations with a valid timing-safe CSRF token', async () => {
    const request = new Request('https://www.pfseeker.com/api/future-admin', { method: 'POST', headers: { Origin: 'https://www.pfseeker.com', 'Content-Type': 'application/json; charset=utf-8', 'X-CSRF-Token': 'csrf-token' }, body: '{"ok":true}' });
    await expect(validateMutationRequest(request, { csrf: 'csrf-token' })).resolves.toEqual({ ok: true });
  });
  it('rejects origin, CSRF, method, and content-type violations', async () => {
    const build = headers => new Request('https://www.pfseeker.com/api/future-admin', { method: 'POST', headers, body: '{}' });
    await expect(validateMutationRequest(build({ Origin: 'https://evil.example', 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-token' }), { csrf: 'csrf-token' })).rejects.toMatchObject({ code: 'admin_origin_required' });
    await expect(validateMutationRequest(build({ Origin: 'https://www.pfseeker.com', 'Content-Type': 'application/json', 'X-CSRF-Token': 'wrong' }), { csrf: 'csrf-token' })).rejects.toMatchObject({ code: 'admin_csrf_invalid' });
    await expect(validateMutationRequest(new Request('https://www.pfseeker.com', { method: 'GET' }), {})).rejects.toMatchObject({ code: 'admin_method_not_allowed' });
    await expect(validateMutationRequest(build({ Origin: 'https://www.pfseeker.com', 'Content-Type': 'text/plain', 'X-CSRF-Token': 'csrf-token' }), { csrf: 'csrf-token' })).rejects.toMatchObject({ code: 'admin_content_type_unsupported' });
  });
  it('rejects declared and streamed oversized bodies', async () => {
    const declared = new Request('https://www.pfseeker.com', { method: 'POST', headers: { 'Content-Length': '10' }, body: '{}' });
    await expect(parseBoundedJson(declared, { maxBytes: 2 })).rejects.toMatchObject({ status: 413 });
    const streamed = new Request('https://www.pfseeker.com', { method: 'POST', body: '123456' });
    await expect(parseBoundedJson(streamed, { maxBytes: 3 })).rejects.toMatchObject({ status: 413 });
  });
  it('returns sanitized no-store errors', async () => {
    const response = adminErrorResponse(new Error('secret-token-value'), 'request-1'); const body = await response.text();
    expect(response.status).toBe(500); expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(body).not.toContain('secret-token-value');
  });
  it('adds no-store headers to successful admin responses too', () => {
    expect(adminJson({ ok: true }).headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('admin capabilities, audit, and retention', () => {
  it('denies preview and unclassified writes and requires explicit local opt-in', () => {
    expect(adminCapabilities({ ADMIN_ENVIRONMENT: 'preview' }, { fullyConfigured: true })).toMatchObject({ readOnly: true, canWrite: false });
    expect(() => requireAdminWriteCapability({}, { fullyConfigured: true })).toThrow(expect.objectContaining({ status: 503 }));
    expect(adminCapabilities({ ADMIN_ENVIRONMENT: 'local', ADMIN_ALLOW_LOCAL_WRITES: 'true' })).toMatchObject({ canWrite: true });
    expect(adminCapabilities({ ADMIN_ENVIRONMENT: 'production' }, { fullyConfigured: false })).toMatchObject({ canWrite: false });
    expect(adminCapabilities({ ADMIN_ENVIRONMENT: 'production' }, { fullyConfigured: true })).toMatchObject({ providerReady: true, writeEnabled: false, canWrite: false });
    expect(adminCapabilities({ ADMIN_ENVIRONMENT: 'production', ADMIN_PRODUCTION_WRITES_ENABLED: 'true' }, { fullyConfigured: true })).toMatchObject({ providerReady: true, writeEnabled: true, canWrite: true });
  });
  it('normalizes a strict audit shape and excludes secret-bearing input fields', () => {
    const value = normalizeAuditEvent({ actorDiscordId: ownerId, actorRole: 'owner', action: 'category.update', targetType: 'category', targetId: 'cat-001', outcome: 'success', diagnosticCode: 'validated', requestId: 'request-1', csrfToken: 'secret', providerToken: 'secret' }, new Date('2026-01-01T00:00:00Z'));
    expect(value).toMatchObject({ actorDiscordId: ownerId, diagnostic: 'validated' }); expect(JSON.stringify(value)).not.toMatch(/csrf|provider|secret/i);
  });
  it('batches state and audit statements through one D1 batch', async () => {
    const { db } = mockDb(); const state = db.prepare('UPDATE delegated_admins SET created_at = ?').bind('now');
    await batchAdminStateWithAudit(db, [state], { actorDiscordId: ownerId, actorRole: 'owner', action: 'delegated_admin.add', targetType: 'delegated_admin', targetId: delegatedId, outcome: 'success', requestId: 'request-1' });
    expect(db.batch).toHaveBeenCalledOnce(); expect(db.batch.mock.calls[0][0]).toHaveLength(2);
  });
  it('retention SQL excludes active, recoverable, and cleanup-eligible jobs', () => {
    const { db, statements } = mockDb(); retentionStatements(db, new Date('2026-08-05T00:00:00Z')); const sql = statements.map(statement => statement.sql).join('\n');
    expect(sql).toContain('recoverable = 0'); expect(sql).toContain("cleanup_state != 'cleanup_eligible'"); expect(sql).not.toContain("status IN ('uploading'"); expect(sql).toContain('DELETE FROM admin_audit_log');
  });
  it('migration enforces approved upload limits and administration tables', async () => {
    const sql = await readFile(new URL('../../migrations/0001_admin_foundation.sql', import.meta.url), 'utf8');
    for (const table of ['delegated_admins', 'admin_audit_log', 'upload_jobs', 'publication_jobs']) expect(sql).toContain(`CREATE TABLE ${table}`);
    expect(sql).toContain('byte_size <= 26214400'); expect(sql).toContain('width <= 12000'); expect(sql).toContain('height <= 12000'); expect(sql).toContain('width * height <= 100000000');
  });
});
