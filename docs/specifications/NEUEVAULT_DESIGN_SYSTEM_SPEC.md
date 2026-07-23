---
title: Neuevault Design System Specification
status: draft
authority: specification
based-on:
  - ../project/DEVELOPMENT.md
  - ../project/DESIGN_SYSTEM.md
  - ../audits/neuevault/NEUEVAULT_UI_INVENTORY.md
  - ../audits/references/grainient/GRAINIENT_REFERENCE.md
last-reviewed: 2026-07-24
---

# Neuevault Design System Specification

## Review decisions incorporated

This revision records the user's resolved design direction:

- SF Pro Rounded is approved for every future public UI and display role except the Neuevault wordmark.
- TBJ Neuetra remains approved for the Neuevault wordmark only.
- Arimo, Archivo, and Inter are removed from future public UI roles; Arimo and Archivo may remain only as temporary migration compatibility faces.
- The complete 400 Regular, 500 Medium, 600 Semibold, and 700 Bold SF Pro Rounded set is retained.
- Font metadata, parsing, loading, fallback, and layout checks are implementation validation—not approval gates for font use.
- Grainient is the selected blueprint for foundational UX patterns deliberately adopted by the user, with Neuevault-specific accessibility, security, responsive, brand, route, and product adaptations.
- The category count/title stack uses a real 10px layout gap.
- The category reveal changes from the current compatibility behavior to opacity 0/scale 1.4 at rest and opacity 1/scale 1 on hover or focus.
- Keyboard, touch, reduced-motion, static/animated crossfade, cleanup, and restricted-content safeguards remain required adaptations.

## 1. Status, authority, and scope

This document defines a proposed future-state UI system for Neuevault. Its status is **draft**. It becomes implementation authority only after a reviewer changes the status to `approved`. Until then, current repository source and verified production behavior remain authoritative.

### Authority order

1. Current repository source and verified production behavior govern current behavior.
2. Approved specifications govern approved future behavior.
3. Current project documentation explains architecture and operational constraints.
4. Neuevault audits provide implementation evidence.
5. External audits provide measured reference evidence. Grainient governs the selected foundational UX patterns explicitly adopted in this specification.
6. Archived and historical task material has no current product authority.

When those sources disagree, implementation work must record and resolve the discrepancy rather than silently choosing one. Grainient is the chosen blueprint for selected foundational UX behavior; it does not govern Neuevault identity, content, routes, security, product-specific components, or accessibility adaptations.

### Terminology

- **Primitive:** the smallest reusable UI contract with one semantic responsibility, such as `Button` or `Icon`.
- **Component:** a composed interface unit that may use primitives and own domain behavior, such as `AssetCard`.
- **Variant:** an approved visual or behavioral form of a primitive/component; variants do not change semantics by themselves.
- **State:** a condition such as hover, focus, loading, disabled, restricted, or error.
- **Token:** a named reusable value.
- **Semantic token:** a token named for a role rather than a raw visual value.
- **Composition:** route- or feature-specific arrangement of components.
- **Compatibility layer:** temporary aliases or adapters that preserve deployed behavior while consumers migrate.
- **Migration phase:** an independently testable and reversible implementation increment.
- **Visual regression fixture:** a deterministic route, viewport, state, and data setup used for comparison.

### Decision labels

- **Approved:** suitable for implementation after this document is approved.
- **Approved with adaptation:** direction is approved, but implementation must calibrate against declared evidence.
- **Deferred:** intentionally unresolved and assigned a later decision gate.
- **Rejected:** must not be adopted.
- **Requires implementation validation:** approved intent whose exact result must be measured in browsers before replacing compatibility behavior.

### Scope

This specification covers foundations, typography, color, layout, responsive behavior, surfaces, motion, icons, controls, navigation, forms, pills/badges, cards/media, overlays, restricted actions, state UI, accessibility, performance-aware behavior, primitive APIs, exceptions, migration, and visual-regression requirements.

It does not authorize production changes, font activation, icon replacement, component refactoring, route changes, catalog migration, authentication changes, or performance optimization. Large-catalog server pagination/search remains a separate architecture program.

## 2. Source documents and evidence

| Source | Authority | Use in this specification | Limits |
|---|---|---|---|
| Current repository and production | implementation authority | compatibility baseline, measured values, security/route behavior | not itself approval for every future pattern |
| `docs/README.md` | documentation index | authority and status rules | no component detail |
| `DEVELOPMENT.md` | project documentation | architecture, route/lazy/auth/media constraints | current implementation, not full future UI |
| `DESIGN_SYSTEM.md` | project documentation | current tokens and component contracts | documents deployed system, not an approved migration |
| `NEUEVAULT_UI_INVENTORY.md` | Neuevault audit | measured routes, states, fonts, geometry, breakpoints, defects | observation date and sampled private states |
| `GRAINIENT_REFERENCE.md` | external audit and selected blueprint | measured foundation for explicitly adopted typography hierarchy, rhythm, surfaces, and category behavior | no assets/fonts/code; Neuevault-specific product, accessibility, responsive, and security requirements still govern |
| This task | phase instructions | required decisions, structure, and quality gate | historical after this draft is produced |

Important evidence:

- Current public UI is a native-module Vite application with History API routing, lazy Search/overlay features, 234 client-side asset records, and secure Pages Functions.
- Actual responsive boundaries are 700/701, 1199/1200, and 1439/1440px.
- Current production loads TBJ Neuetra, Arimo, and Archivo; `Inter` is named but not locally registered.
- Local SF Pro Rounded static WOFF2 files exist but are not active or public.
- Current category cards use a 460/478 ratio, 20px radius, two columns below 1200, four from 1200, and accessible hover/focus/touch/reduced-motion states.
- Current rolling labels preserve singular accessible names and stable entry/exit states.
- `nv-166` is restricted; its public manifest has `src:null`, and server-only delivery is non-negotiable.

### Selected Grainient blueprint decisions

| Foundational pattern | Decision | Neuevault adaptation |
|---|---|---|
| SF Pro Rounded role hierarchy | **Approved** | Local Neuevault files; TBJ Neuetra remains wordmark-only |
| Category count/title gap | **Approved** at 10px | Independent type line heights and responsive calibration |
| Category reveal geometry | **Approved** at opacity 0/scale 1.4 → opacity 1/scale 1 | Focus parity, visible touch/reduced state, wrapper-based static/animated crossfade, restricted safety, cleanup |
| Dark surfaces and restrained pill hierarchy | **Approved with adaptation** | Uses Neuevault semantic palette and existing product roles |
| Duplicate rolling-label accessibility | **Rejected** | Neuevault retains singular accessible names |
| Hover-only or hidden reduced-motion content | **Rejected** | Essential content remains visible and operable |

## 3. Design principles

1. **Dark editorial, not generic dashboard.** Black and near-black surfaces frame imagery; controls remain compact and quiet.
2. **Image-first hierarchy.** Media carries visual emphasis, while text and UI establish context without covering or competing with it.
3. **Restrained acid accent.** `#c2f13c` is reserved for primary action, focus, and deliberate emphasis—not routine body text or every active state.
4. **Stable geometry.** Hover, loading, font swap, and animation must not resize controls, shift layout, or create blank states.
5. **One semantic contract per control.** Visual variants do not determine whether an element is a link, button, field, or status.
6. **Input parity.** Pointer, keyboard, touch, and reduced-motion users receive equivalent content and operability.
7. **Systems before local tuning.** Existing primitives/tokens are used before adding a value. Unique editorial media composition may remain an explicit exception.
8. **Real-content responsiveness.** Breakpoints and intrinsic wrapping serve actual labels, cards, media, and routes, including 320px.
9. **Blueprint fidelity with Neuevault boundaries.** Selected Grainient foundation patterns are adapted faithfully; current implementation differences are migration facts, not automatic preservation reasons. Neuevault branding, copy, routes, security, accessibility, and product-specific behavior remain its own.
10. **Performance-aware media.** Static previews are the baseline; high-cost media loads only when justified and is cleaned up.
11. **Secure restricted content.** UI never implies that client state grants access and never exposes a restricted original URL or identifier.
12. **Incremental migration.** Compatibility aliases and route-by-route verification are preferred over a visual rewrite.

## 4. Typography

### Font policy

**Approved — SF Pro Rounded is the unified future public UI and display family.** The only exception is the Neuevault wordmark, which retains TBJ Neuetra.

The repository's local static WOFF2 set—not Grainient files—is the production source. The approved production weight set is:

