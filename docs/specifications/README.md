---
title: Neuevault Specifications
status: active
authority: specifications-index
last-reviewed: 2026-07-23
---

# Neuevault specifications

This directory contains reviewed future-state contracts for Neuevault.
Specifications define intended behavior or architecture that may not yet be
implemented.

## Status model

Every specification must declare one of these statuses in its front matter:

- `draft` — under discussion; not authorized for implementation.
- `review` — ready for review; not yet authoritative.
- `approved` — accepted implementation guidance.
- `implemented` — approved and reflected in the current repository.
- `superseded` — replaced and ready to move to `docs/archive/`.

Only `approved` and `implemented` specifications are authoritative.

## Required front matter

Use this template:

```yaml
---
title: Specification title
status: draft
authority: specification
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
supersedes: null
related-audits: []
---
```

## Required contents

A specification should state:

1. Scope and goals
2. Explicit non-goals
3. Current-state evidence
4. Approved decisions
5. Component, data, or architecture contracts
6. Responsive, accessibility, security, and reduced-motion requirements
7. Migration sequence
8. Testing and acceptance criteria
9. Rollback or compatibility requirements
10. Open questions and deferred work

## Writing rules

- Base decisions on the current source, verified production behavior, and
  relevant audits.
- Use external references as evidence, not mandates.
- Separate confirmed facts from design decisions and unresolved questions.
- Prefer shared system contracts over page-specific pixel fixes.
- Do not add a new token, primitive, dependency, or architectural layer
  without explaining its role.
- Preserve security boundaries, authentication behavior, and protected asset
  delivery unless the specification explicitly covers them.
- Link to relevant files under `docs/audits/` and `docs/project/`.

## Planned specification sequence

Create specifications only when their phase begins. The expected sequence is:

1. Neuevault design-system specification
2. Typography migration
3. Shared controls and icon system
4. Category-grid and category-card system
5. Route-by-route UI migration
6. Large-catalog data architecture

Do not create empty placeholder specifications merely to fill this list.

## Relationship to project documentation

After an approved specification is implemented and verified, update
`docs/project/DEVELOPMENT.md` and/or `docs/project/DESIGN_SYSTEM.md` so they
describe the actual current system. Mark the specification `implemented`; do
not leave contradictory guidance active.
