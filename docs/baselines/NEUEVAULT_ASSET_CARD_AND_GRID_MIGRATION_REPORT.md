---
title: Neuevault Asset Card and Grid Migration Report
status: implementation-complete
date: 2026-07-27
phase: 8-asset-card-grid-alignment
---

# Neuevault asset-card and grid alignment

## 1. Phase status

Phase 8 is implemented and has passed the targeted Chromium/Firefox geometry,
interaction, lifecycle, error, accessibility, and Pages-runtime checks. The
complete release gate and production deployment are recorded below.

## 2. Files changed

- `styles.css`
- `src/components/AssetGrid.js`
- `src/components/images.js`
- `tests/unit/asset-grid.test.js`
- `tests/unit/design-system.test.js`
- `tests/e2e/prototype.spec.js`
- this report

Ignored evidence is under `.reference-audit/neuevault/asset-cards/`.
`AssetGrid.js` adds only the explicit public `data-asset-id` association; its
semantics, rendering order, batching, observers, and modal callback are
unchanged.

## 3. Current asset-card/grid inventory

Before Phase 8, the archive used `columns: 4 260px`, 12px column and vertical
gaps, the uncapped 2024px page frame, 15px cards with a real 1px subtle border,
intrinsic contained media, saturation `0.72`, and a maximum hover scale of
`1.025`. The overlay used a 78% black surface, 50/15/14px padding, 13px title,
10px metadata, and pointer/focus opacity reveal. At or below 700px the archive
used two columns, 8px gaps, and an always-visible overlay.

Each card was and remains one semantic button keyed by grid ID and logical item
index. The stable asset ID remains authoritative in the repository and modal
route. Static preview dimensions produce intrinsic card geometry. Public
animated media uses a separate decorative layer; restricted records have no
animated/original source in card markup.

The initial batch remains eight items. Load more appends eight, the sentinel
retains its 240px root margin, animated playback retains the 0.35 visibility
threshold, and exit retains the 220ms source-removal delay.

## 4. Reference/current/target/final measurements

Chromium and Firefox produced matching results within sub-pixel rounding.

| Viewport | Grainient reference grid/card | Before grid/card | Target grid/card | Final grid/card |
|---:|---:|---:|---:|---:|
| 1200 | 1170 / 281.25px | 1176 / 285px | 1170 / 281.25px | 1170 / 281.25px |
| 1440 | 1410 / 341.25px | 1416 / 345px | 1410 / 341.25px | 1410 / 341.25px |
| 1600 | 1440 / 348.75px | 1576 / 385px | 1440 / 348.75px | 1440 / 348.75px |
| 1920 | 1440 / 348.75px | 1896 / 465px | 1440 / 348.75px | 1440 / 348.75px |

| Contract | Reference | Before | Final |
|---|---:|---:|---:|
| Desktop columns | 4 | 4 | 4 |
| Column gap | 15px | 12px | 15px |
| Vertical gap | 15px | 12px | 15px |
| Card radius | 15px | 15px | 15px |
| Card border | none | 1px subtle | 1px subtle |
| Media behavior | uniform cover | intrinsic contain | intrinsic contain |
| Hover scale | not exposed by audit | 1.025 | 1.025 |
| Overlay | absent | 95px opaque surface | 100px soft gradient |
| Title | absent | 13px/normal/600 | 14/18px/600 |
| Metadata | absent | 10px/normal/400 | 11/15px/400 |
| Format badge | absent | 33.75×25px | 35.5×24px |

The first production landscape fixture is 800×320. Its final outer height is
113.69px at 1200, 137.69px at 1440, and 140.69px at the 1440px cap. The
portrait fixture `nv-140` is 735×990; its intrinsic final height is
approximately 378.1px, 459.0px, and 469.1px at the same widths. Grainient's
sampled cards are uniformly cropped near-square tiles, so portrait/landscape
height matching is intentionally rejected in favor of the approved Neuevault
intrinsic-media contract.

## 5. Final grid geometry