| CSS weight | Proposed local file | Approved roles |
|---:|---|---|
| 400 | `SF-Pro-Rounded-Regular.woff2` | body, captions, metadata, fields |
| 500 | `SF-Pro-Rounded-Medium.woff2` | navigation, labels, category titles, hero eyebrow |
| 600 | `SF-Pro-Rounded-Semibold.woff2` | buttons, headings, card titles |
| 700 | `SF-Pro-Rounded-Bold.woff2` | hero/major emphasis only |

Exact font metadata, internal family/subfamily names, filename-to-weight mapping, and parser behavior require ordinary implementation validation. Those checks establish correct integration; they do not reopen the decision to use SF Pro Rounded. Black, Heavy, Light, Thin, and Ultralight are excluded from the public UI set unless a later approved specification adds a genuine role. The required 400/500/600/700 set must not be reduced.

Required declaration policy during implementation:

- family name: `"SF Pro Rounded"` consistently;
- normal style only unless an approved italic role and valid local file exist;
- static `@font-face` per real weight; do not claim a variable range;
- `font-display: swap`;
- fallback: `ui-rounded, "Arial Rounded MT Bold", system-ui, -apple-system, "Segoe UI", sans-serif`;
- `font-synthesis: none`; unsupported weights/styles are prohibited;
- preload only faces demonstrated to be critical by measurement.

### Existing font decisions

| Family | Decision | Future role | Rationale and migration notes |
|---|---|---|---|
| TBJ Neuetra | **Approved** | Neuevault wordmark only | Unique brand identity; retain current local variable face and 400 weight role |
| SF Pro Rounded | **Approved** | every public UI/display role | Required product direction; file and browser checks are implementation quality validation |
| Arimo | **Removed from the future system**, compatibility only | none | May remain temporarily only while hero/category consumers migrate |
| Archivo | **Removed from the future system**, compatibility only | none | May remain temporarily only while the hero eyebrow migrates |
| Inter | **Removed from the future system** | none | It is not locally registered and resolves inconsistently across platforms |
| System UI | **Approved** | fallback only | Provides resilient rendering if local fonts fail |

The final system contains no Arimo, Archivo, or Inter public UI role. Their actual production removal belongs to the separately authorized typography migration phase and occurs only after each migrated role passes hero line-span, category-label, control-width, fallback, and cross-browser checks.

### Typography roles

Values below are future targets. “Preserve then calibrate” means the current metric is the compatibility baseline, but SF Pro Rounded metrics must be visually tested before final token replacement.

| Role | Family | Size | Weight | Line height | Tracking | Responsive behavior | Notes |
|---|---|---:|---:|---:|---:|---|---|
| Wordmark | TBJ Neuetra | 20px | 400 | 1 | .05px | unchanged | Preserve brand lockup |
| Body | SF Pro Rounded | 14px | 400 | 20px | 0 | stable | Default prose/UI |
| Body compact | SF Pro Rounded | 13px | 400 | 18px | 0 | stable | Dense supporting copy |
| Metadata | SF Pro Rounded | 12px | 400 | 16px | .01em | stable | Asset/card details |
| Caption | SF Pro Rounded | 11px | 400 | 15px | .02em | stable | Nonessential annotations |
| Navigation | SF Pro Rounded | 14px | 500 | 20px within 40px viewport | -.05px | preserve metrics; test width at 1200/1440 | Rolling layer contract applies |
| Button | SF Pro Rounded | 14px | 600 | 18px | -.08px | large CTA may use 15px | Singular accessible label |
| Hero eyebrow | SF Pro Rounded | 12px | 500 | 16px | 0 | stable in 28px pill | Archivo is compatibility-only until migrated |
| Hero title | SF Pro Rounded | 46px | 700 | 48px | -2px initial target | current mobile clamps retained initially | Explicit two-line spans must remain |
| Hero description | SF Pro Rounded | 13px | 500 | 14px desktop | -.4px initial target | looser mobile line height | Exact three semantic line groups on fitting widths |
| Route H1 | SF Pro Rounded | 36px | 600 | 40px | -.03em | reduce to 28/32 on narrow screens | Validate long route names |
| Section H2 | SF Pro Rounded | 28px | 600 | 32px | -.02em | 24/28 mobile | Editorial hierarchy |
| Card title | SF Pro Rounded | 16px | 600 | 20px | -.01em | natural wrap | Collection and asset roles may differ by token |
| Category count | SF Pro Rounded | 12px | 400 | 16px | -.01em | 11/15 narrow mobile | Independent line height; 10px stack gap |
| Category title | SF Pro Rounded | 24px | 500 | 29px | -.04em initial target | 16–20px mobile bands | Test every real label before approval |
| Modal title | SF Pro Rounded | 24px | 600 | 28px | -.02em | 22/26 mobile | Asset/auth headings |
| Badge | SF Pro Rounded | 10px | 600 | 12px | .04em | stable | Uppercase only where authored |
| Form field | SF Pro Rounded | 14px | 400 | 20px | 0 | stable | Placeholder must not be the label |
| Empty-state heading | SF Pro Rounded | 24px | 600 | 28px | -.02em | 20/24 mobile | Actionable, user-facing copy |
| Error text | SF Pro Rounded | 13px | 500 | 18px | 0 | stable | Error color plus text, never color alone |
| Footer | SF Pro Rounded | 13px | 400/600 | 18px | 0 | stack on mobile | TBJ remains for footer brand only |

### Migration rules

- No page-specific font family overrides without an approved exception.
- No synthetic weight/style and no declared range unsupported by a file.
- Font tokens describe semantic roles, not “looks bold” or “small gray”.
- Font load failure must expose the documented system fallback without clipped controls.
- Hero semantic line spans remain stable; do not substitute browser balancing.
- Navigation, action buttons, filters, and modal controls require width regression at 1199, 1200, 1439, and 1440.
- Category labels require fixtures for all real titles at 320, 375, 520, 1199, and 1200.
- Chromium and Firefox must have no parser warning, missing-face request, synthetic face, or fractional resting transform.

## 5. Color

**Approved — preserve Neuevault's current palette and acid accent.** Grainient's similar accent supports compatibility but is not the source of the decision.

| Semantic token | Approved value/role | Current source | Migration notes |
|---|---|---|---|
| `--color-canvas` | `#000000` | `--bg-page` | canonical page background |
| `--color-surface` | `#121212` | `--bg-surface` | standard cards/hero fallback |
| `--color-surface-raised` | `#191919` | current raised surface | modal/dialog/popup |
| `--color-control` | `#111111` | `--bg-control` | fields/dark controls |
| `--color-control-hover` | `#151515` | nav pill/current hover | quiet interaction surface |
| `--color-active-surface` | `#151515` | active nav pill | active route plus brighter text/`aria-current` |
| `--color-text-primary` | `#f5f5f2` | `--text-primary` | main copy |
| `--color-text-secondary` | `#c3c4cc` | `--text-secondary` | supporting copy |
| `--color-text-muted` | `#969696` | `--text-muted` | metadata only |
| `--color-text-subtle` | current subtle gray | `--text-subtle` | low-priority text; contrast validation required |
| `--color-text-inverse` | `#000000` | `--text-inverse` | light/acid controls |
| `--color-accent` | `#c2f13c` | `--color-acid` | primary action/focus/emphasis |
| `--color-accent-text` | `#000000` | inverse text | text on acid |
| `--color-border-subtle` | `#262626` | current subtle border | card/media separation |
| `--color-border-default` | `#303030` | current default | fields/panels |
| `--color-border-strong` | `#414141` | current strong | active/hover where necessary |
| `--color-focus-ring` | acid with sufficient opaque outline | current focus token | must contrast against black and light controls |
| `--color-success` | **Requires implementation validation** | no complete semantic system | select accessible green distinct from acid action role |
| `--color-warning` | **Requires implementation validation** | no complete semantic system | select accessible amber |
| `--color-error` | **Requires implementation validation** | auth/download local states | select accessible red with text/icon redundancy |
| `--color-restricted` | semantic restricted foreground/surface | current lock/note roles | cannot imply authentication status alone |
| `--color-overlay` | `rgba(0,0,0,.82)` baseline | current overlay | modal/auth; validate media visibility |
| `--color-media-scrim` | component-local alpha | card/hero overlays | not one global value |

Success/warning/error exact hex values are deferred until contrast testing against canvas, surface, and control backgrounds. Existing error colors remain compatibility values until then.

