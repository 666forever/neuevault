---
title: Neuevault Documentation Archive
status: active
authority: archive-index
last-reviewed: 2026-07-23
---

# Neuevault documentation archive

This directory stores superseded documentation that remains useful for
historical comparison or migration context.

Archived material is not current implementation guidance.

## What belongs here

- Superseded specifications
- Replaced design-system documents
- Completed experiments that are no longer active
- Historical migration plans
- Prior architecture decisions retained for context
- Audits that have been explicitly replaced by newer audits

Do not archive:

- Current authoritative project documentation
- Active or approved specifications
- Current audits
- Source code
- Generated build output
- Temporary evidence or downloaded reference assets

## Archiving procedure

Before moving a document here:

1. Confirm a newer authoritative document replaces it or it is no longer
   active.
2. Update its front matter to `status: superseded`.
3. Add `superseded-by` and `archived` fields.
4. Preserve the original body unless a short archival note is required.
5. Update links in `docs/README.md` and related documents.
6. Ensure no active document still treats the archived file as authoritative.

Example:

```yaml
---
title: Previous design-system specification
status: superseded
authority: archive
archived: YYYY-MM-DD
superseded-by: ../specifications/NEW_SPECIFICATION.md
---
```

## Rules for Codex and other agents

- Do not use archived files as implementation requirements.
- Read them only when a task explicitly requests historical comparison,
  rollback context, or rationale.
- When archived and active material conflict, the active material wins.
- Do not restore archived requirements silently.
- Do not delete archived documents without explicit authorization.

Keep this directory small and intentional. Git history remains the primary
record for ordinary file revisions.
