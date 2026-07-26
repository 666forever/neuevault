---
title: Neuevault Collection Card Migration Report
status: completed
date: 2026-07-26
phase: collection-card-blueprint-alignment
---

# Neuevault collection card migration

## 1. Phase status

Phase 7 is implementation-complete and release-gated. Collection cards now
follow the approved editorial card contract while remaining structurally and
behaviorally distinct from category and asset cards. No route, collection
record, count, description, membership, authentication rule, download rule, or
shared page architecture changed.

## 2. Files changed

- `src/components/cards.js`
- `src/components/images.js`
- `styles.css`
- `tests/unit/collection-cards.test.js`
- `tests/e2e/prototype.spec.js`
- this report

Ignored evidence is stored under
`.reference-audit/neuevault/collection-cards/`. `manifest.json` contains the
sanitized browser and breakpoint measurements; `fixtures.json` identifies the
deterministic long-copy and failed-preview fixtures. No fixture changes
production data.

## 3. Previous collection-card inventory

The prior card was one semantic collection anchor containing a
`.collection-cover`, shared `.cover-media`, static and optional animated image
layers, optional restricted badge, and `.collection-meta` title/description.
The grid was three columns with a 14px gap and switched directly to one column
at 700px.

The shell already used the semantic dark surface, subtle border, shared 16px
radius, 4px padding, natural height, and a 4px pointer-hover lift. The media
used a 0.96 desktop ratio, 1.02 mobile ratio, 13px radius, and child-owned 1.03
hover scaling. Static media was visible at rest. Focus activated animation but
did not receive the same shell/border/media emphasis as pointer hover.
Collection animation was also still eligible on non-hover devices.

## 4. Final card structure

```text
a.collection-card
|-- div.collection-cover
|   |-- span.cover-media.collection-media-frame
|   |   |-- img.cover-static
|   |   `-- img.cover-animated (safe public source only)
|   `-- span.badge (only when derived restricted membership is true)
`-- div.collection-meta
    |-- h3
    `-- p (real count + authored description)
```

The anchor remains the single interactive and accessible card. Both image
layers remain decorative with empty alternative text, so they do not duplicate
the title and metadata-derived accessible name.

## 5. Surface and geometry

The collection-specific token contract records:

- grid gap: 14px;
- outer padding: 4px;
- desktop shell radius: 16px;
- existing mobile shell radius: 14px;
- internal media radius: 13px;
- desktop media ratio: 0.96;
- mobile media ratio: 1.02;
- maximum shell lift: 4px;
- maximum media scale: 1.03.

The shell retains the semantic dark surface and subtle border. Hover and focus
strengthen the border. No decorative shadow, glow, gradient shell, shell scale,
fixed card height, absolute copy, or intermediate two-column mode was added.

## 6. Media architecture

`.collection-media-frame` is the collection-specific media owner. It owns the
single scale transform while the static and animated children own only their
crossfade opacity. The frame clips through the existing `.collection-cover`
ratio and radius, and both layers retain `object-fit: cover`.

This separation prevents an animated layer from adding an independent scale
transform and prevents collection media from inheriting the category
opacity/1.4 reveal contract.

## 7. Static and animated lifecycle

The static preview is present and visible at rest. A safe animated source is
assigned only after hover/focus activation while the card is visible. The
playing class is applied only after the animated image reports a successful
load, so static opacity remains 1 until animated media is ready.

On exit, the playing class is removed immediately, restoring static opacity
before the animated `src` is removed after the existing 220ms cleanup delay.
Intersection exit, document visibility change, and route disposal stop
playback and remove the source. Rebinding first disposes the prior lifecycle,
so listeners and observers do not multiply.

## 8. Hover and focus behavior

Pointer hover and keyboard focus now share the same contract:

- shell translates upward exactly 4px at completion;
- border resolves to the existing strong semantic border;
- media frame scales to exactly 1.03;
- a safe public animation may load and crossfade;
- the global 2px acid focus outline with 3px offset remains visible.

Exit returns shell and media to their exact rest transforms, restores the
static preview, and cleans the animated source without a blank frame or layout
shift.

## 9. Touch and reduced-motion behavior

Non-hover environments no longer bind animated collection sources. The card
remains fully visible and the first tap navigates directly; hover emulation
cannot persist a shell lift or media scale.

Reduced motion binds no animated source and explicitly resolves shell and media
transforms to rest. The static preview, content, border, and focus treatment
remain available.

## 10. Typography and content results

Collection titles retain SF Pro Rounded Semibold 600, natural wrapping, and
the existing card-title size. Descriptions retain SF Pro Rounded Regular 400,
the approved caption role, muted semantic color, and natural height. Counts
remain real repository-derived values composed with the authored description.

At 320px, the deterministic long fixture produced a two-line title and
three-line description in both engines with no clipping or overflow. No title,
description, count, or truncation rule changed.

## 11. Loading and error behavior