Global tokens may not absorb asset-specific gradients, hero stops, grain opacity, cover scrims, or per-image readability masks. Text over variable media must meet the approved contrast target in representative bright/dark frames through a local scrim or shadow; it must not rely on a favorable poster frame.

## 6. Spacing and containers

**Approved — preserve the role-based 12/16/24px gutters.** Normalizing everything to 15px is rejected because current roles are intentional and already pass all measured widths.

### Spacing scale and roles

| Role | Approved value | Responsive variants | Existing usage | Notes |
|---|---:|---|---|---|
| Space 1–6 | 4, 8, 12, 16, 20, 24px | none | component gaps/padding | canonical base scale |
| Space 8–16 | 32, 40, 48, 64px | none | larger composition | use only when role fits |
| Page gutter | 12px | 7px at ≤700 | page/hero outer frame | preserve |
| Content gutter | 16px | 12px where narrow | content sections | preserve |
| Navigation gutter | 16px | 16px | header inner | preserve |
| Footer gutter | 24px | 16px mobile | footer | preserve |
| Standard section spacing | current 210px role | about 92px mobile | editorial sections | retain compatibility token; review per composition |
| Gallery/recent spacing | current 170px role | mobile reduction | archive sections | separate legitimate role |
| Standard grid gap | 14–16px by family | 8px mobile where current | collection/category/gallery | use component tokens |
| Control inline padding | 14–16px compact/standard | not below touch need | buttons/nav | size contract controls exact value |
| Icon/text gap | 6–8px | unchanged | icon+text controls | use icon-gap token |
| Card padding | family-specific | mobile reductions allowed | collection/dialog | not imposed on full-bleed media cards |
| Modal info padding | current component token | reduced mobile | asset modal/auth | must preserve scrollable content |

### Container contracts

| Container | Max width | Gutter | Full bleed | Nesting rule |
|---|---:|---:|---|---|
| Page | 2024px | 12px | background may bleed; content does not | top-level route wrapper |
| Wide | 1536px unless component says otherwise | 16px | no | shared broad editorial/nav content |
| Content | 1080px | 16px | no | prose, collections, route sections |
| Editorial | 1080px initial | 16px | exceptional media may bleed | content-driven prose/cards |
| Hero | 1890px | page gutter | video fills frame only | top-level home composition |
| Category grid | 1888px | page gutter | cards fill grid | must not be nested in Content |
| Footer | 1320px | 24px | footer background bleeds | one footer inner |
| Modal | 1180px | viewport safety margin | overlay/backdrop bleeds | never inside page container |

Component-specific maxima are justified only by authored media composition, measured readability, or an approved card geometry. Ordinary alignment may not use negative margins, transforms, cloned page containers, or content-length hacks. Optical hero/media exceptions must be documented through the exceptions policy.

## 7. Breakpoints and responsive policy

**Approved — preserve current boundaries:** 700/701, 1199/1200, and 1439/1440px. They already align shell, navigation, card, modal, and spacing behavior.

| Range | Navigation | Containers | Category grid | Asset grid | Modal | Typography | Notes |
|---|---|---|---|---|---|---|---|
| 320–374 narrow mobile | 60px collapsed | 7px page gutter | 2 columns, 8px gap | 2 columns, 8px gap | full-screen stack | minimum responsive roles | 320 is mandatory |
| 375–700 mobile | 60px collapsed | 7px page/12px content | 2 columns, 8px gap | 2 columns | full-screen stack | fluid mobile roles | touch first |
| 701–1199 tablet/compact desktop | 62px collapsed | 12/16px role gutters | 2 columns, 16px gap | 4 target columns | desktop shell where fit | full role by ~768 | intrinsic wrap allowed |
| 1200–1439 desktop | 62px full nav | capped containers | 4 columns | 4 target columns | max shell | desktop roles | compact nav gap 21px |
| 1440–1920+ wide desktop | 62px full nav | maxima create margins | 4 columns | 4 target columns | max shell | desktop roles | nav gap 38px; component maxima |

**Approved:** category cards remain two columns below 1200 and four at 1200. Grainient's 810px switch is rejected for Neuevault because current real-label geometry, navigation mode, and tested layout support the existing boundary. Any future change needs a separate category-layout proposal and fixtures.

Rules:

- Shared breakpoint constants/tokens must drive JS/CSS where both need the boundary.
- Intrinsic wrapping and `minmax()` may supplement but not silently replace semantic mode changes.
- No component-specific breakpoint without documented evidence and approval.
- Semantics, source order, accessible names, and action availability remain stable across modes.
- Touch modes cannot require hover; no horizontal overflow is permitted.
- 700 and 701, 1199 and 1200, and 1439 and 1440 are paired regression fixtures.

## 8. Radius, borders, shadows, and surfaces

| Role | Approved value | Components | Exceptions |
|---|---:|---|---|
| Compact radius | 8px | compact nested surfaces | only when not a pill |
| Standard radius | 12px | fields/small panels | current component contract may retain 13px nested media |
| Shared card radius | 16px | collection/general card shell | may reduce to 14px at ≤700 |
| Feature card/hero radius | 20px | category, hero, modal where current | no mobile reduction unless clipping/space demands |
| Control radius | 12px or pill by variant | rounded-square controls | size-specific |
| Modal radius | 20px | desktop asset/auth shell | zero/full-screen outer radius on mobile allowed |
| Pill radius | 999px | buttons, nav pills, tags | semantic rounded status only |
| Circle | 50% | circular icon buttons | requires square hit area |
| Subtle border | 1px `#262626` | cards/media | may be inset layer if clipping requires |
| Default border | 1px `#303030` | fields/panels | state tokens replace color |
| Strong/interactive | 1px `#414141` | hover/selected | cannot be sole focus indicator |
| Focus outline | 2px semantic focus ring + offset | all interactive elements | offset adjusted only for clipped contexts |
| Surface shadow | none by default | dark interface | subtle modal elevation only if evidence supports |
| Text/media shadow | local token | hero/category copy | must not become general elevation |
| Overlay | semantic black alpha | modals/auth | media scrims remain local |

**Approved:** the 20px feature-card and pill hierarchy is retained. Grainient corroborates but does not define it. Avoid decorative shadows; borders, surface contrast, and media clipping provide hierarchy.

## 9. Motion

| Motion role | Duration | Easing | Trigger | Allowed properties | Reduced-motion behavior |
|---|---:|---|---|---|---|
| Instant | 0ms | linear | critical state/disabled | none/visibility | same |
| Fast | 150ms | standard | color, border, pill opacity | color, opacity, border-color | immediate |
| Normal | 250ms | standard | controls/overlays | opacity, transform where approved | immediate |
| Slow | 500ms | standard | deliberate composition | opacity/transform | immediate/static |
| Media fade | 400ms | standard | static/animated image layer | opacity | show static |
| Collection/asset media transform | up to 600ms | standard | collection/asset hover or viewport state | transform ≤1.03 | no transform |
| Category reveal | proposed 600ms transform / 400ms opacity; **requires visual calibration** | proposed standard media easing; **requires visual calibration** | category pointer hover or keyboard focus | shared media-wrapper opacity 0→1 and scale 1.4→1 | media visible at opacity 1/scale 1 with no transition |
| Overlay | 250ms | standard | modal/dialog | opacity and small panel transform | immediate |
| Rolling label | 300ms | `cubic-bezier(.76,0,.24,1)` | pointer/focus | transform only | primary layer only |
| Nav pill | 150ms | rolling easing | pointer/focus/active | opacity only | immediate |
| Hover intent | 10ms entry; 0 exit/focus | n/a | pointer | transition delay | none |

**Approved:** rolling travel remains 40px; text enters from above, paired icons from below; entry may settle by 1.5px and rebound .5px; final transforms are exact zero/offscreen states. Exit uses stable transitions without replaying overshoot or showing a blank frame.

**Approved:** ordinary button shells remain stationary. Collection cards may retain the intentional 4px lift; the 1.03 media cap applies only to CollectionCard and AssetCard.

**Approved category geometry:** the shared category media wrapper rests at opacity 0/scale 1.4 and resolves to opacity 1/scale 1 on pointer hover or keyboard focus. Static and animated layers crossfade inside that wrapper so neither layer independently breaks the transform geometry. Touch and reduced-motion states render the wrapper at opacity 1/scale 1. Exact duration/easing remain implementation-calibration questions; the reveal geometry is not open for reconsideration.

