---
title: Neuevault Collection Geometry Alignment Report
status: completed
date: 2026-07-27
phase: 7B-collection-reference-geometry
---

# Neuevault collection geometry alignment

## 1. Phase status

Phase 7B is implemented and has passed the complete release gate. The correction
is limited to collection-section and collection-card geometry. Phase 7 media
lifecycle, accessibility, playback safety, routes, content, and interaction
limits remain unchanged.

## 2. Files changed

- `styles.css`
- `src/pages/pages.js`
- `tests/unit/collection-cards.test.js`
- `tests/e2e/prototype.spec.js`
- this report

Ignored evidence is under
`.reference-audit/neuevault/collection-geometry/`.

## 3. Why Phase 7 remained mismatched

Phase 7 intentionally preserved the existing 1080px homepage section, 14px
grid gap, compact 350.66px cards, 0.96 media ratio, 4px inset, and compact
metadata. That was appropriate for isolating lifecycle and accessibility work,
but it left the visual composition substantially smaller than the selected
reference.

## 4. Reference measurement method

Grainient and current Neuevault production were measured in-browser at matching
requested widths of 1200, 1440, 1600, and 1920px. Measurements used DOM bounds
and computed styles for the section frame, grid, first card, media, metadata,
header, and spacing. Matching screenshots were then captured. The final local
build was measured across all required breakpoints in Chromium, with an
independent Firefox run covering the same widths.

The sites use different scrollbar widths. Comparison therefore uses rendered
grid and card bounds rather than treating the nominal viewport width as usable
content width.

## 5. Reference/current/target/final comparison

| Viewport | Reference grid | Before grid | Final grid | Reference card | Before card | Final card |
|---:|---:|---:|---:|---:|---:|---:|
| 1200 | 1165px | 1080px | 1165px | 378.33 × 506.86 | 350.66 × 430.86 | 378.33 × 506.73 |
| 1440 | 1405px | 1080px | 1405px | 458.33 × 592.72 | 350.66 × 430.86 | 458.33 × 592.59 |
| 1600 | 1440px | 1080px | 1440px | 470 × 605.25 | 350.66 × 430.86 | 470 × 605.09 |
| 1920 | 1440px | 1080px | 1440px | 470 × 605.25 | 350.66 × 430.86 | 470 × 605.09 |

| Contract | Reference | Before | Final |
|---|---:|---:|---:|
| Grid gap | 15px | 14px | 15px |
| Card inset | 5px | 4px | 5px |
| Card radius | 20px | 16px | 20px |
| Media radius | 15px | 13px | 15px |
| Media ratio | 0.9318 | 0.96 | 41/44 (0.9318) |
| Metadata height, one-line copy | 101.59px | 66px | 101.59px |
| Header-to-grid gap | 30px | 25px | 30px |
| Section space before | 200px | 210px | 200px |
| Section space after | 200px | 170px | 200px |

## 6. Final section width

The homepage collection section now uses a collection-specific 1440px maximum.
Its calibrated 10px CSS gutter produces the same rendered grid widths as the
reference at matching requested viewports while avoiding horizontal overflow.
The global `.section`, `.page`, category, recent, and asset layouts were not
widened.

## 7. Final grid geometry

The grid remains three equal columns above 700px and one column at or below
700px. Both axes use a 15px gap. No two-column breakpoint was introduced.

## 8. Final card dimensions

Desktop card dimensions are shown in the comparison table. Total height remains
natural: the media ratio is explicit and metadata can expand for real wrapped
content. Rows may grow to the longest natural card without clipping.

## 9. Final media ratio and height

Desktop media uses `41 / 44`, measured as 0.9318. At the 470px capped card the
Neuevault media frame is 458 × 491.5px. The reference frame is 460 × 493.66px.
The two-pixel inset difference is intentional: Neuevault retains its real 1px
border inside border-box sizing. Outer card height differs by only 0.16px.

Mobile retains its approved 1.02 ratio so the desktop correction does not force
the reference's tall composition onto narrow screens.

## 10. Final metadata spacing

Desktop metadata uses 24px on all sides, a 10px title-to-description gap,
20/24px medium title typography, and 14/19.6px regular description typography.
This produces the measured 101.59px single-line metadata region. At 700px and
below the prior compact 16/13/15px padding, 7px gap, and mobile typography are
preserved.

## 11. Header and View all alignment

The homepage section receives a dedicated modifier. Heading and `View all`
share the collection frame, align centrally on the same 24px line box, and sit
30px above the grid. The collection-specific action removes the legacy
underline to match the measured reference. Other section headers and text links
are unchanged.

## 12. Vertical rhythm

Desktop spacing is 200px from the preceding category section to the collection
section and 200px from the collection grid to the recent section, matching the
reference. Mobile keeps the approved 92px section rhythm.

