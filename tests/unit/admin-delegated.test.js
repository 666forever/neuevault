import { describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '../../server/auth.js';
import { signPayload } from '../../server/crypto.js';
import { normalizeDelegatedDiscordId } from '../../server/admin/delegated-admins.js';
import { onRequest as collectionHandler } from '../../functions/api/admin/delegated-admins.js';
import { onRequest as memberHandler } from '../../functions/api/admin/delegated-admins/[discordId].js';

const secret = 'a sufficiently long delegated administration secret';
const ownerId = '1137950746751537152'; const delegatedId = '2237950746751537152'; const secondId = '2237950746751537153'; const ordinaryId = '3237950746751537152';

class MockD1 {
  constructor(rows = [], { readFailure = false, batchFailure = false } = {}) { this.rows = new Map(rows.map(row => [row.discordId, { discord_id: row.discordId, created_by: row.createdBy || ownerId, created_at: row.createdAt || '2026-08-05T00:00:00.000Z' }])); this.audit = []; this.readFailure = readFailure; this.batchFailure = batchFailure; }
  prepare(sql) { const db = this; return { sql, values: [], bind(...values) { this.values = values; return this; }, async first() { if (db.readFailure) throw new Error('private D1 read'); return db.rows.get(String(this.values[0])) || null; }, async all() { if (db.readFailure) throw new Error('private D1 read'); return { results: [...db.rows.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.discord_id.localeCompare(b.discord_id)) }; }, async run() { if (sql.includes('admin_audit_log')) db.audit.push(this.values); return { success: true }; } }; }
  async batch(statements) { if (this.batchFailure) throw new Error('private D1 batch'); const next = new Map(this.rows); const audits = [...this.audit]; for (const statement of statements) { if (statement.sql.startsWith('INSERT INTO delegated_admins')) { const [id, createdBy, createdAt] = statement.values; if (next.has(id)) throw new Error('UNIQUE constraint failed'); next.set(id, { discord_id: id, created_by: createdBy, created_at: createdAt }); } else if (statement.sql.startsWith('DELETE FROM delegated_admins')) next.delete(statement.values[0]); else if (statement.sql.includes('admin_audit_log')) audits.push(statement.values); } this.rows = next; this.audit = audits; return statements.map(() => ({ success: true })); }
}

async function request(id, { method = 'GET', path = '/api/admin/delegated-admins', body, csrf = 'csrf-token', origin = 'https://www.pfseeker.com', headers = {} } = {}) {
  const token = id ? await signPayload({ user: { id, displayName: 'Admin' }, csrf: 'csrf-token', exp: 9_999_999_999 }, secret) : null;
  return new Request(`https://www.pfseeker.com${path}`, { method, headers: { ...(token ? { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` } : {}), ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}), ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
}
const env = (db, extra = {}) => ({ SESSION_SECRET: secret, ADMIN_OWNER_DISCORD_ID: ownerId, ADMIN_DB: db, ADMIN_ENVIRONMENT: 'test', ADMIN_ALLOW_LOCAL_WRITES: 'true', ...extra });
const list = async (id, db, options = {}) => collectionHandler({ request: await request(id, options), env: env(db, options.env), data: {} });
const add = async (id, db, body, options = {}) => collectionHandler({ request: await request(id, { method: 'POST', body, ...options }), env: env(db, options.env), data: {} });
const remove = async (id, db, target, options = {}) => memberHandler({ request: await request(id, { method: 'DELETE', path: `/api/admin/delegated-admins/${target}`, ...options }), env: env(db, options.env), params: { discordId: target }, data: {} });

describe('delegated administrator authorization and listing', () => {
  it('allows only the permanent owner for list, add, and remove', async () => {
    for (const actor of [null, ordinaryId, delegatedId]) {
      const db = new MockD1([{ discordId: delegatedId }]); const expected = actor ? 403 : 401;
      expect((await list(actor, db)).status).toBe(expected); expect((await add(actor, db, { discordId: secondId })).status).toBe(expected); expect((await remove(actor, db, delegatedId)).status).toBe(expected);
    }
    expect((await list(ownerId, new MockD1())).status).toBe(200);
  });
  it('returns deterministic sorted sanitized rows, permanent owner, audit, and no-store', async () => {
    const db = new MockD1([{ discordId: secondId, createdAt: '2026-02-01T00:00:00.000Z' }, { discordId: delegatedId, createdAt: '2026-01-01T00:00:00.000Z' }]); const response = await list(ownerId, db); const body = await response.json();
    expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(body.owner).toEqual({ id: ownerId, permanent: true }); expect(body.delegatedAdmins.map(row => row.discordId)).toEqual([delegatedId, secondId]); expect(db.audit).toHaveLength(1); expect(JSON.stringify(body)).not.toMatch(/sql|csrf|cookie/i);
  });
  it('fails closed for malformed owner config and D1 read failure', async () => {
    expect((await list(ownerId, new MockD1(), { env: { ADMIN_OWNER_DISCORD_ID: 'bad' } })).status).toBe(503);
    const response = await list(ownerId, new MockD1([], { readFailure: true })); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private D1');
  });
  it('ignores browser role and actor spoofing', async () => { const response = await collectionHandler({ request: await request(ordinaryId, { headers: { 'X-Admin-Role': 'owner', 'X-Discord-ID': ownerId } }), env: env(new MockD1()), data: {} }); expect(response.status).toBe(403); });
});

describe('delegated administrator mutations', () => {
  it('keeps IDs as strings, trims edges, and rejects malformed or numeric values', async () => {
    expect(normalizeDelegatedDiscordId(` ${delegatedId} `)).toBe(delegatedId); for (const invalid of [1.1379507467515372e18, '+1137950746751537152', '1137 9507 4675 1537 152', '1.1379507467515372e18', 'abc', '１１３７９５０７４６７５１５３７１５２']) expect(() => normalizeDelegatedDiscordId(invalid)).toThrow(expect.objectContaining({ code: 'delegated_admin_id_invalid' }));
  });
  it('adds and removes through atomic state plus audit batches', async () => {
    const db = new MockD1(); let response = await add(ownerId, db, { discordId: ` ${delegatedId} ` }); let body = await response.json(); expect(response.status).toBe(201); expect(body.delegatedAdmin.discordId).toBe(delegatedId); expect(db.rows.has(delegatedId)).toBe(true); expect(db.audit.at(-1)[3]).toBe('delegated_admin.add');
    response = await remove(ownerId, db, delegatedId); body = await response.json(); expect(body).toMatchObject({ removed: true, discordId: delegatedId }); expect(db.rows.has(delegatedId)).toBe(false); expect(db.audit.at(-1)[3]).toBe('delegated_admin.remove');
  });
  it('returns conflict for duplicates and 404 for nonexistent removal', async () => {
    const db = new MockD1([{ discordId: delegatedId }]); expect((await add(ownerId, db, { discordId: delegatedId })).status).toBe(409); expect((await remove(ownerId, db, secondId)).status).toBe(404); expect(db.rows.size).toBe(1);
  });
  it('rejects owner add/remove and audits without changing state', async () => {
    const db = new MockD1(); const addResponse = await add(ownerId, db, { discordId: ownerId }); const removeResponse = await remove(ownerId, db, ownerId); expect(addResponse.status).toBe(400); expect(removeResponse.status).toBe(400); expect(db.rows.size).toBe(0); expect(db.audit).toHaveLength(2);
  });
  it('rolls back state and success audit when a batch fails', async () => {
    const addDb = new MockD1([], { batchFailure: true }); expect((await add(ownerId, addDb, { discordId: delegatedId })).status).toBe(503); expect(addDb.rows.size).toBe(0); expect(addDb.audit).toHaveLength(0);
    const removeDb = new MockD1([{ discordId: delegatedId }], { batchFailure: true }); expect((await remove(ownerId, removeDb, delegatedId)).status).toBe(503); expect(removeDb.rows.has(delegatedId)).toBe(true); expect(removeDb.audit).toHaveLength(0);
  });
  it('enforces origin, CSRF, content type, body limit, methods, and local opt-in', async () => {
    const db = new MockD1(); expect((await add(ownerId, db, { discordId: delegatedId }, { origin: 'https://evil.example' })).status).toBe(403); expect((await add(ownerId, db, { discordId: delegatedId }, { csrf: 'bad' })).status).toBe(403); expect((await add(ownerId, db, '{}', { headers: { 'Content-Type': 'text/plain' } })).status).toBe(415);
    expect((await add(ownerId, db, `{"discordId":"${'1'.repeat(1100)}"}`)).status).toBe(413); expect((await collectionHandler({ request: await request(ownerId, { method: 'PUT', body: {} }), env: env(db), data: {} })).status).toBe(405);
    expect((await add(ownerId, db, { discordId: delegatedId }, { env: { ADMIN_ALLOW_LOCAL_WRITES: 'false' } })).status).toBe(403); expect((await add(ownerId, db, { discordId: delegatedId }, { env: { ADMIN_ENVIRONMENT: 'preview' } })).status).toBe(403); expect((await add(ownerId, db, { discordId: delegatedId }, { env: { ADMIN_ENVIRONMENT: 'production' } })).status).toBe(403);
  });
});
