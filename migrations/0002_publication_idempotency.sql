ALTER TABLE publication_jobs ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX publication_actor_idempotency ON publication_jobs(actor_discord_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
