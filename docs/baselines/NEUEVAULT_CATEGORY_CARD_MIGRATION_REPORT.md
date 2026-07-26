---
title: Neuevault Category Card Migration Report
status: completed
date: 2026-07-26
phase: homepage-category-card-blueprint-alignment
---

# Neuevault category card migration

## Outcome

Phase 5 is complete, published, and production-verified. Homepage category cards now use the
approved shared-wrapper reveal: desktop hover-capable media rests at opacity
`0` and scale `1.4`, then resolves to opacity `1` and scale `1` on pointer hover
or keyboard focus. Touch and reduced-motion media is immediately visible at
opacity `1` and scale `1`.

No category data, memberships, counts, routes, accessible names, or shared
homepage components changed.

## Files changed

- `styles.css`
- `src/components/cards.js`
- `tests/unit/design-system.test.js`
- `tests/e2e/prototype.spec.js`
- `docs/baselines/NEUEVAULT_CATEGORY_CARD_MIGRATION_REPORT.md`

Ignored evidence is stored under
`.reference-audit/neuevault/category-cards/`. Its sanitized computed-style,
browser, console, network, and breakpoint record is `manifest.json`.

## Architecture

The existing semantic card markup was retained:

```text
a.category-card
|-- span.cover-media
|   |-- img.cover-static
|   `-- img.cover-animated (when a safe public playback source exists)
`-- span.category-copy
    `-- span.category-copy-inner
        |-- small
        `-- h2
```

`.cover-media` now exclusively owns reveal opacity, reveal scale, transform
origin, clipping, and the 600ms transform / 400ms opacity transitions using the
existing standard media easing. The child image layers remain at
`transform:none`; they crossfade only through opacity. This removes competing
per-layer scale transforms.

The static preview remains visible inside the wrapper until an animated image
has loaded successfully. Only then does `.cover-playing` crossfade the static
layer from 1 to 0 and the animated layer from 0 to 1. Both transitions use the
same duration and easing, so at least one layer remains visible throughout.
Browser sampling during exit at 0, 50, 100, and 150ms measured combined layer
opacity of at least 0.99 at every point.

The existing lifecycle remains responsible for pointer/focus activation,
viewport stopping, page-visibility stopping, listener disposal, and delayed
source removal. Category animation activation is now additionally excluded
when `(hover: hover)` is false. Collection-card policy is unchanged.

## Final contracts

| State | Wrapper opacity | Wrapper scale | Animated source |
|---|---:|---:|---|
| Hover-capable desktop rest | 0 | 1.4 | absent |
| Pointer hover | 1 | 1 | lazy-loaded when public and animated |
| Keyboard focus | 1 | 1 | lazy-loaded when public and animated |
| Pointer/focus exit | 0 | 1.4 | removed after existing 220ms delay |
| Touch | 1 | 1 | absent |
| Reduced motion | 1 | 1 | absent |

The count/title gap is exactly `10px` in computed layout. Count typography
remains SF Pro Rounded 400; title typography remains SF Pro Rounded 500. The
copy width, natural wrapping, two/four-column layout, 460/478 ratio, 20px
radius, and 1888px maximum grid width remain unchanged.

## Safety and accessibility

- Every card remains one real link with one existing `aria-label`.
- Count and title remain visible without interaction; all four current
  categories retain their real count of zero.
- Decorative static and animated images retain empty alternative text.
- `:focus-visible` and `:focus-within` use the same reveal as hover.
- The existing focus ring computes to a 2px acid outline with a 3px offset.
- Touch needs no preliminary tap and loads no category animation.
- Reduced motion has no reveal transition and no animated playback.
- Card and media-wrapper overflow remain hidden; the card radius remains 20px.
- Restricted-source generation remains covered by the existing unit policy:
  restricted media cannot produce an animated cover URL, and restricted
  originals remain absent from public output. The current production category
  set contains no restricted category fixture, so no nonexistent production
  record was represented as captured evidence.

## Responsive and browser evidence

Chromium and Firefox were validated through the local Cloudflare Pages runtime
at 320, 375, 520, 700, 701, 768, 1024, 1199, 1200, 1439, 1440, 1600, and
1920px.

Across the complete matrix:

- two columns resolved below 1200px and four columns from 1200px;
- the mobile grid gap changed only at the existing 700/701 boundary;
- wrapper rest/hover/focus/exit states matched the approved values;
- computed count/title gap was 10px;
- all real titles and counts fit after local fonts loaded;
- no horizontal overflow occurred;
- media clipping and 20px card radius remained intact;
- animation activation showed static opacity 0 / animated opacity 1;
- exit restored static opacity 1 / animated opacity 0 and removed `src`;
- Chromium and Firefox recorded zero console errors and zero failed requests.

Touch evidence at 390px and reduced-motion evidence at 1200px resolved to
visible scale-1 static media with no animated source.

## Verification

- Focused category unit tests: 19 passed.
- Full unit suite: 79 passed.
- Focused category Playwright: 3 passed, 1 intentionally skipped.
- Full Playwright suite: 50 passed, 18 intentionally skipped.
- `npm run validate:assets`: passed; 234 assets, 4 collections, 4 categories.
- `npm run build`: passed.
- `npm run audit:bundle`: passed; 481,013-byte entry, 49,254-byte gzip.
- `npm run audit:cache-headers`: passed; 5 hashed assets covered.
- `npm run audit:cloudinary-secrets`: passed.
- `npm run cloudinary:verify`: passed; 234 manifest assets checked against 235
  remote resources.
- Local Cloudflare Pages/Wrangler runtime: passed for homepage, Functions
  session endpoint, Chromium/Firefox interaction matrix, console, and network.

## Rollback boundary

This phase is one category-only commit. Reverting it restores the former
image-owned reveal, the former 2px computed copy gap, previous touch animation
binding behavior, and category-specific tests/report. It does not affect
typography, icons, navigation, hero, collections, asset cards, modals,
authentication, downloads, data, Cloudinary, or deployment configuration.

## Deployment

The atomic phase commit was pushed to `main` and Cloudflare published the
commit successfully. Chromium production checks on `www.pfseeker.com`,
`pfseeker.com`, and `neuevault.pages.dev` returned HTTP 200 and reproduced
opacity 0 / scale 1.4 at rest, opacity 1 / scale 1 on hover, a 10px copy gap,
successful animated activation, source cleanup, zero horizontal overflow,
HTTP 200 session boundaries, zero console errors, and zero failed requests.
Firefox returned HTTP 200 on all three hosts and reproduced the rest geometry
at 320px with no overflow, console errors, or failed requests.

The final commit hash and immutable Cloudflare deployment ID are recorded in
the task handoff because embedding a commit's own hash in that commit is not a
stable operation.
