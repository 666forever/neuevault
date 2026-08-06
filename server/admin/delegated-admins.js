import { batchAdminStateWithAudit, writeAuditEvent } from './audit.js';
import { validDiscordId } from './authorization.js';
import { AdminError } from './errors.js';

const listSql = 'SELECT discord_id, created_by, created_at FROM delegated_admins ORDER BY created_at ASC, discord_id ASC';
const findSql = 'SELECT discord_id, created_by, created_at FROM delegated_admins WHERE discord_id = ? LIMIT 1';

function requireDatabase(env) {
  if (!env.ADMIN_DB || typeof env.ADMIN_DB.prepare !== 'function') throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  return env.ADMIN_DB;
}

export function normalizeDelegatedDiscordId(value) {
  if (typeof value !== 'string') throw new AdminError(400, 'delegated_admin_id_invalid', 'Enter a valid Discord ID.');
  const discordId = value.trim();
  if (!validDiscordId(discordId)) throw new AdminError(400, 'delegated_admin_id_invalid', 'Enter a valid Discord ID.');
  return discordId;
}

function record(row) {
  return { discordId: String(row.discord_id), createdBy: String(row.created_by), createdAt: String(row.created_at) };
}

function event(admin, requestId, action, targetId, outcome = 'success', diagnosticCode = null) {
  return { actorDiscordId: admin.discordId, actorRole: admin.role, action, targetType: 'delegated_admin', targetId, outcome, diagnosticCode, requestId };
}

async function rejected(db, admin, requestId, action, targetId, code) {
  try { await writeAuditEvent(db, event(admin, requestId, action, targetId, 'rejected', code)); }
  catch { throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.'); }
}

export async function listDelegatedAdmins(env, admin, requestId) {
  const db = requireDatabase(env);
  try {
    const result = await db.prepare(listSql).all();
    const rows = Array.isArray(result?.results) ? result.results.map(record) : [];
    await writeAuditEvent(db, event(admin, requestId, 'delegated_admin.list', null));
    return { owner: { id: admin.discordId, permanent: true }, delegatedAdmins: rows };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  }
}

export async function addDelegatedAdmin(env, admin, requestId, value, now = new Date()) {
  const db = requireDatabase(env); let discordId;
  try { discordId = normalizeDelegatedDiscordId(value); }
  catch (error) { await rejected(db, admin, requestId, 'delegated_admin.add', null, error.code); throw error; }
  if (discordId === env.ADMIN_OWNER_DISCORD_ID) {
    await rejected(db, admin, requestId, 'delegated_admin.add', discordId, 'delegated_admin_owner_permanent');
    throw new AdminError(400, 'delegated_admin_owner_permanent', 'The permanent owner cannot be delegated.');
  }
  try {
    if (await db.prepare(findSql).bind(discordId).first()) {
      await rejected(db, admin, requestId, 'delegated_admin.add', discordId, 'delegated_admin_exists');
      throw new AdminError(409, 'delegated_admin_exists', 'This Discord ID already has delegated access.');
    }
    const createdAt = now.toISOString();
    const insert = db.prepare('INSERT INTO delegated_admins (discord_id, created_by, created_at) VALUES (?, ?, ?)').bind(discordId, admin.discordId, createdAt);
    const result = await batchAdminStateWithAudit(db, [insert], event(admin, requestId, 'delegated_admin.add', discordId), now);
    if (!Array.isArray(result) || result.some(item => item?.success === false)) throw new Error('D1 batch failed.');
    return { discordId, createdBy: admin.discordId, createdAt };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    if (/unique|constraint/i.test(String(error?.message))) throw new AdminError(409, 'delegated_admin_exists', 'This Discord ID already has delegated access.');
    throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  }
}

export async function removeDelegatedAdmin(env, admin, requestId, value, now = new Date()) {
  const db = requireDatabase(env); let discordId;
  try { discordId = normalizeDelegatedDiscordId(value); }
  catch (error) { await rejected(db, admin, requestId, 'delegated_admin.remove', null, error.code); throw error; }
  if (discordId === env.ADMIN_OWNER_DISCORD_ID) {
    await rejected(db, admin, requestId, 'delegated_admin.remove', discordId, 'delegated_admin_owner_permanent');
    throw new AdminError(400, 'delegated_admin_owner_permanent', 'The permanent owner cannot be removed.');
  }
  try {
    if (!await db.prepare(findSql).bind(discordId).first()) {
      await rejected(db, admin, requestId, 'delegated_admin.remove', discordId, 'delegated_admin_not_found');
      throw new AdminError(404, 'delegated_admin_not_found', 'This Discord ID does not have delegated access.');
    }
    const removal = db.prepare('DELETE FROM delegated_admins WHERE discord_id = ?').bind(discordId);
    const result = await batchAdminStateWithAudit(db, [removal], event(admin, requestId, 'delegated_admin.remove', discordId), now);
    if (!Array.isArray(result) || result.some(item => item?.success === false)) throw new Error('D1 batch failed.');
    return { removed: true, discordId };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  }
}
