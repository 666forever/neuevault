---
title: Neuevault Final Release Baseline
status: completed
authority: release-baseline
audited-on: 2026-07-30
source-commit: 06bdfcd6b01fddeac5674c2a19a7e977115f1b4a
---

# Neuevault final release baseline

## 1. Release-baseline status

Phase 13 completed as an audit, evidence, and documentation phase. No production
implementation change was required.

Final recommendation:

> **Approved with documented non-blocking deviations**

All routes, approved visual contracts, security boundaries, browser matrices,
release commands, local Pages Functions checks, and production-host checks
passed. The deviations are limited to explicitly documented reference
unknowns, approved product adaptations, stale explanatory text in the
non-authoritative project design-system overview, and an intermittent Firefox
decoder message during intentional animated-media teardown. None creates a
broken route, blank frame, failed request, source leak, or unusable state.

## 2. Audit scope

The audit covered:

- the complete public route family, direct route entry, clean History API
  navigation, modal Back/Forward, loading, empty, error, and Not Found states;
- 13 widths from 320px through 1920px in Chromium and Firefox;
- pointer, keyboard, touch, reduced motion, and 200%-equivalent zoom;
- homepage, navigation, category, collection, asset, modal/auth, Search,
  editorial, and footer/application-shell contracts;
- deterministic signed-out and authenticated browser fixtures;
- public, animated, malformed, failed, and restricted asset behavior;
- CSS tokens, font roles, lifecycle ownership, landmarks, focus, metadata,
  static assets, cache headers, bundle boundaries, and protected delivery;
- local Cloudflare Pages Functions behavior and all production hosts.

Authority was applied in this order: approved specification, completed migration
reports, current production, deterministic fixtures, and Grainient only where
directly comparable.

## 3. Repository and deployment state

Audit start:

- branch: `main`;
- HEAD: `06bdfcd6b01fddeac5674c2a19a7e977115f1b4a`;
- tracked worktree: clean;
- active deployment: `773e8f56-56f9-4caf-aa14-810efcc617d1`;
- deployment source: `06bdfcd`;
- deployment URL: `https://773e8f56.neuevault.pages.dev`;
- entry JavaScript: `/assets/index-BbLdHMXQ.js`;
- entry size: 483,969 bytes; 50,014 gzip; 38,229 Brotli.

Pre-existing untracked reference fonts, historical `_TASK.md` files, and
`AGENTS.md` were outside the phase and remained untouched.

## 4. Files changed

Tracked output for this phase:

- `docs/baselines/NEUEVAULT_FINAL_RELEASE_BASELINE.md`

Ignored evidence was created under:

- `.reference-audit/neuevault/final-release-baseline/`

No production source, test, asset, font, generated manifest, dependency, build
configuration, route, authentication, download, Cloudinary, or catalog file
changed.

## 5. Route matrix

The production matrix contains 416 settled records: 16 route/state fixtures ×
13 widths × 2 engines.

| Fixture | Canonical route/result | Status |
| --- | --- | --- |
| Homepage | `/` | passed |
| Recently Added | `/recent` | passed |
| Icons | `/icons` | passed |
| Banners | `/banners` | passed |
| Animated | `/animated` | passed |
| Wallpapers | `/wallpapers` | passed |
| Collections | `/collections` | passed |
| Collection detail | `/collections/noface-icons` | passed |
| Search default | `/search` | passed |
| Search authored query | `/search?q=night&type=All` | passed |
| Search empty | `/search?q=__phase13_no_result__` | passed |
| About | `/about` | passed |
| Invalid route | `/phase-13-not-found` | passed as SPA Not Found |
| Direct public asset | canonicalized stable `nv-147` URL | passed |
| Restricted asset | canonicalized stable `nv-166` URL | passed |
| Category detail | `/categories/ethereal` | passed |
| Loading/error | deterministic lazy-route fixtures | passed |

Every settled record had HTTP 200 for the SPA document, the expected title and
canonical route, one header, one main, one footer, one route H1, zero horizontal
overflow, and no genuine failed request. Direct production HTTP checks passed
15/15 routes on each of the three hosts.

## 6. Responsive and browser matrix

Chromium and Firefox passed:

