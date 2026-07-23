---
title: Neuevault Visual Baseline
status: active
authority: baseline
based-on:
  - ../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md
  - ../audits/neuevault/NEUEVAULT_UI_INVENTORY.md
captured-against: current-production
baseline-date: 2026-07-24
---

# Neuevault Visual Baseline

## 1. Purpose and authority

This document defines the deterministic fixture and evidence set used to compare Neuevault before, during, and after design-system migration. It is an evidence contract, not a screenshot archive.

Current repository source and verified production behavior remain authoritative for existing behavior. The approved design-system specification defines the future target. Every migration phase compares:

1. current compatibility behavior, to detect unintended regressions;
2. the approved future target, to confirm intended progress;
3. documented exceptions and known defects, to avoid treating screenshot similarity as correctness.

The baseline does not authorize preserving defects. Known defects remain labelled and must be classified as fixed, deferred, or unchanged during comparison. Baseline evidence does not authorize production changes.

## 2. Baseline environment

### Canonical environment

| Property | Required value |
|---|---|
| Canonical host | `https://www.pfseeker.com` |
| Browsers | current project Playwright Chromium and Firefox |
| Profile | clean temporary browser context; no persisted cache, cookies, extensions, or service-worker state unless the fixture requires warm cache |
| Operating system | record exact OS edition/build and architecture |
| DPR | 1 where controllable; record actual value |
| Locale/time zone | `en-US` locale and `Europe/Stockholm`, unless testing locale sensitivity |
| Color scheme | current production default dark presentation |
| Motion | normal by default; explicit `prefers-reduced-motion: reduce` fixture |
| Input | desktop hover/pointer by default; explicit touch/no-hover fixture |
| Authentication | signed out for committed/public evidence |
| Private states | protected local/test fixture only; never public evidence |

Each capture manifest records:

- browser name and full version;
- operating system and architecture;
- viewport width/height and device pixel ratio;
- date/time and production deployment/source commit when available;
- canonical route, final URL, route state, and fixture ID;
- color scheme, motion, hover/pointer, and authentication mode;
- document title and HTTP status;
- loaded font faces and fallback status;
- console errors/warnings and failed/aborted requests;
- evidence filenames and capture tool version.

Real secrets, OAuth state, tokens, cookies, Discord identity, signed URLs, restricted public IDs, and private download responses must never enter evidence. Signed-in states use redacted protected fixtures only.

## 3. Route fixture matrix

| Fixture ID | Route/state | Required content | Interaction | Notes |
|---|---|---|---|---|
| `home-default` | `/` | header, hero, four categories, featured collections, recent assets, footer | settled rest | canonical homepage |
| `recent-grid` | `/recent` | route heading, initial grid, load-more progression | scroll to next batch | preserve item/order context |
| `type-icons` | `/icons` | selected Icons type and results | filter focus | dedicated clean route |
| `type-banners` | `/banners` | selected Banners type and results | rest | dedicated clean route |
| `type-animated` | `/animated` | public animated results | viewport enter/leave | distinguish intentional request aborts |
| `type-wallpapers` | `/wallpapers` | selected Wallpapers type and results | rest | dedicated clean route |
| `search-empty` | `/search` | empty query, filters, initial results | field focus | lazy route |
| `search-no-results` | `/search?q=__baseline_no_result__` | deterministic no-results state | settled | no production mutation |
| `about` | `/about` | route heading and body | rest/focus links | prose fixture |
| `collections-index` | `/collections` | public collection cards | hover/focus | full index |
| `collection-detail` | `/collections/noface-icons` | valid cover, tags, count, sort, grid | select focus/change without persistence | representative 25-asset collection |
| `category-empty` | `/categories/ethereal` | title, count zero, current empty copy | rest | known data/editorial state |
| `asset-public` | `/asset/nv-147/5668aab8202896db0fc468ea0dc6b7a3` | public asset modal over Icons context | close, Back, Forward | stable ID is identity |
| `asset-restricted-out` | `/asset/nv-166/b6df7c961256bcebc4b169c2ddbd96c5` | public preview, restricted copy/action | signed out only | public manifest must retain `src:null` |
| `not-found` | `/not-found-baseline` | 404 composition | back/home focus | SPA response may be HTTP 200 |
| `mobile-menu-open` | `/` at mobile width | toggle expanded, menu/actions visible | open, outside click, route click | record missing Escape behavior |
| `image-error` | representative asset/card | explicit “Preview unavailable” state | browser harness aborts one public preview request | never alter production asset |
| `lazy-route-loading` | `/search` | persistent shell and delayed route status | throttle/hold Search chunk in browser harness | bounded deterministic release |
| `chunk-error` | `/search` | one safe reload then retryable error | browser harness fails lazy chunk and guards reload | optional; capture only without changing production |
| `auth-unavailable` | restricted action | honest unavailable state | protected local/test harness only | omit if not safely reproducible |

