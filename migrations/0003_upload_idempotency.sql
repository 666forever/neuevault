-- Phase 6 upload request/finalization idempotency. Repository JSON remains canonical.
ALTER TABLE upload_jobs ADD COLUMN idempotency_key TEXT;
ALTER TABLE upload_jobs ADD COLUMN request_sha256 TEXT;
ALTER TABLE upload_jobs ADD COLUMN finalize_idempotency_key TEXT;
ALTER TABLE upload_jobs ADD COLUMN finalize_sha256 TEXT;
ALTER TABLE upload_jobs ADD COLUMN retry_idempotency_key TEXT;
ALTER TABLE upload_jobs ADD COLUMN retry_sha256 TEXT;
CREATE UNIQUE INDEX upload_jobs_actor_idempotency ON upload_jobs(actor_discord_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
