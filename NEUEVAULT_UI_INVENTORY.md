# Neuevault UI inventory

## 1. Scope and methodology

This document is a read-only inventory of Neuevault's public UI and its implementation as observed on 23 July 2026. It is a map of the current product before any design-system migration, SF Pro Rounded rollout, icon replacement, component consolidation, category-card rebuild, or route-level polish.

The repository and rendered Neuevault application are authoritative. `GRAINIENT_REFERENCE.md` is used only for the comparison in section 24. No Grainient asset, font, source, or inaccessible behavior is treated as a Neuevault requirement.

Methods used:

- repository search, import tracing, generated-data inspection, CSS/token analysis, and Pages Function inspection;
- Vite source/build architecture inspection without changing or rebuilding production code;
- Playwright against `https://www.pfseeker.com` in Chromium and Firefox;
- DOM, computed-style, accessibility-tree, network, Resource Timing, keyboard, pointer, touch, and reduced-motion inspection;
- route and state sampling at 320, 375, 520, 768, 800, 1024, 1100, 1199, 1200, 1280, 1366, 1440, 1600, and 1920 CSS pixels;
- safe signed-out inspection of restricted asset `nv-166`; authentication and protected delivery were not bypassed.

Repeated catalog items were sampled by component family. Evidence is stored under the ignored `.reference-audit/neuevault/` directory and is not a product asset or committed output.

The inventory covers 21 component families, 16 control families, and 12 distinct icon-like implementations. Counts describe implementation families, not every repeated DOM instance.

## 2. Confidence and evidence legend

- **Confirmed** — directly observed in source, rendered DOM, computed style, accessibility tree, response metadata, or reproducible browser behavior.
- **High confidence** — corroborated by more than one source or browser, but not fully isolated in every state.
- **Inferred** — a reasonable system interpretation from repeated evidence; not an asserted exact design token or product intent.
- **Unknown** — unavailable without private state, not safely triggerable, or not conclusively observable.

Evidence precedence follows the task specification:

1. rendered behavior for user-visible output;
2. source code for implementation structure;
3. computed style for resolved CSS;
4. source files over generated build output.

Measurements in this document identify route, viewport, browser, state, source, and selector where that context changes the conclusion. Performance numbers are single-run lab observations, not field Core Web Vitals. Accessibility observations are not a legal conformance certification.

## 3. Repository and UI architecture

Neuevault is a framework-free Vite 7 application built from native ES modules. `index.html` provides the persistent header, main mount point, overlay roots, and footer. `app.js` initializes the native History API router, authentication client, Lenis, shared navigation, route rendering, and lazy overlays. Route templates are string-rendered and then enhanced with scoped event bindings and cleanup functions.

The public data layer normalizes generated JSON from `src/generated/`. The current generated archive has 234 asset records, four categories, and four collections. Search and gallery routes operate over the complete browser-side asset repository. Search, the asset modal, and the auth dialog are lazy modules; core homepage, route shell, gallery card, and repository logic are initial dependencies.

Cloudflare Pages Functions implement OAuth/session endpoints and protected downloads. They affect visible signed-in, signed-out, configured, restricted, and failure states but do not render the primary page shell.

### Architecture map

| UI area | Source file(s) | Imported by | Routes/states | Shared or local | Notes |
|---|---|---|---|---|---|
| Document shell | `index.html`, `styles.css` | browser entry | all routes | shared | Persistent header, `main#app`, overlay roots, footer |
| Application coordinator | `app.js` | `index.html` | all routes | shared | Router, auth, Lenis, modal/dialog loaders, shell events |
| Route matcher/history | `src/routing/routes.js` | `app.js` | all clean routes, legacy hashes, asset history | shared | Native History API; no second router |
| Core page renderer | `src/pages/pages.js` | `app.js` | home, recent, collections, collection/category detail, about, 404 | mixed | Returns route-specific cleanup where needed |
| Search/type renderer | `src/pages/searchPage.js` | lazy import from `app.js` | search, icons, banners, animated, wallpapers | route-local lazy | Full-client filtering and 180ms debounce |
| Repository | `src/repository/data.js` and generated JSON | pages, cards, overlays, router | all content routes | shared | Restricted records normalized safely; development schema validation is dynamic |
| Asset grid | `src/components/AssetGrid.js` | pages/search | galleries and detail routes | shared | Batched masonry, sentinel observer, animated playback |
| Cards | `src/components/cards.js` | pages | home categories/collections | shared by family | Animated cover activation and cleanup |
| Rolling controls | `src/components/rollingControls.js` | `app.js`, route render lifecycle | nav, buttons, links | shared | Duplicated visual layers hidden from accessibility APIs |
| Images/fallback | `src/components/images.js` | pages, cards, overlays | all media states | shared | Adds failure class and “Preview unavailable” |
| Asset modal | `src/overlays/AssetModal.js` | lazy import from `app.js` | asset routes/modal state | shared lazy feature | URL/history, focus, scroll lock, downloads |
| Auth dialog | `src/overlays/AuthDialog.js` | lazy import from `app.js` | restricted action/auth states | shared lazy feature | Signed-out, signed-in, unavailable branches |
| Dialog utility | `src/overlays/dialog.js` | both dialogs | overlay states | shared | Focus containment and lifecycle helpers |
| Auth client | `src/auth/AuthClient.js` | `app.js`, overlays | header/session/download states | shared | Session request, guarded sign-in, logout |
| Smooth scrolling | `src/scroll/lenis.js` | `app.js` | all public routes except reduced-motion enhancement | shared | Single Lenis instance; modal stop/start |
| Pages auth functions | `functions/api/auth/**` | HTTP requests | OAuth, callback, session, logout | server-local | Canonical `www` authentication |
| Protected download | `functions/api/download/[assetId].js` | modal action | restricted originals | server-local | Private authenticated response; no public original URL |
| UI tokens/styles | `styles.css` | `index.html` | all routes/states | shared with route sections | One stylesheet; 208 root custom properties |
| Generated data | `src/generated/assets.json`, categories/collections JSON | repository | all catalog UI | generated | 234 assets; safe public fields only |
| Static UI assets | `public/assets/**`, `public/fonts/**` | CSS/HTML | brand, controls, hero, media | shared | Three production font files and four reusable SVG assets |

### Component inventory

| Component family | Source file(s) | Routes | Variants | Shared/local | Known inconsistencies |
|---|---|---|---|---|---|
| Page shell | `index.html`, `app.js`, `styles.css` | all | standard, modal-locked | shared | String-rendered routes rely on lifecycle cleanup discipline |
| Header/brand | `index.html`, `styles.css` | all | desktop, collapsed | shared | Desktop/mobile controls coexist in DOM |
| Navigation | `index.html`, `app.js`, rolling controls | all | desktop, mobile, active, hover/focus | shared | Mobile Escape close is absent |
| Hero | `pages.js`, `styles.css` | home | video, poster/reduced motion | local | Large media transfer; deliberate line-group markup |
| Route heading | `pages.js`, `searchPage.js` | non-home routes | page title, route hero | shared pattern, duplicated markup | Back links contain Unicode arrow |
| Button foundation | markup across files, `styles.css` | all | accent, light, dark, sizes, full | shared CSS | Some controls obtain rolling structure by runtime enhancement |
| Rolling label | `rollingControls.js`, `styles.css` | nav and selected controls | text-only, icon+text | shared | Duplicated visual DOM is intentional complexity |
| Category grid/card | `cards.js`, `styles.css` | home | static, animated, touch, focus | family-local | Source categories currently all resolve to zero assets |
| Collection grid/card | `cards.js`, `styles.css` | home, collections index | standard, featured, animated cover | family-local | Homepage intentionally shows only three of four featured records |
| Asset grid/card | `AssetGrid.js`, `styles.css` | recent, type, search, category/collection detail | static, GIF, restricted, malformed/error | shared | Full repository in browser; masonry item heights vary |
| Search/filter toolbar | `searchPage.js`, `styles.css` | search/type routes | query, type, tag, category, access | route-local | Filter changes after load are not written back to URL |
| Collection toolbar | `pages.js`, `styles.css` | collection detail | sort select | local | Similar field styling, separate behavior |
| Asset modal | `AssetModal.js`, `dialog.js`, `styles.css` | modal/detail | public, restricted signed-out/in | shared lazy | Unicode close/nav/download/share symbols |
| Auth dialog | `AuthDialog.js`, `dialog.js`, `styles.css` | restricted/auth prompts | configured, unavailable, authenticated | shared lazy | Close symbol duplicated with modal |
| Badges/pills/tags | asset/card/page markup, `styles.css` | galleries/details | GIF, lock, tag, restricted note | shared visual family | Implemented through separate selectors rather than one semantic primitive |
| Empty state | `pages.js`, `searchPage.js`, `styles.css` | empty category/collection/search | authored empty, no results | repeated local markup | Copy and hierarchy vary |
| Image failure | `images.js`, `styles.css` | all media | static, card, modal | shared | Text fallback is injected via CSS/markup state |
| Loading/progress | `AssetGrid.js`, `app.js`, styles | lazy routes, grid batches | delayed route state, spinner | mixed | No unified loading-state component |
| Toast/status | `app.js`, styles | share/download/auth feedback | success/error text | shared local root | Visually and semantically separate from inline errors |
| Footer | `index.html`, `styles.css` | all | desktop grid, mobile stack | shared | Uses repeated route links outside main active-nav logic |
| Management/content UI | separate local tooling source | local-only | authored forms/pickers | out of public runtime | Found in repository but intentionally outside public inventory behavior |