Essential content is present without animation. Focus receives hover-equivalent visibility. Touch has a stable first-tap state. Reduced motion exposes static content and disables Lenis/rolling/media movement. `will-change` is scoped to active/hover-capable animation layers and must not be global or permanent. Every observer, listener, timeout, and media source is cleaned up on exit/route disposal.

## 10. Icon system

### Future registry decision

**Approved:** a central framework-neutral icon registry will map semantic names to individually imported/local SVG modules or files. A monolithic sprite is rejected because it complicates per-icon tree-shaking, accessibility, CSP, and authoring. Brand artwork remains outside the utility icon registry.

Proposed locations:

```text
public/assets/brand/          # brand artwork only
src/icons/                   # sanitized UI SVG definitions/modules
src/icons/registry.js        # semantic-name mapping
```

Requirements:

- each icon has a tight, documented `viewBox`; no fixed embedded pixel dimensions;
- default icons use `currentColor`;
- a single icon uses either fills or strokes consistently unless artwork requires both;
- stroke widths are optically normalized at the rendered size;
- no embedded style, script, external reference, raster data, or inaccessible title duplication;
- decorative icons use `aria-hidden="true"` and `focusable="false"`;
- meaningful standalone icons get their accessible name from the control, not a duplicate SVG title;
- inline SVG is preferred for interactive UI because it supports currentColor and predictable geometry;
- CSS masks remain permitted for monochrome decorative/brand applications where inline markup adds no semantic value;
- file `<img>` delivery is reserved for multicolor artwork, not standard controls.

### Canonical sizes

| Role | Size | Evidence/use |
|---|---:|---|
| Compact | 12px | compact badges/metadata only |
| Standard | 16px | bookmark, bolt-scale control roles |
| Medium | 20px | standard button/action icons |
| Large | 24px | modal/icon-only controls |
| Brand | component-specific | 18px current logo artwork in 54×28 shell |

Optical bounds may be smaller than the CSS box, but the box and control hit area remain stable. Icons are aligned by flex/grid, never permanent fractional transforms.

### Unicode replacement inventory

These are future roles only; no replacement occurs in this phase.

| Current symbol | Future icon role | Control | Accessible-name rule | Migration risk |
|---|---|---|---|---|
| `↓` | `download` | public/restricted download | button retains complete textual name | medium: label width and animation layers |
| `↗` | `share` | Copy link | button name remains “Copy link” | low |
| `×` | `close` | asset/auth close | icon hidden; button has contextual Close label | medium: modal geometry/focus |
| `←` | `previous` | modal previous | explicit “Previous asset” | medium: edge control geometry |
| `→` | `next` | modal next | explicit “Next asset” | medium |
| `←` | `back` | Home/All collections | visible text remains; icon decorative | low |
| `●` | `restricted` | asset badge | badge announces “Restricted original” once | medium: visual meaning and placement |
| two CSS bars | `menu`/`close-menu` | mobile disclosure | dynamic accessible label + expanded state | medium: animation and target |

## 11. Buttons

### Foundation

**Approved:** `Button` owns alignment, min-height, horizontal padding, radius, type, icon gap, focus, disabled/loading, and stationary shell behavior.

| Variant | Size | Height | Padding | Radius | Typography | Icon | Use cases |
|---|---|---:|---|---:|---|---|---|
| Accent | compact | 34px | 12px | pill | button 14/600 | 16px | compact primary |
| Accent | standard | 40px | 16px | pill | button 14/600 | 16–20px | Collections/primary |
| Accent | large | 46–47px | 16–20px | pill/22px approved CTA | 15/700 where hero | 16–20px | hero/download |
| Light | compact/standard | 34/40px | 14–16px | pill | 14/600 | 20px | Sign in |
| Dark | standard/large | 40/46px | 16–20px | pill | 14/600 | 16–20px | secondary modal/load more |
| Neutral | standard | 40px | 16px | pill or standard control | 14/600 | optional | low-emphasis action |
| Text | compact/standard | min 34/40px | 8–12px | focus-only/pill when nav | 14/500–600 | optional | back/retry/tertiary |
| Destructive | standard | 40px | 16px | pill | 14/600 | optional | **Deferred until a genuine destructive public action exists** |

Rules:

- use `<a>` for navigation/download URLs and `<button>` for in-page actions; visual variant does not choose semantics;
- disabled anchors are prohibited; unavailable navigation is omitted or explained;
- loading buttons remain named, set busy/disabled semantics, and do not change width;
- rolling labels are allowed only for short stable labels on approved controls;
- duplicate layers are `aria-hidden`; one accessible name remains;
- pressed state may change surface/border but not translate/scale the shell;
- focus-visible is always explicit; touch hit area remains at least 40px, with 44px preferred for isolated critical actions;
- full width is an explicit layout option, not a new variant.

Current mappings: Sign in→Light standard; Collections→Accent standard; hero CTA→Accent large hero composition; modal download→Accent large; share/load more/retry→Dark standard; back links→Text.

## 12. Icon buttons

| Size | Hit area | Icon | Shape | Use |
|---|---:|---:|---|---|
| Compact | 34px minimum | 16px | rounded square/circle | dense noncritical tool only |
| Standard | 40px minimum | 20px | circle or rounded square | menu, share/disclosure |
| Large | 46px minimum | 24px | circle | modal previous/next/close |

**Approved:** close, previous, next, menu, share, optional icon-only download, and disclosure use `IconButton` after icon migration.

Requirements:

- a nonempty contextual accessible name is mandatory;
- tooltip is required when the action is not universally recognizable or when a persistent label is absent, but tooltip never supplies the only programmatic name;
- decorative SVG is hidden from accessibility APIs;
- focus ring remains visible at modal edges and inside clipped containers;
- disabled removes action and exposes disabled semantics;
- icons do not roll independently in icon-only controls;
- edge positioning belongs to the parent composition, not `IconButton`;
- no platform Unicode dependency after the icon phase.

## 13. Rolling labels

**Approved:** retain the current stronger Neuevault rolling contract.

- Supported: short stable text in NavLink, Sign in, Collections, hero CTA, load more, modal text actions, and equivalent buttons.
- Text-only: outgoing primary exits downward; duplicate enters from above.
- Icon+text: text follows that direction; paired icon exits upward and enters from below.
- Travel: 40px.
- Duration/easing: 300ms, `cubic-bezier(.76,0,.24,1)`.
- Pointer entry delay: 10ms; focus and exit: 0ms.
- Entry settling: maximum 1.5px overshoot and .5px rebound; exit has no rebound.
- Rest/active transforms are explicit stable destinations; at least one layer intersects the viewport at every sampled exit frame.
- Duplicate text and icons are `aria-hidden`; accessible name is singular.
- Touch/reduced motion show only the primary layer; first tap activates.
- Active route treatment belongs to NavLink, not the duplicated text layer.

Prohibited: headings, prose, metadata, category titles, identity/account names, changing dynamic labels, loading/error text, destructive confirmations, disabled controls, long labels that wrap, fields, and icon-only controls.

## 14. Navigation

### Approved architecture

- Header remains 62px above 700 and 60px at/below 700.
- Desktop mode begins at 1200; wide nav spacing begins at 1440.
- Brand remains a home link using separate brand artwork + TBJ wordmark and never rolls.
- Desktop and mobile renderings should be driven by one shared navigation/action data model while retaining separate responsive DOM containers if needed for accessibility/layout.
- Route matching remains deterministic and based on canonical route kind/background route—not substring matching.
- Active state remains a quiet persistent `#151515` pill, brighter text, and `aria-current`; no acid hover or underline.
- Collections action maps collection index/detail. Asset routes inherit their background gallery's active route.
- Footer may use the same route data but must not inherit rolling/active header presentation automatically.

### Navigation state matrix

| State | Desktop link | Mobile link | Auth/action | Required behavior |
|---|---|---|---|---|
| Rest | normal text, transparent | full row, normal | permanent button surface | stable geometry |
| Hover | pill + roll | hover-capable only | internal roll | no green/underline |
| Focus-visible | immediate pill + roll + focus ring | same | focus ring + roll | no delay |
| Active route | persistent pill, brighter text, `aria-current` | same | Collections active where relevant | identifiable without motion |
| Menu open | n/a | panel visible, expanded true | mobile actions visible | first focus remains logical |
| Route change | update active | close panel | session persists | focus policy route-specific |
| Reduced motion | immediate pill, one label | one label | one label | no transform/fade |
| Auth loading | nav unchanged | nav unchanged | named stable placeholder/disabled action | no width jump |

