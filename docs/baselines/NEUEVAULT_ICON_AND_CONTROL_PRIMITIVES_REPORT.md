---
title: Neuevault Icon and Control Primitives Migration Report
status: completed
date: 2026-07-26
phase: shared-icon-registry-and-control-primitives
---

# Neuevault icon and control primitives migration

## Outcome

Phase completed. Neuevault now has a framework-neutral local icon registry and
shared `Icon`, `IconButton`, and `Button` primitives. The migrated controls no
longer depend on utility Unicode glyphs, CSS menu bars, or CSS masks at runtime.
Routes, modal history, authentication, downloads, restricted delivery,
responsive behavior, and typography remain unchanged.

## Inventory and architecture

The prior utility icon implementations were:

- local CSS masks for Discord, bookmark, and bolt;
- two CSS bars for the mobile menu;
- Unicode close, previous, next, download, share, back, and restricted marks;
- repeated button and icon-button markup in the header, route pages, asset
  modal, authentication dialog, and asset grid.

The new architecture is:

```text
src/icons/registry.js
src/ui/Icon.js
src/ui/IconButton.js
src/ui/Button.js
```

The registry contains `download`, `share`, `close`, `previous`, `next`, `back`,
`restricted`, `menu`, `close-menu`, `discord`, `bookmark`, and `bolt`.
Brand artwork remains outside the utility registry.

All registry artwork is inline, local, `currentColor`-driven, CSP-safe SVG with
no scripts, external references, embedded raster data, or duplicate titles.
Canonical icon sizes are 12, 16, 20, and 24px. Control hit areas remain
independent at 34, 40, and 46px minimum sizes.

The three historical public SVG files remain tracked as permanent asset
provenance because an existing repository asset contract validates their
presence. Production UI code no longer requests or masks them.

## Primitive contracts

- `Icon` validates registry name and canonical size, defaults to decorative
  `aria-hidden="true"` and `focusable="false"`, supports a standalone title,
  fails clearly in development, and degrades safely in production.
- `IconButton` requires a nonempty accessible label and owns button semantics,
  icon rendering, compact/standard/large geometry, circle/rounded-square shape,
  disabled state, and focus-visible behavior.
- `Button` preserves anchors for navigation and buttons for in-page actions. It
  supports accent, light, dark, neutral, and text variants plus
  compact/standard/large sizes. The compatibility default remains the existing
  34px compact shell so migrated controls do not grow unexpectedly.

The existing rolling-label implementation was deliberately not extracted.
It now discovers paired icons through the shared `.button-icon` contract while
retaining 40px travel, 300ms duration, the approved easing, 10ms pointer-entry
delay, zero-delay focus, singular accessible names, touch/reduced-motion
fallbacks, and blank-frame-free exit behavior.

## Migrated consumers

- mobile menu and close-menu state;
- desktop and mobile Discord sign-in controls;
- desktop and mobile Collections controls;
- homepage hero bolt CTA;
- modal close, previous, and next controls;
- modal public/restricted download and Copy-link actions;
- authentication-dialog close and Discord action;
- category and collection back links;
- restricted asset marker;
- load-more and route-retry actions.

The menu’s known Escape and outside-click defects are intentionally preserved.
Modal previous/next behavior remains cyclic; the reusable primitive supports a
disabled state, but the product does not invent disabled edges where none
existed.

## Accessibility and behavior

Every migrated control exposes one accessible name through its parent control.
Decorative SVGs are hidden from assistive technology, have no duplicate title,
and never take focus. Contextual names remain `Close viewer`, `Previous asset`,
`Next asset`, `Copy link`, complete download-state labels, and expanded-state
menu labels. `Restricted original` is exposed once.

Automated browser verification confirmed:

- menu label and SVG change together without changing the 40×40 shell;
- modal close/navigation controls remain 40×40;
- auth close remains compact;
- focus rings remain available;
- modal open/close URL history and focus restoration pass;
- public downloads pass;
- signed-out `nv-166` remains protected;
- authentication state and logout behavior pass;
- mobile controls activate normally;
- reduced motion retains the primary icon/text layer;
- no route, category, masonry, search, media, or typography regression.

## Visual and interaction evidence

