---
title: Neuevault Stable Asset Grid Migration Report
status: completed
phase: stable-asset-grid-progressive-media
date: 2026-08-01
---

# Neuevault stable asset grid migration

## 1. Phase status

Completed. The shared asset feed now uses deterministic, dimension-led placement and progressive media reveal. No route, catalog, Search, modal, authentication, download, Cloudinary, typography, icon, or non-grid visual contract changed.

## 2. User-visible problem and reproduced cause

The former CSS multi-column layout rebalanced the complete child sequence whenever a batch was appended. At 1440×900, both Chromium and Firefox moved 11 of the first 16 cards after the next eight records were inserted. For example, `nv-151` moved from column 1 at `(371.25, 324)` to column 0 at `(15, 1698.13)`, and `nv-164` moved from `(371.25, 1029.08)` to `(371.25, 324)`. Visual top-to-bottom order also differed from repository order.

Static intrinsic dimensions already prevented meaningful card-relative decode movement, but could not prevent browser column balancing. Chromium's initial page-settling trace recorded 0.21019 cumulative page-level shift before the isolated post-placement phases; Firefox did not expose buffered layout-shift entries in that run.

## 3. Files changed

- `src/components/AssetGrid.js`
- `src/components/images.js`
- `src/utils/masonryLayout.js`
- `styles.css`
- `tests/unit/asset-grid.test.js`
- `tests/unit/masonry-layout.test.js`
- `tests/e2e/asset-grid-stability.spec.js`
- this report

## 4. Previous and final architecture

Previously, one ordered DOM list used `columns: 4 260px` (or fixed two-column mobile CSS) and delegated placement/balancing to the browser. Appending children could redistribute all prior nodes.

The final `.masonry` container is relative and owns an explicit height. Its ordered asset buttons are absolutely positioned from cached layout records. DOM order remains repository order; placement affects only visual coordinates. CSS columns are no longer involved.

## 5. Placement algorithm

For each layout generation, the engine resolves effective width, gap, and column count, derives column width, and computes card height as `columnWidth × intrinsicHeight / intrinsicWidth`. Each record is assigned to the shortest current column; equal heights choose the lowest column index. The stored record contains stable ID, DOM index, column, x, y, width, and height. Container height is the largest final column extent minus the trailing gap.

The same ordered records, dimensions, width, count, and gap reproduce identical placements. A 10,000-run Node measurement averaged 0.02349ms for all 234 assets and 0.00269ms for an appended sixteen-record batch.

## 6. Intrinsic dimensions and fallback

All 234 generated records have unique IDs, positive width/height, and safe aspect ratios; no production record requires fallback geometry. A deterministic 1:1 fallback remains for missing, zero, negative, non-finite, or implausible dimensions. It reserves the same geometry through loading and failure without mutating catalog data or querying Cloudinary at runtime.

## 7. Append behavior

The initial batch remains eight. Each subsequent operation appends sixteen. New placements start from cached column extents; existing placements are neither recomputed nor rewritten. One shared sentinel uses a 600px vertical root margin, which prepares the next batch without loading the full catalog. End state hides Load more and disconnects the loader.

## 8. Resize and relayout

A `ResizeObserver` watches the actual masonry container. Notifications are animation-frame coalesced and changes below one CSS pixel are ignored. A new generation is created only when effective width or column count changes. Card nodes and loaded media remain intact, container height updates with placements, and a visible-card anchor is used to mitigate scroll displacement. No scroll handler performs layout work.

## 9. Media reservation and reveal

Every card receives final width and height before media readiness. The dark media surface, border, radius, overlay, and badges render immediately. Static previews begin at zero opacity, wait for successful load and `decode()` where available, and then receive the ready state. A decode rejection is tolerated only when the image remains complete with a valid natural width. No promise rejection escapes.

The former hidden per-grid spinner markup and its dead styles were removed; the reserved dark surface is the restrained loading treatment.

## 10. Animated lifecycle and failures

Public animation remains static-first, viewport-policy controlled, load/decode-before-crossfade, and unloaded after exit/disposal. Restricted and reduced-motion assets remain static. Animated failure removes only the animated layer and keeps static media. Static failure preserves assigned geometry and exposes the existing `Preview unavailable` state without a broken-image glyph. Error binding is idempotent, preventing duplicate listeners after append.

## 11. Ordering and modal integration

There is one ordered sequence and one semantic button/tab stop per asset. No CSS `order`, column DOM, measurement clone, or screen-coordinate sorting exists. Keyboard, screen-reader, modal previous/next, direct routes, Back/Forward, focus restoration, and filtered context continue to use the original ordered array and stable index.

## 12. Search and route integration