### Required remediation

**Approved and required in navigation migration:** Escape closes the mobile disclosure and returns focus to the toggle. Outside click and route change also close it; focus must not be trapped, and body scrolling must follow current panel behavior. This draft does not implement the fix.

## 15. Fields

| Field | Height | Padding | Radius | Surface/border | Typography | States |
|---|---:|---|---:|---|---|---|
| Text/search | 42px | 0 16px | pill or 12px by composition | control/default border | field 14/400 | rest, focus, value, invalid, disabled, loading |
| Select | 42px | 0 16px | same field role | native control styling with semantic border | field 14/400 | rest, focus, value, disabled |
| Textarea (future) | min 96px | 12–16px | 12px | same field role | body 14/20 | rest, focus, invalid, disabled |
| Filter control | 40px min | 12–16px | pill | interactive pill roles | 13–14/500 | rest, selected, focus, disabled |
| Sort control | 42px | 0 16px | field radius | select contract | field | value/focus |

Requirements:

- every field has a persistent programmatic label; placeholder is supplemental;
- focus uses ring plus border, invalid uses text plus color and `aria-describedby`;
- helper/error text has stable spacing and remains present long enough to read;
- loading does not erase user input;
- native select behavior is retained unless a custom select has a documented accessibility need;
- on mobile, labels and controls stack without reducing hit area.

**Approved future URL-state contract:** meaningful search/filter state (`q`, type, tag, category, access, and approved sort) is serialized to canonical query parameters with debounced `replaceState` during refinement and push navigation only when the user commits a new route-level search. Back/Forward restores control state. Implementation is deferred.

## 16. Pills and badges

Rounded elements remain separate semantic families.

| Family | Semantics | Type/padding | Surface | Interaction/accessibility |
|---|---|---|---|---|
| Status badge | informational status | 10/600, 4×8px | semantic state | text/icon redundancy |
| Media badge | format such as GIF | 10/600, compact | dark translucent | decorative format text may be exposed once |
| Restricted badge | access information | 10–11/600 | restricted role | explicit “Restricted original”, not bullet alone |
| Tag | navigation/filter metadata | 12/500, 6×10px | subtle control | anchor when navigational; span when informational |
| Active nav pill | route state surface | nav typography, 16px inline | `#151515` | `aria-current`; not a generic Pill instance if behavior differs |
| Filter pill | interactive selection | 13–14/500, 12–16px | control/selected | button semantics and selected state |

Do not merge all rounded elements into one primitive. `Badge` is informational; `Pill` is a shape/presentation helper used by interactive controls only where semantics are supplied by Button/NavLink/filter components.

## 17. CardShell and MediaFrame

### CardShell

**Approved:** a thin structural primitive may own semantic surface, border, radius, overflow, focus-ring integration, and optional interaction state. It does not own aspect ratio, copy, media position, route semantics, or animation policy.

### MediaFrame

**Approved:** a shared media lifecycle primitive/utility may own:

- static preview, animated layer, and error layer;
- responsive `srcset`/sizes and intrinsic dimensions;
- object fit/position inputs;
- lazy loading/decoding;
- static fallback and load-before-swap;
- restricted rule preventing public animated/original URLs;
- touch/reduced-motion behavior;
- observer/listener/timeout/source cleanup.

Family-specific responsibilities:

- Hero: source selection, poster, viewport video playback, grain/gradient composition.
- Category/Collection: hover/focus activation and authored cover crop.
- Asset: viewport autoplay threshold, masonry geometry, badges, modal trigger.
- Modal: large preview selection, current asset navigation, download state.

## 18. Category cards

### Approved contract

| Property | Decision |
|---|---|
| Grid | 2 columns below 1200; 4 from 1200 |
| Maximum width | 1888px |
| Gap | 16px; 8px at ≤700 |
| Card ratio | 460/478 |
| Max height | none beyond ratio/current grid max |
| Radius | 20px at all current ranges |
| Surface/border | `#121212`, 1px subtle border |
| Copy | centered flex/grid; max 225px; no absolute Figma coordinates |
| Count/title gap | 10px real flex/grid gap between independent count and title line boxes |
| Typography | future SF Pro Rounded roles from section 4 |
| Desktop rest | shared media wrapper opacity 0 and scale 1.4; copy fully visible |
| Hover/focus | shared media wrapper opacity 1 and scale 1; original color; light readability scrim only |
| Touch | shared media wrapper visible at opacity 1/scale 1 without preliminary tap |
| Reduced motion | shared media wrapper visible at opacity 1/scale 1; no transition or animated playback |
| Animated cover | static first; static/animated layers crossfade inside the shared transforming wrapper; public animation loads on hover/focus and unloads after exit/offscreen |
| Restricted | public static preview only |
| Cleanup | all listeners, observers, timers, animated source removed on disposal |
| Focus | explicit ring plus same media reveal as hover |
| Empty count | real count 0 is rendered; route provides user-facing empty state |

**Approved:** adopt the Grainient blueprint's scale 1.4→1 and opacity 0→1 reveal geometry. Neuevault improves the blueprint with keyboard focus parity, visible touch/reduced-motion states, wrapper-based static/animated crossfade, restricted-media safety, and complete lifecycle cleanup. These adaptations correct accessibility and product constraints without weakening the selected visual behavior.

**Approved with adaptation:** future SF Pro category metrics are recalibrated against the current composition. Count and title keep independent line-height roles with a real 10px gap. The card geometry, label wrapping, and centered block remain stable.

The fact that current category records match zero assets is a data/editorial issue. UI migration may not hide, synthesize, or alter counts, filters, or memberships.

## 19. Collection cards

`CollectionCard` remains a distinct editorial link card.

- Semantics: anchor to collection detail with one accessible name.
- Layout: three columns in the current content range; one column at ≤700. A later two-column mode requires separate evidence.
- Media: static preview baseline; optional public animation on hover/focus; restricted covers use public preview only.
- Copy: title, actual derived count/description, optional featured/status metadata.
- Hover/focus: current slight shell lift (maximum 4px) and media scale up to 1.03 are approved; focus has equivalent emphasis and ring.
- Touch/reduced motion: no required hover; stable static card, no lift/animation.
- Loading/error: intrinsic frame preserved; unavailable preview shows named fallback.
- Cleanup: same MediaFrame lifecycle.
- Ratio: collection-specific and content-driven; must not inherit CategoryCard or AssetCard ratio.
- Responsive: copy must not depend on a fixed card height.

Homepage curation limits and public/featured state are data/composition decisions, not CollectionCard variants.

## 20. Asset cards and grids

### AssetCard

- Semantic button opens the asset detail/modal route; stable ID is identity.
- Static responsive preview with intrinsic dimensions is always initial.
- Optional GIF badge, restricted badge, title/category/dimensions overlay.
- Public animated playback activates only while sufficiently visible; restricted/reduced modes remain static.
- Hover/focus may use the current maximum 1.025 media scale and saturation change; overlay content is also available to keyboard users.
- Error/malformed states retain geometry and accessible action/context.
- Card does not expose restricted original URL or protected public ID.
- Listener/observer/source cleanup is mandatory.

### AssetGrid

- Preserve current batching and load-more fallback through compatibility migration.
- Maintain logical DOM order, card focus order, `aria-live` restraint, and modal background context.
- **Deferred:** CSS-column masonry remains current behavior. A future decision must compare visual masonry benefit against row-wise visual/keyboard reading-order expectations before replacing it.
- No primitive may require the entire catalog; grid APIs accept a repository/result source compatible with future cursors.
- Loading must not render duplicate cards, lose scroll, or make Back/Forward rebuild modal context.

## 21. Modals and overlays

### Shared mechanics

`ModalShell` may share backdrop, labelled dialog semantics, focus containment/restoration, Escape, close action, background scroll lock, Lenis stop/start, native nested-scroll exclusion, reduced-motion behavior, and cleanup.

### Asset viewer

- Native History API detail URL remains canonical.
- Opening pushes; Back closes; Forward reopens; direct deep links reconstruct context.
- Desktop max remains 1180px and 94vh/820px compatibility geometry; mobile becomes full-screen stacked at ≤700.
- Media and info regions remain distinct; `.modal-info` uses native scroll.
- Previous/next preserve current list and disabled edges.
- Focus returns to the origin when possible.

### Auth dialog

