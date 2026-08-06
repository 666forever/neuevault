import { currentSession } from '../auth.js';
import { timingSafeTextEqual } from '../crypto.js';
import { AdminError } from './errors.js';

const DISCORD_ID = /^\d{17,20}$/;
export const validDiscordId = value => typeof value === 'string' && DISCORD_ID.test(value);

export async function requireAdmin(request, env, { ownerOnly = false } = {}) {
  const session = await currentSession(request, env);
  if (!session) throw new AdminError(401, 'admin_authentication_required', 'Authentication is required.');
  const discordId = String(session.user.id);
  if (!validDiscordId(discordId)) throw new AdminError(403, 'admin_identity_invalid', 'Administrator access is not authorized.');
  const ownerId = env.ADMIN_OWNER_DISCORD_ID;
  if (!validDiscordId(ownerId)) throw new AdminError(503, 'admin_owner_unconfigured', 'Administration is not configured.');
  if (await timingSafeTextEqual(discordId, ownerId)) return { session, discordId, role: 'owner' };
  if (ownerOnly) throw new AdminError(403, 'admin_owner_required', 'Owner access is required.');
  if (!env.ADMIN_DB || typeof env.ADMIN_DB.prepare !== 'function') throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  try {
    const row = await env.ADMIN_DB.prepare('SELECT discord_id FROM delegated_admins WHERE discord_id = ? LIMIT 1').bind(discordId).first();
    if (!row || String(row.discord_id) !== discordId) throw new AdminError(403, 'admin_access_denied', 'Administrator access is not authorized.');
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(503, 'admin_database_unavailable', 'Administration is temporarily unavailable.');
  }
  return { session, discordId, role: 'delegated' };
}
