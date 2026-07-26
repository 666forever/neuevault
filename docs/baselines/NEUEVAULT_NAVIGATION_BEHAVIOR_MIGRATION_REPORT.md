---
title: Neuevault Navigation Behavior Migration Report
status: completed
date: 2026-07-26
phase: navigation-behavior-and-mobile-menu-remediation
---

# Neuevault navigation behavior migration

## 1. Phase status

Phase 6 is complete and release-gated. The collapsed navigation now has an
explicit lifecycle-owned state model for toggle, Escape, outside-pointer,
successful route navigation, action dismissal, and the 1200px desktop
transition. Header visuals, geometry, rolling labels, route definitions,
authentication architecture, modal behavior, and scrolling are unchanged.

## 2. Files changed

- `app.js`
- `index.html`
- `src/components/mobileNavigation.js`
- `tests/unit/mobile-navigation.test.js`
- `tests/e2e/prototype.spec.js`
- `docs/baselines/NEUEVAULT_NAVIGATION_BEHAVIOR_MIGRATION_REPORT.md`

Ignored evidence is stored under `.reference-audit/neuevault/navigation/`.
`manifest.json` contains sanitized computed state and runtime results;
`fixtures.json` indexes the dedicated focus and authentication fixtures.

## 3. Previous defect inventory

Pre-change browser reproduction confirmed:

- Escape left the collapsed menu open.
- Outside pointer activation left the menu open.
- Escape could not return focus because no dismissal existed.
- Crossing from 1199px to 1200px retained `.open`,
  `aria-expanded="true"`, and the close label.
- A permanent panel anchor listener closed on click before the SPA navigation
  outcome was known.

Normal successful About navigation already closed through the route render
path, confirming route dismissal was conditional rather than universally
absent.

## 4. Final state model

`createMobileNavigation()` is the sole owner of:

- the internal open boolean;
- `.main-nav.open`;
- `aria-expanded`;
- the contextual `Open menu` / `Close menu` accessible label;
- the registry-backed `menu` / `close-menu` SVG;
- transient Escape and outside-pointer listeners;
- the 1200px media-query transition;
- focus restoration for keyboard dismissal;
- disposal.

The existing real button, `aria-controls="main-nav"`, 40x40px geometry, focus
ring, DOM order, and primary/mobile action markup remain intact.

## 5. Event-listener ownership

The toggle click and media-query change listeners belong to the controller and
are removed by `destroy()`. Escape and pointerdown listeners exist only while
the menu is open and are removed on every close path. Reopening reuses the same
handler identities, so listeners cannot multiply.

Focused unit tests measured one listener per transient event after repeated
open/close cycles and zero toggle, media-query, Escape, or pointer listeners
after disposal.

## 6. Escape behavior

The transient document keydown handler acts only when:

- the menu is open;
- the key is Escape;
- neither the asset modal nor authentication dialog owns Escape.

It prevents the dismissal keystroke, stops propagation, closes the menu, and
returns focus to the toggle. URL and route state do not change. Closed-menu
Escape is ignored.

## 7. Outside-pointer behavior

The transient document pointerdown handler uses `composedPath()` plus
containment fallback. Events whose path includes the toggle or panel are
ignored, including nested SVG targets. A pointer outside both closes without
preventing the pointer action and without moving focus.

The controller does not own a panel-wide click-to-close listener.

## 8. Route-change behavior

The existing SPA router closes the menu only after route rendering succeeds.
A prevented/cancelled link remains open. Successful primary or Collections
navigation closes without returning focus to the toggle; focused controls in
the newly hidden panel are blurred so focus is not retained inside hidden
content. Back and Forward run the existing route policy and never reopen the
menu.

Authentication actions close only after the overlay feature loads, then open
the existing dialog once. Failed feature loading does not silently dismiss the
panel.

## 9. Breakpoint-transition behavior

The existing `(min-width: 1200px)` contract is observed directly. If open at
1199px, entering desktop mode closes, clears the class and expanded state,
restores the open label/icon, clears hidden-panel focus, and removes transient
listeners. Returning to 1199px starts closed.

Header height remains 60px through 700px and 62px above 700px. Desktop mode
still starts at 1200px; compact and wide desktop spacing boundaries remain
1439/1440px.

## 10. Focus-management results

- Opening retains focus on the toggle and does not trap focus.
- Tab order is Recently Added, Icons, Banners, Animated, Wallpapers, Search,
  About, Sign in, Collections.
- Shift+Tab returns logically to the toggle.
- Escape restores toggle focus.
- Outside pointer does not steal focus.
- Route/action close never restores toggle focus.
- Closed-panel controls receive no keyboard focus.
- No body scroll lock was added; Lenis integration is unchanged.