`320, 375, 520, 700, 701, 768, 1024, 1199, 1200, 1439, 1440, 1600, 1920`.

The paired boundaries `700/701`, `1199/1200`, and `1439/1440` preserved the
approved layout changes without overlap, focus clipping, stale navigation
state, or horizontal overflow. Normal browser sub-pixel serialization was
accepted. Fixed geometry tolerance was ±1 CSS pixel and fluid geometry
tolerance was ±0.5%.

## 7. Homepage results

At the 1920px reference viewport in both engines:

- header: 1920×62px;
- hero: 1890×887px, 20px radius;
- hero title: SF Pro Rounded 600, 46/48px, exactly two authored line groups;
- category grid: 1888px, four 460×478px cards, 16px gap, 20px radius;
- collection grid: 1440px, three 470px cards, 15px gap;
- footer: full width with a 1320px inner frame.

Hero video, gradient, authored grain, CTA, category reveal, collection
geometry, recent grid, section rhythm, and footer transition remained
unchanged.

## 8. Navigation results

Desktop and mobile navigation passed:

- 62px desktop header and established mobile header;
- 38px wide desktop gap and approved compact breakpoint gap;
- quiet active-route pill with `aria-current`;
- singular rolling-label accessible names;
- smooth reverse motion without a blank frame;
- Escape, outside pointer, successful route close, and focus restoration;
- 1199/1200 state reset;
- Collections and authentication controls;
- touch first activation and reduced-motion static layers.

The navigation controller remains singular and its global listeners are
disposed by its owned lifecycle.

## 9. Category-card results

The approved Phase 5 contract is matched:

- 460/478 aspect ratio and 20px radius at the desktop cap;
- 16px grid gap;
- rest opacity 0 and scale 1.4 on hover-capable layouts;
- reveal opacity 1 and scale 1;
- load-before-crossfade with no blank frame;
- focus parity;
- static touch and reduced-motion state;
- restricted media remains static;
- animated source cleanup on exit, route disposal, and visibility change.

## 10. Collection-card results

The Phase 7/7B geometry remains matched:

- 1440px section cap;
- three desktop columns and one mobile column;
- 470px desktop card width, approximately 605.1px total height;
- 15px gap;
- 20px desktop and 14px mobile radius;
- 41/44 media ratio and retained metadata region;
- bounded hover lift/media scale;
- natural long-copy wrapping;
- static touch/reduced behavior.

Chromium/Firefox height serialization differs by about 0.02px and is within
sub-pixel tolerance.

## 11. Asset-card and grid results

The Phase 8 contract remains matched:

- 1440px maximum grid;
- four desktop columns;
- 15px desktop and 8px mobile gaps;
- intrinsic media geometry and CSS-column masonry;
- 15px card radius and real border;
- stable IDs, one button/tab stop per asset, and logical DOM order;
- maximum media scale 1.025;
- initial 8-item batch followed by 16-item rendering;
- public, animated, restricted, malformed, static-failure, animated-failure,
  portrait, landscape, square, long-title, and metadata fixtures.

The measured settled route contains 16 items after the initial load-more
intersection behavior, as approved.

## 12. Media lifecycle results

Category, collection, asset-grid, and modal media retain:

- static preview first;
- animated source only when viewport/interaction policy permits;
- load-before-crossfade;
- static fallback on decode/load failure;
- observer disconnection and source removal during route disposal;
- visibility-change cleanup;
- reduced-motion and restricted-source blocks.

Three repeated route cycles per browser ended with one shell landmark set, no
stale animated source on the final About route, no application console error,
and no overflow.

Firefox intermittently reports `Image corrupt or truncated` when a large
Cloudinary-transformed animated WebP is intentionally unloaded before decode
completion. Reproduction returned HTTP 200 with the expected `image/webp`
content and a valid static preview; no request failed and no blank frame
occurred. This is recorded as a non-blocking decoder/teardown deviation rather
than a production regression.

## 13. Modal and authentication results

The Phase 9 modal contract remains matched:

- 1180×820px at the desktop cap and 94vh bound;
- 798px preview plus 380px information panel;
- 20px radius and 90% backdrop;
- 40px controls at 16px offsets;
- sticky actions and native information-panel scrolling;
- responsive full-screen mobile composition;
- direct asset reconstruction, cyclic navigation, Escape, focus trap,
  body/Lenis lock, Copy link, public download, and restricted states.