## 4. Route and state inventory

### Canonical route table

| Route/state | Source | Layout shell | Major components | Responsive status | Known issues |
|---|---|---|---|---|---|
| `/` | `pages.js` | global shell | hero, four categories, three featured collection cards, recent grid | verified all mandated widths | Fourth featured collection exists but homepage uses `.slice(0,3)` intentionally in code |
| `/recent` | `pages.js` | page title + gallery | asset grid, batch loading, modal triggers | verified mobile/tablet/desktop | Full repository is present client-side |
| `/icons` | `searchPage.js` | search/type page | heading, filters, icon results | verified | Uses shared “Search the vault” heading rather than category-specific title |
| `/banners` | `searchPage.js` | search/type page | filters, banner results | verified | Same route-local filter limitations |
| `/animated` | `searchPage.js` | search/type page | filters, animated results | verified | Cloudinary playback requests may be intentionally aborted during unload/navigation |
| `/wallpapers` | `searchPage.js` | search/type page | filters, wallpaper results | verified | Same full-manifest dependency |
| `/search` | `searchPage.js` | search page | search input, filters, results/no-results | verified | Initial query parameters seed state; later changes do not update URL |
| `/about` | `pages.js` | page title/content | authored prose | verified | No unique concern observed |
| `/collections` | `pages.js` | page title + grid | collection cards | verified | Desktop and mobile Collections controls both exist in DOM |
| `/collections/:slug` | `pages.js` | route hero + toolbar + gallery | cover, tags, sort, asset grid | verified representative route | Invalid slug falls to not found |
| `/categories/:slug` | `pages.js` | page title + gallery/empty | category copy, asset grid or empty state | verified with `/categories/ethereal` | Current four configured category filters each match zero assets |
| `/asset/:id/:slug` | router + modal | background gallery route plus overlay | asset modal, URL/history, auth/download | verified public and signed-out restricted | Decorative slug canonicalizes; unknown ID gives not found |
| 404 | `pages.js` | global shell + empty/error block | not-found copy, route back action | verified `/missing-route` | HTTP remains 200 through SPA fallback, as expected for client route |
| Legacy hash migration | `routes.js` | replacement to canonical route | hash mapper | verified by source and browser | Uses `replaceState`; old URL does not remain in history |
| Modal Back/Forward | `app.js`, `AssetModal.js` | gallery preserved underneath | modal open/close/reopen | verified | Depends on preserved `backgroundRoute` and cleanup ordering |
| Search no-results | `searchPage.js` | search shell | `.empty` state | verified | No retry is needed; changing filters is the recovery |
| Empty category | `pages.js` | category shell | `.empty-state` | verified | Public copy refers to local content manager, an implementation-facing message |
| Restricted `nv-166`, signed out | repository, modal, auth dialog, download Function | icon gallery + restricted modal | public preview, lock, protected action | safely verified | `src:null`; original not exposed |
| Restricted `nv-166`, signed in | same | same | authenticated protected download | implementation confirmed; live private download not re-exercised | Existing production state documented without bypass |
| Session loading | `AuthClient.js`, header | global shell | header action placeholder/state update | source confirmed | Very brief on healthy connections; dedicated skeleton absent |
| OAuth configured/unavailable | Auth client/dialog/functions | dialog/header | sign-in action or honest unavailable message | source confirmed | `neuevault.pages.dev` behavior depends on canonical host configuration |
| Mobile navigation open | `index.html`, `app.js` | fixed/collapsed header menu | mobile links/actions | verified | Outside click and route change close; Escape does not |
| Image error | `images.js` | local card/media context | failure class/text | source confirmed | Network failure state was not forced across every family |
| Lazy chunk failure | `app.js` | persistent shell | delayed loading/error/reload path | source confirmed | Recognized stale chunks attempt one safe same-URL reload |

All direct route requests sampled returned HTTP 200 through the SPA fallback. `/api/*` is handled by Pages Functions rather than the SPA.

## 5. Global foundations

### Token hierarchy

`styles.css` defines 208 root custom properties spanning primitive colors, semantic roles, typography, spacing, radii, controls, icons, shadows, motion, containers, hero/category contracts, and z-index layers. Components usually use semantic tokens, but tuned media effects and several older selectors retain literals.

### Token inventory

| Role | Token/value | Defined in | Used by | Duplicates | Notes |
|---|---|---|---|---|---|
| Accent | `--color-acid: #c2f13c` | `styles.css :root` | Collections, CTA, active/accent controls | legacy literals possible | Approved Neuevault accent |
| Page canvas | `--bg-page: #000` | root semantic tokens | body, shell | repeated `#000` in tuned effects | Confirmed computed black |
| Standard surface | `--bg-surface: #121212` | root | cards, hover surfaces, hero fallback | `#121212` also appears in media-specific contexts | Core dark surface |
| Raised/control surfaces | `--bg-surface-raised`, `--bg-control`, hover variants | root | modal, fields, buttons | several nearby hardcoded blacks remain | Roles are visually close but semantically distinct |
| Text | primary/secondary/muted/subtle/inverse/accent | root | all typography roles | local `#eee`, `#aaa`, `#bbb` remain | Semantic adoption is substantial, not complete |
| Borders | subtle/default/strong/interactive | root | cards, controls, modal | hardcoded `#3a3a3a` spinner | Border definitions combine width/style/color |
| UI family | `--font-ui: "Inter", sans-serif` | root | body/nav/buttons | body adds Helvetica/Arial fallbacks | Inter is not locally declared, so Windows may resolve to Arial |
| Brand family | `--font-brand: "TBJ Neuetra", sans-serif` | root | wordmark | none material | Local WOFF2 loaded |
| Category/hero family | `--font-category: "Arimo", var(--font-ui)` | root | category and hero type | none material | Local variable WOFF2 loaded |
| Eyebrow family | Archivo face/component token | fonts/hero tokens | hero eyebrow | local only | Width axis declared |
| Type scale | `--text-xs` through `--text-hero` and semantic role tokens | root | labels, controls, headings | responsive `clamp()` exceptions | Some roles use direct sizes to preserve approved layout |
| Weight scale | 400/500/600/700 tokens | root | shared type | category uses 621 intentionally | 621 is supported by variable Arimo |
| Spacing | `--space-1` through `--space-16` | root | layout/components | optical one-offs remain | Scale is not forced onto media composition |
| Radius | small/medium/large/xl/card/hero/pill/circle | root | controls/cards/hero/modal | mobile `--radius-card:14px` override | Mobile override is intentional but easy to miss |
| Control heights | small/medium/large and component contracts | root | buttons/fields | modal icon controls have local dimensions | Shared buttons are structurally aligned |
| Icon sizes | small/standard/medium/large and component overrides | root | button/icon families | Unicode symbols follow font metrics | No central SVG registry |
| Motion | fast/normal/slow, roll/pill/media, easing | root | buttons/cards/overlays | several component-specific durations | Intentional motion hierarchy exists |
| Containers | wide 1536, page 2024, content 1080, footer 1320 | root | shell/sections/footer | category 1888 and hero 1890 are component maxes | Multiple valid layout layers |
| Gutters | page 12, content/nav 16, footer 24 | root | respective containers | mobile page gutter resolves to 7 | Roles differ intentionally |
| Layers | header, hero content, modal, auth dialog, toast | root | stacking contexts | media layers use local indices | Global overlay order is tokenized |
| Category contract | max 1888, gap 16, ratio 460/478, radius 20 | root | homepage category grid/cards | mobile gap and typography overrides | Exact at 1920 content width |
| Hero contract | max 1890, ratio 1890/887, max/min height, copy tokens | root | homepage hero | mobile fixed height | Media composition-specific |