## 11. Active-route verification

Route matching remains in `activeNavigation()` and is unchanged. The header now
exposes exactly one `aria-current="page"`:

- the header brand on Home;
- the matching primary link for Recent, type routes, Search, and About;
- the currently applicable desktop or collapsed Collections action for
  collection index/detail routes;
- the background route for asset detail/modal URLs.

The existing quiet active pill and class remain on compatible rendered
controls. No substring matching was introduced.

## 12. Authentication and action verification

Signed-out configured/unavailable behavior, Discord icon/label behavior,
session loading, signed-in display, logout POST/CSRF handling, OAuth endpoints,
and Collections routing are unchanged. Automated fixtures confirmed:

- unavailable action opens one unavailable dialog and makes no protected API
  request;
- configured signed-out action opens one auth dialog;
- synthetic signed-in state renders the existing account label;
- logout returns to the signed-out state;
- menu dismissal neither duplicates nor cancels the action.

No private signed-in production identity was captured.

## 13. Responsive and visual evidence

Chromium and Firefox passed at 320, 375, 700, 701, 1024, 1199, 1200, 1439,
1440, and 1920px through the local Cloudflare Pages runtime.

Evidence covers closed/open panels, toggle focus, every menu control focus,
Escape, outside pointer, route navigation, Back, 1199/1200 transition,
signed-out/unavailable actions, a synthetic signed-in fixture, touch, reduced
motion, and desktop navigation at 1200/1439/1440.

All fixtures retained the approved header/panel/toggle/icon bounds, body
overflow, rolling-label structure, typography, active pill, and responsive
visibility. There was zero horizontal overflow.

## 14. Accessibility results

- The toggle remains one real button with one accessible label.
- `aria-expanded` and `aria-controls` match panel state.
- Menu/close icons remain decorative registry SVGs.
- Hidden links are not reachable by keyboard.
- Focus outline remains the existing 2px acid ring with 3px offset.
- Normal Tab and Shift+Tab order passes without a focus trap.
- Touch activates on the first tap.
- Reduced motion exposes one usable label/icon layer.
- Modal and authentication Escape ownership remains isolated.
- The header has exactly one current-page indicator.

## 15. Console, network, and bundle results

The Chromium/Firefox runtime matrix recorded zero console errors and zero
failed requests. Local Pages checks returned:

- `/`: HTTP 200, revalidating HTML;
- `/about`: HTTP 200, revalidating HTML;
- `/api/auth/session`: HTTP 200, `Cache-Control: no-store`;
- signed-out `/api/download/nv-166`: HTTP 401,
  `Cache-Control: no-store`.

The entry bundle is 482,674 bytes, 49,813 bytes gzip, and 38,028 bytes Brotli.
Total JavaScript is 491,689 bytes and 53,551 bytes gzip. The bundle budget and
existing lazy boundaries pass.

## 16. Release gate

| Gate | Result |
|---|---|
| Focused navigation unit tests | pass - 6/6 |
| Focused navigation Playwright | pass |
| `npm test` | pass - 16 files, 85 tests |
| `npm run build` | pass - 35 modules transformed |
| `npm run validate:assets` | pass - 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass - 51 passed, 19 intentional skips |
| `npm run audit:bundle` | pass |
| `npm run audit:cache-headers` | pass - 5 hashed outputs |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass - 234 manifest assets / 235 remote resources |
| Chromium navigation matrix | pass |
| Firefox navigation matrix | pass |
| Local Pages runtime | pass |

## 17. Deferred navigation work

No additional navigation defect is carried by this phase. A future visual
redesign or focus-policy change would require separate authorization.

## 18. Rollback boundary

This phase is one navigation-only commit. Reverting it removes the controller,
restores the prior inline toggle/panel listeners and route close calls, restores
the previous accessible label wording and active-current behavior, and removes
the focused tests/report. It does not affect typography, icons, hero, category
cards, collections, assets, modals, authentication architecture, downloads,
data, Cloudinary, or deployment configuration.

## 19. Completion checklist

- [x] Escape closes only an open menu and restores toggle focus.
- [x] Outside pointer closes without stealing focus.
- [x] Inside pointer and cancelled navigation remain open.
- [x] Successful route/action close occurs once without toggle focus.
- [x] 1199/1200 transition clears mobile state.
- [x] Listener setup, reuse, and disposal pass.
- [x] Labels, icons, expanded/controls/current attributes pass.
- [x] Active-route mapping remains deterministic.
- [x] Auth actions and dialog/modal Escape isolation pass.
- [x] Touch and reduced-motion behavior pass.
- [x] Chromium/Firefox matrix and complete release gate pass.
- [x] Atomic publication record is included in the final task handoff.