`--asset-grid-max` is 1440px and `--asset-grid-gutter` is 15px. The component
centers itself against the viewport without widening the global page or other
sections. Four CSS columns remain above 700px. The approved two-column mobile
layout remains at or below 700px with its existing compact 8px gaps.

No Grid masonry, JavaScript positioning, DOM reordering, new breakpoint, or
catalog-loading change was introduced.

## 6. Final card geometry

Cards retain a 15px radius and the semantic subtle border. The shell remains
stationary. At the desktop cap, the effective card width is 348.75px in both
engines. Media, overlays, static/animated layers, and focus content clip through
the one card shell.

## 7. Media framing

Static previews remain initial, responsive, and intrinsically sized.
`object-fit: contain` remains authoritative. Rest saturation remains `0.72`;
hover/focus saturation is `0.95`. Pointer hover and keyboard focus now share
the exact maximum 1.025 media scale. Touch and reduced-motion sessions resolve
to an untransformed media state.

The reference's uniform `cover` crop was intentionally adapted because copying
it would destroy the archive's real asset proportions.

## 8. Overlay presentation

The desktop overlay is a 100px minimum bottom scrim using a transparent-to-88%
black gradient. It uses 48px top, 16px inline, and 15px bottom padding with a
3px title/meta gap. Pointer hover and keyboard focus reveal it without layout
shift.

At or below 700px the overlay remains visible without a preliminary tap. Its
height is bounded by the card, and compact 8/8/6px padding allows metadata to
fit even on the 60.8px-high 320px landscape fixture. The measured title and
metadata bounds remain inside that card.

## 9. Typography and metadata

Titles resolve to SF Pro Rounded Semibold 600 at 14/18px on desktop and
12/15px on mobile. Metadata resolves to SF Pro Rounded Regular 400 at 11/15px
on desktop and 9/12px on mobile. Existing titles, category names, and intrinsic
dimensions remain unchanged. Long hexadecimal titles wrap without horizontal
overflow or clipped glyphs.

## 10. Badge alignment

The GIF badge uses a 12px desktop offset, 5×8px padding, 10/12px Semibold type,
and the shared pill radius. The restricted control uses the matching 12px
opposite-side offset and a 28×28px bordered surface. Mobile uses 8px offsets and
compact dimensions. Left/right ownership prevents overlap, and the restricted
icon retains the singular accessible label `Restricted original`.

## 11. Static/animated lifecycle

The existing `AssetGrid` owner remains unchanged:

- observer activation requires at least 0.35 visible intersection;
- static opacity remains one until the animated image loads;
- successful load crossfades to the animated layer;
- viewport exit restores static before the source is removed;
- cleanup removes the source after 220ms;
- route disposal disconnects both observers and performs immediate cleanup;
- reduced motion never creates the animation observer;
- restricted cards emit no animation layer.

Phase 8 adds one narrow failure correction: an animated image error removes
only the failed animated layer and clears `asset-playing`. The healthy static
preview remains visible and the card is not marked as a failed preview.

Chromium and Firefox both recorded animated opacity 1/static opacity 0 after
successful load, then animated `src: null`, `asset-playing: false`, and static
opacity 1 after exit.

## 12. Malformed and error behavior

Malformed media retains the existing `min(70vh, 720px)` maximum and contained
intrinsic behavior. Static failure removes the broken image and preserves a
180px `Preview unavailable` frame. The deterministic fixture measured a
281.25×182px card with a 279.25×180px fallback frame. Animated failure preserves
the healthy static image and does not add `image-error`.

No production record was altered to manufacture these states.

## 13. Batching and masonry preservation

CSS-column masonry, logical DOM order, focus order, sorting, filtering, and
stable item indices are unchanged. With the observer disabled in the
deterministic fallback fixture, the first render contained eight cards, Load
more was visible, and one activation produced sixteen cards. The live sentinel
continues progressive loading normally.

## 14. Accessibility

- Each asset remains one button and one tab stop.
- `aria-label="Open {title}"` remains singular and authoritative.
- Static preview alternative text remains informative; animated media remains
  decorative.