Card open changed the URL to the canonical stable-ID asset route. Back closed
the modal and restored focus to `nv-147`; Forward reopened it in both engines.
The deterministic auth dialog retained one labelled dialog, a close-first focus
position, and no OAuth request until its explicit action.

## 14. Search results

The Phase 10 contract remains matched:

- 1180px desktop content/control cap;
- 42px input/select;
- 36px filters with 8px gaps;
- persistent labels, native select behavior, `aria-pressed`, singular selected
  type, real result count, batching, asset-grid integration, and modal opening;
- deterministic loading status, route error alert/retry, and empty state.

Direct URL-authored query state reconstructs correctly. Interactive local
control changes intentionally do not rewrite the URL; this remains an approved
deferred behavior, not a regression.

## 15. Route and editorial results

The Phase 11 contracts remain matched:

- 1080px editorial cap;
- desktop 36/40px route title at weight 600;
- mobile 28/32px route title;
- 640px descriptive-copy maximum;
- 1536×400px collection hero;
- real back-link semantics and 28px tags;
- bounded loading, empty, error, and Not Found surfaces;
- one H1 and natural long-content wrapping.

Grainient route/editorial geometry remains unknown where the reference exposes
no comparable surface.

## 16. Footer and application-shell results

The Phase 12 contracts remain matched:

- full-width footer shell with 1320px inner cap;
- 24px desktop and 16px mobile gutters;
- 128px desktop and 80px mobile content separation;
- approved desktop/mobile padding;
- 13/18px typography;
- brand block, Browse group, Neuevault group, and legal line;
- only real internal links;
- one footer and one main;
- short-page bottom alignment and long-page normal flow;
- no fixed positioning, overlap, or zoom overflow.

At 1920px the footer measured 1920×386px with a 1320px inner frame in both
engines.

## 17. Typography results

Runtime font families across all matrix records were exactly:

- `SF Pro Rounded`;
- `TBJ Neuetra`.

Public source contains no Arimo, Archivo, or Inter consumer and no
`font-weight: 700`. The three SF Pro Rounded faces resolve to 400, 500, and 600;
TBJ Neuetra remains wordmark-only. The production font files return HTTP 200
with `font/woff2`, no untracked italic face is requested, and no synthetic 700
role exists.

The approved specification and Phase 3 report are authoritative. The older
typography paragraph in `docs/project/DESIGN_SYSTEM.md` still describes the
pre-migration families and should receive a future documentation-only
reconciliation; production and the approved specification are not ambiguous.

## 18. Token and CSS audit

Static and runtime review found:

- 471 distinct token definitions and 372 token consumers;
- zero undefined custom-property uses;
- no accidental 700 weight or legacy public font family;
- repeated component definitions are breakpoint overrides or approved
  compatibility mappings;
- unused semantic aliases are intentionally retained by the Phase 2
  compatibility layer and were not deleted from static analysis alone;
- one bounded `100vw` asset-grid calculation, with zero overflow across the
  complete matrix;
- `!important` use is limited primarily to touch/reduced-motion state
  guarantees plus one existing integration-status exception;
- no demonstrated specificity, selector, breakpoint, or parsing regression.

No token or selector cleanup was authorized because runtime evidence did not
prove behavior-neutral deletion.

## 19. JavaScript lifecycle audit

Source and repeated runtime cycles confirm:

- route disposal owns page cleanup;
- asset-grid observers disconnect;
- cover observers disconnect;
- visibility listeners and interaction handlers are removed;
- timers are cleared;
- animated `src` attributes are removed;
- modal/auth/navigation controllers are not recreated per route;
- route sequencing rejects stale lazy completions;
- one header and footer remain persistent.

Seventy-nine raw matrix records contain only `ERR_ABORTED` or
`NS_BINDING_ABORTED` requests when the harness deliberately navigated away.
They are classified as successful route cleanup, separated from genuine
network failures, and not hidden as delivery errors.

## 20. Accessibility audit

Passed:

