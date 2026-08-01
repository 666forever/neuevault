---
title: Neuevault Navbar Visual Fidelity Migration Report
status: completed
date: 2026-08-01
phase: navbar-visual-fidelity-and-interaction-refinement
---

# Neuevault navbar visual fidelity migration

## 1. Phase status

Completed and release-gated. The navbar's visual composition was refined without changing its routes, state controller, authentication flow, Collections action, icon artwork, typography families, or mobile dismissal behavior.

## 2. User-visible problem

The prior header combined a 38px external navigation gap with pills that extended 16px beyond the actual anchor. The brand was comparatively wide and segmented, desktop actions were visually dominant, and the 300ms roll plus separate settle animation made the header feel mechanical. The mobile panel was functional but visually loose.

## 3. Files changed

- `styles.css`
- `tests/unit/design-system.test.js`
- `tests/unit/homepage-assets.test.js`
- `tests/unit/interaction-system.test.js`
- `tests/e2e/prototype.spec.js`
- `tests/e2e/navbar-fidelity.spec.js`
- `docs/baselines/NEUEVAULT_NAVBAR_VISUAL_FIDELITY_MIGRATION_REPORT.md`

Ignored evidence is under `.reference-audit/neuevault/navbar-fidelity/`.

## 4. Current navbar inventory

The existing DOM remains one `.site-header`, one `.nav-shell`, one brand link, one primary `.main-nav`, one desktop action group, one collapsed action group, and one registry-backed menu button. `createMobileNavigation()` remains the sole navigation-state controller.

## 5. Grainient measurement inventory

Direct Chromium and Firefox measurements at 1200, 1440, 1600, and 1920px recorded a 62px header, 1440px maximum inner width, 15px minimum gutters, 133×34px brand with a 7px internal gap, approximately 605px primary group, approximately 40px link/pill height, 10px 20px link padding, no explicit inter-link gap, and approximately 38px action height. Reference hover and exit timing could not be established reliably and is recorded as Unknown.

## 6. Grainient / before / target / final comparison

| Contract | Grainient | Neuevault before | Target | Final |
|---|---:|---:|---:|---:|
| Header height | 62px | 62px | 62px desktop | 62px |
| Inner maximum | 1440px | 1536px | 1440px | 1440px |
| Minimum gutter | 15px | 16px | 15px | 15px |
| Brand | 133×34px | 163.3×28px | compact 34px-high lockup | 140.3×34px |
| Logo shell | 34×34px | 54×28px | 34×34px | 34×34px |
| Brand gap | 7px | 10px | 7px | 7px |
| Nav width at 1440 | ~605px | 608.7px | compact continuous group | 602.7px |
| Explicit link gap | 0px | 38px | 2px | 2px |
| Link padding | 20px reference | pill expanded outside link | 15px owned by link | 15px |
| Link/pill height | ~39.6px | 40px | 40px | 40px |
| Actions | ~247.6×38px | 234.5×40px signed-out | compact 38px controls | 221.5×38px |
| Header roll | Unknown | 300ms + settle | clean immediate roll | 220ms, no settle |

Firefox final widths differ by less than 0.15px from Chromium.

## 7. Final shell width and gutters

`--nav-container-max` is 1440px and `--nav-shell-gutter` is 15px. The shell resolves to 1170px at 1200, 1410px at 1440, and 1440px at 1600/1920.

## 8. Final brand lockup

The original artwork and TBJ Neuetra wordmark are unchanged. The surface shell is 34×34px with a 12px radius, the artwork remains 18×18px, and the wordmark gap is 7px. Total measured width is 140.33px in Chromium and 140.30px in Firefox.

## 9. Final center-navigation geometry

The three-zone grid is retained because compact side groups allow true centering without transforms. At all measured desktop widths the navigation center equals the viewport center: exact in Chromium and within 0.01px in Firefox.

## 10. Final link and pill box model

Each link owns its 15px inline padding and 40px height. The pill pseudo-element uses `inset: 0`, so visible pill, focusable anchor, and pointer target have identical bounds. The group uses a deliberate 2px gap with no expanded invisible pill region.

## 11. Final active and hover treatment

Hover uses `#1a1a1a`; the persistent `aria-current` route uses `#151515`. Both use the same full pill radius. Text color, width, and geometry remain stable and the global focus ring remains visible.

## 12. Final rolling-label behavior

Header labels retain two accessibility-safe visual layers and exact 40px travel. Duplicate layers remain `aria-hidden`. The header override removes the settle keyframes and uses one clean reversible transform. Non-header rolling controls retain their established behavior.

## 13. Final motion timing

Header text, paired header icons, and the pill use 220ms with the standard cubic-bezier easing and no entry delay. Exit reverses immediately. Touch and reduced-motion rules expose only the primary label.

## 14. Final right-action treatment

Sign in and Collections retain their Button primitives, destinations, icons, accessible names, and visual variants. Both are 38px high with 14px inline padding, a 6px icon/text gap, and an 8px group gap. The signed-out group measures 221.53px in Chromium and 221.43px in Firefox.