## 13. Responsive behavior

- 320, 375, 520, and 700px: one column, 24px total mobile gutter, mobile radius
  and spacing, no overflow.
- 701, 768, 1024, and 1199px: three columns remain authoritative; content wraps
  naturally and stays contained.
- 1200, 1439, 1440, 1600, and 1920px: three columns track the reference frame
  and cap at 470px per card.

The narrowest three-column state at 701px was visually inspected. It remains
usable, with natural title and description wrapping and no clipping.

## 14. Preserved Phase 7 lifecycle

The dedicated `.collection-media-frame`, 4px maximum lift, 1.03 maximum media
scale, load-before-crossfade behavior, static-first cleanup, visibility and
route disposal, failed-media fallback, touch first-tap navigation,
reduced-motion static behavior, and restricted-source boundary are unchanged.
No lifecycle JavaScript was edited.

## 15. Accessibility results

Cards remain single semantic anchors with one computed accessible name.
Static and animated media remain decorative. Keyboard focus preserves the
global solid focus indicator and triggers the same bounded visual state as
pointer hover. Focus outlines are not clipped. Touch navigation remains
first-tap, and reduced motion remains static.

## 16. Visual comparison classification

| Area | Classification | Evidence |
|---|---|---|
| Section and card scale | matched | identical measured grid/card widths |
| Grid gap | matched | 15px |
| Card total height | matched | within 0.16px at cap |
| Media ratio | matched | 41/44 |
| Metadata region | matched | 101.59px |
| Header/grid spacing | matched | 30px |
| Desktop vertical rhythm | matched | 200/200px |
| Mobile composition | intentionally adapted | retained approved Neuevault mobile contract |
| Media inner width | intentionally adapted | 2px narrower due to retained real border |
| Content and imagery | intentionally adapted | Neuevault data and media remain authoritative |

## 17. Browser evidence

The sanitized manifest is
`.reference-audit/neuevault/collection-geometry/manifest.json`.
It references:

- `reference-{1200,1440,1600,1920}.png`
- `before-{1200,1440,1600,1920}.png`
- `after-{all-required-widths}.png`
- `firefox-after-1440.png`
- reference, before, Chromium-after, and Firefox measurement JSON

Chromium and Firefox reported no horizontal overflow, incorrect column count,
geometry failure, focus failure, console error, or failed request in the
targeted geometry runs.

## 18. Unit, E2E, build, and audit results

- Focused collection unit tests: passed, 6/6.
- Focused collection Playwright tests: passed, 11; skipped by intended project
  applicability, 3.
- Production build and cache-header generation: passed.
- Unit suite: passed, 17 files and 91 tests.
- Full Playwright suite: passed, 59 tests; 21 intentional project-specific
  skips.
- Production build: passed; 35 modules transformed.
- Bundle audit: passed; 483,099-byte entry, 49,868-byte gzip,
  38,096-byte Brotli.
- Cache-header audit: passed; five hashed Vite assets covered.
- Asset validation: passed; 234 assets, four collections, four categories.
- Cloudinary secret audit: passed.
- Cloudinary verification: passed; 234 manifest assets checked against 235
  remote resources.
- Local Cloudflare Pages runtime: `/`, `/collections`,
  `/collections/noface-icons`, and `/api/auth/session` all returned HTTP 200
  with the expected content types.

## 19. Remaining intentional differences

The two-pixel media inset noted above preserves Neuevault's actual border.
Neuevault uses its approved images, copy, grayscale treatment, and Phase 7
interaction behavior rather than copying reference content or presentation.
Mobile remains product-specific. These differences do not prevent the outer
composition from matching the reference scale.

## 20. Rollback boundary

The atomic Phase 7B commit includes only the collection-section modifier,
collection geometry tokens/rules, focused tests, and this report. Reverting it
restores the prior 1080px section, 14px gap, compact card/media/metadata
geometry, and asymmetric section rhythm without undoing Phase 7 lifecycle,
accessibility, or restricted-media safety.

## 21. Completion checklist

- [x] Matching reference/current measurements recorded before editing.
- [x] Collection-specific width and rhythm; no global container widening.
- [x] Desktop grid/card/media geometry aligned.
- [x] Three-column desktop and one-column mobile preserved.
- [x] Real metadata remains natural-height and unclipped.
- [x] Phase 7 lifecycle and safety unchanged.
- [x] Chromium and Firefox targeted geometry checks pass.
- [x] Side-by-side evidence captured and sanitized.
- [x] Complete unit, build, E2E, asset, bundle, cache, secret, and Cloudinary gate.
- [x] Atomic commit and push.
- [x] Cloudflare deployment and production-host verification.