### Typography inventory

| Role | Family | Size | Weight | Line height | Tracking | Source | Responsive variants |
|---|---|---:|---:|---:|---:|---|---|
| Body | `Inter`, `Helvetica Neue`, Arial, sans-serif | 14px | 400 | normal/role-specific | normal | base CSS | unchanged |
| Brand wordmark | TBJ Neuetra | 20px | 400 | aligned to brand lockup | .05px | header CSS | same family on mobile |
| Desktop/mobile nav | `Inter`, sans-serif fallback | 14px | 500 | 40px rolling viewport | -.05px | nav CSS | desktop gap changes; type stable |
| Button labels | `Inter` or component Arimo | 14–15px | 600/700 | control-specific | -.08 to -.5px | button/hero CSS | sizes preserved |
| Hero eyebrow | Archivo | 12px | 500 | flex-centered in 28px | component value | hero CSS | stable |
| Hero H1 | Arimo | 46px | 600 rendered | 48px | -2px | hero CSS/computed style | clamp down to 36px at 320, 37.5 at 375, 42 at 520 |
| Hero description | Arimo | 13px | 500 | 14px desktop | -.4px | hero CSS | mobile line-height loosens |
| Route H1 | UI family | route token | semibold | role token | role token | route CSS | responsive decrease |
| Section heading | UI family | section token | semibold | role token | role token | section CSS | responsive decrease |
| Category count | Arimo | 12px | 621 | 29px | -.04em | category CSS | 11px/1.4 on narrow mobile |
| Category title | Arimo | 24px | 621 | 29px | -.04em | category CSS | 16/18.4 at 320; 18.75/21.56 at 375; 20/23 at 520 |
| Collection title | UI family | component token | semibold | component token | normal | collection CSS | wraps naturally |
| Asset overlay title | UI family | compact role | semibold | compact | normal | asset-card CSS | same role across masonry |
| Asset metadata | UI family | caption/metadata token | regular/medium | compact | role token | card/modal CSS | modal layout changes, type mostly stable |
| Badges/tags | UI family | 10–12px roles | semibold | compact | tracked role | badge/tag CSS | stable |
| Search/filter controls | UI family | 14px role | medium | control height | normal | search/control CSS | full-width/reflow changes only |
| Modal heading | UI family | modal heading token | semibold | role token | normal | modal CSS | mobile size adjustment |
| Auth dialog heading | UI family | 24px mobile and desktop role | semibold | role token | normal | auth CSS | uses typography token, not spacing token |
| Footer | UI family plus brand face | role-specific | regular/semibold | role-specific | normal | footer CSS | grid to stacked layout |
| Empty/error text | UI family | body + H2 roles | regular/semibold | role-specific | normal | empty/error CSS | width constrained responsively |

### Font assets and actual use

| Font | Public file | Declaration | Actual loaded use | Status |
|---|---|---|---|---|
| TBJ Neuetra | `/fonts/tbj-neuetra-vf.woff2` (34,908 bytes) | normal, 100–900, swap | navbar/footer wordmark | loaded in Chromium and Firefox |
| Arimo | `/fonts/Arimo-VariableFont_wght.woff2` (220,164 bytes) | normal, 400–700, swap | hero and category type | loaded; no parser warning |
| Archivo | `/fonts/Archivo-VariableFont_wdth,wght.woff2` (186,240 bytes) | normal, 100–900, stretch 62–125%, swap | hero eyebrow | loaded; no parser warning |
| Inter | no local public face | CSS fallback name only | UI role resolves to installed Inter if present, otherwise system sans/Arial | naming/availability inconsistency |
| SF Pro Rounded | nine local WOFF2 files under `content/fonts/SF Pro Rounded/` | not declared | none | identified only; not tracked/public/activated |
| Other local font sources | 36 WOFF2, 121 TTF, 10 OTF across `content/fonts/` | mostly undeclared | none in public app unless listed above | reference/source corpus, not runtime UI |

No untracked italic font was requested in either browser. `font-synthesis` is disabled at the document level, reducing accidental synthetic styles. Browser rendering cannot be expected to match Figma across platforms.

### Hardcoded and tuned values

Hardcoded dark values such as `#050505`, `#071000`, `#0b0b0b`, `#3a3a3a`, `#444`, and `#555` remain in isolated surfaces, spinner, or tuned states. Hero gradients, grain, text shadows, media opacity, object positions, and overlay alpha are intentional one-off visual composition values and should not be tokenized mechanically.

Only a small number of `!important` declarations remain: integration-status overrides and touch/reduced-motion safeguards. Negative values include modal action positioning and optical composition adjustments. They are maintenance risks, not evidence of a visual defect by themselves.

## 6. Global layout and page shell

- **Confirmed:** `body` is a black page canvas with no horizontal overflow at all 15 mandated widths in Chromium.
- **Confirmed:** the persistent header, `main`, overlay roots, toast/status root, and footer form one shared shell. Route content is replaced inside `main`; the header/footer are not rerendered per route.
- **Confirmed:** page maximum width is 2024px with 12px desktop side gutters. Content sections generally cap at 1080px with 16px gutters. The footer caps at 1320px with 24px gutters. The hero and category grid use their own 1890/1888px maxima.
- **Confirmed:** standard section top spacing is about 210px; recent/gallery sections use about 170px; narrow layouts reduce this to roughly 92px. These are composition tokens, not arbitrary per-route margins.
- **Confirmed:** the header is 62px at 701px and above and 60px at 700px and below. It is part of the normal page flow rather than a sticky overlay.
- **Confirmed:** Lenis is initialized once with `autoRaf`, anchors, and navigation-inertia stopping. It is enhancement-only and disabled for reduced motion.
- **Confirmed:** `[data-lenis-prevent]` is applied to `.modal-info` and auth dialog scroll regions; overlay lifecycle stops and restarts background smoothing.
- **High confidence:** there is no general route-transition animation. Lazy routes retain the shell and may display a restrained delayed loading state.
- **Confirmed:** modal/auth/toast layers use named z-index tokens. Hero content uses its own named layer above grain/gradient/video.
- **Confirmed:** direct clean routes receive SPA HTML while `/api/*` reaches Functions.

The current shell is genuinely shared, but route renderers own event listeners and observers. Correct cleanup on every route transition is therefore a structural requirement.

## 7. Header and navigation

### Geometry and behavior

- Header height: 62px desktop/tablet; 60px at `max-width:700px`.
- Inner width: `min(calc(100% - 32px), 1536px)`.
- Desktop mode begins at 1200px. Below 1200px, the desktop nav/actions are hidden and the menu toggle/mobile panel is used.
- Desktop nav gap: 38px at 1440px and wider; 21px at 1200–1439px.
- Each rolling nav link has a 40px interaction viewport and 16px horizontal padding. The hover pill is 40px tall, `#151515`, and pill-shaped.
- Roll timing: 300ms; entry intent: 10ms; pill fade: 150ms; travel: 40px. Incoming text starts above; paired SVG enters from below. Button shells remain stationary.
- Active state: a quiet persistent pill, brighter text, and `aria-current`; no acid hover color or active underline.

At 1440px, the Recent link measured approximately 97.4×40px. Its computed type was 14px, weight 500, `-.05px` tracking. The rolling duplicate is `aria-hidden`, so the accessibility name is singular.

### Item behavior

| Item | Semantics/destination | Visual/active behavior | Accessible name | Notes |
|---|---|---|---|---|
| Brand | anchor `/` | 54×28 shell, 18px SVG mask, wordmark | Neuevault brand label | Not roll-animated |
| Recently Added | anchor `/recent` | rolling label, active pill | singular visible label | Asset background route can keep it active |
| Icons | anchor `/icons` | same | singular | Dedicated canonical route |
| Banners | anchor `/banners` | same | singular | Dedicated canonical route |
| Animated | anchor `/animated` | same | singular | Dedicated canonical route |
| Wallpapers | anchor `/wallpapers` | same | singular | Dedicated canonical route |
| Search | anchor `/search` | same | singular | Route matching, not substring matching |
| About | anchor `/about` | same | singular | Standard route |
| Sign in | button/link behavior starts OAuth | light permanent surface, icon/text roll | “Sign in with Discord” | Double initiation guarded |
| Collections | anchor `/collections` | acid permanent surface, icon/text roll | Collections | Active collection state supported |
| Signed-in identity | account/user control | no rolling label on identity text | account name | State depends on session |
| Mobile toggle | button | two CSS bars | “Open navigation menu”, expanded state | 40px+ target; no icon asset |

