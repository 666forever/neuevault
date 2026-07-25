---
title: Neuevault Visual Baseline Capture Report
status: completed
authority: baseline-evidence-report
based-on:
  - ./NEUEVAULT_VISUAL_BASELINE.md
  - ../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md
capture-date: 2026-07-25
captured-against: current-production
---

# Neuevault Visual Baseline Capture Report

## 1. Capture status

The current-production baseline capture is complete for every required route,
every required viewport, both required browsers, and every safely reproducible
public state.

The sanitized manifest records:

- 88 captured fixture records;
- 404 unique referenced evidence files;
- 7 explicitly deferred fixtures;
- 74 current-compatibility records;
- 6 operational-corroboration records;
- 3 safely simulated records;
- 2 known-defect records.

Evidence is stored under the ignored directory:

```text
.reference-audit/neuevault/baseline/
```

The authoritative evidence index is:

```text
.reference-audit/neuevault/baseline/manifest.json
```

No future-state screenshot was manufactured. Future design-system values in
this report are annotations from the approved specification, not rendered
production evidence.

## 2. Environment

| Property | Captured value |
|---|---|
| Canonical host | `https://www.pfseeker.com` |
| Pages source commit | `03afaad` |
| Pages deployment | `f70736c2-a7a9-466e-a6c3-75b450adfacc` |
| Capture date | 25 July 2026 |
| Operating system | Windows 11 Pro, Windows build `10.0.26200`, x64 |
| Chromium | `149.0.7827.55` |
| Firefox | `151.0` |
| Locale | `en-US` |
| Time zone | `Europe/Stockholm` |
| DPR | 1 |
| Browser state | clean temporary contexts; service workers blocked |
| Authentication | signed out |
| Motion | normal by default, with explicit reduced-motion fixtures |
| Input | mouse/keyboard by default, with explicit touch/no-hover fixtures |

No extensions, persisted cookies, persisted browser profiles, or private
authentication state were used. The manifest excludes cookies, OAuth state,
tokens, Discord identity, signed URLs, private responses, protected original
URLs, and Cloudinary credential values.

## 3. Routes captured

All required routes have real Chromium and Firefox evidence at 1440×1000,
except interaction-only variants that are intentionally Chromium-specific:

| Fixture | Route |
|---|---|
| Homepage | `/` |
| Recently Added | `/recent` |
| Icons | `/icons` |
| Banners | `/banners` |
| Animated | `/animated` |
| Wallpapers | `/wallpapers` |
| Search | `/search` |
| Search no results | `/search?q=__baseline_no_result__` |
| About | `/about` |
| Collections | `/collections` |
| Collection detail | `/collections/noface-icons` |
| Empty category | `/categories/ethereal` |
| Public asset | `/asset/nv-147/5668aab8202896db0fc468ea0dc6b7a3` |
| Restricted asset | `/asset/nv-166/b6df7c961256bcebc4b169c2ddbd96c5` |
| Not found | `/not-found-baseline` |

Additional route/state evidence covers mobile navigation, search filtering,
modal history, image failure, lazy loading, chunk failure, animated-media
lifecycle, load-more progression, and Copy-link toast behavior.

Representative evidence:

```text
home-default__1440x1000__chromium__rest.png
search-no-results__1440x1000__firefox__rest.png
asset-public__1440x1000__chromium__rest.png
asset-restricted__1440x1000__firefox__rest.png
not-found__1440x1000__chromium__rest.png
```

## 4. Viewports captured

The complete required matrix was captured in Chromium:

| Viewport | Role |
|---:|---|
| 320×812 | narrow mobile |
| 375×812 | common mobile |
| 520×900 | wide mobile |
| 700×900 | final mobile breakpoint pixel |
| 701×900 | first tablet pixel |
| 768×1024 | tablet portrait |
| 1024×900 | compact desktop/tablet |
| 1199×900 | final collapsed-navigation pixel |
| 1200×900 | first full desktop-navigation pixel |
| 1439×1000 | compact desktop navigation gap |
| 1440×1000 | standard desktop |
| 1600×1000 | large desktop |
| 1920×1080 | wide desktop/component maxima |

