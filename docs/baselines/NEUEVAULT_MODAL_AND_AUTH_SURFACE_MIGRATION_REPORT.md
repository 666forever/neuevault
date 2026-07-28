---
title: Neuevault Modal and Authentication Surface Migration Report
status: completed
date: 2026-07-28
phase: 9-modal-auth-surface-alignment
---

# Neuevault modal and authentication surface alignment

## 1. Phase status

Phase 9 is complete. The asset viewer and authentication dialog
now use explicit semantic geometry contracts and a more balanced visual
composition. History, focus, Escape, cyclic navigation, session, OAuth,
download, and protected-delivery logic remain unchanged.

The complete release gate and publication record are recorded below.

## 2. Files changed

- `styles.css`
- `src/overlays/AssetModal.js`
- `tests/unit/asset-modal.test.js`
- `tests/unit/auth-dialog.test.js`
- `tests/e2e/prototype.spec.js`
- this report

`AuthDialog.js`, shared UI primitives, icons, routes, APIs, data, and deployment
configuration required no production change.

Ignored evidence is stored under
`.reference-audit/neuevault/modal-auth/`. Its sanitized index is
`manifest.json`; `measurements.json` records the browser geometry and behavior
results without credentials, cookies, signed URLs, or private identity.

## 3. Current modal/auth inventory

The asset viewer remains a labelled `role="dialog"` overlay containing a
two-column `.modal-shell`, contained `.modal-preview`, natively scrollable
`.modal-info`, shared registry-backed close/previous/next `IconButton`
controls, semantic metadata `dl`, and two shared `Button` actions.

The authentication surface remains a separate labelled dialog. It contains
the registry-backed close control, eyebrow, state-specific title/body,
Discord/sign-out action, and integration status. It is not merged with the
asset viewer and owns no detail URL.

Before this phase:

- modal maximum: 1180×820px / 94vh;
- columns at the desktop cap: 838px media + 340px information;
- backdrop: 94% black;
- shell: 20px radius and 1px `#303030` border;
- info padding: 34px;
- controls: 40×40px at 14px offsets;
- metadata: flex rows, 12px vertical padding;
- actions: 9px gap, sticky within the info scroller;
- auth: 420px maximum, 30px padding, 16px radius, 34px close control;
- mobile asset layout: full-screen with a 56vh media row;
- mobile auth: 22px inline padding and compatibility 14px radius.

## 4. Reference, current, target, and final measurements

The Grainient reference audit explicitly reports that no public semantic modal
or authentication dialog was measurable. Backdrop, panel geometry, focus
behavior, controls, and actions are therefore **Unknown**. No reference value
was inferred.

The approved Neuevault specification is the target authority. It requires the
1180px desktop maximum, 820px/94vh bound, distinct media/info regions, native
info scrolling, and full-screen stack at or below 700px.

| Viewport | Reference | Before shell/media/info | Target | Final shell/media/info |
|---:|---|---|---|---|
| 1200×900 | Unknown | 1164 / 822 / 340px | 1164 / flexible / ≤380px | 1164 / 782 / 380px |
| 1440×1000 | Unknown | 1180 / 838 / 340px | 1180 / 798 / 380px | 1180 / 798 / 380px |
| 1600×1000 | Unknown | 1180 / 838 / 340px | 1180 / 798 / 380px | 1180 / 798 / 380px |
| 1920×1080 | Unknown | 1180 / 838 / 340px | 1180 / 798 / 380px | 1180 / 798 / 380px |

Chromium and Firefox matched within normal sub-pixel serialization.

Intermediate information width uses
`clamp(300px, 32vw, 380px)`: 300px at 701/768, 327.67px at 1024, and 380px
from 1199px. This avoids the former excessively narrow text region at desktop
while preventing a fixed 380px panel from consuming most of the first tablet
pixel.

## 5. Final modal geometry

The semantic contract is:

