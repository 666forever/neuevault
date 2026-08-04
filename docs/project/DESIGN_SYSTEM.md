---
title: Neuevault Design System
status: active
authority: project-overview
last-reviewed: 2026-07-31
---

# Neuevault design system

Neuevault uses a restrained editorial interface: near-black surfaces, quiet borders, compact rounded typography, and acid green reserved for primary action, focus, and deliberate emphasis. The deployed interface is the visual baseline. Tokens and primitives make that interface repeatable; they are not permission to redesign it.

## Authority and use

This page is an orientation guide, not the normative product specification. Resolve conflicts in this order:

1. [`NEUEVAULT_DESIGN_SYSTEM_SPEC.md`](../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md) defines the approved system and implementation requirements.
2. [`NEUEVAULT_FINAL_RELEASE_BASELINE.md`](../baselines/NEUEVAULT_FINAL_RELEASE_BASELINE.md) records the verified integrated release.
3. Migration reports, including the [typography](../baselines/NEUEVAULT_TYPOGRAPHY_MIGRATION_REPORT.md) and [token-alias](../baselines/NEUEVAULT_TOKEN_ALIAS_MIGRATION_REPORT.md) reports, provide phase evidence and rollback boundaries.
4. This overview summarizes the resulting system for day-to-day work.

## Token hierarchy

Tokens live in `styles.css` and follow four levels:

1. **Primitives** define palette and numerical scales, such as `--gray-*`, `--space-*`, and `--radius-*`.
2. **Semantic tokens** describe roles, such as `--bg-page`, `--text-muted`, `--border-default`, and `--focus-ring`.
3. **Component tokens** preserve deliberate contracts, such as navigation gaps, control heights, card geometry, and hero composition.
4. **Intentional exceptions** remain local when unique optical or media values cannot form a reusable role, such as crop positions, gradient stops, overlay alpha, and modal navigation offsets.

Component rules consume semantic or component tokens. A raw primitive is acceptable in the token layer or for a documented distinction with no reusable role.

## Foundations

### Color

The palette runs from `--color-black` and `--gray-950` through `--gray-50` and `--color-white`; `--color-acid` is `#c2f13c`. Components use semantic roles:

- backgrounds: page, surface, raised surface, control, modal, overlay, hover surface, and active surface;
- text: primary, secondary, muted, subtle, inverse, accent, and interactive states;
- borders: subtle, default, strong, and interactive;
- interaction: focus ring and deliberate accent action.

Media darkness, hero gradients, cover effects, and readability overlays stay locally tuned because their alpha values depend on authored imagery.

### Typography

- **Public UI and display:** locally served `SF Pro Rounded` Regular 400, Medium 500, and Semibold 600.
- **Wordmark only:** `TBJ Neuetra` at its approved 400 role.
- **No public role:** Arimo, Archivo, Inter, CSS weight 700, italic faces, or synthesized weight/style.

Regular roles include body, metadata, captions, fields, category counts, and ordinary footer copy. Medium roles include navigation, the hero eyebrow and description, category titles, and medium labels. Semibold roles include buttons, the hero title and CTA, route/section/card/modal headings, badges, and emphasized footer copy.

The hero title starts at 46/48px desktop and Semibold 600. Route H1 starts at 36/40px and becomes 28/32px on narrow screens. Section, card, metadata, and control roles use their semantic type tokens rather than recreating family/size/weight declarations.

Font synthesis is disabled. Animated glyph layers settle at exact zero translation and rotation, never at a fractional transform or scale. Browser and Figma rasterization may differ by platform; do not fake antialiasing with blur, filters, or extra shadows.

### Spacing, radius, and surfaces

The base spacing scale is 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px. Semantic roles cover control gaps, section rhythm, page gutters, card padding, and modal spacing. Optical exceptions remain local only when adopting the nearest role would change the approved composition.

Radius roles cover compact controls, standard controls, nested media, cards, feature cards, hero/modal shells, pills, and circles. Important final distinctions include 20px hero/category/modal shells, 20px collection shells with 14px nested media, 15px asset cards, and pill/circular controls. Borders remain quiet; focus uses a visible semantic outline and is never conveyed by color alone.

### Layout contracts

| Family | Final contract |
|---|---|
| Navigation | 1536px inner cap; 62px header |
| Homepage hero | 1890px cap; `1890 / 887`; 887px maximum height |
| Category grid | 1888px cap |
| Collection section | 1440px cap |
| Asset grid | 1440px cap |
| Search | 1180px cap |
| Editorial content | 1080px cap |
| Route hero | 1536 × 400px desktop composition |
| Asset modal | 1180 × 820px desktop shell, capped at 94vh |
| Footer inner | 1320px cap within a full-width footer |