- Compact dialog uses shared mechanics but not asset-viewer geometry/history.
- States are configured signed out, authenticated, unavailable, loading, and error.
- No credential form is introduced; Discord owns credential entry.

**Rejected:** merging asset modal and auth dialog into one visual component. Only mechanics may be shared. The current secure download/session architecture remains untouched.

## 22. Download and restricted actions

| State | Semantics/label | Variant/icon | Required behavior |
|---|---|---|---|
| Public | link/button “Download original” | Accent large + future download icon | valid public URL, preserves file/animation |
| Restricted signed out | button “Sign in to download” | Light/Accent as composition requires | opens honest auth flow; no original URL |
| Restricted signed in | button “Download restricted original” | Accent large + download icon | calls protected Function; busy state |
| Auth unavailable | disabled button/status “Authentication unavailable” | Neutral disabled | no fake action |
| Loading | same action name + busy status | stable width | no duplicate request |
| Success | action remains; toast/status confirms | no semantic change | downloadable file verified by server |
| Error | action remains retryable + inline/toast error | error semantic role | no secret/URL disclosure |

Authorization is server-only. Browser session state may select UI copy but cannot grant access. Restricted records retain `src:null`; static previews may be public; signed responses remain private/no-store and short-lived.

## 23. Loading, empty, error, and toast states

| System | Semantic role | Content/action | ARIA | Timing/reduced motion |
|---|---|---|---|---|
| LoadingState | status within affected region | concise named progress; no fake completion | `aria-busy`, polite status | delay route indicator to avoid flash; spinner static under reduced |
| EmptyState | section/article | H2/title, explanatory body, optional recovery | no live region unless result changed | immediate, no decorative motion |
| ErrorState | alert for actionable failure; status for passive | clear problem, safe retry/back action | `role=alert` only for newly surfaced urgent error | no auto-dismiss |
| Toast | global transient status | short success/info; errors remain available elsewhere when actionable | polite for success, assertive sparingly | motion removed; enough reading time |

Required mappings:

- route lazy loading→LoadingState with persistent shell;
- grid batch→inline LoadingState;
- session→stable header status, no geometry jump;
- image failure→MediaFrame error;
- search no results/category empty→EmptyState;
- 404→Error/Empty composition with home action;
- auth/download failure→inline ErrorState plus optional toast;
- chunk failure→retryable ErrorState after one safe reload.

Implementation-facing copy such as “local content manager” is marked for future editorial replacement, not changed by component migration.

## 24. Accessibility contract

Non-negotiable requirements:

1. Use semantic links, buttons, fields, headings, landmarks, dialogs, lists, and status regions.
2. Every control exposes one accessible name; decorative/duplicate layers are hidden.
3. All actions work by keyboard and retain logical focus order.
4. Focus-visible is never removed and remains visible over media/overlays.
5. Hover and focus expose equivalent meaningful content.
6. Touch exposes essential content on first activation.
7. Reduced motion preserves content and operation.
8. Mobile disclosure closes on Escape and returns focus.
9. Modals contain focus, close on Escape, restore focus, and preserve underlying history/scroll.
10. Isolated controls target at least 40px; 44px is preferred for critical/mobile actions.
11. Every field has a real label and connected helper/error text.
12. Icon-only controls have contextual names; decorative icons are hidden.
13. Image alt distinguishes informative media from decorative/repeated previews.
14. Live regions are scoped and not overly chatty.
15. Restricted messaging states what is public/private without leaking implementation data.
16. Text/control contrast is validated against all semantic surfaces and representative media frames.
17. Visual reading order and DOM/focus order must not conflict materially.

### Current-issue disposition

| Finding | Classification | Required outcome |
|---|---|---|
| Mobile menu Escape absent | required remediation | phase 6 |
| Singular rolling names | acceptable current behavior | preserve |
| Category pointer/focus/touch/reduced parity | acceptable current behavior | preserve |
| Unicode controls with explicit labels | acceptable temporarily | replace during icon phase without naming regression |
| Restricted preview/original explanation | acceptable current behavior | preserve |
| CSS-column visual order | future validation | phase 10/15 decision |
| Complete signed-in account focus audit | deferred | private-state fixture before phase 6/11 completion |
| Media contrast across frames | future validation | visual/accessibility fixtures |

## 25. Performance-aware UI contract

- Limit active public font faces to demonstrated roles; the required SF Pro Rounded set is 400/500/600/700 plus TBJ for the wordmark, with legacy Arimo/Archivo present only during migration.
- Icons are local and individually importable; no runtime icon CDN or large universal sprite.
- Images use intrinsic dimensions, responsive sources, lazy loading, and static previews.
- Animated media loads only for visible/interactive public states and unloads after exit/route disposal.
- Hidden/restricted/reduced states never load full-resolution animated/original media.
- Hero retains responsive source selection and viewport/reduced-motion pause policy.
- Route-specific primitives remain compatible with dynamic import and cannot force all overlay/search code into entry.
- Primitive APIs accept result/repository inputs and do not import the full catalog.
- Observer/listener/timeout ownership is explicit and cleanup is testable.
- Preload is reserved for measured critical resources; no component preloads every possible state.
- Future cursor/pagination/search adapters may replace the full manifest without changing Card/Grid semantics.

This section is policy only; it does not authorize optimization or catalog migration.

## 26. Primitive APIs

The interfaces are framework-neutral. “Inputs” describe responsibilities, not JavaScript signatures.

### Button

| Field | Description |
|---|---|
| Purpose | Text or icon+text action/navigation control |
| Allowed variants | accent, light, dark, neutral, text; compact/standard/large/full |
| Required inputs | semantic element/action, label, size, variant |
| Optional inputs | icon, rolling label, busy, disabled for buttons |
| States | rest, hover, focus, pressed, disabled, loading |
| Accessibility | singular name; real link/button semantics; busy/disabled exposed |
| Responsive rules | no shell resize; full-width only by explicit composition |
| Migration source | `.button`, sign-in, Collections, hero/modal/load-more actions |
| Prohibited uses | icon-only, fake disabled anchors, arbitrary shell transforms |

### IconButton

| Field | Description |
|---|---|
| Purpose | Compact action represented by an icon |
| Allowed variants | compact/standard/large; circle/rounded-square |
| Required inputs | action, semantic icon name, contextual accessible label |
| Optional inputs | tooltip, disabled |
| States | rest, hover, focus, pressed, disabled |
| Accessibility | explicit name; icon hidden; visible focus |
| Responsive rules | ≥40px target; edge position owned by parent |
| Migration source | modal/auth close, previous/next, mobile menu |
| Prohibited uses | unlabeled icon, rolling icon-only animation, Unicode dependency |

### Icon

| Field | Description |
|---|---|
| Purpose | Render approved local vector artwork |
| Allowed variants | compact, standard, medium, large; fill/stroke families |
| Required inputs | registry name, size, decorative/meaningful mode |
| Optional inputs | title only for standalone meaningful artwork |
| States | inherits currentColor |
| Accessibility | decorative hidden; control supplies name |
| Responsive rules | no distortion; optical alignment within fixed box |
| Migration source | four SVG masks, Unicode/CSS icon inventory |
| Prohibited uses | remote icons, embedded script/style, brand through utility registry |

### RollingLabel

| Field | Description |
|---|---|
| Purpose | Optional visual transition for short stable labels |
| Allowed variants | text-only, icon+text |
| Required inputs | one semantic label |
| Optional inputs | approved icon |
| States | rest, hover/focus active, reverse exit |
| Accessibility | duplicate layers hidden; singular name |
| Responsive rules | touch/reduced show primary only; no wrapping |
| Migration source | current rolling runtime/CSS |
| Prohibited uses | dynamic/long/loading/error/destructive/icon-only content |

### NavLink

| Field | Description |
|---|---|
| Purpose | Canonical internal route navigation |
| Allowed variants | desktop, mobile, footer presentation |
| Required inputs | label, canonical href, route matcher |
| Optional inputs | RollingLabel, active mapping |
| States | rest, hover, focus, active |
| Accessibility | anchor, `aria-current`, singular name |
| Responsive rules | shared data drives responsive presentations |
| Migration source | desktop/mobile main nav and footer links |
| Prohibited uses | substring active detection, nonnavigation actions |

### Field

