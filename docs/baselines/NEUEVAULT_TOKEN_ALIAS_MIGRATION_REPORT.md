---
title: Neuevault Token Alias Migration Report
status: completed
authority: migration-evidence-report
based-on:
  - ../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md
  - ./NEUEVAULT_VISUAL_BASELINE.md
  - ./NEUEVAULT_VISUAL_BASELINE_CAPTURE_REPORT.md
report-date: 2026-07-25
---

# Neuevault Token Alias Migration Report

## 1. Phase status

The semantic alias and compatibility layer passes the
required visual, computed-layout, accessibility, behavior, console, network,
breakpoint, protected-content, unit, browser, build, asset, bundle, cache,
secret, and Cloudinary checks.

The release gate was cleared by correcting the stale documentation path in
`tests/unit/design-system.test.js` from repository-root `DEVELOPMENT.md` to
`docs/project/DEVELOPMENT.md`. No assertion, matcher, test, or skip state was
removed, weakened, broadened, or disabled.

Release status is **completed**. The documentation dependency was resolved in
commit `4602750a4910dfffd212f5905ad2afb1a6dfbc44`, which places
`docs/project/DEVELOPMENT.md` in the committed tree and completes the
authoritative documentation structure. A detached clean worktree at that
commit confirmed that every relative link in `docs/README.md` resolves. With
only the validated Phase 2 stylesheet and corrected test overlaid, the same
worktree passed the complete unit suite: 14 files and 73 tests.

The Phase 2 commit is the commit containing this report, `styles.css`, and the
corrected unit test. Its immutable hash, push result, Cloudflare deployment,
and production-host results are recorded in the publication report because a
Git commit cannot contain its own hash or outcomes that occur only after that
commit is created.

## 2. Files changed

Allowed task files changed:

- `styles.css`
- `tests/unit/design-system.test.js`
- `docs/baselines/NEUEVAULT_TOKEN_ALIAS_MIGRATION_REPORT.md`

Ignored evidence was generated under:

- `.reference-audit/neuevault/token-alias/`

No component markup, JavaScript, fonts, icons, Unicode symbols, media, data,
generated manifests, functions, configuration, dependencies, routes, or
catalog files were changed.

## 3. Existing token inventory

Before this phase, the root token block contained 206 declarations:

| Existing group | Count |
|---|---:|
| color and surface contracts | 50 |
| typography contracts | 30 |
| spacing contracts | 10 |
| radius contracts | 10 |
| control contracts | 9 |
| icon contracts | 6 |
| motion contracts | 13 |
| layer contracts | 7 |
| layout and component contracts | 71 |

The current stylesheet contains 356 unique declarations after adding the
semantic layer and type-role contracts. The token contract audit found zero
duplicate declarations, zero circular references, and zero missing required
aliases.

## 4. New semantic aliases

### Color

The new canonical roles are:

| Semantic role | Current compatibility value/source |
|---|---|
| `--color-canvas` | `--color-black` |
| `--color-surface` | `--gray-900` |
| `--color-surface-raised` | `--gray-850` |
| `--color-control` | `#111` |
| `--color-control-hover` | `--gray-825` |
| `--color-active-surface` | `#151515` |
| `--color-text-primary` | `--gray-50` |
| `--color-text-secondary` | `--gray-300` |
| `--color-text-muted` | `--gray-500` |
| `--color-text-subtle` | `--gray-600` |
| `--color-text-inverse` | `--color-black` |
| `--color-accent` | `--color-acid` |
| `--color-accent-text` | `--color-black` |
| `--color-border-subtle/default/strong` | existing gray primitives |
| `--color-focus-ring` | `--color-accent` |
| `--color-overlay` | existing `rgba(0,0,0,.82)` value |

No success, warning, error, or restricted-state colors were invented.

### Typography

`--font-ui-current` preserves `"Inter", sans-serif`; `--font-ui` resolves to
that current stack. `--font-ui-future` records the approved future SF Pro
Rounded stack but has no consumer and no `@font-face`. TBJ Neuetra remains the
brand family, while Arimo and Archivo remain active compatibility families.