The mandatory 700/701, 1199/1200, and 1439/1440 pairs use the same homepage
route, data, browser, motion mode, and capture method. Every computed evidence
record includes document `scrollWidth` and `clientWidth` so horizontal
overflow can be checked without relying only on screenshots.

## 5. Navigation evidence

Captured navigation states include:

- desktop rest;
- every active route family;
- 1200 compact desktop;
- 1439 compact navigation gap;
- 1440 wide navigation gap;
- rolling hover and keyboard focus;
- 26 animation-frame samples for rolling entry;
- 26 animation-frame samples for rolling exit;
- normal and reduced motion;
- collapsed navigation;
- mobile menu open;
- route-change close;
- Escape dismissal attempt;
- outside-click dismissal attempt.

Rolling-label evidence records the two 40px text layers, pill opacity, entry,
exit, and exact settled transforms:

```text
motion-sequences__1440x1000__chromium__entry-exit.json
```

Route change closed the mobile menu as expected. Escape and outside click did
not close it; both are retained as known defects in section 14.

## 6. Typography evidence

The consolidated typography record covers all required roles in Chromium and
Firefox:

```text
typography-roles__1440x1000__chromium-firefox__current.json
```

For every role it records resolved family, size, weight, style, stretch, line
height, letter spacing, rendered bounds, line count, wrapping rectangles,
CSS Font Loading API status, and matching loaded font-face metadata.

Observed current compatibility families:

- wordmark: TBJ Neuetra;
- navigation and general UI: `Inter`-named system/fallback stack;
- hero eyebrow: Archivo with UI fallback;
- hero title, description, CTA, category count, and category title: Arimo with
  UI fallback.

Both browsers reported successful `document.fonts.check()` results for every
recorded primary family. Browser APIs do not expose exact per-glyph fallback
or synthetic-glyph use; that limitation is recorded rather than inferred.
SF Pro Rounded was not loaded or activated.

## 7. Category-card evidence

All four current category labels were captured at 320, 375, 520, 1199, 1200,
1440, and 1920 pixels. Evidence includes card/grid geometry, count/title
typography, current copy spacing, focus geometry, media opacity/transform,
touch, reduced motion, and frame-sampled entry/exit.

At 1440×1000 Chromium:

- grid width: 1416px;
- columns: four × 342px;
- grid gap: 16px;
- card size: 342×355.38px;
- card radius: 20px;
- card surface: `rgb(18, 18, 18)`;
- border: `1px solid rgb(38, 38, 38)`.

Current motion sampling records:

- rest media opacity `0`, scale `1`;
- hover/focus media opacity `1`, scale approximately `1.025`;
- exit returns to opacity `0`, scale `1`;
- touch exposes the current static image;
- reduced motion removes transitions and preserves usable content.

The current 1.025 scale remains compatibility evidence only.

Approved future target annotations:

- real 10px count/title gap;
- rest opacity `0`, scale `1.4`;
- hover/focus opacity `1`, scale `1`;
- touch/reduced-motion opacity `1`, scale `1`;
- one shared transforming media wrapper;
- static/animated crossfade inside that wrapper;
- source/timer/listener/observer cleanup;
- restricted originals never exposed.

No production category currently exposes an animated cover source, so the
animated-category-cover and category-specific delayed-unload fixtures are
deferred rather than fabricated.

## 8. Collection and asset-card evidence

Captured collection evidence includes rest, hover, focus, touch, reduced
motion, geometry, surface, image treatment, and copy. No current featured
collection exposes an animated cover source, so that state is deferred.

Captured asset evidence includes:

- static card;
- animated/GIF card activation;
- viewport exit and source unload;
- route cleanup;
- hover and focus;
- touch/no-hover;
- reduced motion;
- restricted badge/state;
- intercepted public-preview error;
- initial batch and next load-more batch;
- DOM order versus visual CSS-column positions.

The animated gallery lifecycle record confirms:

- the public animated source is assigned only while active;
- leaving the viewport removes the active class;
- the animated `src` is removed after the bounded unload period;
- navigating away leaves zero asset cards and zero assigned animated sources.

The ordering record confirms the current visual CSS-column sequence differs
from source DOM order. This is observation only; masonry was not changed.

## 9. Search and field evidence

Captured:

- empty search;
- populated `night` search;
- deterministic no-results query;
- Banners type filter;
- public access filter;
- supported category query filter;
- input focus;
- native select focus;
- mobile wrapping;
- current URL synchronization behavior.

Changing type/access filters did not change `/search`; this is recorded as the
current URL-synchronization limitation:

```text
search-url-state__1440x1000__chromium__filter-change.json
```

No production asset has an authored tag, so a populated tag-filter fixture is
deferred. Search behavior and URLs were not modified.

## 10. Modal and restricted-state evidence

Captured:

- public asset modal;
- first, middle, and last navigation-control states;
- desktop modal;
- mobile full-screen modal in Chromium and Firefox;
- origin focus;
- modal focus;
- close/Back restoration;
- Forward reopening;
- configured signed-out authentication dialog;
- restricted `nv-166` signed-out state.

The history fixture demonstrates:

- gallery card activation pushes a stable asset route;
- focus moves to Close viewer;
- Back closes the modal and restores focus to the originating asset card;
- Forward reopens the same modal and restores modal focus.

Signed-out restricted verification returned:

- HTTP `401`;
- `Cache-Control: no-store`;
- public preview wording;
- no protected-original URL pattern in rendered image sources.

No protected original, signed response, signed URL, Discord identity, session
cookie, or protected public ID was recorded.

## 11. Loading, empty, error, and toast evidence

Captured deterministic states:

- lazy Search route loading, with the chunk held by browser interception and
  then released successfully;
- image failure, by aborting one public preview request in the isolated
  browser context;
- search no results;
- empty category;
- 404;
- Copy-link success toast;
- chunk failure and one-reload recovery;
- load-more progression.

The safely simulated chunk failure made two failed requests: the initial
request and the single guarded reload request. The resulting retryable error
was captured, with no reload loop.

The current grid inserts batches synchronously and never exposes its
`grid-progress` element. A distinct visible grid-spinner state is therefore
deferred; actual load-more progression is captured instead.

## 12. Accessibility evidence

Representative evidence records:

- landmark names and order;
- heading hierarchy;
- control names, roles, current/expanded/live states;
- keyboard focus sequence;
- visible focus outline/box-shadow geometry;
- rolling duplicate suppression;
- touch target bounds;
- modal labelling and focus containment/restoration;
- mobile-menu state;
- search labels and native controls;
- live regions;
- image alt/decorative handling;
- restricted-content wording;
- DOM versus visual masonry order;
- reduced-motion substitutions.

The consolidated accessibility file is:

```text
accessibility-baseline__1440x1000__chromium__representative.json
```

This is an engineering baseline, not a formal accessibility or legal
conformance certification. The mobile-menu Escape and outside-click results
remain explicit defects rather than accepted target behavior.

## 13. Motion and reduced-motion evidence

Motion evidence combines endpoint screenshots, computed transitions, and
bounded `requestAnimationFrame` sampling:

- rolling labels: 26 entry and 26 exit samples;
- navigation pill opacity;
- current category reveal: 26 entry and 26 exit samples;
- collection lift;
- asset scale/saturation;
- animated gallery activation/unload;
- modal/dialog state;
- spinner contract;
- toast contract;
- Lenis normal/reduced behavior.

Normal motion showed Lenis active. Reduced motion showed no Lenis class,
native `scroll-behavior: auto`, and a paused hero video. Reduced-motion
screenshots preserve content while removing nonessential transitions.

Key files:

```text
motion-sequences__1440x1000__chromium__entry-exit.json
motion-contracts__1440x1000__chromium__computed.json
animated-lifecycle__1440x1000__chromium__activation-unload-cleanup.json
```

## 14. Known defects