| Field | Description |
|---|---|
| Purpose | Labelled text/search/select/textarea input |
| Allowed variants | text, search, select, textarea |
| Required inputs | label, name/id, value/change contract |
| Optional inputs | helper, error, disabled, loading |
| States | rest, focus, invalid, disabled, loading |
| Accessibility | persistent label; described helper/error |
| Responsive rules | stack label/control as needed; retain 42px height |
| Migration source | search input and selects |
| Prohibited uses | placeholder-only labels, custom select without need |

### Badge

| Field | Description |
|---|---|
| Purpose | Informational compact status/media/access label |
| Allowed variants | status, media, restricted |
| Required inputs | text/meaning |
| Optional inputs | decorative icon |
| States | informational only |
| Accessibility | meaning exposed once; color not sole cue |
| Responsive rules | no clipping; compact type stable |
| Migration source | GIF, lock, status badges |
| Prohibited uses | interactive filtering/navigation |

### Pill

| Field | Description |
|---|---|
| Purpose | Shared rounded presentation for interactive components |
| Allowed variants | tag, filter, active-surface helper |
| Required inputs | semantic owner component |
| Optional inputs | icon |
| States | owned by Button/NavLink/filter |
| Accessibility | Pill itself adds no semantics |
| Responsive rules | must not reduce target size |
| Migration source | tags, filters, nav surface |
| Prohibited uses | one universal rounded component for all statuses/actions |

### SectionContainer

| Field | Description |
|---|---|
| Purpose | Apply approved max width/gutter/section rhythm |
| Allowed variants | page, wide, content, editorial, hero, category, footer |
| Required inputs | role |
| Optional inputs | semantic element, full-bleed background |
| States | none |
| Accessibility | preserves landmarks/headings |
| Responsive rules | uses shared gutter/breakpoint policy |
| Migration source | current page/content/recent/footer wrappers |
| Prohibited uses | arbitrary max width, negative alignment hacks |

### CardShell

| Field | Description |
|---|---|
| Purpose | Shared surface/border/radius/clipping foundation |
| Allowed variants | standard, feature, interactive |
| Required inputs | semantic owner, radius/surface role |
| Optional inputs | focus integration, restricted/disabled state |
| States | rest, optional hover/focus |
| Accessibility | semantics belong to owner link/button/article |
| Responsive rules | approved mobile radius only |
| Migration source | category, collection, asset, panels |
| Prohibited uses | forcing one ratio/copy/media behavior |

### MediaFrame

| Field | Description |
|---|---|
| Purpose | Safe static/animated/error/restricted media lifecycle |
| Allowed variants | static, animated, video, restricted |
| Required inputs | preview URL, alt mode, dimensions, fit/position |
| Optional inputs | responsive sources, playback URL, observer policy |
| States | loading, static, active, error, restricted |
| Accessibility | correct alt/decorative handling; no hidden original |
| Responsive rules | preserve ratio; touch/reduced fallback |
| Migration source | image utilities, cover/asset playback |
| Prohibited uses | eager hidden originals, uncleared observers/sources |

### CategoryCard

| Field | Description |
|---|---|
| Purpose | Navigate to a category with derived count and cover |
| Allowed variants | static, animated, empty-count |
| Required inputs | stable category id/slug, title, count, preview |
| Optional inputs | public playback URL, description |
| States | desktop rest opacity 0/scale 1.4; hover/focus opacity 1/scale 1; touch/reduced visible at opacity 1/scale 1; error |
| Accessibility | link; title/name singular; focus reveal |
| Responsive rules | 2/4 grid contract, responsive type |
| Migration source | homepage category cards |
| Prohibited uses | invented count, absolute Figma coordinates, hidden touch/reduced media, transforming static/animated layers inconsistently |

### CollectionCard

| Field | Description |
|---|---|
| Purpose | Navigate to collection summary/detail |
| Allowed variants | standard, featured, animated |
| Required inputs | stable slug/id, title, derived count, preview |
| Optional inputs | description, tags, playback |
| States | rest, hover/focus, touch, reduced, error |
| Accessibility | link with singular title/context |
| Responsive rules | 1/3 columns; natural height |
| Migration source | home/index collection cards |
| Prohibited uses | category/asset ratio, authored fake count |

### AssetCard

| Field | Description |
|---|---|
| Purpose | Preview an asset and open stable-ID detail |
| Allowed variants | static, animated, restricted, malformed |
| Required inputs | stable ID, title, preview, dimensions/category |
| Optional inputs | playback, badges |
| States | rest, hover/focus, viewport-active, error |
| Accessibility | button/link contract consistent with modal route; named once |
| Responsive rules | intrinsic ratio in responsive grid |
| Migration source | `AssetGrid` cards |
| Prohibited uses | restricted original URL, filename identity |

### ModalShell

| Field | Description |
|---|---|
| Purpose | Shared accessible overlay mechanics |
| Allowed variants | asset viewer, compact dialog |
| Required inputs | title/label, close action, focus return target |
| Optional inputs | history integration, nested scroll, nav actions |
| States | opening, open, loading/error, closing |
| Accessibility | dialog semantics, focus trap/restoration, Escape |
| Responsive rules | desktop panel/mobile full-screen where specified |
| Migration source | AssetModal, AuthDialog, dialog utility |
| Prohibited uses | merging domain content/security behavior |

### DownloadAction

| Field | Description |
|---|---|
| Purpose | Present public or protected original delivery state |
| Allowed variants | public, restricted signed-out/in, unavailable |
| Required inputs | asset ID, access state, human label |
| Optional inputs | progress/error handlers |
| States | rest, loading, success, error |
| Accessibility | named status; busy/disabled semantics |
| Responsive rules | stable full/standard width in modal |
| Migration source | modal download branch |
| Prohibited uses | client authorization, exposed restricted URL/public ID |

### EmptyState

| Field | Description |
|---|---|
| Purpose | Explain an empty valid result/context |
| Allowed variants | search, category, collection, generic |
| Required inputs | user-facing heading/body |
| Optional inputs | recovery action |
| States | static |
| Accessibility | semantic heading; no unnecessary alert |
| Responsive rules | constrained readable width |
| Migration source | no-results and empty routes |
| Prohibited uses | implementation-facing copy, errors requiring alert |

### LoadingState

| Field | Description |
|---|---|
| Purpose | Name perceptible pending work |
| Allowed variants | inline, route, grid, session |
| Required inputs | status label, affected region |
| Optional inputs | delayed threshold, progress |
| States | pending, complete |
| Accessibility | `aria-busy` and scoped polite status |
| Responsive rules | reserve geometry; no full-shell replacement |
| Migration source | lazy route, grid spinner, session |
| Prohibited uses | fake progress, immediate flash, endless unnamed spinner |

### Toast

| Field | Description |
|---|---|
| Purpose | Transient global confirmation/notice |
| Allowed variants | success, info, error supplement |
| Required inputs | concise message |
| Optional inputs | dismiss action, timeout by severity |
| States | enter, visible, exit |
| Accessibility | scoped live region; actionable error also persists inline |
| Responsive rules | safe viewport inset; no content obstruction |
| Migration source | share/download/auth feedback |
| Prohibited uses | sole location for critical/recoverable error |

## 27. Exceptions policy

An exception is allowed only when a standard primitive/token demonstrably breaks an approved composition or semantic requirement. Every exception record must contain:

| Required field | Meaning |
|---|---|
| Component | exact primitive/component/composition |
| Reason | evidence-based need |
| Route | affected route/state |
| Deviation | exact token/behavior difference |
| Accessibility impact | none or documented mitigation |
| Responsive impact | ranges/fixtures |
| Migration impact | compatibility and cleanup |
| Lifespan | temporary or permanent |
| Owner/review | accountable owner and approval status |

Undocumented one-off branches, ordinary negative-margin alignment, transform layout nudges, content-length hacks, duplicated containers, and page-specific typography families are prohibited. Editorial media crops, hero gradient positions, and singular visual compositions may be permanent exceptions when documented.

## 28. Migration phases