- one header, main, footer, and route H1;
- logical landmark and heading order;
- semantic links/buttons and one asset-card tab stop;
- singular accessible control names and decorative SVG handling;
- visible 2px acid focus outline without clipping;
- mobile disclosure attributes and focus restoration;
- modal/auth dialog names, containment, Escape, and restoration;
- keyboard-native select and `aria-pressed` filters;
- loading `role=status`/`aria-busy`, error `role=alert`, and empty headings;
- touch-first operation, reduced-motion operation, and no hover-only essential
  content.

The existing Playwright suite covers complete keyboard flows across navigation,
cards, modal/auth, and footer.

## 21. SEO and document metadata audit

Verified:

- `<html lang="en">`;
- viewport and description metadata;
- route-specific titles;
- canonical URLs updated to `https://www.pfseeker.com`;
- direct-route HTML delivery;
- one canonical link;
- canonical stable-ID asset route and matching asset title;
- valid Not Found title/canonical state;
- favicon ICO/SVG/16×16/32×32, Apple icon, and web manifest delivery;
- no stale title after route/history navigation.

Open Graph, Twitter metadata, JSON-LD, sitemap, and robots expansion remain
deferred because no approved contract requires them and no current regression
was reproduced.

## 22. Static-asset and cache audit

All hosts returned HTTP 200 for HTML, entry/lazy JavaScript, CSS, SF Pro Rounded
font, logo, favicons, manifest, and hero texture with correct content types.
Public Cloudinary JPEG, PNG, and GIF attachment deliveries also returned HTTP
200 with the expected JPEG (`ffd8`), PNG (`89504e470d0a1a0a`), and animated
GIF (`GIF89a`) signatures. The representative public preview and original
returned HTTP 200.

- HTML: `public, max-age=0, must-revalidate`;
- hashed JS/CSS: `public, max-age=31536000, immutable`;
- versionless assets: excluded from immutable rules;
- custom-domain versionless assets: current four-hour revalidation policy;
- Pages hostname versionless assets: immediate revalidation;
- session and restricted responses: `no-store`.

The cache-header audit structurally covered all five hashed outputs. No mixed
content, missing production asset, service worker, or stale-chunk loop was
found.

## 23. Security and protected-content audit

Passed:

- Cloudinary and OAuth secrets absent from browser source/build;
- no signed restricted URL or restricted original path in public markup or
  evidence;
- `nv-166` signed-out response: HTTP 401 with `no-store` on all hosts;
- session response: HTTP 200 with `no-store` on all hosts;
- restricted manifest identity remains stable and public `src` remains null;
- public preview remains available;
- authenticated fixture keeps authorization and delivery server-owned;
- Copy link exposes only the stable application route;
- no credentials, cookies, private identity, signed URL, or restricted original
  exists in the evidence manifest.

## 24. Drift classification

| Contract | Classification |
| --- | --- |
| Header/nav geometry and behavior | matched |
| Hero 1890/887 frame and 46/48 title | matched |
| Category 460×478, reveal, touch/reduced states | matched |
| Collection 1440 cap, 470px cards, 15px gap | within sub-pixel tolerance |
| Asset 1440 cap, four columns, masonry, 15px gap | matched |
| Modal 1180×820 and 798/380 split | matched |
| Search 1180 cap, 42px fields, 36px filters | matched |
| Route 1080/1536 caps and 36/40 title | matched |
| Footer 1320 cap and application shell | matched |
| Neuevault accessibility/security adaptations | intentionally adapted |
| Exact Grainient modal/route/footer geometry | unknown reference |
| Search local changes not rewriting URL | intentionally adapted/deferred |

## 25. Regressions found

No blocking production regression was found.

The audit harness initially reused pages too aggressively, cancelling lazy
chunks and fonts during navigation. Affected fixtures were discarded and
re-captured in isolated, fully settled pages. The provisional collection slug
was also rejected and replaced with the real canonical
`/collections/noface-icons` fixture. Neither issue existed in product code.

## 26. Corrections made

No production correction was made.

Only ignored audit tooling/evidence was corrected:

- transient navigation aborts were separated from genuine failures;
- affected fixtures were re-captured in isolated pages;
- the collection fixture was corrected to a real generated collection.

## 27. Remaining intentional differences

Neuevault intentionally retains its own:

- brand, routes, content, security model, responsive breakpoints, and product
  information architecture;