- Focus reveals the same overlay and 1.025 media state as hover.
- The global 2px acid outline remains visible and unclipped.
- Touch exposes metadata and opens on first activation.
- Reduced motion exposes metadata, prevents playback, and removes scaling.
- Restricted meaning remains explicit once.
- Existing modal focus restoration and modal keyboard behavior are unchanged.

## 15. Responsive and visual evidence

Chromium and Firefox passed at 320, 375, 520, 700, 701, 768, 1024, 1199,
1200, 1439, 1440, 1600, and 1920px. No horizontal overflow occurred.

The sanitized ignored manifest is
`.reference-audit/neuevault/asset-cards/manifest.json`. It references before
and after measurement JSON, both-engine breakpoint overviews, portrait
rest/hover/focus, landscape, GIF, restricted, reduced-motion, touch, failure,
malformed, and load-more fixtures.

| Area | Classification |
|---|---|
| Desktop grid bounds/card width | matched |
| Four-column density and 15px gaps | matched |
| 15px clipping radius | matched |
| Intrinsic portrait/landscape height | intentionally adapted |
| Real border | intentionally adapted |
| Neuevault overlay and badges | intentionally adapted |
| Mobile two-column presentation | intentionally adapted |
| Reference uniform cover crop | remaining intentional difference |

## 16. Console, network, and bundle results

Across both 13-width browser matrices, console errors and failed requests were
zero. The local Pages runtime returned HTTP 200 for `/`, `/icons`, `/animated`,
representative Search, and `/api/auth/session`. HTML remained revalidating,
session remained `no-store`, and signed-out `/api/download/nv-166` remained
HTTP 401 with `no-store`.

Bundle and cache results are recorded in the release-gate table.

## 17. Unit, E2E, build, and audit results

| Gate | Result |
|---|---|
| Focused asset unit tests | pass - 7/7 |
| Focused design/public-media tests | pass - 12/12 |
| Focused asset Playwright | pass |
| `npm test` | pass - 18 files, 98 tests |
| `npm run build` | pass - 35 modules transformed |
| `npm run validate:assets` | pass - 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass - 62 passed, 22 intentional project skips |
| `npm run audit:bundle` | pass - 483,247-byte entry / 49,884-byte gzip / 38,116-byte Brotli |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass - 234 manifest assets / 235 remote resources |
| Chromium matrix | pass |
| Firefox matrix | pass |

## 18. Remaining intentional differences

Neuevault preserves intrinsic uncropped media, its real border, product
metadata, GIF/restricted badges, CSS-column ordering, and two-column mobile
behavior. Grainient exposes none of those product states in the sampled route.
Those differences are required adaptations rather than incomplete alignment.

## 19. Deferred asset-grid work

Replacing CSS columns, reconciling visual and keyboard reading order, changing
catalog pagination/search, and redesigning the asset modal remain deferred.
They require separate architecture and accessibility decisions.

## 20. Rollback boundary

The atomic Phase 8 commit contains only asset tokens/presentation, animated
failure isolation, focused tests, and this report. Reverting it restores the
former uncapped grid, 12px gaps, overlay/badge metrics, pointer-only media
transform, prior animated-error behavior, tests, and report. It does not affect
modal history, routing, batching, filtering, data, authentication, downloads,
Cloudinary, or prior category/collection phases.

## 21. Completion checklist

- [x] Reference/current/target measurements recorded before editing.
- [x] Asset grid matches the measured 1440px frame.
- [x] CSS-column masonry and logical DOM/focus order remain.
- [x] Intrinsic media is contained and unclipped.
- [x] Maximum scale remains 1.025 with focus parity.
- [x] Touch and reduced-motion metadata remain available.
- [x] Badges remain distinct and singular.
- [x] Animation crossfade and cleanup have no blank frame.
- [x] Failed animation preserves static preview.
- [x] Static failure and malformed geometry remain bounded.
- [x] Eight-item batching and load-more remain.
- [x] Stable IDs and modal opening remain unchanged.
- [x] Restricted sources remain protected.
- [x] Chromium and Firefox matrices pass without overflow/errors.
- [x] Complete release gate passes.
- [ ] Atomic commit and push complete.
- [ ] Cloudflare deployment and production-host verification complete.
