---
title: Neuevault Documentation
status: active
authority: documentation-index
last-reviewed: 2026-07-24
---

# Neuevault documentation

This directory contains Neuevault's authoritative project documentation,
approved specifications, implementation audits, external reference research,
and archived material.

## Document authority

When documents conflict, use this order:

1. Current repository source and verified production behavior
2. Approved specifications in [`specifications/`](specifications/)
3. Active visual baselines in [`baselines/`](baselines/)
4. Current project documentation in [`project/`](project/)
5. Neuevault implementation audits in
   [`audits/neuevault/`](audits/neuevault/)
6. External reference audits in
   [`audits/references/`](audits/references/)
7. Historical or superseded material in [`archive/`](archive/)

Task files explain how an audit or document was produced. They are not current
product specifications unless explicitly marked otherwise.

If source, production behavior, and documentation disagree, do not silently
choose one. Record the discrepancy and resolve it within the scope of the
current task.

## Current project documentation

- [`project/DEVELOPMENT.md`](project/DEVELOPMENT.md) — architecture,
  development workflows, deployment, data, authentication, and operational
  conventions.
- [`project/DESIGN_SYSTEM.md`](project/DESIGN_SYSTEM.md) — the currently
  implemented design tokens, component contracts, interaction rules, and
  accessibility requirements.

## Current Neuevault audits

- [`audits/neuevault/NEUEVAULT_UI_INVENTORY.md`](audits/neuevault/NEUEVAULT_UI_INVENTORY.md)
  — read-only inventory of the current Neuevault interface and implementation.
- [`audits/neuevault/NEUEVAULT_UI_INVENTORY_TASK.md`](audits/neuevault/NEUEVAULT_UI_INVENTORY_TASK.md)
  — historical instructions used to produce the inventory.

## External references

- [`audits/references/grainient/GRAINIENT_REFERENCE.md`](audits/references/grainient/GRAINIENT_REFERENCE.md)
  — measured Grainient UI/UX research. This is supporting reference material,
  not a Neuevault specification.
- [`audits/references/grainient/GRAINIENT_AUDIT_TASK.md`](audits/references/grainient/GRAINIENT_AUDIT_TASK.md)
  — historical instructions used to produce the Grainient audit.

External references must never override Neuevault's product requirements,
security boundaries, accessibility standards, or approved specifications.

## Specifications

Approved future-state contracts belong in
[`specifications/`](specifications/). A specification becomes authoritative
only after it is explicitly marked `approved`.

- [`specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md`](specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md)
  — approved future-state design-system contract and phased migration
  authority.

Draft specifications may inform discussion, but they must not be treated as
implementation authorization.

## Active baselines

- [`baselines/NEUEVAULT_VISUAL_BASELINE.md`](baselines/NEUEVAULT_VISUAL_BASELINE.md)
  — active route, viewport, state, accessibility, and evidence plan for
  comparing the current production interface with separately authorized
  future implementation phases.

Baselines define reproducible evidence and comparison requirements. They do
not authorize production changes or supersede an approved specification.

## Archive

Superseded documents belong in [`archive/`](archive/). Archived files must not
be used as current implementation guidance unless a task explicitly requests
historical comparison.

## Rules for Codex and other agents

Before changing UI, architecture, data flows, or operational behavior:

1. Read this index.
2. Read [`project/DEVELOPMENT.md`](project/DEVELOPMENT.md).
3. Read the relevant approved specification, if one exists.
4. Read the relevant Neuevault audit for implementation evidence.
5. Use external audits only for comparison and inspiration.
6. Treat files ending in `_TASK.md` as historical instructions, not current
   product requirements.
7. Preserve existing working behavior unless the active task explicitly
   authorizes a change.
8. Report documentation conflicts rather than resolving them silently.

When creating a new document, include front matter identifying its title,
status, authority, and review or observation date.