- maximum width: 1180px;
- maximum height: 820px, bounded by 94vh;
- information track: 300–380px;
- media track: remaining minimum-zero space;
- shell radius: 20px;
- border: semantic 1px default border;
- backdrop: `rgba(0,0,0,.9)`;
- media background: `--gray-950`;
- information padding: 32px;
- viewport padding above 700px: 18px.

At 1440px the media/info balance is 798/380px, or approximately 67.7/32.3%.
Originals remain centered with `object-fit:contain`; no crop, blur, or
decorative media treatment was introduced.

## 6. Control placement

Close, previous, and next remain shared 40×40px circular `IconButton`
controls. Offsets are normalized from 14px to 16px. Close remains top-right
inside the media region; previous/next remain vertically centered at the media
edges. Accessible names remain `Close viewer`, `Previous asset`, and
`Next asset`. Navigation remains cyclic.

## 7. Metadata presentation

Metadata rows now use a two-track grid with a minimum-zero value column,
16px label/value gap, 13px vertical padding, 1.4 line height, semantic divider,
Regular 400 muted labels, and Medium 500 secondary values. Values use safe
wrapping, so deterministic long metadata does not clip or create horizontal
overflow.

The title retains the approved modal type role, gains an explicit 1.15 line
height, and wraps naturally through `overflow-wrap:anywhere`.

## 8. Action area

The action region remains sticky inside `.modal-info`. It uses the modal
surface, a 10px action gap, 12px top separation, and two stable 46px full-width
shared buttons. Public download and Copy link semantics are unchanged.

For restricted assets, the public/private explanation now precedes the sticky
actions inside a dedicated content wrapper. This keeps both critical actions
available at the bottom without changing the explanation or authorization
flow.

## 9. Public, restricted, and authentication states

- Public assets retain `Download original` and direct public delivery.
- Restricted signed-out assets retain `Sign in to download`.
- Restricted signed-in fixtures retain `Download restricted original` and the
  `/api/download/:assetId` boundary.
- Auth unavailable retains a disabled `Authentication unavailable` action.
- `nv-166` exposes no original, authenticated path, restricted public ID, or
  signed URL in markup.
- Public preview and private original are stated once.
- Loading/error toasts and retry behavior are unchanged.

The redacted signed-in fixture records only the action label and protected
source absence. No real account identity or response was captured.

## 10. Authentication-dialog geometry

Desktop auth geometry is:

- 440px maximum width;
- 32px padding;
- 20px radius;
- semantic surface and border;
- 40×40px close control at 16px;
- 14px title/body rhythm;
- 16px body/action rhythm;
- 44px full-width action;
- native contained scrolling with a viewport-safe maximum height.

At 1440px the configured signed-out fixture measured 440×326.8px. At 320px
the card remains contained at 288px wide with 22px mobile padding and an 18px
radius. The dialog remains distinct from the asset viewer and introduces no
credential form.

## 11. Mobile composition

At or below 700px the viewer remains full-screen, borderless, and radius-free.
The first row is `minmax(220px, min(44vh, 420px))`; the remaining height belongs
to the native `.modal-info` scroller. At 320×812 the media region measured
320×357.28px and the information region used the remaining width/height.

Titles, metadata, actions, close/navigation controls, and focus rings remain
visible and contained. Chromium and Firefox recorded zero horizontal overflow
at 320, 375, 520, and 700px.

## 12. History and navigation behavior

The existing native History API implementation is unchanged and passed:

- stable-ID direct detail URL opens;
- opening from a card pushes history;
- Back closes;
- Forward reopens;
- background route and list context remain;
- origin focus restores after Back/close;
- previous/next wraps cyclically;
- direct refresh reconstructs the modal.

## 13. Focus, Escape, and scrolling

The existing dialog controller is unchanged. Browser tests confirmed:

- close receives initial focus;
- Shift+Tab wraps to the last action;
- Tab returns to close;
- Escape closes only the active owning surface;
- asset origin focus restores when possible;
- auth close restores focus to the restricted action;
- body scroll remains locked;
- Lenis stops while an overlay is active and resumes after close;
- `.modal-info` and `.auth-dialog-card` retain `data-lenis-prevent`.

## 14. Accessibility