Do not nest wide media families inside the editorial container or reproduce alignment with negative margins and transforms.

## Shared primitives

### Button, IconButton, and Icon

`Button` owns control alignment, minimum height, padding, pill radius, typography, disabled state, focus behavior, and the approved rolling-label option. Its semantic variants cover light authentication, acid Collections, gradient hero CTA, dark/secondary actions, and full-width actions. Button shells remain stationary; only approved internal label/icon layers move.

`IconButton` owns square/circular geometry, accessible naming, disabled state, and focus treatment for icon-only actions. `Icon` resolves semantic names from the local registry, renders with `currentColor`, preserves its viewBox/aspect ratio, and is decorative when the control already owns the accessible name.

Use the registry for menu, close, previous/next, back, share, download, restricted, Discord, bookmark, bolt, and other approved utility roles. Do not introduce utility Unicode symbols, CSS-drawn icons, duplicated inline paths, or an external icon library.

### Fields, filters, badges, and cards

Search inputs and selects share the field surface, 42px height, border, text/placeholder roles, pill radius, padding, and focus treatment. Filter pills are 36px high with an 8px gap and use `aria-pressed` for selection.

Badges, format labels, restricted labels, tags, user controls, and compact status pills share radius and typography roles while retaining distinct semantics. Category, collection, and asset cards share surface, border, clipping, focus, and motion foundations, but keep their own media geometry and lifecycle.

## Navigation and application shell

Desktop and mobile primary navigation use the same ordered route set: Icons, Banners, Wallpapers, and Collections. The active route is identified by `aria-current`, brighter text, and a quiet persistent `#151515` pill—not acid color or an underline. The 62px desktop/70px mobile header is sticky at the viewport top on an opaque black surface; modal and authentication layers remain above it. Sign in/account remains the separate header action.

Rolling labels use a 40px clipping viewport and 40px travel. Text enters from above while paired registry icons enter from below. Pointer entry waits 10ms; pointer exit and keyboard focus are immediate. Label motion lasts 300ms, the navigation pill fades in 150ms, and entry uses the restrained approved settle without corrupting stable rest/active transforms. Duplicate visual layers are hidden from assistive technology. Touch and reduced-motion environments expose the primary layer without requiring animation.

Below 1200px, the mobile menu preserves one-tap navigation, focus restoration, Escape close, outside-pointer close, successful-route close, and body-scroll handling. The brand lockup and wordmark do not participate in rolling animation.

The global header, main, and footer form one application shell. There is one landmark of each type. Short pages keep the footer at the viewport bottom; long pages flow naturally. The footer is full width with one 1320px inner frame and grouped real internal links—never invented destinations.

## Homepage hero

The homepage hero is its own media component and must not be reused as a route hero. It uses the responsive `1890 / 887` composition, centered 658px content column, 20px clipping, video with poster/fallback behavior, the approved linear gradient, and the single non-repeating authored `1890 × 887` grain.

Layer order is content, grain, gradient, video, fallback. Decorative layers do not intercept input. The eyebrow is non-interactive. The two semantic title lines, three semantic description lines, and `Get Full Access` CTA retain their authored copy and responsive fallback. The CTA uses the shared Button/Icon primitive and preserves its route action.

Reduced motion avoids autoplay/motion while retaining poster, grain, gradient, readable content, and a usable CTA. Viewport lifecycle management stops unnecessary playback.

## Category cards

The category grid is capped at 1888px with four columns from 1200px and two below it. Cards use the `460 / 478` ratio and 20px radius. The centered label stack uses SF Pro Rounded Regular 400 for the 12px count and Medium 500 for the 24/29px title, with a real 10px layout gap and responsive mobile calibration.

On hover-capable devices the shared media wrapper rests at opacity 0 and scale 1.4, then resolves to opacity 1 and scale 1 on pointer hover or keyboard focus. Static and animated layers crossfade inside that wrapper. Touch and reduced-motion states remain statically visible at opacity 1/scale 1. Restricted covers remain static, and public animated sources load only while policy permits and are cleaned up after interaction. Content remains accessible without animation.

## Collection cards

The collection section is capped at 1440px. It uses three desktop columns and one mobile column, with a 15px gap; at the cap, cards are approximately 470px wide and 605px tall. Cards use a 20px outer radius and 14px nested-media radius.