### Mobile menu

**Confirmed:** route navigation and outside click close the menu. The toggle updates `aria-expanded`, and the row click targets remain usable on touch. Under `hover:none`, only primary rolling layers remain, so the first tap activates.

**Confirmed defect:** pressing Escape while the mobile menu is open does not close it. The existing global Escape handling is scoped to dialogs. Focus is not trapped—which is appropriate for a disclosure menu—but an Escape close behavior would be expected for parity with outside click.

Desktop and mobile navigation/action markup coexist and are hidden by CSS rather than generated from one semantic data structure. This reduces runtime complexity but duplicates maintenance and can create repeated DOM matches during testing.

## 8. Button and control inventory

### Button inventory

| Control | Source | Routes | Height | Padding | Radius | Font | Icon | States | Issues |
|---|---|---|---:|---|---:|---|---|---|---|
| Brand home link | `index.html`, CSS | all | 28px shell | logo shell + brand gap | 16px shell | TBJ wordmark | logo SVG mask | rest/focus | Not a full 44px-high target by itself, though header link area may be larger |
| Nav link | `index.html`, rolling runtime | all | 40px | 0 16px | pill | UI 14/500 | none | rest, hover, focus, active, touch/reduced | Desktop/mobile duplicated |
| Mobile menu toggle | `index.html`, `app.js` | <1200 | control token | compact | rounded | n/a | two CSS bars | open/closed/focus | Escape does not close |
| Sign in | `index.html`, AuthClient | all signed out | shared medium | component padding | pill | UI 14/600 | Discord SVG mask | rest/hover/focus/initiating/unavailable | OAuth action is intentionally host-canonical |
| Signed-in/account/sign-out | header/auth client | all signed in | shared medium | component | pill | UI role | profile/text dependent | loading/authenticated/logout | Private visual state not exhaustively re-captured |
| Collections action | `index.html` | all | shared medium | component | pill | UI 14/600 | bookmark SVG mask | rest/hover/focus/active | Desktop/mobile copies |
| Hero CTA | `pages.js` | home | 47px | 0 16px | 22px | Arimo 15/700 | bolt SVG mask | rest/hover/focus/active, reduced | Action remains current browse destination |
| Text/back link | pages/search | detail/about/error | content height | inline/compact | role-dependent | UI | Unicode `←` on back links | hover/focus/active | Symbol is part of label string |
| Search field | `searchPage.js` | search/type | shared control | field padding | control radius | UI 14 | no separate clear icon observed | focus, value, empty | Query state not continuously URL-synced |
| Type filter chips | `searchPage.js` | search/type | shared control | compact | pill | UI compact | none | selected/unselected/focus/touch | Seven controls; selected semantics should remain explicit |
| Select controls | search and collection pages | search/detail | shared control | standard | control radius | UI 14 | browser arrow | focus/value/disabled native | Two behavior owners use same visual foundation |
| Asset card trigger | `AssetGrid.js` | galleries | media-derived | none | card/media radius | overlay type | badges/lock | rest/hover/focus/error/restricted | Button contains large media; dimensions vary |
| Load more | `AssetGrid.js` | galleries | shared button | standard | pill/control | UI | none | visible/hidden/focus | IntersectionObserver often loads before manual use |
| Modal close/previous/next | `AssetModal.js` | modal | icon-control dimensions | centered | circle | symbol font | `×`, `←`, `→` | hover/focus/disabled edge | Unicode geometry varies by platform |
| Download/share actions | `AssetModal.js` | modal | shared medium/large | standard | control/pill | UI | `↓`, `↗` | public/restricted/auth/loading/success/error | Unicode download arrow is explicitly in labels |
| Auth dialog action/close | `AuthDialog.js` | auth prompt | shared button/icon | standard | control/circle | UI | `×` close; Discord on action where used | configured/unavailable/authenticated/focus | Close symbol duplicates modal implementation |

Shared controls have focus-visible styling and stationary shells. Rolling layers animate only internal glyphs/icons; touch and reduced-motion show a single stable layer. Disabled/loading coverage is strongest in auth/download flows and lighter in purely navigational controls.

## 9. Icon and SVG inventory

The application has four reusable repository SVG assets, one CSS-generated menu icon, one CSS spinner, and six Unicode/text-symbol implementations. It does not have a central icon registry.

### Icon inventory

| Purpose | Source | Type | Size | currentColor | Accessible | Duplicated | Status |
|---|---|---|---|---|---|---|---|
| Neuevault brand | `/assets/brand/logo28x28.svg`, CSS mask | reusable SVG artwork | 18px art in 54×28 shell | yes via mask background | brand link supplies label; artwork decorative | navbar/footer reuse source | approved brand asset |
| Discord | `/assets/icons/signin_discord.svg`, CSS mask | reusable SVG | 22×22 | yes | hidden; button names Discord action | desktop/mobile/auth placements | reusable |
| Collections bookmark | `/assets/icons/collections-bookmark.svg`, CSS mask | reusable SVG | 16px width, intrinsic ratio | yes | hidden; text names control | desktop/mobile | reusable |
| Hero bolt | `/assets/icons/bolt.svg`, CSS mask | reusable SVG | 13×16 | yes | hidden; CTA text names action | duplicated visual layer for roll only | reusable |
| Mobile menu | two `.menu-toggle span` bars | CSS-generated | control-relative | inherits/background | button has open/close label/state | one implementation | CSS icon |
| Loading spinner | `.grid-spinner` borders/keyframe | CSS-generated | `--icon-sm` | border colors | `aria-hidden`; adjacent loading text | grid instances | CSS icon |
| Restricted lock marker | `●` in `AssetGrid.js` | Unicode/text placeholder | badge-relative | inherited | span has “Restricted original” | every restricted card | placeholder, not a lock glyph |
| Modal close | `×` in `AssetModal.js` | Unicode | icon-control | inherited | `aria-label="Close viewer"` | duplicated concept in auth | replaceable future icon |
| Auth close | `×` in `AuthDialog.js` | Unicode | icon-control | inherited | `aria-label="Close sign-in dialog"` | duplicates modal close | replaceable future icon |
| Previous/next | `←` / `→` in `AssetModal.js` | Unicode | icon-control | inherited | explicit previous/next labels | paired | replaceable future icons |
| Download | `↓` in `AssetModal.js` lines 24 and 40 | Unicode in visible label | inline | inherited | included once in button name | public/restricted labels | **required located Unicode arrow** |
| Share/external direction | `↗` in `AssetModal.js` | Unicode in visible label | inline | inherited | included in “Copy link” label | single | replaceable future icon |

Back navigation also embeds `←` in `src/pages/pages.js` for “Home” and “All collections”; it reuses the Unicode arrow concept rather than an SVG.

No icons were replaced in this audit. A future `Icon` registry could unify asset lookup, dimensions, `currentColor`, decorative handling, and accessible labels, but should preserve brand artwork separately and should not convert meaningful text into unlabeled decoration.

## 10. Card and media inventory

### Category cards

- Grid: four equal columns at 1200px+, two below 1200px; 16px desktop/tablet gap, 8px at 700px and below.
- Maximum grid width: 1888px. At a 1920px viewport, four cards resolve to exactly 460×478px.
- Card ratio/radius: `460 / 478`, 20px, `#121212` surface, subtle border, clipped overflow.
- Copy: centered responsive inner block, max 225px, desktop count 12/29 and title 24/29, Arimo weight 621, `-.04em`, drop shadow.
- Desktop hover-capable rest: image opacity 0. Active hover/focus: opacity 1, original color, scale 1.025, stronger border. Persistent dark overlay does not defeat the reveal.
- Touch: image is visible without requiring hover.
- Reduced motion: transition is disabled and a usable stable state remains.
- Animated cover: static preview is initial; animated source loads on pointer/focus, reaches active opacity, stops/unloads after exit and when offscreen, and is suppressed for reduced motion/restricted playback.
- Lifecycle: card bindings return cleanup functions for event listeners, observer, and delayed unload. `cover-playing` coordinates static/animated layers.
- Current content: four category records render, but their tag/filter rules currently match zero assets. Covers still render because cover references are independent.