Public route captures use the canonical host. The deployment-specific Pages host may be recorded as operational corroboration but is not the visual canonical source.

## 4. Viewport matrix

| ID | Viewport | Role | Mandatory observations |
|---|---:|---|---|
| `vp-320` | 320×812 | narrow mobile | minimum support, two-column cards, modal/menu |
| `vp-375` | 375×812 | common mobile | typography wrapping and touch targets |
| `vp-520` | 520×900 | wide mobile | category label scaling and controls |
| `vp-700` | 700×900 | last mobile breakpoint pixel | mobile radii/layout |
| `vp-701` | 701×900 | first tablet pixel | paired boundary with 700 |
| `vp-768` | 768×1024 | tablet portrait | full hero type and compact navigation |
| `vp-1024` | 1024×900 | tablet/compact desktop | two-column categories, three collection columns |
| `vp-1199` | 1199×900 | last collapsed-nav pixel | paired category/nav boundary |
| `vp-1200` | 1200×900 | first desktop pixel | full nav and four categories |
| `vp-1439` | 1439×1000 | compact desktop gap | paired nav-gap boundary |
| `vp-1440` | 1440×1000 | standard desktop | primary desktop comparison |
| `vp-1600` | 1600×1000 | large desktop | container margins/maxima |
| `vp-1920` | 1920×1080 | wide desktop | 1890/1888 component maxima |

Every route/viewport check records:

- document and principal component `scrollWidth <= clientWidth`;
- no clipped interactive label, control, focus ring, or modal action;
- expected heading/card wrapping;
- expected navigation mode and action visibility;
- expected category/asset/collection columns;
- valid modal geometry and nested scrolling;
- minimum touch targets where applicable.

Full screenshot coverage may use a risk-based route subset at every width, but 700/701, 1199/1200, and 1439/1440 must always be captured as pairs using identical route/state/data.

## 5. Interaction-state matrix

| Component/family | Rest | Hover | Focus-visible | Active/pressed | Disabled/loading/error | Touch/no-hover | Reduced motion |
|---|---:|---:|---:|---:|---:|---:|---:|
| NavLink | ✓ | ✓ | ✓ | active route ✓ | session action where applicable | ✓ | ✓ |
| Button/RollingLabel | ✓ | ✓ | ✓ | ✓ | implemented examples only | ✓ | ✓ |
| Mobile menu | closed/open | n/a | toggle/links | route action | n/a | ✓ | ✓ |
| CategoryCard | ✓ | ✓ | ✓ | link navigation | image error if safe | ✓ | ✓ |
| CollectionCard | ✓ | ✓ | ✓ | link navigation | image error if safe | ✓ | ✓ |
| AssetCard | ✓ | ✓ | ✓ | modal open | restricted/error/loading | ✓ | ✓ |
| Field/filter/select | ✓ | n/a | ✓ | selected/value | no-results where applicable | ✓ | ✓ |
| Modal | closed/open | controls | trap/control focus | previous/next/download | restricted/error/loading | mobile full-screen | ✓ |
| Toast/state UI | hidden/visible | n/a | action if any | n/a | success/error/loading | ✓ | ✓ |

Not every state is forced on every component. A fixture must be semantically valid, safely reproducible, and mapped to an implemented or approved state.

## 6. Typography fixtures

| Role | Fixture selector/context | Current baseline expectation | Future target |
|---|---|---|---|
| Wordmark | header/footer brand | TBJ Neuetra | TBJ Neuetra unchanged |
| Navigation | desktop and mobile nav | current UI fallback stack | SF Pro Rounded 500 |
| Hero eyebrow | homepage | Archivo | SF Pro Rounded 500 |
| Hero title | homepage semantic line spans | Arimo | SF Pro Rounded 700 |
| Hero description | three semantic line groups | Arimo | SF Pro Rounded 500 |
| Button | Sign in, Collections, hero CTA | current UI/Arimo roles | SF Pro Rounded 600/700 |
| Route H1 | About/Recent | current UI family | SF Pro Rounded 600 |
| Section H2 | homepage sections | current UI family | SF Pro Rounded 600 |
| Body | About/state copy | current fallback stack | SF Pro Rounded 400 |
| Category count | all four categories | Arimo 621 current metrics | SF Pro Rounded 400 |
| Category title | all four categories | Arimo 621 current metrics | SF Pro Rounded 500 |
| Collection title | collection card | current UI family | SF Pro Rounded 600 |
| Asset metadata | card/modal | current UI family | SF Pro Rounded 400 |
| Field | Search/select | current UI family | SF Pro Rounded 400 |
| Modal title | public/restricted modal | current UI family | SF Pro Rounded 600 |
| Badge | GIF/restricted | current UI family | SF Pro Rounded 600 |
| Empty heading | empty category/no-results | current UI family | SF Pro Rounded 600 |
| Footer | copy and links | current UI + TBJ brand | SF Pro Rounded + TBJ brand |

