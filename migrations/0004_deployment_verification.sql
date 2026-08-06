-- Phase 7 stores the immutable catalog expectation used by two-signal deployment verification.
ALTER TABLE publication_jobs ADD COLUMN catalog_digest TEXT;
ALTER TABLE upload_jobs ADD COLUMN catalog_digest TEXT;
CREATE INDEX publication_commit_pending ON publication_jobs(commit_sha, status);
CREATE INDEX upload_commit_pending ON upload_jobs(catalog_commit_sha, status);