Weight aliases were added for 400, 500, 600, and 700. Semantic property groups
were added for body, compact body, metadata, caption, navigation, button, hero
eyebrow/title/description, route H1, section H2, card title, category
count/title, modal title, badge, field, empty heading, error, and footer. Each
resolves to current production metrics rather than future SF Pro metrics.

### Layout, radius, motion, controls, icons, and layers

The required gutter and container roles, radius hierarchy, focus outline
roles, motion roles, control-height roles, and icon-size roles were added.
Existing z-index layer names already met the approved contract and were
retained unchanged.

## 5. Legacy compatibility mappings

Existing color-facing contracts now resolve through semantic color roles:

```text
--bg-page              -> --color-canvas
--bg-surface           -> --color-surface
--bg-surface-raised    -> --color-surface-raised
--bg-control           -> --color-control
--bg-control-hover     -> --color-control-hover
--bg-overlay           -> --color-overlay
--text-*               -> --color-text-*
--border-*-color       -> --color-border-*
--focus-ring           -> --color-focus-ring
```

Existing weight, compact/standard/large radius, control-height, icon-size,
fade/media duration, and easing contracts likewise resolve through the new
roles where the browser-computed result remains identical.

Several test-pinned and layout-sensitive legacy declarations remain the
literal compatibility source, with the semantic name aliasing them:

- rolling duration, nav-pill duration/easing/background;
- page/content/navigation/footer gutters;
- navigation, hero, and category maxima.

This preserves source-level test contracts and avoids creating a false
consumer migration. It is an intentional compatibility direction, not a
second semantic value.

## 6. Consumers migrated

No component selector was renamed or refactored. Existing consumers continue
to use their legacy contracts, which now reach the semantic layer through the
compatibility mappings above.

This phase deliberately did not switch any typography consumer, component
primitive, markup structure, or future font role. The only production
consumer effect is alias indirection with the same resolved value.

## 7. Intentional exceptions retained

The following tuned values remain component-local:

- hero gradient stops and fallback layers;
- hero grain opacity;
- image/media scrims;
- object positions and authored crops;
- modal navigation offsets;
- category copy shadow;
- authored asset and cover values;
- component-specific optical spacing;
- current category opacity/scale behavior;
- collection-card lift and existing media transitions.

The future category 1.4-to-1 reveal was not added. The mobile-menu Escape and
outside-click defects remain unchanged, as required.

## 8. Computed-style parity

Targeted evidence compares the current production stylesheet with the built
candidate stylesheet replayed against the same production shell, APIs, data,
browser state, locale, time zone, DPR, and fonts. This isolates CSS from the
expected authentication difference on a local hostname.

The comparison covers body/page, header/navigation, hero, category,
collection, asset, search, modal, restricted auth state, footer, and
empty/not-found surfaces. It records colors, borders, radii, spacing,
dimensions, typography, transforms, transitions, layers, and overflow.

Result: **pass**.

- no resolved token-value change;
- no typography change;
- no measured geometry change;
- no breakpoint change;
- no new horizontal overflow.

One raw Chromium CSSOM sample serialized the category grid's automatic inline
margins as `0px` instead of `4px` at 1920px. In both captures its measured
rectangle was exactly `x=16`, `width=1888`, `height=478`. Repeated same-build
sampling showed that only the CSSOM serialization varies; actual spacing and
geometry do not.

The static token audit is:

```text
.reference-audit/neuevault/token-alias/token-contract.json
```

## 9. Visual regression results

Required Chromium breakpoint evidence covers 320, 700, 701, 1199, 1200, 1439,
1440, and 1920 pixels. Chromium and Firefox route fixtures cover `/`,
`/search`, `/collections`, the representative public modal, restricted
signed-out `nv-166`, and 404.

Result: **pass**.

Volatile image/video pixels were masked without changing layout. Seventeen of
19 comparisons were byte-identical. The remaining two Chromium screenshots
differed across 2 and 9 pixels respectively, with a maximum change of one RGB
channel level. Their geometry and computed visual properties were identical.
The difference was investigated and classified as antialiasing/rasterization
noise, not an approved or visible design delta.

Evidence index:

```text
.reference-audit/neuevault/token-alias/manifest.json
.reference-audit/neuevault/token-alias/comparison-summary.json
```

