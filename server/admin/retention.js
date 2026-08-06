const TERMINAL_UPLOAD_REDACTION = "status IN ('live', 'failed', 'expired', 'cleaned')";
const TERMINAL_PUBLICATION_REDACTION = "status IN ('live', 'failed', 'conflict')";
export function retentionStatements(db, now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString(); const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString(); const oneHundredEightyDaysAgo = new Date(now.getTime() - 180 * 86_400_000).toISOString();
  return [
    db.prepare(`UPDATE upload_jobs SET mutation_json = NULL, updated_at = ? WHERE mutation_json IS NOT NULL AND recoverable = 0 AND ${TERMINAL_UPLOAD_REDACTION} AND updated_at < ?`).bind(now.toISOString(), sevenDaysAgo),
    db.prepare(`UPDATE publication_jobs SET mutation_json = NULL, updated_at = ? WHERE mutation_json IS NOT NULL AND recoverable = 0 AND ${TERMINAL_PUBLICATION_REDACTION} AND updated_at < ?`).bind(now.toISOString(), sevenDaysAgo),
    db.prepare(`DELETE FROM upload_jobs WHERE recoverable = 0 AND cleanup_state != 'cleanup_eligible'
      AND (status IN ('live', 'cleaned', 'failed') OR (status = 'expired' AND cloudinary_asset_id IS NULL))
      AND updated_at < ?`).bind(thirtyDaysAgo),
    db.prepare(`DELETE FROM publication_jobs WHERE recoverable = 0 AND status IN ('live', 'failed', 'conflict') AND updated_at < ?`).bind(thirtyDaysAgo),
    db.prepare('DELETE FROM admin_audit_log WHERE created_at < ?').bind(oneHundredEightyDaysAgo),
  ];
}
export const applyAdminRetention = (db, now) => db.batch(retentionStatements(db, now));
