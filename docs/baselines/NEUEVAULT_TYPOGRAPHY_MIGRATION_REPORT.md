---
title: Neuevault Typography Migration Report
status: completed
authority: migration-evidence-report
based-on:
  - ../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md
  - ./NEUEVAULT_VISUAL_BASELINE.md
  - ./NEUEVAULT_VISUAL_BASELINE_CAPTURE_REPORT.md
report-date: 2026-07-26
---

# Neuevault Typography Migration Report

## 1. Phase status

Phase 3 is complete. The public typography system now uses:

- SF Pro Rounded Regular 400 for regular UI roles;
- SF Pro Rounded Medium 500 for medium UI roles;
- SF Pro Rounded Semibold 600 for headings, buttons, and the hero;
- TBJ Neuetra for the Neuevault wordmark only.

The former Rounded/non-rounded 700 investigations are retained as superseded
prerequisite history. The approved system no longer requires, searches for,
publishes, synthesizes, or maps any public role to weight 700.

## 2. Files changed

Production:

- `styles.css`
- `public/fonts/SF-Pro-Rounded-Regular.woff2`
- `public/fonts/SF-Pro-Rounded-Medium.woff2`
- `public/fonts/SF-Pro-Rounded-Semibold.woff2`
- removed `public/fonts/Arimo-VariableFont_wght.woff2`
- removed `public/fonts/Archivo-VariableFont_wdth,wght.woff2`

Tests:

- `tests/unit/design-system.test.js`
- `tests/unit/homepage-assets.test.js`
- `tests/e2e/prototype.spec.js`

Documentation:

- `docs/specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md`
- `docs/baselines/NEUEVAULT_TYPOGRAPHY_MIGRATION_REPORT.md`

Ignored evidence:

- `.reference-audit/neuevault/typography/`

No route, component structure, icon, Unicode symbol, data, authentication,
download, Cloudinary, category interaction, category gap, mobile-menu, masonry,
modal-history, dependency, or deployment configuration changed.

## 3. Final font metadata

Two independent checks were used: direct WOFF2/OpenType table inspection and
isolated browser loading in Chromium and Firefox.

| Published file | Bytes | SHA-256 | Internal naming | OS/2 weight | Width | Style | Chromium | Firefox |
|---|---:|---|---|---:|---:|---|---|---|
| `public/fonts/SF-Pro-Rounded-Regular.woff2` | 1,177,080 | `b9104321cb8ec842076bf38dd0e1042a01d33b38038e644d3b37b9871fbdb2be` | SF Pro Rounded / Regular / SFProRounded-Regular | 400 | 5 | normal | pass | pass |
| `public/fonts/SF-Pro-Rounded-Medium.woff2` | 1,248,924 | `e3661c592d20c9f9c50dcf670fe6ce0c4305370c3676ff8c3f3f05d442a929b8` | SF Pro Rounded / Medium / SFProRounded-Medium | 500 | 5 | normal | pass | pass |
| `public/fonts/SF-Pro-Rounded-Semibold.woff2` | 1,256,272 | `fe8cf20eb207b92ab35ee838a7a1ce286cf3214213e4b8eaee4c586138bc479b` | SF Pro Rounded / Semibold / SFProRounded-Semibold | 600 | 5 | normal | pass | pass |

All three files are static, normal-style WOFF2 faces. Each production request
returned HTTP 200 with a WOFF2 content type in both browsers. No parser,
sanitizer, missing-face, italic, or synthetic-weight warning was observed.

## 4. Font declarations

`styles.css` publishes exactly three SF Pro Rounded `@font-face` declarations
at weights 400, 500, and 600 with `font-display: swap`. `font-synthesis: none`
remains enforced. TBJ Neuetra remains separately declared for the wordmark.
No variable range, italic face, Rounded Bold, Heavy, Black, non-rounded SF Pro,
SF Pro Display, SF Pro Text, Arimo, or Archivo face is published.

## 5. Final family and weight mapping

| Weight | Public roles |
|---:|---|
| 400 | body, compact body, metadata, captions, fields, category counts, regular footer copy |
| 500 | navigation, hero eyebrow, hero description, category titles, errors, medium labels |
| 600 | buttons, hero title and CTA, route/section/card/modal headings, badges, empty-state headings, emphasized footer copy |
| TBJ Neuetra 400 | Neuevault wordmark only |

CSS and computed-style audits found no public role at weight 700, 800, or 900.

## 6. Hero result