For every role record computed:

- full resolved `font-family`;
- actual loaded face from the browser font API/network;
- font size, weight, style, stretch, line height, and letter spacing;
- rendered bounding box and line count;
- exact wrapping endpoints for semantic hero spans;
- whether fallback/synthetic weight was used;
- font request status/content type and parser/console warnings.

Current captures must not activate SF Pro Rounded. Future migration captures compare the approved SF Pro target to these compatibility measurements.

## 7. Navigation fixtures

Required fixture groups:

1. Desktop rest at 1200, 1439, 1440, and 1920.
2. Active route for Recent, Icons, Banners, Animated, Wallpapers, Search, About, and Collections/detail.
3. Rolling hover frame sequence: before entry, 10ms intent boundary, mid-roll, settled, immediate exit, 50/150/290ms exit, rest.
4. Keyboard focus with zero entry delay and visible focus ring.
5. Compact desktop 21px gap versus wide 38px gap.
6. Collapsed header at 320, 700, 701, and 1199.
7. Mobile menu open, outside-click close, and route-change close.
8. **Known defect:** Escape currently does not close the mobile menu. Record the failed expected behavior; do not normalize or fix it in baseline work.
9. Reduced-motion primary layers and immediate pill.
10. Signed-out “Sign in” plus Collections state.
11. Signed-in account state only in a protected/redacted fixture; otherwise mark deferred.

Record header height, brand geometry, link/control boxes, gaps, active pill, `aria-current`, toggle name/expanded state, focus order, body scroll behavior, and singular accessibility names.

## 8. Category-card fixtures

Capture all four real category labels at 320, 375, 520, 1199, 1200, 1440, and 1920. Use the same category order and generated counts in every comparable capture.

### Current compatibility evidence

- rest state and computed media opacity/transform;
- hover state;
- keyboard focus state and focus ring;
- touch/no-hover state;
- reduced-motion state;
- static category cover;
- animated category cover load/crossfade where available;
- pointer/focus exit and delayed unload;
- offscreen/route cleanup;
- card, copy, media, and text bounding boxes;
- current copy gap and typography;
- border, radius, ratio, columns, and grid gap.

### Approved future annotations

Every comparison manifest annotates the target separately from the current screenshot:

- real count/title gap: 10px;
- desktop rest: media-wrapper opacity 0, scale 1.4;
- hover/focus: media-wrapper opacity 1, scale 1;
- touch and reduced motion: visible at opacity 1, scale 1;
- transform belongs to one shared wrapper;
- static/animated layers crossfade inside that wrapper;
- restricted media never receives a protected original;
- listeners, observers, sources, and timers clean up;
- exact transform duration/easing remain implementation calibration.

Current production must not be altered to manufacture future-target screenshots. The current 1.025 implementation is compatibility/rollback evidence only, never the target.

## 9. Collection and asset-card fixtures

### CollectionCard

- standard static collection: `/collections/noface-icons`;
- animated collection where a current public playback cover exists;
- rest, hover, focus, touch, reduced motion, and image error;
- title/count/description wrapping and featured/status metadata;
- current shell lift, media scale, border, radius, and focus ring;
- one-column mobile and three-column tablet/desktop geometry;
- animated source load/unload and cleanup.

### AssetCard and grid

- static JPEG/PNG representative;
- public GIF/animated representative;
- restricted `nv-166`;
- safely simulated malformed/error media;
- rest, hover, focus, touch, reduced motion;
- viewport enter/leave and playback unload;
- initial eight items and next load-more/infinite batch;
- format/restricted badges and metadata overlay;
- current scale, saturation, opacity, and transition values;
- DOM/focus order compared with visual CSS-column order.

CSS-column masonry is a documented future decision. The baseline records its current order; it does not approve the layout indefinitely.

## 10. Search and field fixtures

Required:

- empty `/search`;
- populated query with stable result;
- dedicated type route and selected type filter;
- tag/category/access filter where current data exposes the state;
- no-results query;
- search input and native select focus-visible;
- control wrapping at 320, 375, 520, 700, 701, and 1200;
- collection sort select;
- Back/Forward/direct-load behavior.

Record label association, placeholder, value, height, padding, radius, border, computed typography, selected state, result count, live-region behavior, and focus ring.

Known limitation: initial URL parameters seed state, but subsequent filter changes are not fully synchronized to the URL. Record it without implementing synchronization.

## 11. Modal and restricted-state fixtures

| Fixture | Required evidence |
|---|---|
| Public asset modal | final/detail URL, background route, origin focus, modal focus, preview/info geometry, action labels |
| First/middle/last | previous/next enabled state and accessible names |
| Close | focus restoration and unchanged underlying scroll |
| Back/Forward | Back closes; Forward reopens; URL and scroll recorded |
| Desktop | 1180px/max-height behavior and native info scroll |
| Mobile | full-screen stack, media height, info/actions, no overflow |
| `nv-166` signed out | public preview, restricted wording, protected action, public manifest `src:null`, no original URL |
| Auth configured | sign-in dialog semantics, action, close/focus |
| Auth unavailable | protected local/test simulation only |
| Signed in | deferred unless a protected, redacted fixture is safely available |

Never call or record a protected original URL as public evidence. Do not store signed responses, cookies, OAuth parameters, account identity, or short-lived delivery URLs.

## 12. Loading, empty, error, and toast fixtures

| State | Deterministic trigger | Record |
|---|---|---|
| Lazy route loading | hold Search chunk in browser harness, then release | shell persistence, delayed status, `aria-busy/live` |
| Grid batch loading | scroll sentinel under controlled response timing | spinner/text, batch size, no duplicate cards |
| Image failure | abort one selected preview request | preserved geometry and unavailable copy |
| Search no results | impossible query string | title/body, live-region/result semantics |
| Empty category | `/categories/ethereal` | count zero and current implementation-facing copy |
| 404 | unknown route | heading/body/back action |
| Auth/download error | protected local/test stub only | inline status/toast, retry semantics, no secret |
| Toast success | deterministic Copy link where clipboard can be controlled | role, text, duration, motion |
| Chunk failure | fail lazy chunk in isolated browser context | one-reload guard and retryable error; no loop |

Record semantic roles, heading hierarchy, action, recovery, timing, focus behavior, and reduced-motion presentation.

## 13. Footer fixtures

- desktop at 1440 and 1920;
- mobile stack at 320 and 375;
- tablet at 768;
- keyboard focus-visible on every link;
- long-page position after natural scroll and direct route render;
- route consistency on home, search, collection detail, modal background, empty, and 404.

Record container width/gutter, spacing, brand reuse, link groups/order, typography, focus ring, and horizontal overflow.

## 14. Accessibility baseline

Each representative route records:

- landmark names/order;
- heading hierarchy and one route H1;
- link/button/field accessible names and roles;
- rolling duplicate suppression;
- keyboard focus order and visible focus geometry;
- category hover/focus parity;
- touch target boxes;
- mobile menu label, expanded state, panel relationships, and dismissal methods;
- modal label, focus containment, Escape, close restoration, and background inert/scroll behavior;
- reduced-motion content parity;
- field labels/descriptions/errors;
- live-region announcements;
- informative/decorative image alt policy;
- restricted-content wording and absence of exposed original;
- DOM order versus visual masonry order.

**Known defect:** the mobile menu does not currently close with Escape. Baseline evidence must label this as a required remediation from the approved specification, not acceptable target behavior.

This is an engineering baseline, not a formal accessibility conformance certification. Contrast must still be measured during implementation against representative media frames.

## 15. Motion and reduced-motion baseline

| Motion | Current measurement method | Reduced-motion fixture |
|---|---|---|
| Rolling labels | computed transforms plus frame samples at entry/exit | one primary layer, no transform |
| Nav pill | computed opacity/transition at 0/75/150ms | immediate state |
| Category current reveal | wrapper/layer opacity and transform frame samples | visible static media |
| Collection lift | card/media transform before/after hover/focus | no lift/scale |
| Asset media | scale/saturation/overlay plus viewport observer | static preview |
| Animated covers/GIF | request/source/visibility timeline and unload | no animated source |
| Modal/dialog | backdrop/panel transition and focus timing | immediate stable panel |
| Grid spinner | animation name/duration | static/nonessential indicator |
| Toast | transform/opacity/lifetime | immediate/static change |
| Lenis | scroll position/time and keyboard/native behavior | native scrolling, no Lenis smoothing |