Homepage Recent, `/recent`, Icons, Banners, Animated, Wallpapers, Search, category detail, and collection detail all use the same shared grid. Search URL/local-state behavior, filtering, sorting, memberships, empty state, footer spacing, and modal context are unchanged.

## 13. Responsive geometry

Chromium and Firefox matched at all 13 required widths. The measured grid/column contracts included 306/149px at 320 (two columns, 8px gap), 686/339px at 700, 671/328px at 701 (15px gap), 994/321.33px at 1024 (three columns), 1169/281px at 1199 (four columns), 1410/341.25px at 1440, and the capped 1440/348.75px geometry at 1600 and 1920. No overlap or horizontal overflow occurred.

## 14. Stability and CLS evidence

After the final placement was established, Chromium and Firefox each reported:

| Phase | Existing cards moved | Asset-grid CLS |
|---|---:|---:|
| Static decode | 0 | 0 |
| Sixteen-record append | 0 | 0 |
| Animated activation | 0 | 0 |
| Static failure | 0 | 0 |

The responsive matrix also compared the first sixteen cards before/after append with ≤1px tolerance: all 26 browser/width fixtures passed, with unchanged x, y, width, height, column, and DOM index.

## 15. Performance and lifecycle

There is no per-scroll calculation, clone-based measurement, card-loop layout read/write interleaving, or new dependency. Placement computation uses cached column heights and batched style writes. Each grid owns one load observer, at most one animation observer, and one resize observer; disposal disconnects all three, cancels the pending frame, clears timers, and removes animated sources.

The final entry is `index-wwkcK-GZ.js`: 486,302 bytes, 50,857 gzip, and 38,951 Brotli. Total JavaScript is 496,351 bytes / 54,977 gzip. The existing bundle budget passes without changing thresholds.

## 16. Accessibility and input modes

DOM and tab order remain source order, controls retain singular names, focus outlines are not clipped, and modal focus returns to the opening card. Touch keeps first-tap activation and does not depend on hover. Reduced motion keeps static previews, disables crossfade/animation through the existing policy, and does not animate placement. Image readiness does not create per-image live-region noise.

## 17. Security and data integrity

Layout consumes only public presentation dimensions. All 234 IDs remain unique and ordered. Restricted `nv-166` retains public `src:null`, static preview, and server-owned original delivery. No signed URL, protected public ID, OAuth value, Cloudinary credential, or restricted original enters markup or evidence.

## 18. Browser, console, network, and runtime results

Chromium and Firefox passed the responsive, append, decode, animation, failure, touch, keyboard, reduced-motion, and route fixtures. Eleven representative local Pages routes returned HTTP 200 without overflow. Request cancellations observed during deliberately rapid route cycling were navigation-aborted public preview/favicon requests, not settled-route failures. The local session and restricted boundaries remained owned by Pages Functions.

## 19. Verification results

- Unit: 133 tests passed across 25 files.
- E2E: 77 passed and 23 intentionally skipped across desktop/mobile projects.
- Assets: 234 assets, 4 collections, 4 categories validated.
- Build/cache: passed; five hashed Vite assets covered.
- Bundle: passed without budget changes.
- Cloudinary secret audit: passed.
- Cloudinary verification: 234 manifest assets against 235 remote resources.

## 20. Visual evidence

Ignored evidence is stored under `.reference-audit/neuevault/stable-asset-grid/`. It includes the before coordinate reproduction, Chromium/Firefox breakpoint screenshots, the final first-sixteen responsive matrix, isolated stability/CLS events, and route checks. The sanitized index is `manifest.json` in that directory.

## 21. Remaining intentional differences and deferred work

Visual masonry order is deterministic shortest-column placement, while semantic reading order remains repository order by design. Full virtualization remains deferred because the current 234-record feed performs within budget and does not need it. Catalog/data correction remains unnecessary because dimension coverage is complete.

## 22. Rollback boundary

Revert the single `fix: stabilize asset grid and media loading` commit to restore CSS-column masonry, immediate static visibility, previous grid tests, and remove this report. Reversion must not touch data, routes, Search semantics, modal history, authentication, downloads, Cloudinary, typography, icons, or other completed visual phases.

## 23. Completion checklist

- [x] CSS-column balancing removed from feed placement
- [x] geometry reserved from trusted dimensions
- [x] append-only deterministic placement
- [x] decode, append, animation, and failure movement: zero
- [x] post-placement asset-grid CLS: zero in Chromium and Firefox
- [x] DOM, keyboard, screen-reader, and modal order preserved
- [x] 234 unique records and no data mutation
- [x] no overlap or overflow across required widths
- [x] touch, keyboard, reduced motion, and route cleanup preserved
- [x] protected-source boundary preserved
- [x] bundle budget preserved without threshold changes