## 10. Accessibility and behavior checks

Result: **pass**.

- 19 of 19 semantic snapshots matched exactly.
- Accessible names, roles, `aria-current`, expanded state, and disabled state
  were unchanged.
- Route active states, modal state, auth-dialog state, and body scroll-lock
  state matched.
- The known mobile-menu Escape defect reproduced before and after; it was not
  fixed in this phase.
- No new console warnings/errors were recorded.
- No new first-party failure was recorded.
- Local Pages runtime returned `200` for `/` and `/api/auth/session`.
- Local signed-out `/api/download/nv-166` remained `401`.
- No SF Pro Rounded face was activated.
- Arimo, Archivo, TBJ Neuetra, icons, and Unicode symbols were unchanged.

## 11. Build and test results

| Check | Result |
|---|---|
| CSS parsing through Vite production build | pass |
| `npm run build` | pass |
| `npm run validate:assets` | pass; 234 assets, 4 collections, 4 categories |
| targeted token/interaction/foundation unit tests | pass; 17/17 |
| `npm test` | pass; 14 files, 73/73 tests |
| `npm run test:e2e` | pass; 47 passed, 17 intentionally skipped |
| `npm run audit:bundle` | pass |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass; 234 manifest assets against 235 remote resources |
| local Cloudflare Pages runtime | pass for shell, session, and restricted signed-out boundary |

The stale unit-test path now resolves
`docs/project/DEVELOPMENT.md` from the repository root using the test's
existing `path.join(root, ...)` convention. The assertion body is unchanged.
The 17 Playwright skips are the same project-configured mobile/desktop
applicability skips recorded before the correction; no new test was skipped.

`styles.css` remained byte-for-byte unchanged after the prior parity
validation:

```text
SHA-256 09e2d173486aa8290e2313e19e0f1cfec0f88159ae8ed29b60344dd2ffa43cd9
```

The authoritative development document is now committed. The publication
commit, push, and production deployment are the final actions in this phase;
their immutable identifiers and live results are recorded in the task's final
publication report.

## 12. Deferred token decisions

- SF Pro Rounded remains an unused future alias until the approved typography
  migration.
- Success, warning, error, and restricted semantic colors remain deferred.
- Arimo and Archivo removal remains deferred.
- Future category reveal timing and implementation remain deferred.
- Direct component-primitive migration remains deferred.
- Component-local optical/media exceptions remain candidates for later,
  evidence-backed review only.

## 13. Rollback boundary

The production rollback boundary is limited to the semantic alias and
compatibility declarations added to the `:root` block of `styles.css`.
Component selectors, markup, behavior, data, functions, and assets do not need
rollback.

Rollback consists of reverting the single Phase 2 commit containing the
stylesheet compatibility layer, corrected test path, and this report. The
documentation dependency commit remains an independent rollback boundary.
The ignored evidence directory may be deleted independently.

## 14. Completion checklist

- [x] approved semantic aliases exist
- [x] no circular custom-property references
- [x] no duplicate root declarations
- [x] current consumers render identically
- [x] no SF Pro Rounded activation
- [x] Arimo and Archivo retained
- [x] no icon or Unicode replacement
- [x] no component refactor
- [x] no route/data/auth/download/Cloudinary/catalog change
- [x] computed-style parity passed
- [x] visual parity passed after raster-noise investigation
- [x] accessibility and behavior parity passed
- [x] console/network/breakpoint parity passed
- [x] ignored evidence and sanitized manifest exist
- [x] rollback boundary is explicit
- [x] stale documentation path corrected
- [x] no assertion weakened, removed, or skipped
- [x] complete unit command exits successfully
- [x] production build and all required audits pass
- [x] browser suite passes with no newly skipped test
- [x] authoritative `docs/project/DEVELOPMENT.md` is present in the committed tree
- [x] clean-checkout documentation-link verification passed
- [x] clean-checkout candidate unit suite passed, 73/73
- [x] Phase 2 candidate is limited to the three authorized files
- [x] publication identifiers and production results are required in the final report

The release gate is complete. No unrelated worktree content is included in
the Phase 2 publication.
