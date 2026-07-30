---
title: Neuevault Route and Editorial Surface Migration Report
status: completed
authority: migration-evidence
date: 2026-07-30
phase: 11-route-editorial-surface-alignment
---

# Neuevault route and editorial surface alignment

## 1. Phase status

Phase 11 is complete. The full local release gate and Pages-runtime checks
passed before publication. It aligns route headers, collection detail, About,
back links, tags, and route-level state surfaces without changing route,
catalog, Search, grid, modal, authentication, download, or Cloudinary
behavior.

## 2. Files changed

- `app.js`
- `src/pages/pages.js`
- `src/pages/searchPage.js`
- `styles.css`
- `tests/unit/route-pages.test.js`
- `tests/e2e/bundle-loading.spec.js`
- `tests/e2e/prototype.spec.js`
- this report

Ignored evidence is indexed by
`.reference-audit/neuevault/route-editorial/manifest.json`.

## 3. Route-family inventory

| Family | Owner | Structure and cleanup |
|---|---|---|
| Icons/Banners/Animated/Wallpapers | lazy `searchPage.js` | archive heading + unchanged Search controls/filter/grid; route sequence owns stale-load protection |
| Recent | `pages.js` | plain editorial title + existing sorted AssetGrid |
| Collections index | `pages.js` | plain editorial title + existing CollectionCard grid |
| Category detail | `pages.js` | back link + plain title + AssetGrid or category EmptyState |
| Collection detail | `pages.js` | image-backed route hero + tags + sort toolbar + AssetGrid |
| About | `pages.js` | two-column editorial composition |
| Not Found | `pages.js` | route-level Error/Empty composition with Home link |
| Lazy loading/error | `app.js` | scoped busy status; one-reload retry policy and route retry remain |

Asset-grid disposal, animated-cover disposal, route sequence ownership, Lenis,
modal history, and focus restoration are unchanged.

## 4. Reference/current/target measurements

Grainient exposed no reliably measurable public collection-detail, About,
route loading, empty, or error compositions. Comparable reference values are
therefore **Unknown**. The approved Neuevault specification is authoritative.

| Contract | Reference | Current at 1440 | Target/final |
|---|---|---:|---:|
| Editorial content max | Unknown | mixed/full page | 1080px |
| Route title | Unknown | 72/72px, `-.055em` | 36/40px, `-.03em`, 600 |
| Mobile route title | Unknown | legacy fluid | 28/32px, 600 |
| Plain header | Unknown | 100px top; 44–52px bottom | 96px top; 48px bottom |
| Route copy | Unknown | uncapped/shared | 640px max; 14/20px |
| Collection hero | Unknown | 1416×414px | 1416×400px; 1536px cap |
| Hero copy padding | Unknown | 72px | 48px |
| About title | Unknown | 100.8/90.7px | 64/68px |
| Back separation | Unknown | 25px | 16px |
| Tag | Unknown | 28px; 10px text | 28px; 12/500 |
| State surface | Unknown | mixed/unframed/dashed | 760px max; 64px padding; 16px radius |

At 1200/1440/1600/1920 the final route title remains 36/40px. Collection
hero width resolves to 1176/1416/1536/1536px.

## 5. Final archive/category header treatment

Archive/type URLs now expose their real route type as the H1 while retaining
the existing eyebrow, descriptive copy, Search controls, selected filter,
result count, filter behavior, and AssetGrid. Recent, Collections, and category
routes share the same measured title role and header rhythm.

Category detail retains its derived count/description and direct Home link.
The empty category renders a labelled semantic section rather than the legacy
dashed placeholder.

## 6. Final collection-detail header

The collection route retains the authored title, derived count/description,
cover preview, tags, restricted metadata, route, sorting, and membership.
The header is capped at 1536px, uses a 400px desktop minimum, 20px radius,
48px copy padding, and a 680px effective copy column. Long title, description,
and tag fixtures wrap without clipping or viewport overflow.

## 7. Final route-hero treatment

- desktop minimum height: 400px;
- 701–1199 minimum: 380px;
- 320–700 minimum: 360px;
- radius: 20px desktop, responsive card radius on mobile;
- border: semantic subtle border;
- media: public preview, cover fit, centered;
- media opacity: `.54`;
- filter: `grayscale(.35) saturate(.85)`;
- overlay: `rgba(5,5,5,.54)`;
- padding: 48/36/24px by band.

No video, parallax, restricted original, or homepage-hero rule is used.

## 8. Final page-title treatment

Primary route titles use SF Pro Rounded Semibold 600 at 36/40px with
`-.03em` tracking, reducing to 28/32px through 700px. Title width is capped at
760px; descriptive copy is capped at 640px and uses 14/20px. Titles use normal
flow, natural wrapping, and no transform or fixed height.

The ordinary `/search` title remains on the Phase 10 presentation. Only the
dedicated archive/type variant receives the route title contract.

## 9. About-page composition

About is capped at 1080px with a 1.05/.95 two-column ratio, 72px desktop gap,
112px top and 144px bottom padding. The heading is capped at 64/68px and the
body column at 500px with 14px text and 1.625 line height. At 700px and below
the columns stack in source order with 40px separation and a 40/44px title.
All authored copy is unchanged.

## 10. Back-link treatment

Home and All collections remain real anchors with their original destinations.
Both reuse the registry-backed `back` icon, one accessible label, Medium 500
14/20px type, semantic secondary color, visible focus treatment, existing
rolling behavior, and 16px separation from title content. No history rewrite
or Unicode arrow was introduced.