The hero title resolves to SF Pro Rounded Semibold 600 at the approved initial
desktop 46px size and 48px line height. Authored title spans and description
line groups remain intact. No transform was introduced to compensate for font
metrics. The CTA remains weight 600 and its geometry and action are unchanged.

## 7. Category result

Category titles resolve to SF Pro Rounded Medium 500 and counts to Regular 400.
The existing category geometry, 16px compatibility gap, image reveal,
animated-cover lifecycle, focus/touch behavior, and reduced-motion behavior
are unchanged. The future 1.4-to-1 reveal and 10px gap were not implemented.

## 8. Arimo, Archivo, and Inter removal

Arimo and Archivo declarations and public font files were removed after all
consumers migrated. Inter no longer appears in public stylesheet roles.
Computed evidence contains no Arimo, Archivo, or Inter fallback result. TBJ
Neuetra appears only on the wordmark.

## 9. Responsive and browser evidence

Evidence covers Chromium and Firefox at 320, 375, 520, 700, 701, 768, 1024,
1199, 1200, 1439, 1440, 1600, and 1920 pixels across the homepage, navigation,
category, collection and asset cards, Search, About, Collections, public and
restricted modals, signed-out auth dialog, empty category, 404, and footer.

The capture contains 143 fixtures per browser (286 total). Every audited role
resolved to the SF Pro Rounded stack at 400/500/600 or the TBJ wordmark face.
There were zero missing-face results, zero font warnings, zero clipped labels,
and zero horizontal-overflow results.

One metric-compatible correction was required at the 320px Firefox breakpoint:
mobile search controls now use `width: 100%` and `min-width: 0` so the new font
metrics cannot force horizontal overflow. This is a containment correction,
not an intentional visual redesign.

## 10. Accessibility and behavior

Accessible names, landmarks, roles, focus behavior, keyboard navigation,
responsive navigation, History API routing, modal Back/Forward behavior,
Lenis behavior, authentication, public downloads, and restricted `nv-166`
delivery remain unchanged. Playwright regression coverage passed.

## 11. Console and network

Both browser font audits completed without parser or font-loading warnings.
All three SF Pro Rounded faces and TBJ Neuetra loaded successfully. Local
Cloudflare Pages runtime checks returned HTTP 200 for the homepage, a clean
deep route, and the signed-out session endpoint; restricted `nv-166` returned
HTTP 401 with `Cache-Control: no-store`.

The ignored Vite-preview evidence may contain expected `/api` failures because
Vite preview does not execute Pages Functions; Pages runtime and automated
function tests provide the authoritative function verification.

## 12. Release gate

| Check | Result |
|---|---|
| `npm test` | pass — 74/74 |
| `npm run build` | pass |
| `npm run validate:assets` | pass — 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass — 47 passed, 17 expected skips |
| `npm run audit:bundle` | pass — entry 476,361 bytes / 47,378 gzip |
| `npm run audit:cache-headers` | pass — 5 hashed outputs covered |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass — 234 manifest assets / 235 remote resources |
| Chromium typography matrix | pass |
| Firefox typography matrix | pass |
| local Cloudflare Pages runtime | pass |

## 13. Superseded 700 audit history

Earlier audits correctly rejected mislabeled or malformed Rounded, SF Pro
Display, and SF Pro Text “Bold” candidates. That evidence remains in the
ignored audit directory as historical provenance. The final approved
three-face system makes those candidates irrelevant to completion; none is
published or referenced, and no further 700 search or approval is required.

## 14. Rollback boundary

The atomic typography implementation commit is the rollback boundary. Reverting
it restores the previous Arimo/Archivo declarations and files, prior typography
token mappings and role metrics, and removes the three published SF Pro Rounded
faces. No data or application-behavior rollback is required.

## 15. Publication record

This report is committed with the typography implementation, so its own commit
hash cannot be embedded without creating a second commit. The exact
implementation commit, push result, Cloudflare deployment, and three-host
verification are recorded in the Phase 3 completion handoff.

## 16. Completion checklist

- [x] specification amended to the unified 400/500/600 direction
- [x] prior 700 requirements and searches superseded
- [x] exactly three static SF Pro Rounded faces published
- [x] all three faces pass metadata and Chromium/Firefox loading
- [x] all public UI/display roles migrated
- [x] hero title resolves to SF Pro Rounded 600 at 46/48 desktop
- [x] TBJ Neuetra remains wordmark-only
- [x] no public role uses 700, Heavy, or Black
- [x] Arimo, Archivo, and Inter removed from public roles
- [x] responsive and computed-style matrix passes
- [x] accessibility and behavior remain unchanged
- [x] complete release gate passes
- [x] Phase 3 completed