Collection shells and media remain stationary and borderless during pointer and keyboard interaction. Hover/focus crossfades over 1s from the authored cover to the first different valid preview in collection membership order; the alternate is loaded before reveal, retained until route disposal, and omitted for one-image collections. Failed alternates leave the original preview visible. Touch and reduced-motion states remain static. Links, counts, badges, restricted-preview safety, and focus behavior remain data-driven and keyboard accessible.

## Asset grid and media lifecycle

The asset grid is a CSS-column masonry layout capped at 1440px, with four desktop columns, a 15px desktop gap, and an 8px mobile gap. Initial rendering batches eight records and advances to sixteen on the next batch. Each asset card contributes one tab stop; nested decorative/media layers do not create extra focus stops.

Intrinsic media geometry is preserved. Static previews load first; eligible animated sources attach only while viewport and interaction policy allow, and observers, listeners, timers, and sources are cleaned up on exit or route disposal. Malformed/failing media receives an honest state. Restricted records never expose an original URL and remain compatible with the same grid geometry.

## Modal, authentication, and protected delivery

The asset modal is a history-aware overlay with an approximately 798/380 desktop media/info split inside the 1180 × 820 shell. Opening updates the canonical stable-ID route; Back closes, Forward reopens, direct routes work, cyclic previous/next navigation works, and gallery scroll is restored. Focus is trapped and restored, Escape closes, the background and Lenis are locked, and the information panel retains native scrolling.

The authentication dialog is a distinct component and route flow, not a modal variant that grants client-side access. Session state, logout, and Discord OAuth remain server-backed.

Restricted previews may be public, but the public manifest keeps the original `src` null. Originals are delivered only through the authenticated Pages Function. Copy link uses the stable public application URL, never a protected Cloudinary identifier or signed original URL. Session and restricted responses remain `no-store`; client state cannot authorize delivery.

## Search, route pages, and states

Search uses the 1180px shell, 42px input/select fields, 36px filter pills, and 8px filter gap. URL-authored query/type state reconstructs on direct load and history navigation. Local search and filter interactions update results without rewriting the URL; a full interactive URL-rewrite policy remains deferred. Search retains batching, result counts, keyboard semantics, and the shared asset grid/modal behavior.

Editorial route content is capped at 1080px. Route H1 uses 36/40px desktop and 28/32px mobile. Collection detail uses the distinct 1536 × 400px route hero. About, back links, tags, loading, empty, error, and Not Found states use shared type, control, surface, and focus roles without borrowing the homepage hero.

Lazy route loading keeps the header/footer mounted, prevents stale async renders, exposes a restrained delayed loading state with `aria-busy`/live status when perceptible, and offers a normal retry state on chunk failure.

## Motion, scrolling, and layers

Motion tokens cover fast interaction, standard UI transition, media/crossfade timing, rolling labels, and the standard easing. Motion is never required to reveal meaning. `will-change` is scoped to active hover-capable animation layers and is never global.

One Lenis instance is initialized centrally for the public application. Reduced-motion visitors and initialization failures retain native scrolling. Route navigation, Back/Forward restoration, and modal history use the explicit shared scroll policy. Modal/auth scroll locks pause Lenis while designated nested panels retain native scrolling.

Named layers cover header, content/control overlays, hero content, asset modal, authentication dialog, and toast. Do not introduce arbitrary z-index values that bypass that order.

## Responsive and accessibility requirements

The approved responsive boundaries are 700/701, 1199/1200, and 1439/1440px. Validate at 320, 375, 700, 701, 768, 1024, 1199, 1200, 1439, 1440, 1890, and 1920px, plus 200%-equivalent zoom.

Every range must preserve containment, no horizontal overflow, readable type, reachable controls, deliberate media crops, usable modal stacking, and stable navigation. Pointer, keyboard, touch, and reduced-motion users receive equivalent content and actions. Focus remains visible; active state is not color-only; controls have singular accessible names; decorative icons are hidden; headings and landmarks remain semantic; dialog containment, Escape, focus restoration, and scroll locking remain intact.

## Adding UI or tokens

**New UI work must use an existing token and component primitive before introducing a new value.**

Add a token only when its value is reused, represents a genuine semantic role, or belongs to an intentional scale. Do not create a token merely to hide an individual literal or introduce one- or two-pixel drift.

For a necessary exception:

1. Confirm that the nearest existing role changes the approved composition.
2. Keep a unique value local.
3. Comment only when intent would otherwise be unclear.
4. Verify responsive, keyboard, touch, reduced-motion, protected-content, and failure states.

Before merging UI work, build the application, compare representative computed styles with the approved baseline, check every supported breakpoint and 200% zoom for overflow, and run the required unit, browser, asset, bundle, cache, secret, and Cloudinary gates.