| # | Phase | Prerequisites | Allowed files/expected change | Strategy/compatibility | Regression/testing | Rollback/completion |
|---:|---|---|---|---|---|---|
| 1 | Documentation freeze/baselines | draft approved | docs/evidence only | freeze routes/states/screens | all fixture routes/viewports | rollback docs; complete on approved baselines |
| 2 | Token aliases | phase 1 | `styles.css`, token tests/docs | add aliases before consumer changes | computed-style parity | remove aliases to rollback; no visual delta |
| 3 | Typography/font migration | file metadata/parser/browser baseline | public fonts/CSS/tests as separately authorized | activate required 400/500/600/700 SF Pro set role-by-role; retain Arimo/Archivo only as temporary compatibility; remove Inter role | line wraps, widths, fallback, parser/network, all routes | one-role rollback; complete when TBJ is wordmark-only and every other UI role resolves to SF Pro Rounded |
| 4 | Icon registry/SVG replacement | approved artwork | `src/icons`, assets, component markup/tests | registry plus compatibility symbols until each control passes | names, geometry, currentColor, touch | per-icon rollback |
| 5 | Button/IconButton/RollingLabel | tokens/icons | CSS/helpers/markup/tests | migrate family by family | dimensions, entry/exit, AX names, reduced/touch | modifier compatibility; all mapped controls pass |
| 6 | Navigation/mobile remediation | phase 5 | header/app/nav tests | shared data model; preserve DOM modes; add Escape/focus return | route active, auth, widths, keyboard | old renderer boundary; all nav fixtures pass |
| 7 | Field/Badge/Pill/state primitives | tokens/type | search/pages/styles/tests | structural helpers without URL change yet | forms, labels, loading/empty | per-family rollback |
| 8 | CardShell/MediaFrame | phases 2–5 | card/image/playback utilities/tests | thin shell/lifecycle adapter | media errors, animation cleanup, restricted safety | keep old family renderers until parity |
| 9 | Category grid/cards | phase 8/type approved | category markup/styles/tests | target shared-wrapper opacity 0/scale 1.4→opacity 1/scale 1 and 10px copy gap; current 1.025 behavior remains rollback compatibility only | all labels/viewports; rest, hover, focus, touch, reduced; static/animated crossfade; restricted safety/cleanup | category-only rollback to current compatibility behavior |
| 10 | Collection/Asset cards | phase 8 | cards/grid/styles/tests | separate family migration | animation, grid, modal trigger, order | family-level rollback |
| 11 | Modal/download/auth controls | icons/buttons/modal shell | overlays/styles/tests/functions only if separately authorized | share mechanics only; preserve security/history | focus, Back/Forward, auth, public/restricted downloads | feature flag/old shell; security gate |
| 12 | Route-by-route migration | primitives stable | page renderers/styles/tests | one canonical route family at a time | direct/deep/history/title/scroll | route-level rollback |
| 13 | Accessibility matrix | migrated components | tests/docs and scoped fixes | close known gaps | keyboard/AX/touch/reduced/contrast | no completion with required defect open |
| 14 | Visual regression QA | deterministic fixtures | test config/evidence | compare geometry, mask media variance | Chromium/Firefox widths/states | baseline review required |
| 15 | Catalog UI compatibility layer | stable cards/grid/search API | repository interfaces/UI adapters/tests | decouple components from complete manifest | current 234 records + synthetic paged fixtures | adapter rollback; no transport change |
| 16 | Server pagination/search migration | separate approved architecture | backend/repository/routes as separately authorized | cursor/search/count transport | scale, caching, history, modal neighbors | independently deployable; not design-system completion |

Each phase requires syntax/build/unit/browser checks appropriate to its surface, no unrelated changes, and a reversible boundary. Phase 16 is explicitly not part of the visual-system migration.

## 29. Visual regression specification

Required widths: 320, 375, 520, 700, 701, 768, 1024, 1199, 1200, 1439, 1440, 1600, and 1920.

### Fixture matrix

| Surface | Required states |
|---|---|
| Homepage | initial hero poster/video-safe frame, category/collection/recent sections |
| Navigation | rest, active each route family, hover/focus, collapsed/open mobile |
| Category cards | all four real titles; 10px count/title gap; rest 0/1.4, hover/focus 1/1, touch/reduced visible 1/1; animated/static shared-wrapper crossfade and cleanup |
| Collection cards | standard/featured/animated, error |
| Asset grid | JPEG/PNG/GIF/restricted, loading/error/load-more |
| Search | initial/results/no-results/filter selected |
| Asset modal | public/restricted, first/middle/last, desktop/mobile |
| Restricted state | `nv-166` signed out; approved private fixture for signed in |
| Auth dialog | configured signed out, unavailable, loading/error, approved signed-in fixture |
| Empty state | zero category, search no-results, empty collections where supported |
| 404 | unknown clean route/asset ID |
| Footer | desktop/mobile stack and focus |

Controls:

- freeze video/animated content to deterministic poster/static previews for pixel comparison; separately test playback behavior;
- wait for declared local fonts and fail on fallback/parser errors;
- wait for route/loading settlement with bounded deterministic conditions, not arbitrary long sleeps;
- intercept or fixture network-dependent auth/session states; never store real tokens/cookies/screenshots containing identity;
- compare geometry and typography separately from video pixels;
- verify modal push/Back/Forward while preserving scroll;
- run signed-in private fixtures only in an approved protected environment and redact identity;
- capture paired breakpoint widths to detect one-pixel boundary failures;
- assert no horizontal overflow at every width.

## 30. Open decisions and deferred items

| Decision | Status/reason | Evidence needed | Blocking phase | Owner/next action |
|---|---|---|---|---|
| Exact SF Pro Rounded file metadata mapping | Implementation calibration; use is approved | internal family/subfamily names, `name`/OS2 tables, WOFF2 parser checks, filename-to-weight confirmation | 3 | engineering font audit |
| Cross-browser SF Pro typography calibration | Exact line wrapping/metrics require browser evidence | hero spans, category labels, nav/button widths, fallback snapshots in Chromium/Firefox | 3/9 | design + engineering |
| Category reveal duration/easing | Geometry is resolved at opacity 0/scale 1.4→opacity 1/scale 1; only timing is open | frame-by-frame comparison at pointer/focus entry/exit | 9 | design QA |
| Category breakpoint | Approved 1200 | no new evidence needed; revisit only by proposal | 9 | product/design |
| CSS-column masonry | Deferred | reading-order usability and alternative layout performance | 10/15 | accessibility + engineering |
| Search URL synchronization | Approved future contract, implementation deferred | query/history UX tests | after 7 or route phase | product/engineering |
| Signed-in account-state audit | Deferred for privacy-safe fixture | approved test account/state capture | 6/11/13 | auth owner |
| Modal/auth chunk separation | Deferred; performance choice | chunk/network/first-use measurement | outside visual migration | performance owner |
| Category zero-count correction | Deferred data/editorial issue | authored filters/content decision | independent | content owner |
| Exact success/warning/error colors | Requires validation | contrast matrix on semantic surfaces | 2/7 | design/accessibility |
| Mobile menu Escape implementation | Approved requirement, not implemented | automated keyboard fixture | 6 | engineering |
| Large-catalog repository interface | Deferred architecture | API/cursor/count/search design and scale tests | 15/16 | architecture owner |

## 31. Approval checklist

This draft may be marked `approved` only when reviewers confirm:

- [ ] Authority/status and current-versus-future distinction are understood.
- [ ] SF Pro Rounded metadata, parsing, filename-to-weight mapping, and browser loading checks are sufficient to implement the approved 400/500/600/700 set.
- [ ] TBJ wordmark-only retention and removal of Arimo/Archivo/Inter from final public UI roles are represented consistently.
- [ ] Typography metrics and required calibration gates are accepted.
- [ ] Semantic color roles and deferred status colors are accepted.
- [ ] Role-based gutters and 700/1200/1440 breakpoint policy are accepted.
- [ ] Category 2/4-column geometry, 10px copy gap, and opacity 0/scale 1.4→opacity 1/scale 1 reveal are represented consistently.
- [ ] Icon registry approach and Unicode replacement inventory are approved.
- [ ] Button, IconButton, RollingLabel, navigation, field, badge/pill, card/media, overlay, action, and state contracts are complete.
- [ ] Mobile-menu Escape/focus return is a required remediation.
- [ ] Modal history, Lenis, OAuth/session, and protected-download security remain non-negotiable.
- [ ] Accessibility and performance-aware requirements are testable.
- [ ] Primitive APIs are sufficiently framework-neutral.
- [ ] Exceptions policy prevents undocumented drift without blocking editorial composition.
- [ ] Sixteen migration phases and rollback boundaries are accepted.
- [ ] Visual-regression routes, states, widths, font/media handling, and private-state rules are accepted.
- [ ] Open decisions have owners and phase gates.
- [ ] Large-catalog backend work remains separate.

Approval of this document authorizes planning against these contracts, not an unreviewed all-at-once implementation. Each migration phase still requires scoped authorization, tests, and regression review.