Frame sampling uses state conditions and animation-frame timestamps rather than subjective observation or arbitrary long sleeps. Intentional aborted animated-media requests caused by unload/navigation are classified separately from true failures.

The future category target is documented in section 8; current motion evidence must not be relabelled as that target.

## 16. Network and media determinism

- Use static poster/preview frames for pixel comparisons.
- Test video/GIF/cover lifecycle separately from static screenshots.
- Wait for `document.fonts.ready` and verify intended loaded faces before typography capture.
- Wait on bounded DOM/network/state conditions; do not use unbounded or arbitrary sleeps.
- Record cold/warm cache mode and response failures.
- Intercept only within the isolated browser context; never mutate production or Cloudinary.
- Redact private/auth material at capture time, not after committing evidence.
- Never cache, download into evidence, or expose a protected original.
- Record console warnings/errors and failed requests with URL query/private data removed.
- Classify `ERR_ABORTED` from deliberate source unload/navigation separately.
- Freeze or mask video/media pixels when comparing layout geometry.
- Use the same generated-data deployment for paired viewport/state comparisons.

## 17. Evidence naming and storage

All local evidence lives under the existing ignored path:

```text
.reference-audit/neuevault/baseline/
```

Naming:

```text
<fixture-id>__<viewport>__<browser>__<state>.<ext>
```

Examples:

```text
home-categories__1440x1000__chromium__rest.png
home-category-1__1440x1000__chromium__hover.png
asset-nv-166__375x812__chromium__restricted-signed-out.png
```

Permitted ignored evidence:

- PNG screenshots;
- JSON computed-style/geometry manifests;
- accessibility-tree summaries;
- sanitized network summaries;
- minimal DOM snippets without private data;
- measurement/comparison tables.

Each capture batch includes a sanitized `manifest.json` linking evidence to route, state, browser, viewport, source deployment, and expected classification. Evidence binaries, browser profiles/caches, fonts, source bundles, private responses, and credentials are never committed.

## 18. Comparison rules

Every observed difference is classified as:

- **expected target change** — directly required by the approved specification;
- **compatibility-preserving change** — implementation changed without intended user-visible/semantic delta;
- **regression** — violates current compatibility or approved target without exception;
- **known defect fixed** — intentionally removes a documented current defect;
- **approved exception** — recorded through the specification exceptions policy;
- **nondeterministic media difference** — only moving/remote pixels differ;
- **unresolved** — requires owner decision/evidence.

### Tolerances

| Domain | Default tolerance | Escalation rule |
|---|---|---|
| Container/control geometry | 1 CSS px | zero tolerance at 700/701, 1199/1200, 1439/1440 mode switches |
| Typography box/wrap | 1 CSS px when same face; wrap endpoints exact | font migration uses approved target annotations and manual review |
| Color | exact semantic token value; minor raster antialiasing ignored | contrast and state identity cannot rely on screenshot delta alone |
| Media frame | frame geometry/object position exact within 1px | moving pixels masked; crop changes require approval |
| Animation | state endpoints exact; timing within 16.7ms/frame or documented calibration | no blank frame, missing focus parity, or hidden reduced state tolerated |
| Accessibility semantics | zero unintended role/name/state difference | screenshot similarity cannot override AX regression |

A visual match is insufficient when semantics, keyboard behavior, touch behavior, restricted-media safety, history, or cleanup differ.

## 19. Baseline acceptance checklist

The following checklist is completed for each evidence capture batch. The document defines every requirement but does not falsely claim that all future screenshots have already been captured.

- [ ] Route fixture matrix captured.
- [ ] Viewport matrix captured.
- [ ] 700/701, 1199/1200, and 1439/1440 boundary pairs captured.
- [ ] Category rest, hover, focus, touch, reduced-motion, animated/static, and unload states captured.
- [ ] Typography computed styles, faces, boxes, and wrapping recorded.
- [ ] Desktop/mobile navigation, active, rolling, menu, and dismissal states captured.
- [ ] Modal push/Back/Forward, focus, scroll, and responsive geometry captured.
- [ ] Restricted `nv-166` signed-out state verified without original exposure.
- [ ] No secrets, identities, cookies, tokens, signed URLs, or protected originals in evidence.
- [ ] Reduced-motion substitutions captured.
- [ ] Touch/no-hover behavior captured.
- [ ] Known defects labelled and not normalized.
- [ ] Evidence path confirmed ignored.
- [ ] No production code or production resource changed.
- [ ] Baseline manifest names browser, OS, viewport, DPR, deployment, route, and state.
- [ ] Baseline document committed.