Ignored evidence is stored under:

```text
.reference-audit/neuevault/icon-controls/
```

The sanitized manifest is:

```text
.reference-audit/neuevault/icon-controls/manifest.json
```

It references Chromium and Firefox captures at 320, 375, 700, 701, 1199,
1200, 1439, 1440, and 1920px, plus dedicated auth-close,
restricted-signed-out, back-link, and reduced-motion fixtures.

Results:

- 18 browser/viewport fixtures captured;
- zero horizontal-overflow cases;
- zero console errors;
- zero failed first-party requests;
- menu controls: 40×40px in both engines;
- modal close/navigation controls: 40×40px in both engines;
- accessible names, roles, disabled state, icon bounds, `currentColor`,
  clipping, focus style, alignment, and layout bounds recorded.

The unit contract covers disabled `IconButton` semantics. Live modal
previous/next controls remain enabled because the approved gallery wraps
cyclically.

## Bundle and network

The entry bundle is 480,923 bytes, 49,231 bytes gzip, and 37,469 bytes Brotli.
Total JavaScript is 489,938 bytes and 52,976 bytes gzip. The entry increase
against the pre-phase 476,361-byte baseline is 4,562 bytes (0.96%), reflecting
the twelve-icon registry and three reusable primitives. The bundle budget
passes, lazy route boundaries remain intact, and there are no duplicate or
missing SVG network requests.

Local Cloudflare Pages runtime verification:

- homepage: HTTP 200 with the approved title;
- `/api/auth/session`: HTTP 200 and `Cache-Control: no-store`;
- signed-out `/api/download/nv-166`: HTTP 401 and
  `Cache-Control: no-store`.

## Validation

| Gate | Result |
|---|---|
| `npm test` | 15 files, 79 tests passed |
| `npm run build` | passed; 34 modules transformed |
| `npm run validate:assets` | 234 assets, 4 collections, 4 categories validated |
| `npm run test:e2e` | 49 passed, 17 intentional project skips |
| `npm run audit:bundle` | passed |
| `npm run audit:cache-headers` | passed; 5 hashed outputs covered |
| `npm run audit:cloudinary-secrets` | passed |
| `npm run cloudinary:verify` | 234 manifest assets verified against 235 remote resources |
| Local Pages runtime | passed |
| Chromium evidence | passed at all required widths |
| Firefox evidence | passed at all required widths |

## Changed source

- `app.js`
- `index.html`
- `src/components/AssetGrid.js`
- `src/components/rollingControls.js`
- `src/icons/registry.js`
- `src/overlays/AssetModal.js`
- `src/overlays/AuthDialog.js`
- `src/pages/pages.js`
- `src/ui/Button.js`
- `src/ui/Icon.js`
- `src/ui/IconButton.js`
- `styles.css`
- `tests/e2e/prototype.spec.js`
- `tests/unit/icon-controls.test.js`
- this report

No font, category, route, data, Cloudinary, dependency, Vite, or deployment
configuration file changed. Unrelated untracked task files, source fonts,
audits, and `AGENTS.md` remain untouched.

## Deferred work

- Rolling-label extraction remains deferred because the existing helper already
  satisfies the behavioral contract and extracting it would increase risk.
- Mobile-menu Escape and outside-click remediation remains a future authorized
  phase.
- Category reveal and 10px category gap remain out of scope.

## Rollback

This phase is one atomic commit. Reverting it removes the registry and shared
primitives and restores prior Unicode symbols, CSS menu bars, CSS icon masks,
consumer markup, and compatibility styles without touching typography,
categories, routes, data, authentication, downloads, or Cloudinary.

## Completion checklist

- [x] Required registry and twelve icons exist.
- [x] `Icon`, `IconButton`, and `Button` contracts exist.
- [x] Migrated utility controls no longer use Unicode or CSS bars.
- [x] Runtime Discord, bookmark, and bolt masks are removed.
- [x] Accessible names and control geometry are preserved.
- [x] Rolling-label behavior is preserved.
- [x] Modal history/focus and restricted boundaries pass.
- [x] Chromium and Firefox evidence passes.
- [x] Complete release gate passes.
- [x] Rollback boundary is explicit.