Representative sizes: 149×154.8 at 320; 176.5×183.4 at 375; 364×378.2 at 768; 492×511.3 at 1024 (two columns); 282×293 at 1200 (four); 342×355.4 at 1440; 460×478 at 1920.

### Collection cards

The collection family is a taller editorial card with media, optional animated crossfade, title, count/description, and featured/public data. It uses three columns within the 1080px content container on tablet/desktop and one column at 700px and below. At 1440px, a representative card measured about 350.7×429.9px. Hover lifts the card by 4px and scales media to 1.03; keyboard focus receives visible focus styling and animated-cover behavior. This movement is intentionally different from stationary button shells.

The homepage shows the first three featured/public collections. `/collections` shows the full collection index. Collection membership, featured state, and counts are data-driven.

### Asset cards

Asset cards are semantic buttons within a CSS multi-column masonry layout. They contain:

- a static preview with responsive `srcset`, intrinsic width/height when valid, lazy decoding/loading;
- optional animated playback layer;
- optional GIF badge and restricted marker;
- title/category/dimensions overlay;
- image-failure and malformed-media variants.

Hover/focus raises image saturation and scale slightly and reveals overlay metadata. GIF playback activates only while a public animated card is sufficiently visible (`IntersectionObserver` threshold .35), uses delayed 220ms unloading to avoid boundary thrash, and disconnects on route cleanup. Restricted animated playback never receives a public animated source.

### Route hero/media frame

Collection detail uses a wide cover plus route copy rather than either homepage card. The homepage hero is a separate full-bleed media composition and is not a generic card primitive.

### Empty/promotional states

Empty category/search states use bordered/surface containers but are not catalog cards. There is no separate “premium promotional card” family in the current public UI. Restricted content appears as an asset-card badge plus modal/auth branches.

## 11. Gallery and catalog UI

The archive uses CSS columns rather than a row-based CSS grid:

- desktop: `columns: 4 260px`, 12px gap;
- at 700px and below: two columns with a 135px target, 8px gap;
- asset cards avoid column breaks and preserve media aspect ratio.

`AssetGrid` initially renders eight records. An `IntersectionObserver` sentinel with 240px root margin increments the visible batch; a “Load more” button remains as a fallback. In a normal audit scroll, `/recent` advanced from 8 to 16 without manual activation.

The masonry container has `aria-live="polite"`. Cards are keyboard-focusable buttons and open the asset modal. The router preserves the gallery route and scroll position underneath the modal so Back closes and Forward reopens without rebuilding the user’s context.

Image previews are lazy. Public animation playback is viewport-gated and cleaned up. Broken images become an explicit unavailable state rather than collapsing the card.

### Large-catalog dependencies

Current assumptions that matter for a future 5,000–10,000 asset archive:

- all 234 asset records are embedded in/generated for the browser repository;
- search, sorting, filter counts, and collection/category matching are client-side;
- route renderers can synchronously traverse the full repository;
- pagination is presentation batching, not server pagination;
- asset detail lookup is local by stable ID;
- category and collection summaries rely on the same complete repository;
- no server search, D1 metadata query, cursor contract, or partial hydration exists.

A future catalog migration would affect repository interfaces, route loading/error states, count semantics, URL-filter persistence, modal neighbor navigation, and optimistic/paginated UI. This inventory does not begin that migration.

## 12. Search and filters

Search/type routes are lazy-loaded as one feature module. Dedicated navbar routes select a fixed type but reuse the same “Search the vault” shell.

Implemented:

- text query input;
- seven type/orientation filter buttons;
- type, tag, category, and access filtering;
- 180ms debounced updates;
- URL parameters consumed on initial load;
- no-results state;
- shared asset grid and modal opening;
- native select controls where applicable;
- keyboard focus and responsive reflow.

Partial:

- query/filter changes do not continuously update or replace the URL;
- copied URLs therefore preserve only the initial/explicit query state, not every interactive refinement;
- no explicit sort control is present on the general search route;
- no server loading/error/retry state exists because filtering is local;
- shortcut support beyond ordinary browser focus was not found.

Full-manifest-dependent:

- all filtering and result counts;
- tag/category discovery;
- result ordering;
- empty determination.

The input is labelled through the rendered form structure, uses the shared control foundation, and remains usable at narrow widths. No icon-only clear button was found; clearing is performed through input editing/filter controls rather than a distinct shared control.

## 13. Modal and detail experience

Asset detail is a modal-route hybrid:

- opening a card pushes `/asset/:id/:slug`;
- stable asset ID is authoritative, and a stale decorative slug canonicalizes;
- the gallery remains rendered underneath;
- Back closes, Forward reopens, direct detail URLs reconstruct a reasonable background route;
- unknown IDs render not found.

Desktop modal maximum geometry is about 1180px wide and 820px/94vh tall with a 340px information column. At 700px and below it becomes a full-screen stacked layout with roughly 56vh media followed by a natively scrollable info panel.

The modal provides image/media preview, category, collection, dimensions, file, upload date, download/restricted action, copy link, close, previous, and next controls. Public downloads use the existing Cloudinary-safe URL generation. Restricted downloads use only the authenticated Function.

Accessibility/lifecycle:

- dialog semantics and labelled title are applied by the shared dialog utility;
- focus is moved into the overlay and restored to the origin on normal close;
- Tab is contained; Escape closes;
- background scroll and Lenis are stopped;
- `.modal-info[data-lenis-prevent]` keeps nested native scrolling usable;
- all overlay listeners and state are cleaned up;
- animated media follows reduced-motion safety.

Fragility:

- close/previous/next/download/share graphics are Unicode text and inherit platform font metrics;
- desktop/mobile geometry and the negative modal-action positioning token are tightly coupled;
- modal neighbor navigation depends on the current background list;
- modal/auth code is split together in the current loader boundary, coupling two overlay families.

## 14. Authentication and restricted content

Discord OAuth is configured and active in production. Authentication canonicalizes through `www.pfseeker.com`; an apex-originated sign-in is routed through the canonical auth start before state creation. State remains random, signed, expiring, single-use, and server-only. Sessions and logout are active.

Header states:

- session loading;
- signed out with “Sign in” visible and an accessible Discord-specific name;
- signed in with account identity/action;
- honest unavailable state if production configuration cannot support the flow.

Auth dialog states:

- restricted signed-out prompt;
- configured sign-in action;
- signed-in explanation/action;
- integration unavailable;
- inline status/error.

`nv-166` is the current production restricted asset:

- its public generated record has `src:null`;
- its static preview remains public;
- the public card shows a restricted marker;
- the modal explains preview/original separation;
- signed-out protected delivery returns 401;
- the original is delivered only through `/api/download/:assetId` after server-side session/authorization;
- the present policy allows any authenticated Discord account;
- no Cloudinary protected public ID, unrestricted original URL, API secret, OAuth token, or session secret is exposed to browser code.

The audit used only safe public/signed-out routes and source inspection. It did not replay OAuth, inspect secret values, or bypass protected delivery.

## 15. Forms and fields

Public form/field families are limited:

| Field family | Location | Semantics | Visual foundation | States observed | Gaps |
|---|---|---|---|---|---|
| Search text field | search/type routes | labelled search/text input | shared control height, dark surface, border/radius | empty, populated, focus | no separate invalid/loading state needed locally |
| Filter buttons/chips | search/type routes | buttons with selected state | pill control | selected, rest, hover/focus, touch | URL not updated after each change |
| Filter/select | search and collection detail | labelled native select | `.select` shared field styling | value, focus, native menu | browser-native arrow varies |
| Sort select | collection detail | label + select | same shared styling | newest/title | local behavior, not shared controller |
| Auth action | dialog | button, not credential form | shared button | configured, initiating, unavailable | Discord owns credential entry |

No public request/contact/newsletter form exists in Neuevault. No email/password account fields exist because authentication is Discord OAuth. Admin/content-management fields are local tooling and are not loaded in the public website.

Autofill and validation styling are therefore largely not applicable to the current public surface. Focus-visible treatment is shared, while disabled styling exists at the button/control foundation but is not exercised by every field family.

## 16. Loading, empty, error, and placeholder states