The ratio-owned cover frame prevents loading or failure from collapsing card
geometry. A failed static preview removes the broken image and retains the
existing `Preview unavailable` fallback inside the same frame.

An animated failure now removes only the failed animated layer and clears the
playing state. It does not mark a healthy static preview as failed, does not
show a broken-image icon, and does not blank the card.

## 12. Restricted-media safety

`animatedCoverUrl()` continues to return an empty string for restricted
records, non-animated records, or records without a public source.
`collectionCard()` therefore emits no animated layer when the repository
provides no safe source. Restricted originals and protected public IDs are not
introduced into card markup or network requests.

No current production collection uses a restricted cover, so no nonexistent
production record was represented as captured evidence. The restriction was
verified through deterministic unit policy and the signed-out `nv-166`
boundary, which remains HTTP 401 with `Cache-Control: no-store`.

## 13. Responsive and visual evidence

Chromium and Firefox passed through the local Cloudflare Pages runtime at 320,
375, 520, 700, 701, 768, 1024, 1199, 1200, 1439, 1440, 1600, and 1920px.

Across the matrix:

- one column resolved through 700px and three columns from 701px;
- the gap remained 14px;
- natural card heights remained intact;
- rest, hover, focus, exit, touch, and reduced-motion values matched;
- animated activation loaded the existing public `nv-054` source;
- cleanup removed its source after static restoration;
- long-copy and failed-preview fixtures retained geometry;
- no media or focus clipping occurred;
- horizontal overflow was zero;
- console errors and failed requests were zero.

Screenshots cover the 700/701, 1199/1200, and 1439/1440 boundaries plus mobile
and large-desktop rest states. Fixture screenshots cover long copy and failed
preview behavior.

## 14. Accessibility results

- Every collection card remains one real anchor.
- Each card has one text-derived accessible name.
- Static and animated images retain empty alternative text.
- Title, real count, and description remain available without hover.
- Keyboard focus receives hover-equivalent shell, border, media, and animation
  behavior plus the existing focus ring.
- Touch requires no preliminary activation.
- Reduced motion remains fully functional and static.
- Focus order and route activation are unchanged.

## 15. Console, network, and bundle results

The browser evidence matrix recorded no console errors, failed requests,
horizontal overflow, protected animation requests, or duplicate animated
source requests.

The entry bundle is 483,080 bytes, 49,866 bytes gzip, and 38,072 bytes Brotli.
Total JavaScript is 492,095 bytes and 53,612 bytes gzip. The largest lazy chunk
is the 5,013-byte asset modal. The bundle budget and all lazy boundaries pass.

Local Pages checks returned:

- `/`: HTTP 200, revalidating HTML;
- `/collections`: HTTP 200, revalidating HTML;
- `/collections/white-minimal-banners`: HTTP 200, revalidating HTML;
- `/api/auth/session`: HTTP 200, `Cache-Control: no-store`;
- signed-out `/api/download/nv-166`: HTTP 401,
  `Cache-Control: no-store`.

## 16. Unit, E2E, build, and audit results

| Gate | Result |
|---|---|
| Focused collection unit tests | pass - 6/6 |
| Focused collection Playwright | pass |
| `npm test` | pass - 17 files, 91 tests |
| `npm run build` | pass - 35 modules transformed |
| `npm run validate:assets` | pass - 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass - 55 passed, 21 intentional project skips |
| `npm run audit:bundle` | pass |
| `npm run audit:cache-headers` | pass - 5 hashed outputs |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass - 234 manifest assets / 235 remote resources |
| Chromium Pages-runtime matrix | pass |
| Firefox Pages-runtime matrix | pass |

## 17. Deferred collection work

No additional collection-card defect is carried by this phase. A future
editorial redesign, data change, or new breakpoint requires separate
authorization.

## 18. Rollback boundary

This phase is one collection-card implementation commit. Reverting it restores
the previous collection wrapper markup, child-owned image scaling,
pointer-only shell emphasis, touch animation eligibility, former animated
error handling, focused tests, and this report. It does not affect typography,
icons, navigation, hero, category/asset cards, routes, data, modals,
authentication, downloads, Cloudinary, or deployment configuration.

## 19. Completion checklist

- [x] Collection cards remain distinct from category cards.
- [x] Static media is visible at rest.
- [x] Shell lift is no more than 4px.
- [x] Media scale is no more than 1.03.
- [x] Focus receives equivalent emphasis.
- [x] Touch navigates on first activation.
- [x] Reduced motion has no lift, scale, or playback.
- [x] Crossfade and source cleanup have no blank frame.
- [x] Restricted animated/original sources remain excluded.
- [x] Real metadata and long-copy fixtures fit naturally.
- [x] One-column mobile and three-column desktop layouts remain.
- [x] No overflow, clipping, route, or accessible-name regression exists.
- [x] Chromium, Firefox, and the complete release gate pass.
- [x] Atomic rollback boundary is explicit.