## 15. Optical-balance result

At 1200, 1440, 1600, and 1920px, the navigation center delta is 0px in Chromium and 0.01px in Firefox. The compact 140.3px brand and 221.5px action group remain unequal in mass, but the independently centered navigation and quieter control sizing produce a balanced composition. Classification: geometrically centered and optically balanced.

## 16. Mobile navigation result

At widths below 1200px the header is 70px high with 15px shell gutters. The menu control is 38×38px. The open panel begins at y=70, uses 15px viewport gutters, 12px padding, a 2px row gap, 48px route rows, and a separated two-column action group. Existing Escape, outside-pointer, route-close, focus restoration, body lock, and breakpoint reset remain unchanged.

## 17. Responsive matrix

Chromium and Firefox passed at 320, 375, 390, 430, 520, 700, 701, 768, 1024, 1199, 1200, 1280, 1366, 1439, 1440, 1536, 1600, and 1920px. All 36 fixtures reported zero horizontal overflow, one active route, no clipping, and no failed request or console error. The 700/701, 1199/1200, and 1439/1440 boundaries were explicitly captured. A 700/701 CSS-viewport fixture also covers 200%-equivalent containment for a 1400px desktop canvas.

## 18. Accessibility

One header and one primary navigation landmark remain. Routes retain one accessible name and `aria-current`; duplicate roll layers remain hidden. The menu button retains `aria-controls`, contextual accessible naming, and `aria-expanded`. Closed mobile links remain non-focusable, focus order remains logical, and only one mode-specific Sign in and Collections action is exposed.

## 19. Touch, keyboard, and reduced motion

Pointer hover and exit keep geometry stable. Keyboard focus triggers the same pill and label state immediately with a visible focus outline. Touch preserves first-tap activation and suppresses duplicate layers. Reduced motion removes roll and pill transitions while retaining labels, route state, and actions.

## 20. Controller and lifecycle results

The controller implementation and listener ownership were not changed. Focused unit tests pass one-controller, repeated open/close, Escape, outside pointer, successful-route close, focus restoration, and breakpoint reset contracts. Browser lifecycle checks passed mobile → desktop → mobile transitions with no stale `aria-expanded` or body-lock state.

## 21. Cross-system regression results

The full browser suite passed hero, category, collection, stable asset grid, Search, clean routing, modal/history, Lenis, authentication/session/logout, public downloads, restricted source boundaries, footer/application shell, titles, and media lifecycle coverage.

## 22. Visual evidence

The sanitized evidence manifest is `.reference-audit/neuevault/navbar-fidelity/manifest.json`. It indexes before/reference/final measurements and final Chromium/Firefox screenshots without cookies, credentials, OAuth data, or private identity.

## 23. Console, network, and bundle results

The 36-fixture cross-browser matrix reported zero console errors, zero failed requests, and zero overflow. Bundle audit passed: entry `index-BXA4--rS.js` is 486,302 bytes (50,856 gzip; 38,995 Brotli); total JavaScript is 496,351 bytes (54,978 gzip); largest lazy chunk is 5,051 bytes.

## 24. Unit, E2E, build, and audit results

- Unit: 25 files, 133 tests passed.
- E2E: 80 passed, 26 intentionally skipped.
- Build: passed; five hashed assets received generated immutable rules.
- Assets: 234 assets, four collections, four categories validated.
- Bundle budget: passed.
- Cache headers: passed.
- Cloudinary secret audit: passed.
- Cloudinary verification: 234 manifest assets verified against 235 remote resources.
- Local Pages runtime: homepage, Recent, Icons, Collections, Search, About, and asset deep link returned 200; session returned 200; signed-out `/api/download/nv-166` returned 401.

## 25. Remaining intentional differences

Neuevault keeps its own routes, seven-link information architecture, 14px SF Pro Rounded navigation typography, Discord action, acid Collections action, and Neuevault brand. Grainient's exact motion timing is Unknown and was not invented.

## 26. Deferred navigation work

No functional navigation work is deferred. Any future visual adjustment should be based on new measured evidence and must preserve the controller contracts.

## 27. Rollback boundary

Reverting the single navbar-fidelity commit restores the prior navbar geometry, pill/link model, brand/action sizing, header motion, mobile presentation, focused tests, and this report. It does not alter or roll back routes, authentication, modal, Search, cards, grid, footer, data, or Cloudinary systems.

## 28. Completion checklist

- [x] Measured current and Grainient compositions in Chromium and Firefox.
- [x] Clickable and visible pill bounds match.
- [x] External link gap reduced and tokenized.
- [x] Center navigation is optically balanced.
- [x] Brand and actions are compact and aligned.
- [x] Header motion is simplified and reversible.
- [x] Touch, keyboard, and reduced motion pass.
- [x] Mobile navigation is visually refined.
- [x] Lifecycle and accessibility contracts pass.
- [x] Required responsive matrix passes in Chromium and Firefox.
- [x] Full release gate and local Pages runtime pass.
- [x] Unrelated worktree files remain untouched.