| State | Source | Semantics/behavior | Status |
|---|---|---|---|
| Route lazy loading | `app.js` | persistent shell, delayed restrained status | implemented; avoids fast-cache flash |
| Chunk-load failure | `app.js` | one same-URL reload for recognized stale chunk, then usable error/retry | implemented |
| Session loading | `AuthClient.js`, header | header state updates after `/api/auth/session` | implemented, minimal |
| Grid batch loading | `AssetGrid.js` | spinner plus “Loading more assets…” | implemented; adjacent text names state |
| Image failure | `images.js` | failure class and “Preview unavailable” | implemented |
| Animated cover loading | cards/grid | static preview remains until animated source is ready | implemented |
| Empty category | `pages.js` | H2/body explanation | implemented; copy is content-manager-facing |
| Empty collection | page/grid branch | empty state | implemented |
| Search no results | `searchPage.js` | `.empty` result with filter recovery | implemented |
| Restricted unavailable | modal/auth | public preview plus protected-message branch | implemented |
| Auth failure/config unavailable | auth client/dialog | honest status; no fake sign-in | implemented |
| Download failure | modal/toast | error feedback without exposing URL/secret | implemented |
| 404 | `pages.js` | not-found title/body/back action | implemented |
| Malformed dimensions | `AssetGrid.js` | `malformed-media` class, omits unsafe intrinsic dimensions | implemented defensive state |
| Coming soon/premium | none found in current public source | n/a | absent, not a hidden component |
| First-visit overlay | no distinct onboarding overlay found | n/a | absent |

The product has several well-behaved local states but no single `LoadingState`/`EmptyState` implementation. Typography, spacing, and recovery actions are repeated through route-local strings.

## 17. Footer

The semantic footer is part of the persistent document shell and appears on every public route. It uses a centered maximum width of 1320px with 24px gutters, approximately 180px top separation, and 50/45px vertical padding on desktop. At 700px and below it stacks, reduces the preceding margin to about 100px, and preserves link target spacing.

The footer reuses the real Neuevault logo source and brand wordmark rather than a CSS approximation. Decorative artwork is hidden when nearby text supplies the name. It includes grouped internal navigation/legal/about information and standard hover/focus behavior.

The footer does not participate in header active-route calculation. Its route links are separate markup, creating a modest duplication risk. No route-specific footer variant was observed.

## 18. Motion and interaction inventory

| Interaction | Trigger | Target/state | Timing/easing | Touch/reduced motion | Cleanup |
|---|---|---|---|---|---|
| Rolling label | hover/focus | text enters from above; paired icon from below; 40px travel | 300ms, 10ms pointer entry, cubic roll easing, subtle 1.5/-0.5px settle | duplicate layers hidden; primary remains | CSS/state enhancement; stable rest transforms |
| Nav pill | hover/focus/active | opacity only, `#151515`, 40px | 150ms; 10ms pointer entry, immediate exit/focus | immediate/nonanimated under reduced | CSS |
| Button interaction | hover/focus/active | internal text/icon roll; shell stationary | same roll system | first tap activates | CSS/runtime enhancement |
| Category reveal | hover/focus | opacity 0→1, scale to 1.025, color image | 400ms opacity / 600ms transform family | touch shows image; reduced disables transition | route cleanup |
| Animated category/collection cover | pointer/focus + viewport | static→animated source, delayed unload | media transition + 220ms exit guard | static under reduced/restricted | event/observer/timeouts cleared |
| Collection card | hover/focus | shell lift -4px, media scale 1.03 | standard/media tokens | motion reduced | CSS |
| Asset card | hover/focus + viewport | overlay, scale1.025, saturation .72→.95; GIF swap | standard/media; observer threshold .35 | static under reduced/restricted | observer/timeouts disconnected |
| Grid spinner | batch loading | border rotation | .8s linear infinite | animation disabled/simplified by reduced rules | removed/hidden after load |
| Modal/dialog | open/close | overlay/panel, focus, scroll lock | component transition tokens | reduced rules remove nonessential motion | listeners/focus/Lenis restored |
| Lenis | wheel/anchor/native input | document scrolling | Lenis `autoRaf` | not initialized for reduced motion; native touch retained | one app-lifetime instance |
| Toast/status | action feedback | opacity/position | standard token | reduced rules | timed removal |

The rolling interaction now uses stable rest/active transforms, so pointer/focus exit reverses without a blank frame. Entry-only overshoot does not corrupt the stable exit destination. `will-change` is limited to animating layers in hover-capable contexts rather than applied globally.

No essential content depends exclusively on hover: category images are visible on touch, text remains present, and animated media always has a static preview.

## 19. Responsive behavior

### Actual breakpoints and ranges

- **0–700px:** narrow/mobile layout. Header 60px; menu mode; page side gutter effectively 7px; hero fixed 540px; category/asset gaps 8px; category and masonry stay two columns; collections become one column; modal becomes full-screen stacked.
- **701–1199px:** tablet/compact desktop. Header 62px; collapsed menu remains; 12px page gutter; hero minimum 560px; category grid two columns; collection grid three columns; normal desktop hero typography is reached by 768px.
- **1200–1439px:** desktop navigation/actions appear; categories switch to four columns; nav gap compacts to 21px.
- **1440px+:** nav gap becomes 38px; content/footer max widths begin producing growing outer margins.
- **1920px:** hero/category component maxima resolve to their authored 1890×887 and 1888px compositions.

The CSS architecture has two primary media-query boundaries (`700px`, `1199/1200px`) plus a `1439/1440px` nav-spacing band. Component `clamp()` values create fluid typography between discrete boundaries.

### Responsive matrix

| Component | Mobile | Tablet | Desktop | Breakpoints | Issues |
|---|---|---|---|---|---|
| Header/nav | 60px, menu toggle/panel | 62px, menu mode | 62px full nav/actions | 700, 1200, 1440 gap band | Escape does not close mobile menu |
| Hero | 540px fixed; 36–42px title | 560px min; 46/48 by 768 | aspect-ratio grows to max 887 | 700 plus fluid ratio/clamp | Large media cost remains |
| Page container | ~7px gutters | 12px gutters | max 2024/12px | 700 | Multiple nested container roles require discipline |
| Category grid | 2 cols, 8px gap | 2 cols, 16px | 4 cols, 16px | 700, 1200 | Abrupt 2→4 shift is intentional but large |
| Collection cards | 1 col | 3 cols | 3 cols, content max1080 | 700 | No 2-column intermediate band |
| Asset masonry | 2 columns, 8px | 4 target columns/12px | 4 target columns/12px | 700 | CSS columns affect reading/order expectations |
| Search/filters | stacked/wrapping controls | expanded rows | full control row | 700 and intrinsic wrap | Query URL persistence partial |
| Collection detail | cover/copy stack as needed | route hero layout | wide route hero + toolbar | 700 | Long titles depend on natural wrap |
| Asset modal | full screen, ~56vh media then info | desktop shell where space permits | max1180×820/94vh, 340px info | 700 | Negative action offset and viewport-height coupling |
| Auth dialog | near-full mobile width | centered card | centered card | 700 | 24px H2 preserved with token |
| Footer | stacked; ~100px top gap | grid | max1320 grid; ~180px top gap | 700 | Internal link markup duplicated from header concepts |
| Loading/empty | full available width | constrained | constrained | shared container rules | No single shared primitive |

All mandated widths had `scrollWidth == viewport width`. No horizontal overflow was observed in Chromium. Firefox reproduced the major layout and font roles without CSS/font warnings.

## 20. Accessibility observations

| Observation | Classification | Evidence |
|---|---|---|
| Semantic header/nav/main/sections/footer and one H1 per sampled route | acceptable | Chromium accessibility tree and DOM |
| Rolling visual duplicates use `aria-hidden`; accessible names remain singular | acceptable | AX names for nav/buttons |
| Category and asset cards are keyboard-focusable semantic links/buttons | acceptable | DOM and keyboard traversal |
| Category hover has focus parity; touch exposes media | acceptable | computed state/source and emulation |
| Reduced motion disables rolling/media motion while preserving content | acceptable | emulation/source |
| Modal has labelled dialog semantics, focus containment, Escape, and restoration | acceptable | source and browser behavior |
| Mobile menu does not close on Escape | **confirmed defect** | keyboard test and `app.js` listener scope |
| Restricted messaging explicitly separates public preview/private original | acceptable | `nv-166` signed-out modal/AX text |
| Unicode icon controls depend on platform glyph rendering | likely concern | modal/auth source; labels are present, so naming is not defective |
| Restricted marker uses `●`, which is visually less explicit than a lock | likely concern | `AssetGrid.js`; accessible label mitigates |
| Masonry CSS columns may produce a visual order different from row-wise expectation | likely concern | layout method; keyboard/DOM order remains source order |
| Empty category copy exposes “local content manager” to public users | likely content concern | rendered `/categories/ethereal` |
| Color contrast of every overlay/media frame | unknown | not exhaustively measured across video frames |
| Signed-in account menu complete focus behavior | unknown | private state not re-exercised |
| Every decorative image alt classification | unknown | family sampling rather than asset-by-asset audit |

