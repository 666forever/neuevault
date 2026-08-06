import { randomToken } from '../crypto.js';
import { validDiscordId } from './authorization.js';

const OUTCOMES = new Set(['success', 'rejected', 'failed']); const ROLES = new Set(['owner', 'delegated']);
const SAFE_TOKEN = /^[a-z0-9][a-z0-9._:-]{0,127}$/i; const COMMIT_SHA = /^[a-f0-9]{40}$/i;
function safeToken(value, label, { nullable = false } = {}) { if (nullable && (value === null || value === undefined || value === '')) return null; const normalized = String(value || ''); if (!SAFE_TOKEN.test(normalized)) throw new TypeError(`Invalid audit ${label}.`); return normalized; }
export function normalizeAuditEvent(event, now = new Date()) {
  const actorDiscordId = String(event.actorDiscordId); if (!validDiscordId(actorDiscordId)) throw new TypeError('Invalid audit actor.');
  if (!ROLES.has(event.actorRole)) throw new TypeError('Invalid audit role.'); if (!OUTCOMES.has(event.outcome)) throw new TypeError('Invalid audit outcome.');
  const publicationCommitSha = event.publicationCommitSha || null; if (publicationCommitSha && !COMMIT_SHA.test(publicationCommitSha)) throw new TypeError('Invalid audit publication commit.');
  return { eventId: event.eventId || randomToken(18), actorDiscordId, actorRole: event.actorRole, action: safeToken(event.action, 'action'), targetType: safeToken(event.targetType, 'target type'), targetId: safeToken(event.targetId, 'target ID', { nullable: true }), outcome: event.outcome, diagnostic: safeToken(event.diagnosticCode, 'diagnostic', { nullable: true }), requestId: safeToken(event.requestId, 'request ID'), publicationCommitSha, createdAt: now.toISOString() };
}
export function auditInsert(db, event, now) {
  const value = normalizeAuditEvent(event, now);
  return db.prepare(`INSERT INTO admin_audit_log (event_id, actor_discord_id, actor_role, action, target_type, target_id, outcome, diagnostic, request_id, publication_commit_sha, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(value.eventId, value.actorDiscordId, value.actorRole, value.action, value.targetType, value.targetId, value.outcome, value.diagnostic, value.requestId, value.publicationCommitSha, value.createdAt);
}
export const writeAuditEvent = (db, event, now) => auditInsert(db, event, now).run();
export function batchAdminStateWithAudit(db, statements, event, now) { if (!db || typeof db.batch !== 'function') throw new TypeError('ADMIN_DB batch support is required.'); return db.batch([...statements, auditInsert(db, event, now)]); }
