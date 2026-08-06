-- Neuevault administration state only. The repository remains the canonical catalog.
CREATE TABLE delegated_admins (
  discord_id TEXT PRIMARY KEY CHECK(length(discord_id) BETWEEN 17 AND 20) CHECK(discord_id NOT GLOB '*[^0-9]*'),
  created_by TEXT NOT NULL CHECK(length(created_by) BETWEEN 17 AND 20) CHECK(created_by NOT GLOB '*[^0-9]*'),
  created_at TEXT NOT NULL
);

CREATE TABLE admin_audit_log (
  event_id TEXT PRIMARY KEY,
  actor_discord_id TEXT NOT NULL CHECK(length(actor_discord_id) BETWEEN 17 AND 20) CHECK(actor_discord_id NOT GLOB '*[^0-9]*'),
  actor_role TEXT NOT NULL CHECK(actor_role IN ('owner', 'delegated')),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  outcome TEXT NOT NULL CHECK(outcome IN ('success', 'rejected', 'failed')),
  diagnostic TEXT,
  request_id TEXT NOT NULL,
  publication_commit_sha TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX admin_audit_actor_created ON admin_audit_log(actor_discord_id, created_at DESC);
CREATE INDEX admin_audit_target_created ON admin_audit_log(target_type, target_id, created_at DESC);
CREATE INDEX admin_audit_created ON admin_audit_log(created_at);

CREATE TABLE upload_jobs (
  job_id TEXT PRIMARY KEY,
  actor_discord_id TEXT NOT NULL CHECK(length(actor_discord_id) BETWEEN 17 AND 20) CHECK(actor_discord_id NOT GLOB '*[^0-9]*'),
  proposed_asset_id TEXT NOT NULL,
  base_commit_sha TEXT NOT NULL,
  cloudinary_asset_id TEXT,
  cloudinary_public_id TEXT,
  cloudinary_version INTEGER,
  cloudinary_resource_type TEXT,
  cloudinary_delivery_type TEXT,
  preview_asset_id TEXT,
  preview_public_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('created', 'uploading', 'uploaded', 'verifying', 'verified', 'publication_pending', 'commit_created', 'deployment_pending', 'live', 'failed', 'expired', 'cleanup_eligible', 'cleaned')),
  format TEXT,
  byte_size INTEGER CHECK(byte_size IS NULL OR (byte_size >= 0 AND byte_size <= 26214400)),
  width INTEGER CHECK(width IS NULL OR (width > 0 AND width <= 12000)),
  height INTEGER CHECK(height IS NULL OR (height > 0 AND height <= 12000)),
  animated INTEGER CHECK(animated IS NULL OR animated IN (0, 1)),
  mutation_json TEXT,
  mutation_sha256 TEXT,
  catalog_commit_sha TEXT,
  failure_code TEXT,
  sanitized_failure TEXT,
  recoverable INTEGER NOT NULL DEFAULT 0 CHECK(recoverable IN (0, 1)),
  cleanup_state TEXT NOT NULL DEFAULT 'not_eligible',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK(width IS NULL OR height IS NULL OR width * height <= 100000000)
);
CREATE UNIQUE INDEX upload_jobs_active_asset_id ON upload_jobs(proposed_asset_id) WHERE status NOT IN ('failed', 'expired', 'cleaned');
CREATE INDEX upload_jobs_actor_created ON upload_jobs(actor_discord_id, created_at DESC);
CREATE INDEX upload_jobs_status_updated ON upload_jobs(status, updated_at);

CREATE TABLE publication_jobs (
  publication_id TEXT PRIMARY KEY,
  actor_discord_id TEXT NOT NULL CHECK(length(actor_discord_id) BETWEEN 17 AND 20) CHECK(actor_discord_id NOT GLOB '*[^0-9]*'),
  action TEXT NOT NULL,
  base_commit_sha TEXT NOT NULL,
  mutation_sha256 TEXT NOT NULL,
  mutation_json TEXT,
  status TEXT NOT NULL CHECK(status IN ('validating', 'catalog_commit_pending', 'commit_created', 'deployment_pending', 'live', 'failed', 'conflict')),
  commit_sha TEXT,
  deployment_id TEXT,
  deployed_commit_sha TEXT,
  failure_code TEXT,
  sanitized_failure TEXT,
  recoverable INTEGER NOT NULL DEFAULT 0 CHECK(recoverable IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX publication_status_updated ON publication_jobs(status, updated_at);