Focus-visible styles are retained on interactive controls. Active navigation is not indicated by color alone: `aria-current`, brighter text, and a persistent pill work together. Button targets retain their established hit areas even when visual icons are small.

## 21. Performance-relevant findings

### Measured current behavior

Single Chromium 1440px production observation:

- entry JavaScript `/assets/index-CYYhdfBE.js`: about 47.6KB transferred, 476.4KB decoded;
- primary CSS: about 8.7KB transferred, 34.8KB decoded;
- three local font responses: about 442KB transferred in total;
- hero grain: about 3.18MB transferred;
- hero video: about 7.91MB transferred in the observed run;
- 26 Resource Timing entries;
- document DOMContentLoaded around 151ms and load around 449ms in that lab run.

These values vary by cache, edge, codec, and device. Stable LCP, INP, CLS, TBT, and Lighthouse scores were not collected and remain **Unknown**.

### Code-level findings

- Search and overlay UI are lazy chunks; homepage does not eagerly request every route module.
- Lenis is one small shared dependency and is not duplicated.
- The complete 234-record generated asset repository remains an initial application dependency and is a material decoded-JavaScript/data contributor.
- Content Tool and Node-only Cloudinary administration code do not enter the browser bundle.
- Public app requests only the three approved runtime fonts; local SF/reference fonts are not shipped.
- Hero video is selected responsively and only rendered on the homepage; 1080/1440 sources are not both deliberately loaded.
- Hero video playback is viewport/visibility/reduced-motion aware, but the media and full-size grain dominate homepage transfer much more than icon assets.
- Gallery images are lazy, and GIF/animated-cover originals are loaded only for active states.
- Hashed Vite JS/CSS outputs are immutable-cache candidates; versionless fonts/media require separate policy.
- Route/card observers and listeners have explicit cleanup, limiting long-navigation leaks.

### Future large-catalog risk

At 5,000–10,000 assets, embedding and traversing the complete manifest would affect initial parse/memory, query time, category counts, filter construction, modal neighbor lookup, and generated chunk size. This is a future architecture concern, not a current backend defect.

## 22. Duplication and fragility

### Fragility inventory

| Finding | Severity | Files | Routes | Visible impact | Future consolidation |
|---|---|---|---|---|---|
| Mobile menu lacks Escape close | Medium | `app.js`, `index.html` | all at <1200 | Keyboard users cannot dismiss with expected key | shared disclosure/menu controller |
| Desktop/mobile nav/action markup duplicated | Medium | `index.html`, `app.js` | all | No current visual defect; state updates can diverge | data-driven `NavLink`/action renderer |
| Unicode modal/back/download/share symbols | Medium | `AssetModal.js`, `AuthDialog.js`, `pages.js` | modal/detail routes | Platform-dependent glyph geometry | icon registry with labelled `IconButton` |
| Restricted “lock” is a bullet | Low | `AssetGrid.js` | galleries with `nv-166` | Meaning depends on context; label saves accessibility | restricted badge/icon primitive |
| Full generated repository in initial client data | Medium | generated JSON, repository | all | Current load is acceptable; growth risk | paged repository contract |
| Search state only initially synchronized to URL | Medium | `searchPage.js` | search/type | Interactive filter state is not fully shareable | query-state adapter |
| Category records all match zero current assets | Medium | generated categories/data | home/category routes | Public categories lead to empty pages | editorial/data review, not UI refactor |
| Empty category copy references local content manager | Low | `pages.js` | empty categories | Implementation-facing public copy | shared public `EmptyState` content |
| Four featured collections, homepage slices to three | Informational | `pages.js`, generated collections | home | Intentional display difference can surprise editors | explicit homepage limit documentation |
| Similar empty/loading/error markup is route-local | Low | pages/search/grid/app | several | Small visual/copy drift | `EmptyState`/`LoadingState` primitives |
| Close symbol duplicated across modal/auth | Low | overlay files | overlay states | Same concept can drift | shared `IconButton` |
| Similar selects have separate behavior owners | Low | pages/search | search/collection detail | Styling shared, logic repeated | `Field`/select helper |
| Multiple near-black literals bypass semantic tokens | Low | `styles.css` | various | Mostly imperceptible 1–2 value drift | audit semantic roles before replacement |
| Component-specific motion durations are scattered | Low | `styles.css` | cards/overlays | Deliberate today, harder to compare | documented motion contracts |
| Mobile root overrides are easy to overlook | Low | `styles.css` | <=700 | No current defect | colocate responsive component contracts |
| CSS-column masonry affects visual reading order | Medium | `styles.css`, `AssetGrid.js` | galleries | Potential keyboard/visual order mismatch | evaluate true masonry/grid later |
| Hero media dominates transfer | Medium | hero assets/CSS/pages | home | Network cost on cold load | separate media optimization study |
| UI family names Inter without local Inter face | Low | `styles.css` | most UI | Cross-platform typography differs | decide system stack or ship approved face |
| String-template rendering couples structure and escaping | Medium | pages/components/overlays | all | Maintenance and test fragility; current escaping is deliberate | incremental component helpers, no framework required |
| Overlay lazy boundary couples modal and auth loading | Low | `app.js` | first overlay use | Slightly broader chunk request | measure before separating |

There is no Critical finding. Severity reflects user and maintenance impact, not the amount of code involved.

Top duplication themes are navigation markup, Unicode/icon concepts, route-local state blocks, and repeated field/control semantics. Top fragility themes are menu keyboard dismissal, full-manifest scale, partial URL state, CSS-column order, and media weight.

## 23. Candidate shared primitives

These are planning candidates, not implementation instructions.

### Primitive candidates

| Primitive | Current implementations | Variants | Dependencies | Risks |
|---|---|---|---|---|
| `PageShell` | persistent header/main/footer/overlay roots | normal, overlay locked | router, Lenis, auth | migrating shell can disturb history/scroll |
| `SectionContainer` | page/content/recent/footer wrappers | wide, content, footer, full-bleed | layout tokens | over-unifying intentionally different gutters |
| `Button` | sign-in, Collections, hero, modal, load more, auth | light, accent, dark, gradient, sizes, full | rolling labels, icons | accessible name/action must survive markup change |
| `IconButton` | modal close/nav, auth close, menu | circle, previous/next, disclosure | future Icon registry | Unicode replacement is a separate authorized phase |
| `RollingLabel` | nav and selected text/icon controls | text-only, paired icon | motion tokens, reduced/touch | duplicate visual layers and exit geometry |
| `NavLink` | desktop/mobile nav, footer links | route-active, mobile row | router matcher, RollingLabel | duplicated DOM may be intentional for responsive shell |
| `Icon` | four SVG masks, CSS/Unicode concepts | brand, decorative, meaningful | asset registry/accessibility | brand must remain separate; no premature replacement |
| `Field` | search input and selects | text, search, select | control tokens | native select behavior must remain |
| `Pill`/`Badge` | GIF, tags, lock, active nav, status | informational, interactive, restricted | typography/color tokens | do not merge semantic and interactive behavior blindly |
| `CardShell` | category, collection, asset, dialog | media, surface, interactive | radius/border/motion | families have materially different ratios/semantics |
| `MediaFrame` | hero, route hero, cards, modal | static, animated, restricted, error | images, observers, reduced motion | lifecycle complexity |
| `CategoryCard` | homepage category renderer | static/animated/touch | data filters, MediaFrame | current zero-count content must not be hidden by UI work |
| `CollectionCard` | home/index cards | featured, animated | membership/counts | homepage limit and index usage differ |
| `AssetCard` | masonry card | public, GIF, restricted, malformed | repository, playback observer | modal/history coupling |
| `AssetGrid` | recent/search/category/collection grids | initial batch, filtered, sorted | repository, observers | future server paging contract |
| `ModalShell` | asset modal/auth dialog shared mechanics | media panel, compact dialog | focus, Lenis, history | route modal and auth dialog are not identical |
| `DownloadAction` | public/restricted modal actions | direct public, signed protected, unavailable | auth, Functions, URL safety | highest security regression surface |
| `EmptyState` | no results, empty category/collection, 404 | recoverable, terminal, editorial | route/action | copy remains context-specific |
| `LoadingState` | route lazy, grid progress, session | inline, delayed route, overlay-local | lazy imports, ARIA | avoid flashing on fast paths |
| `Toast` | copy/download/auth feedback | success, error | timing/live region | should not replace inline actionable errors |