## 11. Tag and metadata-pill treatment

Navigational tags remain anchors to `/search?tag=…`; restricted context
remains a noninteractive `span`. Tags use a 28px minimum height, pill radius,
semantic border/control surface, 10px inline padding, 8px wrapping gap, and
12/500 typography. Long metadata contains safely.

## 12. Route loading

The existing lazy architecture remains. Search/type loading now uses the
shared route surface with a 260px reserved minimum, scoped `aria-busy`, one
polite `role=status`, stable shell, and reduced-motion-safe static content.
No global boot screen was changed.

## 13. Route empty states

Category and collection empty variants share the bounded route-state surface,
semantic H2/body hierarchy, solid border, and responsive padding. Existing
copy is preserved, including implementation-facing copy explicitly deferred
by the specification.

## 14. Route errors and Not Found

Not Found keeps its URL and Return home action but now uses a bounded labelled
route surface. Chunk failure keeps the exact one-reload policy, retry action,
and URL, and uses an actionable `role=alert`. No stack, request detail,
credential, or automatic redirect is exposed.

## 15. Section rhythm

Plain headers use 96px top and 48px bottom spacing. Hero-to-toolbar separation
is 24px. State surfaces start at the same 96px route inset. Mobile route
headers use 72px top and 36px bottom spacing. Homepage section rhythm,
Search controls, asset grids, and footer rules are unchanged.

## 16. Responsive behavior

Chromium and Firefox were measured at 320, 375, 520, 700, 701, 768, 1024,
1199, 1200, 1439, 1440, 1600, and 1920px. Every measured route recorded zero
horizontal overflow. Mobile uses contained one-column editorial layouts,
stacked About content, wrapped tags, visible back links, and compact state
padding. Tablet uses 36/40px route titles and a 380px hero.

## 17. Typography results

All public route roles resolve to the approved SF Pro Rounded 400/500/600
system. Route and collection titles use 600; body uses 400; tags and back
links use 500. No 700 role, new font, or TBJ consumer was introduced.

## 18. Accessibility

Fixtures confirm one H1 per route, logical H2 result/empty headings, labelled
loading/error/empty surfaces, singular back-link names, real tag link versus
static metadata semantics, visible focus, touch-first operation, reduced
motion, and contained long content. Modal focus restoration and route focus
policy remain unchanged.

## 19. Visual evidence

The ignored evidence contains 80 pre-change production measurements, 260
post-change responsive records, route screenshots at five representative
widths in both browsers, and dedicated loading/error/touch/reduced fixtures.

| Area | Classification |
|---|---|
| Approved 36/40 route H1 | matched |
| 1080px editorial About frame | matched |
| 1536×400 maximum route hero | matched |
| 28px semantic tags | matched |
| Mobile 28/32 route title | intentionally adapted |
| Grainient route/state geometry | remaining unknown |

## 20. Console, network, and bundle results

The local Pages runtime returned HTML `200` for every required direct route,
including the representative collection and asset-detail routes.
`/api/auth/session` returned `200` with `Cache-Control: no-store`, and the
signed-out `/api/download/nv-166` boundary returned `401` with
`Cache-Control: no-store`. Browser evidence records the expected absent Vite
Pages Function request and context-teardown animated-media aborts separately;
neither is a settled route failure.

The optimized production bundle remained within budget: the entry is 483,969
bytes uncompressed, 50,016 bytes gzip, and 38,228 bytes Brotli; total
JavaScript is 494,018 bytes uncompressed, 54,126 bytes gzip, and 41,631 bytes
Brotli. No new route/editorial dependency or chunk boundary was introduced.

## 21. Unit/E2E/build/audit results

| Gate | Result |
|---|---|
| Focused route unit tests | pass — 7 |
| Focused route/state Playwright | pass |
| `npm test` | pass — 23 files / 125 tests |
| `npm run build` | pass — Vite 7.3.6 |
| `npm run validate:assets` | pass — 234 assets / 4 collections / 4 categories |
| `npm run test:e2e` | pass — 71 passed / 23 intentional skips |
| `npm run audit:bundle` | pass |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass — 234 manifest records / 235 remote resources |
| Local Pages runtime | pass |

## 22. Remaining intentional differences

Neuevault retains its own Search controls on type routes, product-specific
collection metadata, wide AssetGrid, direct back-link destinations, and
catalog copy. No absent Grainient state geometry was invented.

## 23. Deferred route/editorial work

No route architecture, server search, copy rewrite, footer composition, new
state architecture, or generic page-component rewrite is included. Those
remain separately authorized future work.

## 24. Rollback boundary

One atomic Phase 11 commit is the rollback boundary. Reverting it restores the
legacy 60–72px route titles, full-width collection hero, previous About
columns, back/tag styles, dashed/unframed states, focused tests, and this
report. It does not alter routes, filtering, ordering, Search behavior, modal
history, authentication, downloads, data, Cloudinary, cards, masonry, or prior
visual phases.

## 25. Completion checklist

- [x] reference unknowns recorded rather than inferred
- [x] current measurements captured before editing
- [x] archive/category headers aligned
- [x] collection detail measured and aligned
- [x] About composition aligned
- [x] back links and tags preserve semantics
- [x] loading, empty, error, and Not Found surfaces aligned
- [x] long content, touch, focus, and reduced motion pass
- [x] Chromium/Firefox responsive matrix has zero overflow
- [x] complete release gate passes
- [x] atomic commit scope verified
- [x] local Pages runtime and security boundary pass