Both surfaces retain `role="dialog"`, `aria-modal`, and programmatic titles.
Every control retains one contextual accessible name. Registry SVGs remain
decorative. Loading/disabled semantics, logical tab order, reduced motion,
keyboard-native nested scrolling, and visible focus rings remain intact.

The deterministic failed-preview fixture removes the failed image and retains
the stable media frame without a browser broken-image glyph.

## 15. Visual evidence and classification

Evidence covers Chromium and Firefox at 320, 375, 520, 700, 701, 768, 1024,
1199, 1200, 1439, 1440, 1600, and 1920px plus portrait, landscape, animated,
restricted, auth configured/unavailable/mobile, redacted signed-in,
reduced-motion, cyclic navigation, and Back/Forward fixtures.

| Area | Classification |
|---|---|
| Approved 1180×820/94vh shell | matched |
| Desktop information width and action room | matched target |
| 701–1199 responsive balance | intentionally adapted with clamp |
| 20px shell/auth radius and semantic border | matched target |
| 40px shared controls and 16px offsets | matched target |
| Mobile full-screen/native info scroll | matched |
| Grainient modal geometry | remaining unknown; no public reference evidence |
| Neuevault protected/auth states | intentionally product-specific |

## 16. Console, network, and bundle results

Stable route/browser checks recorded no first-party request failures or
implementation console errors. Evidence navigation deliberately cancels
in-flight gallery GIF requests when contexts/routes close; Chromium reports
`ERR_ABORTED` and Firefox reports `NS_BINDING_ABORTED`, with Firefox sometimes
describing the cancelled decode as truncated. These are expected lifecycle
cancellations, not failed settled modal resources.

Final bundle and audit values are recorded in the release-gate table.

## 17. Unit, E2E, build, and audit results

| Gate | Result |
|---|---|
| Focused modal/auth unit tests | pass – 21 focused tests including existing auth/history contracts |
| Focused modal/history/Lenis Playwright | pass |
| `npm test` | pass — 20 files, 109 tests |
| `npm run build` | pass |
| `npm run validate:assets` | pass — 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass — 65 passed, 23 intentional skips |
| `npm run audit:bundle` | pass — entry 483,247 bytes / 49,885 gzip; total JS 492,300 bytes / 53,631 gzip |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass — 234 manifest assets verified against 235 remote resources |
| Chromium matrix | pass |
| Firefox matrix | pass |
| Local Pages runtime | pass — clean routes 200, session 200/no-store, restricted signed-out 401/no-store |

## 18. Remaining intentional differences

There is no measurable Grainient modal/auth geometry to copy. Neuevault
therefore keeps its approved shell maximum, contained originals, product
metadata, protected-content explanation, History API model, and Discord-only
authentication architecture.

## 19. Deferred modal/auth work

No behavior rewrite is carried by this phase. A future inline error-state or
busy-label redesign would require separate authorization because this phase
preserves current toast and retry behavior.

## 20. Rollback boundary

One atomic Phase 9 commit is the rollback boundary. Reverting it restores the
340px info track, prior padding/row/action geometry, 94% backdrop, 14px control
offsets, 420px auth card, 34px auth close, prior mobile media split, focused
tests, and this report.

It does not alter or roll back routes, History API behavior, OAuth/session
architecture, downloads, authorization, data, Cloudinary, cards, masonry,
typography, icons, or deployment configuration.

## 21. Completion checklist

- [x] reference unknowns recorded rather than inferred
- [x] current and target measurements recorded before editing
- [x] modal shell and media/info balance aligned
- [x] metadata and long values remain readable
- [x] sticky actions retain stable geometry and semantics
- [x] public/restricted/auth states remain correct
- [x] no protected source leaks
- [x] auth surface remains distinct and contained
- [x] History, cyclic navigation, focus, Escape, scroll lock, and Lenis pass
- [x] mobile full-screen composition passes
- [x] Chromium and Firefox matrices pass without overflow
- [x] complete release gate passes
- [ ] atomic commit and push complete
- [ ] Cloudflare deployment and production-host verification complete