1. **Mobile-menu Escape dismissal:** pressing Escape leaves the menu open.
   Evidence:
   `mobile-menu-escape__375x812__chromium__escape-failure.*`
2. **Mobile-menu outside-click dismissal:** clicking outside the open panel
   leaves it open. This is an additional observed discrepancy relative to the
   active baseline plan. Evidence:
   `mobile-menu-outside__375x812__chromium__outside-click-failure.*`

Other retained current limitations:

- search filter changes do not synchronize the URL;
- CSS-column visual order differs from DOM order;
- all four configured public category rules currently match zero assets;
- empty-category copy references the local content manager.

None were fixed or normalized during capture.

## 15. Deferred fixtures

| Fixture | Reason |
|---|---|
| Animated category cover | No current production category cover exposes an animated source |
| Animated collection cover | No current featured collection cover exposes an animated source |
| Populated tag filter | Current production asset records contain no authored tags |
| Visible grid batch spinner | Current batch insertion is synchronous and never exposes the progress element |
| Authentication unavailable | No authorized protected test harness was available |
| Authentication/download error | No authorized protected test harness was available |
| Signed-in protected state | Avoided private identity, cookies, signed URLs, and protected responses |

These are recorded as `deferred` in the manifest and are not counted as
captured.

## 16. Console and network summary

Across the final manifest:

- ordinary production fixtures produced no console warnings or errors;
- 3 console errors belong only to the intentionally aborted chunk-failure
  simulation;
- 21 failed requests were intentional animated-media unload/navigation
  aborts;
- 2 failed requests were the isolated chunk-failure simulation;
- 1 failed public preview request was the isolated image-error simulation;
- no unexpected first-party failure remained in ordinary fixtures.

Expected aborts and safely simulated failures are separated from operational
failures in the relevant network summaries.

The evidence privacy scan found no credential assignment, Discord/session
secret, access/refresh token, cookie/authorization value, OAuth query value,
unredacted Cloudinary account identifier, signed URL, or protected original.

## 17. Evidence manifest

Manifest:

```text
.reference-audit/neuevault/baseline/manifest.json
```

Naming:

```text
<fixture-id>__<viewport>__<browser>__<state>.<ext>
```

The manifest contains every required metadata field:

```text
fixture_id
route
final_url
browser
browser_version
os
viewport
dpr
state
motion_mode
input_mode
auth_mode
deployment
timestamp
title
http_status
fonts
console_summary
network_summary
evidence_files
classification
notes
```

All 404 referenced evidence files exist and all JSON evidence parses. The
evidence directory is covered by the existing `.reference-audit/` ignore
rule. Evidence binaries are not committed.

## 18. Baseline acceptance checklist

| Check | Result | Notes |
|---|---|---|
| Route fixture matrix | **Passed** | all required routes captured in both browsers |
| Viewport matrix | **Passed** | all 13 required sizes captured |
| Breakpoint pairs | **Passed** | 700/701, 1199/1200, 1439/1440 |
| Category states | **Deferred** | all available states captured; animated-cover state unavailable |
| Typography computed styles | **Passed** | all 18 roles in Chromium and Firefox |
| Navigation states | **Passed** | required states captured; two failures labelled as defects |
| Modal history | **Passed** | push, Back close, focus restoration, Forward reopen |
| Restricted state | **Passed** | signed-out 401/no-store and no exposed original |
| No secrets | **Passed** | sanitized manifest/evidence scan passed |
| Reduced motion | **Passed** | navigation, category, asset, hero, Lenis evidence |
| Touch/no-hover | **Passed** | category, collection, asset, and navigation evidence |
| Known defects labelled | **Passed** | Escape and outside-click failures explicit |
| Ignored evidence path | **Passed** | existing `.reference-audit/` ignore rule |
| Manifest complete | **Passed** | 88 records, 404 existing references, no invalid JSON |
| No production modification | **Passed** | documentation report and ignored evidence only |

Capture quality-gate failures: none.

Observed behavior failures retained in the baseline: mobile-menu Escape and
outside-click dismissal.