- keyboard/touch/reduced-motion adaptations where reference behavior would be
  inaccessible;
- native History API, modal, media, and protected-delivery architecture;
- quiet active navigation, stationary button shells, and component-specific
  media behavior.

Unsupported Grainient geometry is marked unknown rather than inferred.

## 28. Deferred work

Deferred, non-blocking items:

- full URL rewriting for interactive Search control changes;
- advanced SEO features not already present;
- future large-catalog repository/pagination architecture;
- documentation-only reconciliation of stale pre-migration typography wording
  in `docs/project/DESIGN_SYSTEM.md`;
- potential investigation of Firefox's intermittent decoder message during
  deliberate large animated-WebP teardown, without weakening source cleanup.

## 29. Console, network, and bundle results

Settled matrix:

- 416 records;
- zero application console errors;
- zero genuine failed requests;
- zero overflow;
- 79 route-disposal abort records classified separately;
- one independently documented intermittent Firefox decoder message.

Bundle:

- entry: 483,969 bytes / 50,014 gzip / 38,229 Brotli;
- total JS: 494,018 bytes / 54,135 gzip / 41,637 Brotli;
- largest lazy chunk: `AssetModal-BsPsDeqn.js`, 5,051 bytes;
- Vite advisory: absent;
- bundle budget: passed.

## 30. Unit, E2E, build, and audit results

| Gate | Result |
| --- | --- |
| `npm test` | passed — 24 files / 129 tests |
| `npm run build` | passed — Vite 7.3.6 / 35 modules |
| `npm run validate:assets` | passed — 234 assets / 4 collections / 4 categories |
| `npm run test:e2e` | passed — 73 / 23 intentional skips |
| `npm run audit:bundle` | passed |
| `npm run audit:cache-headers` | passed — 5 hashed outputs |
| `npm run audit:cloudinary-secrets` | passed |
| `npm run cloudinary:verify` | passed — 234 manifest / 235 remote |
| Local Pages Functions runtime | passed |
| Chromium matrix | passed |
| Firefox matrix | passed with documented teardown decoder deviation |
| 200%-equivalent containment | passed in both engines |

## 31. Production verification

At audit time all three hosts served deployment
`773e8f56-56f9-4caf-aa14-810efcc617d1` from source `06bdfcd`:

- `https://www.pfseeker.com`;
- `https://pfseeker.com`;
- `https://neuevault.pages.dev`.

All hosts served the same entry, CSS, and lazy chunk names. Each passed 15/15
direct route checks, session/restricted cache checks, static-asset checks, and
canonical-host behavior. The apex and Pages host serve the application while
document canonicals consistently identify `www.pfseeker.com`.

## 32. Rollback boundary

Because no implementation changed, the Phase 13 rollback boundary is the
documentation/evidence-only commit containing this report. Ignored evidence
may be removed independently without affecting production.

## 33. Final release recommendation

**Approved with documented non-blocking deviations.**

Neuevault may treat this release as the definitive integrated visual and
behavioral baseline. No security, route, visual-contract, browser, history,
accessibility, protected-delivery, build, cache, or deployment blocker remains.

## 34. Completion checklist

- [x] Authority order applied.
- [x] Current repository/deployment baseline recorded before editing.
- [x] No speculative production cleanup performed.
- [x] All required routes and deterministic states audited.
- [x] All 13 widths audited in Chromium and Firefox.
- [x] Breakpoint boundary pairs audited.
- [x] Pointer, keyboard, touch, reduced motion, and zoom audited.
- [x] Homepage and every completed migration family revalidated.
- [x] Modal History, focus, Lenis, and restricted boundaries passed.
- [x] Loading, empty, route-error, and Not Found states passed.
- [x] Typography roles and font files passed.
- [x] CSS/token and JavaScript lifecycle audits completed.
- [x] Accessibility and metadata audits completed.
- [x] Static assets and cache policy passed.
- [x] Evidence manifest sanitized.
- [x] Complete release gate passed.
- [x] No production implementation change required.
- [x] Documentation-only commit scope prepared; publication identifiers belong
  to the final task handoff.
- [x] Pre-publication production convergence verified; post-commit host
  reconfirmation belongs to the final task handoff.