The strongest first candidates are `RollingLabel`, `Button`, `IconButton`, `Field`, `EmptyState`, and `SectionContainer`, because they already share contracts. `CardShell` and `ModalShell` should remain thin structural abstractions rather than forcing visually distinct components together.

## 24. Grainient comparison map

| Neuevault area | Current Neuevault | Grainient reference | Keep Neuevault | Adapt reference | Reject reference | Reason |
|---|---|---|---|---|---|---|
| Page gutter | 12px page, 16px content, component-specific wide frames | consistent 15px | ✓ |  |  | Neuevault roles are deliberate and already responsive |
| Header | 62px desktop, 60px mobile; 1536 inner | 62px desktop, 70px collapsed; ~1440 inner | ✓ |  | Current compact mobile header is approved |
| Nav spacing | 38px wide, 21px compact; 16px link padding | padding-driven, no explicit gap | ✓ |  | Neuevault better handles its labels/intermediate width |
| Nav rolling | singular AX name, stable reverse, reduced/touch safety | duplicate accessible names; timing unknown | ✓ |  |  | Neuevault accessibility and state model are stronger |
| Hover pill | 40px, `#151515`, 150ms | ~40px, `#1a1a1a` | ✓ |  |  | Current system is approved and tokenized |
| Compact buttons | established medium controls with stationary shells | 38px compact pills | ✓ |  |  | Preserve Neuevault touch/action system |
| Large CTA | 47px hero CTA | 47.2–51.2px | ✓ |  |  | Similar role already implemented |
| Icon policy | four reusable SVG masks plus Unicode/CSS | exact SVG system unknown |  | ✓ |  | Adopt only registry principles later, never copy assets |
| Card radius | 20px category/hero, family tokens elsewhere | 20px cards, 50px pills | ✓ |  |  | Shared visual principle already present |
| Category grid | 2 below 1200, 4 from 1200, max1888 | 2 below810, 4 from810, full-width | ✓ |  |  | Neuevault switch matches its content and nav bands |
| Category ratio | 460/478 | ~0.878 width/height, 500px cap | ✓ |  |  | Current Figma-derived ratio is approved |
| Category type | Arimo 12/29 count, 24/29 title, responsive | SF Pro Rounded 12/12, 18→24 | ✓ |  |  | Do not activate SF Pro Rounded; current metrics are authored |
| Category reveal | opacity0→1, scale1.025, focus/touch/reduced parity | opacity0/scale1.4; no focus reveal; reduced hides media | ✓ |  | ✓ | Reject inaccessible/overaggressive parts |
| Media loading | viewport-gated GIF/cover unload | responsive images/video preload tiers | ✓ | ✓ |  | Both support selective loading; Neuevault has stronger cleanup |
| Font hierarchy | TBJ/Arimo/Archivo + system UI fallback | SF Pro Rounded roles | ✓ | ✓ |  | Role hierarchy can inform future spec; font must not be copied/activated |
| Footer | compact grouped Neuevault footer, max1320 | larger grouped information footer | ✓ | ✓ |  | Grouping can inspire IA, not exact content/layout |
| Reduced motion | explicit stable states throughout | category reveal suppressed into hidden media | ✓ |  | ✓ | Neuevault preserves essential content |
| Runtime footprint | Vite/native modules, one Lenis dependency | Framer/React plus many third parties | ✓ |  | ✓ | Do not inherit third-party-heavy model |

## 25. Migration dependency map

| Future group | Dependencies | Files/routes | Primary risks | Incremental/compatibility notes |
|---|---|---|---|---|
| 1. Foundations/tokens | inventory sign-off, visual baselines | `styles.css`, all routes | pixel drift, cascade changes | introduce aliases before deleting old tokens |
| 2. Font registration/roles | approved font decision and licensing | fonts, `styles.css`, every text role | layout shift, metrics, platform rendering | SF Pro Rounded remains inactive until explicitly authorized |
| 3. Icon registry | complete icon spec/assets/accessibility mapping | header, overlays, cards, pages | changed names/target geometry | compatibility wrapper can preserve current symbols until replacement phase |
| 4. Button/control primitives | tokens, RollingLabel, Icon | header, hero, modal, auth, grid | action/ARIA regressions | migrate one visual family at a time |
| 5. Navigation primitives | router active matcher, mobile behavior | `index.html`, `app.js` | history, active state, OAuth action | fix Escape independently; preserve canonical routes |
| 6. Card/media primitives | image fallback, playback lifecycle | cards/grid/modal | observer leaks, restricted URL exposure | start with thin `MediaFrame`, retain family renderers |
| 7. Category grid | card/media primitives, content review | home/category data | changing approved design, zero-count content | visual regression at all mandated widths |
| 8. Modal/download controls | Icon/Button/ModalShell, auth | asset routes/functions | security, focus, history, signed URLs | highest regression gate; compatibility tests required |
| 9. Search/filter controls | Field/Button, URL-state spec | search/type/collection detail | shareability, stale async state | URL adapter before server migration |
| 10. Route migration | stable primitives and repository interface | pages/router/app | Back/Forward, cleanup, stale chunks | no framework required; preserve native route contract |
| 11. Accessibility QA | component migrations complete | all | regressions hidden by visual parity | keyboard/AX/touch/reduced matrix per phase |
| 12. Visual regression QA | stable reference screenshots/fonts | all viewports | video-frame nondeterminism | mask/ignore moving media; compare geometry |
| 13. Large-catalog adaptation | server/API/D1 contract, pagination/search spec | repository, grid, search, modal neighbors | initial payload, counts, URL/history | add repository compatibility interface before data transport changes |

No group requires a wholesale rewrite. Foundations, icon registration, and thin component helpers can be incremental, provided current route/history/auth/media contracts remain covered.

## 26. Unknowns and unresolved questions

1. Should the public UI continue to name `Inter` without shipping it, intentionally accepting platform-specific system fallback?
2. Is the public “local content manager” wording on empty categories intentional editorial copy?
3. Are the four current zero-count categories expected, or are their configured tag rules awaiting content?
4. Is the homepage three-collection limit intentional product curation or a historical hard limit?
5. Should search/filter changes become fully shareable through URL updates?
6. Should CSS-column visual order remain acceptable as the archive grows, or is row-consistent keyboard/visual order a future requirement?
7. Which signed-in account/menu variants need a separate private-state accessibility inventory?
8. What formal contrast target should be used for text over changing hero/card media?
9. Are the untracked SF Pro Rounded files licensed and approved for future production use? Their existence alone does not authorize activation.
10. Should the modal/auth overlay lazy boundary remain shared after measuring first-use behavior?
11. What server pagination/search/count contract will eventually replace the complete browser manifest?
12. Which Unicode symbols should receive custom SVG artwork in the separately authorized icon phase?
13. Should mobile navigation adopt Escape dismissal and explicit focus return as an isolated accessibility fix before broader component migration?
14. Reliable field Core Web Vitals and stable cross-device media cost remain unknown; the lab figures here are not a performance budget.

## 27. Recommended next documentation phase

The next phase should be a design-system specification, not implementation. It should:

1. freeze the current route/state and viewport baselines from this inventory;
2. decide the UI font policy, including whether Inter is a system fallback and whether SF Pro Rounded is authorized at all;
3. specify icon semantics, sizes, viewBoxes, and accessible-name rules without replacing assets yet;
4. define contracts for `Button`, `IconButton`, `RollingLabel`, `Field`, `Badge`, `EmptyState`, and thin layout primitives;
5. document media lifecycle requirements for static, animated, restricted, error, touch, and reduced-motion states;
6. define search URL-state and future repository/pagination interfaces;
7. create an accessibility remediation list led by mobile-menu Escape behavior;
8. define visual-regression fixtures at the actual 700/1200/1440 boundaries plus representative narrow/wide widths;
9. separate editorial/data questions (zero categories, homepage collection limit, empty copy) from component work;
10. establish migration gates for history, auth, protected downloads, modal focus, GIF lifecycle, and no horizontal overflow.

Implementation should begin only after those decisions are approved. Grainient should remain a comparison reference, not a source of proprietary assets, inaccessible patterns, or unverified motion values.
