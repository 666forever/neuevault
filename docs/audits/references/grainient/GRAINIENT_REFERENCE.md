# Grainient UI/UX reference

## 1. Scope and methodology

This is a read-only forensic reference for the public site at `https://grainient.supply/`, observed on 23 July 2026. It is not a clone specification. No Grainient font, image, video, SVG, or source bundle is included.

The audit combined:

- Playwright Chromium and Firefox at 320, 375, 520, 768, 800, 1024, 1100, 1199, 1200, 1280, 1366, 1440, 1600, and 1920 CSS pixels;
- Chromium CDP for computed layout, the accessibility tree, performance counters, and network metadata;
- DOM landmarks, `data-framer-name` markers, visible labels, routes, responsive image attributes, rendered fonts, interaction states, and pseudo/border metadata;
- controlled screenshots and JSON evidence in the ignored `.reference-audit/grainient/` directory.

Computed style and rendered geometry take precedence over generated Framer CSS or inline declarations. Repeated items were sampled by component family rather than exhaustively duplicated.

Public routes audited:

| Family | Routes sampled | Result |
|---|---|---|
| Core | `/`, `/pricing`, `/faq`, `/request`, `/contact`, `/freebies` | HTTP 200; rendered public content |
| Authentication/account | `/sign-in`, `/sign-up`, `/reset-password`, `/update-password`, `/account` | HTTP 200; sign-in/up/update rendered; reset/account returned a titled public shell without measurable content in the observation window |
| Legal | `/license-agreement`, `/privacy-policy` | HTTP 200; license rendered; privacy returned a titled shell without measurable content in the observation window |
| Indexes | `/collections`, `/animated-gradientes`, `/all-backgrounds` | HTTP 200; collections and animated rendered; all-backgrounds returned a titled shell without measurable content in the observation window |
| Categories | `/noisy-grainy`, `/smooth-blend`, `/ai-generated` | HTTP 200; heading plus filter/gallery section |
| Details | `/collections/hero-gradients-v3`, `/backgrounds/hero-gradient-v3-01`, `/animated-gradientes/animated-gradient---01` | HTTP 200; animated detail rendered; collection/background details returned titled shells without measurable content in the observation window |
| External tool | `https://shader.grainient.supply/` and its homepage embed | Public link and embedded document observed; the separate application was not forensically audited |

The sitemap also exposes many repeated collection, background, and animated-detail URLs. The representative routes above establish those repeated families; access controls were not bypassed.

## 2. Confidence and evidence legend

- **Confirmed** — directly measured from rendered geometry, computed style, accessibility tree, network response, or browser behavior.
- **High confidence** — corroborated by multiple public signals or browsers but not fully isolated to a single declaration.
- **Inferred** — a reasonable system interpretation from repeated measurements; not an exact source token.
- **Unknown** — not publicly observable, did not render during the observation window, or requires private/authenticated behavior.

Important evidence examples:

- Category title: **Confirmed**, SF Pro Rounded Medium, 24px, weight 500, 28.8px line height, white, 200px maximum rendered width, Chromium and Firefox, 1440px desktop.
- Category breakpoint: **Confirmed**, two columns through 800px and four from 1024px; public responsive image `sizes` narrows the declared switch to 810px.
- Category border: **High confidence**, a 1px `rgba(255,255,255,.1)` Framer border layer is declared through `data-border` custom properties; the anchor's own computed `border` is `0`.
- Motion duration/easing: **Unknown** where Framer's runtime changed inline variant state without an inspectable CSS transition. The report does not invent timing.

Local evidence references include `audit.json`, `targeted.json`, and controlled `categories-{width}.png` screenshots. They remain ignored and are not product assets.

## 3. Global foundations

### Color

| Role | Observed value | Confidence and context |
|---|---|---|
| Page canvas | `#000000` | **Confirmed**, computed `body` background at every viewport |
| Standard card surface | `#141414` | **Confirmed**, category and collection cards |
| Navigation hover surface | `#1a1a1a` | **Confirmed**, desktop nav hover |
| Primary text | `#ffffff` | **Confirmed**, hero, category copy, headings |
| Muted price text | `#666666` | **Confirmed**, crossed/secondary pricing numerals |
| Primary accent | `#c2f13c` | **Confirmed**, primary action surface |
| Subtle card border | `rgba(255,255,255,.1)` | **High confidence**, Framer border-layer variables |
| Dark translucent action | `rgba(0,0,0,.25)` | **Confirmed**, dark “Unlock with Pro” control |

Other gradients, media colors, and shader output are asset-specific and are not promoted to reusable tokens. No universal box shadow was present on the sampled foundations.

### Typography

Actually rendered downloadable fonts on the homepage:

| Family | Loaded weight | Format | Confirmed use |
|---|---:|---|---|
| SF Pro Rounded Regular | 400 | WOFF2 | category counts, body/control roles |
| SF Pro Rounded Medium | 500 | WOFF2 | hero, route/section headings, category titles |
| SF Pro Rounded Semibold | 600 | WOFF2 | price numerals and emphasized labels |
| Inter | 400 | WOFF2 | embedded/third-party content; not the dominant Grainient UI face |

An SF Pro Rounded Bold face is declared in public CSS but was not requested on the sampled homepage. **Confirmed:** Firefox and Chromium loaded the same three SF Pro Rounded faces without a font-parser warning during the audit. The files are hosted by Framer and must not be copied.

Recurring roles:

- Hero H1: **Confirmed**, SF Pro Rounded Medium 500; 32/32px at 320–800, 40/40px at 1024–1199, 48/48px at 1200+; white; normal tracking.
- Route H1: **Confirmed**, 48/48px at 1440.
- Section H2: **Confirmed**, typically 34/40.8px at 1440.
- Category count: **Confirmed**, Regular 400, 12/12px, white, centered.
- Category title: **Confirmed**, Medium 500, 18/21.6px at ≤800, 20/24px at 810–1199, 24/28.8px at ≥1200; white, centered, maximum rendered width 200px.
- Price: **Confirmed**, Semibold 600, 32/38.4px, `-1.6px` tracking.

### Spacing, radius, borders, and effects

- The dominant page/grid gutter is **15px confirmed** at every measured width.
- Repeated grid gaps are **15px confirmed**.
- Category count-to-title flex gap is **10px confirmed**.
- Standard card radius is **20px confirmed**; navigation and controls use **50px confirmed** pill radii.
- Category media is clipped by the card; the image has no independent radius requirement.
- Category media uses no grayscale/filter in either observed state.
- No general grain or text-shadow system was established from the sampled public computed styles; media-specific effects should remain exceptions.

## 4. Page and layout system

Homepage visible order, based on semantic landmarks and `data-framer-name`:

1. navigation;
2. Hero;
3. Categories;
4. Collection;
5. Images/gallery;
6. New tools (Shader and Animated);
7. Screen/product demonstration;
8. Bento Grid;
9. Pricing;
10. 3d Img;
11. Testimonials;
12. Newsletter;
13. footer.

The homepage uses a black full-width shell with many full-bleed sections and 15px internal gutters. The category section is full viewport width, not constrained by the 1440px navbar inner width. At 1920px its four cards are 461.25px wide with 15px gaps.

The navbar content is the notable constrained layout: **High confidence** maximum inner width 1440px, inferred from brand x=15 at 1440, x=80 at 1600, and x=240 at 1920. The header itself remains full width.

At 1440px the homepage is approximately 19,154px tall; this is evidence of a long editorial landing page, not a reusable height. Section-specific vertical spacing varies substantially and should be treated as composition, not a universal scale.

Public route layout families:

- marketing/editorial landing sections;
- price cards plus FAQ;
- category heading + filter/gallery;
- collection index;
- animated-media index/detail;
- account/auth shells;
- single-column legal and contact/request forms;
- footer repeated across rendered routes.

## 5. Header and navigation

### Header geometry

- Desktop begins at **1200px confirmed**.
- Desktop header: **62px high**, `padding-inline:15px`, transparent, relative/static in page flow, not sticky.
- Narrow/tablet header: **70px high**, `padding:3px 15px`.
- Inner content maximum: **1440px high confidence**, centered.
- Desktop middle link cluster: **604.75 × 39.59px** at 1440; positioned centrally.
- Desktop action group: **247.64 × 38px**, 10px gap.

### Brand

- Whole brand link: **133 × 34px**, 7px internal gap, vertically centered; x=15/y=14 on 1440 desktop and y=18 in the 70px narrow header.
- It is a home link and a 34px-high pointer target.
- Artwork/wordmark sub-dimensions and SVG viewBox were not isolated without copying the proprietary mark: **Unknown**.
- Focus used the browser's default-looking `auto 1px` outline in the sampled category link; a custom brand focus treatment was not confirmed.

### Desktop navigation

Links: Collections, Animated Gradients, Shader Tool, Pricing, Request, FAQ.

- Each is an anchor with 10px vertical and 20px horizontal padding, approximately 39.59px tall, 50px radius.
- Link widths reflect label length; Collections measured 105.34px.
- Adjacent anchors meet without a separate flex gap; padding creates the visual spacing.
- Rest surface is transparent; hover surface is **#1a1a1a confirmed**.
- Labels are duplicated into clipped rolling layers. Collections' visible glyph box measured about 65.34 × 19.59px.
- Rest and hover exchange the two layers across roughly a 30px vertical separation. Runtime variant changes appeared complete by the first computed sample, so exact duration/easing are **Unknown**.
- The accessibility tree exposes names such as “Collections Collections”: **Confirmed defect/concern**, not a recommended pattern.
- Active-route styling was not reliably isolated across server navigations: **Unknown**.

### Navbar actions

- Sign in: 92.52 × 38px, white, 10px 14px padding, 50px radius.
- Get Pro Access: 145.13 × 38px, `#c2f13c`, same padding/radius.
- Action group gap: 10px.
- Both are links. Duplicated visual text is also present.

### Mobile navigation

At 1199px and below the desktop link/action clusters are removed and the 70px header variant is used. The brand remains 133 × 34px. A replacement menu control exists visually in the variant, but its reliable semantic label, open-panel geometry, focus containment, and scroll-lock behavior were not captured: **Unknown**. The breakpoint itself is **Confirmed at 1200px**.

## 6. Button and control system

Confirmed families at 1440px:

| Family | Example | Geometry | Surface / padding / radius |
|---|---|---|---|
| Light compact | Sign in | 92.52 × 38px | white; 10px 14px; 50px |
| Primary compact | Get Pro Access | 145.13 × 38px | `#c2f13c`; 10px 14px; 50px |
| Primary large | Get Pro Access | 163.27 × 47.2px | `#c2f13c`; 14px 19px; 50px |
| Dark | Unlock with Pro | 200 × 51.2px | `rgba(0,0,0,.25)`; 16px 30px; 50px |
| Light large | pricing purchase | 310 × 47.2px | white; 14px 19px; 50px |
| Nav text pill | Collections | 105.34 × 39.59px | transparent → `#1a1a1a`; 10px 20px; 50px |
| Form submit | Get Notified/request/contact | semantic submit input/button | dimensions vary by form; exact shared primitive unconfirmed |
| FAQ disclosure | FAQ rows | button semantics observed | disclosure geometry/motion not fully sampled |

The sampled controls are predominantly anchors, even when visually button-like. Control shells did not show a computed border or box shadow. Text layers use the same rolling duplication family in nav and several calls to action. Icon dimensions could not be reliably separated from Framer wrappers, and the sampled computed control collection did not expose direct child SVGs; do not infer a universal icon size.

Pressed, disabled, loading, and validation states were not safely triggerable without submitting public forms or entering commerce/auth flows: **Unknown**.

## 7. Category grid and cards

This section is the most fully measured component.

### Simplified rendered structure

```html
<section data-framer-name="Categories">
  <a href="/category" data-border>
    <div data-framer-name="img">
      <img loading="lazy" alt="Category name" srcset="…">
    </div>
    <p>( count ) Type</p>
    <h4>Category title</h4>
  </a>
</section>
```

The media is absolutely positioned; the anchor itself is a flex container with column content, `align-items:center`, `justify-content:center`, and a 10px gap. Thus the copy is genuinely centered by flex layout, not by copied Figma coordinates or a transform.

### Grid and geometry

- Section: full viewport width, 15px horizontal padding, 15px row/column gap.
- Columns: two below 810px; four from 810px.
- Card surface: `#141414`; 20px radius; clipped overflow.
- Card border: Framer border layer, approximately 1px `rgba(255,255,255,.1)` (**High confidence**).
- Card ratio below the height cap: approximately width/height `0.878`, or height ≈ width × 1.139.
- At 1920 the first card is 461.25 × 500px: the 500px maximum height changes the ratio.

Representative confirmed sizes:

| Viewport | Columns | First card (W × H) |
|---:|---:|---:|
| 320 | 2 | 137.5 × 156.58 |
| 375 | 2 | 165 × 187.89 |
| 520 | 2 | 237.5 × 270.45 |
| 768 | 2 | 361.5 × 411.67 |
| 800 | 2 | 377.5 × 429.89 |
| 1024 | 4 | 237.25 × 270.17 |
| 1199 | 4 | 281 × 320 |
| 1200 | 4 | 281.25 × 320.28 |
| 1440 | 4 | 341.25 × 388.61 |
| 1920 | 4 | 461.25 × 500 |

At 1440, the two text nodes occupy 12px and 57.59px, separated by 10px. Their combined 79.59px block has equal 154.5px space above and below: **Confirmed exact centering**.

### Typography

- Count: SF Pro Rounded Regular, 400, 12/12px, white, centered.
- Title: SF Pro Rounded Medium, 500, white, centered, max width 200px.
- Title bands: 18/21.6px below 810; 20/24px at 810–1199; 24/28.8px at 1200+.
- Tracking is normal in computed style.

### Media and states

- Desktop rest: opacity 0, scale 1.4, centered transform origin.
- Desktop pointer hover: opacity 1, transform none, original color (`filter:none`).
- Pointer exit: immediately returned to opacity 0 and scale 1.4 in sampled computed frames; an intermediate CSS transition was not observable.
- Image: `object-fit:cover`, centered object position, responsive `srcset`, `loading=lazy`.
- Touch/narrow mode: media is already visible at opacity 1 with no transform; no hover is needed.
- Keyboard focus: focusing the anchor did **not** reveal the image in the controlled Chromium sample; default 1px auto outline remained. This differs from pointer behavior.
- Reduced motion: emulated `prefers-reduced-motion:reduce` kept the desktop rest state even on pointer hover. This suppresses the reveal rather than presenting a visible static image.
- Animated category: a muted looping video is present for the animated family. Its exact hover load/unload policy was not fully isolated; the homepage DOM had one autoplay/preload-auto video and two preload-none paused videos.

## 8. Other cards and media components

### Collection cards

A representative Hero Gradients V3 collection link at 1440 measured 460 × 594.52px, `#141414`, 20px radius, 5px padding, clipped overflow. It contains a media preview, title, and descriptive metadata (“48 Ultra creative…”). Featured cards add a textual badge. Collection cards form a visually taller editorial family than category cards.

### Gallery/background items

Category routes expose image grids with responsive Framer images. The homepage reported 97 lazy images and 7 auto-priority images. Public background detail pages did not render measurable content in the audit window, so download-card geometry and protected states remain **Unknown**.

### Animated media

`/animated-gradientes` rendered 20 video elements and the representative animated detail rendered one video with its title in a two-column detail composition. Homepage “Animated Backgrounds” and Shader tool cards are distinct large promotional families. Video policies vary: one homepage video autoplayed muted/looped with preload auto; two other homepage videos were paused with preload none.

### Tool, bento, pricing, testimonial

- Tool promotions combine large visual media, 34/40.8px headings, descriptive copy, and pill CTAs.
- Bento cards vary intentionally in span, media, and copy density; they are not a single fixed-ratio primitive.
- Pricing uses paired cards and semibold 32px price typography, followed by FAQ disclosures.
- Testimonials use article/figure semantics in the accessibility tree.

Empty/auth-gated shells were observed on several routes, but no designed empty-state component was reliably visible.

## 9. Search and filters

A public search control was not found in the sampled navigation or route inventory: **Absent**.

Category pages include a semantic “Filter” section, but no native `<select>` was present in the homepage audit and the exact category filter pill/dropdown states were not fully exercised. Sorting, pagination, load-more, toggle, and empty-result treatments are therefore **Unknown**. Newsletter, request, contact, and update-password forms establish field families, but should not be generalized into search behavior.

Homepage newsletter:

- form width 480px and height 59px at 1440;
- email input placeholder “Type your email here”;
- submit control “Get Notified”;
- one semantic form landmark.

## 10. Modals and overlays

No semantic `<dialog>` and no public asset-detail overlay was present in the sampled homepage or route states. Representative background/collection detail URLs returned HTTP 200 and correct document titles but did not render measurable content in the observation window, likely because of loading, membership, or client-state requirements.

Therefore backdrop color, panel geometry, focus trap, Escape behavior, previous/next controls, scroll locking, and download actions are **Unknown**. The audit did not bypass authentication or commerce. The animated detail is a route page, not a confirmed modal.

## 11. Footer

The rendered homepage and public content routes use a semantic `<footer data-framer-name="Desktop">`. It includes grouped headings (“Grainients”, “New”, “Created by”, “Information”, “Legal”), route links, creator/legal information, and the brand treatment.

Confirmed structural behavior:

- full-width black context;
- repeated site links rather than a minimal legal strip;
- heading groups use H5 semantics;
- the desktop footer is present on most rendered public routes.

Exact footer container width, top padding, link gap, mobile stack order, and hover duration were not independently captured: **Unknown**. Accessibility names inherit the same duplicated rolling-text problem for some repeated links.

## 12. Responsive behavior

| Mode | Actual widths observed | Navigation | Categories | Hero type | Other observations |
|---|---|---|---|---|---|
| Narrow mobile | 320, 375 | 70px collapsed | 2 columns, 15px gutter/gap | 32/32px | no horizontal overflow; visible category media |
| Mobile/tablet | 520, 768, 800 | 70px collapsed | 2 columns | 32/32px | card dimensions grow fluidly |
| Tablet | 1024, 1100, 1199 | 70px collapsed | 4 columns | 40/40px | category title 20/24px |
| Desktop | 1200, 1280, 1366, 1440 | 62px full nav/actions | 4 columns | 48/48px | category title 24/28.8px |
| Wide desktop | 1600, 1920 | 62px, 1440px centered inner | 4 full-width columns | 48/48px | nav side margins grow; category cards cap at 500px high |

Confirmed breakpoints:

- **810px:** category grid 2 → 4 columns and category type 18 → 20px.
- **1200px:** full desktop navigation, 70 → 62px header, hero 40 → 48px, category type 20 → 24px.
- Hero 32 → 40px occurs between 800 and 1024; public responsive bands imply 810px, but the exact declaration was not separately traced: **High confidence 810px**.

All 15 mandated viewport widths had `scrollWidth == viewport width`; no horizontal overflow was observed.

## 13. Accessibility observations

Positive observations:

- semantic `main`, `nav`, `header`, `section`, `footer`, form, article, figure, and heading structures exist;
- category cards are links; FAQ has button semantics; newsletter has a textbox and submit button;
- category images have descriptive alt text;
- focus produced a visible browser outline on the tested category link;
- reduced-motion emulation changed category interaction behavior.

Concerns:

- The Chromium accessibility tree exposed duplicated rolling labels, e.g. “Collections Collections”, “See all See all”, and duplicated collection titles. Duplicate visual layers were not consistently hidden from assistive technology.
- Of 104 homepage images in the DOM, 75 had empty alt. Many are plausibly decorative or repeated previews, but this was not manually classified one by one.
- The category link accessible name can repeat image alt and visible title/count.
- Pointer hover reveals category media, but keyboard focus did not.
- Reduced motion leaves desktop category media hidden rather than showing a static equivalent.
- Heading order contains an H1, H2s, H3s, H4 category titles, and H5 labels, but accessibility-tree ordering is influenced by Framer layout and does not always follow visual order.
- No modal semantics could be confirmed.

This is an observation, not a formal accessibility conformance assessment. Color contrast was not exhaustively tested.

## 14. Performance-relevant behavior

Single controlled Chromium lab run at 1440 (not a Core Web Vitals field result):

- document: HTTP 200, Brotli, 44,389-byte encoded body, `public,max-age=0,must-revalidate`;
- First Paint / First Contentful Paint: about 312ms;
- DOMContentLoaded: about 327ms; load event: about 1,926ms;
- 76 Resource Timing entries with approximately 2.75MB aggregate transfer size visible to the page;
- response mix observed: 3 documents, 53 scripts, 2 stylesheets, 5 fonts, 27 images, 4 fetches, 1 media, 1 ping;
- CDP snapshot: ~0.64s script duration, ~5.50s task duration, 3,350 DOM nodes, 1,643 event listeners, 21 layouts, 63 style recalculations.

These values are run-specific and third-party-sensitive. Reliable LCP, CLS, INP, TBT, and Speed Index were not collected without an early tracing harness: **Unknown**.

Observable optimizations:

- responsive image `srcset`/`sizes`;
- 97 lazy images and seven eager/auto images on the homepage;
- video preload differentiated by importance;
- Framer JS/font assets use long-lived immutable caching;
- HTML revalidates.

Observable costs/risks:

- numerous Framer modules plus React runtime;
- Lenis CSS from unpkg;
- FramerAuth, analytics/visitor scripts, GTM/Hotjar, LemonSqueezy, Unicorn Studio, and an embedded Shader document;
- a very long page and large media inventory;
- Firefox logged unsupported Feature-Policy names from embedded/third-party content, WebGL deprecation warnings, and a cookie-domain warning.

No invasive security analysis was performed.

## 15. Asset and icon inventory

| Purpose | Public source type | Delivery/behavior | Confidence |
|---|---|---|---|
| Category/collection previews | raster images (PNG/JPEG through Framer image CDN) | responsive `srcset`, cover crop, mostly lazy | Confirmed |
| Animated previews | HTML video/media | muted/looping variants; preload varies | Confirmed |
| Shader preview | cross-origin iframe/document | separate `shader.grainient.supply` embed | Confirmed |
| UI icons | inline/vector wrappers in Framer components | exact viewBoxes/rendered sizes not safely isolated | Unknown |
| Brand mark | linked vector/image treatment | 133 × 34 total brand lockup | Partial, confirmed outer geometry |
| Fonts | WOFF2 on Framer CDN | SF Pro Rounded 400/500/600 actually loaded | Confirmed |

No asset URL is a recommendation to copy. Icon fill/stroke/currentColor behavior and every viewBox remain unresolved because extracting proprietary SVG content was outside the boundary.

## 16. Motion inventory

| Component | Rest | Active | Exit / reduced motion | Confidence |
|---|---|---|---|---|
| Category media | opacity 0, scale 1.4 | pointer: opacity 1, scale 1 | exit returned to rest immediately in computed samples; reduced motion suppresses reveal | States confirmed; timing unknown |
| Nav text | one duplicate above, one centered | layers swap vertically; dark pill appears | reverse behavior not isolated frame-by-frame | Geometry confirmed; timing/easing unknown |
| Nav surface | transparent | `#1a1a1a`, 50px pill | returns transparent | Confirmed |
| Videos | static/paused or muted looping by placement | autoplay only for selected priority media | preload none on secondary videos | Confirmed |
| Smooth scrolling | Lenis CSS/runtime publicly requested | site-level behavior present | reduced-motion implementation not isolated | High confidence |

No reliable duration, pointer-entry delay, spring, overshoot, stagger, or easing curve was exposed by computed CSS; Framer runtime variants reported generic `transition:all` and jumped between inline states. These values are intentionally **Unknown** rather than reverse-engineered from minified application code.

## 17. Reusable patterns

- A 15px page gutter and 15px grid gap form a strong, simple spatial rhythm.
- 20px media/card radii and 50px pills create a clear two-level radius system.
- A black canvas with `#141414` cards and subtle white-alpha borders separates media without heavy shadows.
- Typography changes at the same 810/1200 bands as layout.
- Full-width content grids can coexist with a centered, capped navigation inner.
- Touch variants expose essential media without requiring hover.
- Responsive images and differentiated video preload are useful implementation patterns.
- Distinct card families share surface/radius/clipping while retaining purpose-specific proportions.

Patterns should be adapted to Neuevault's own accessibility, content density, fonts, and existing visual system rather than copied wholesale.

## 18. Intentional exceptions

- Category cards cap at 500px high at 1920, so their wide-screen ratio differs from smaller widths.
- Animated category media uses video rather than the same image-only stack.
- Bento cards intentionally vary spans and internal composition.
- Pricing cards use different text weights, colors, and CTA widths.
- Hero and tool sections use composition-specific large typography and media.
- Auth/account/legal routes may expose public shells without the common page content.
- External Shader UI is a separate product surface and not part of the main component inventory.

## 19. Unknowns and unresolved questions

- Exact desktop link-roll duration, easing, entry delay, and exit interpolation.
- Exact icon viewBoxes, rendered sizes, and currentColor conventions.
- Mobile menu open-state geometry, focus management, scroll locking, and animation.
- Active navigation treatment across every route.
- Authenticated account, download, purchase, disabled, loading, and error states.
- Background and collection detail content that did not render during the public observation window.
- Modal/backdrop/focus-trap behavior, if a modal exists for signed-in users.
- Complete filter control states and pagination/load-more behavior.
- Formal contrast ratios and every decorative-image classification.
- Route-level code splitting, LCP, CLS, INP, TBT, and stable Lighthouse results.
- Whether category animation is intentionally unavailable to keyboard focus or is an implementation gap.
- Exact footer measurements and mobile stacking.

## 20. Neuevault relevance map

| Grainient pattern | Observed values | Potential Neuevault role | Adopt directly? | Adapt? | Reject? | Reason |
|---|---|---|---|---|---|---|
| Navbar inner width | 1440px max, centered; 15px minimum gutter | Header container reference |  | ✓ |  | Neuevault already has its own approved width; the capped-center logic is useful |
| Header bands | 62px desktop; 70px collapsed; switch at 1200 | Responsive navigation structure |  | ✓ |  | Geometry is coherent but must fit Neuevault controls |
| Brand lockup | 133 × 34px; 7px gap | Logo/wordmark alignment reference |  | ✓ |  | Do not copy mark or exact proportions blindly |
| Navigation pills | ~40px high; 10×20px padding; 50px radius; `#1a1a1a` hover | Hover target geometry |  | ✓ |  | Useful target size; Neuevault motion/accessibility is stronger |
| Duplicated rolling labels | Two vertical text layers | Rolling-control technique |  |  | ✓ | Grainient exposes duplicated accessible names |
| Navigation spacing | Zero explicit gap; 20px link padding provides rhythm | Desktop nav spacing |  | ✓ |  | Adapt to labels and intermediate widths |
| Compact controls | 38px high; 14px horizontal padding; 50px radius | Sign-in/primary controls |  | ✓ |  | Good compact family, but Neuevault has established touch targets |
| Large controls | 47.2–51.2px high | Hero/modal CTAs |  | ✓ |  | Normalize within Neuevault tokens rather than copying every variant |
| Accent | `#c2f13c` | Existing Neuevault acid role | ✓ |  |  | Already matches the approved Neuevault accent |
| Page/grid gutter | 15px at all measured widths | Gallery and homepage rhythm |  | ✓ |  | 16/12px token alignment may be cleaner in Neuevault |
| Category columns | 2 below 810; 4 from 810 | Homepage category grid |  | ✓ |  | Clear breakpoint, but test Neuevault title length/content |
| Category surface | `#141414`, 20px radius, subtle white-alpha border | Category-card shell |  | ✓ |  | Compatible visual role; preserve Neuevault token hierarchy |
| Category ratio | ~0.878 W/H, capped at 500px height | Category-card proportion |  | ✓ |  | Different from Neuevault's approved ratio; use only if composition benefits |
| Category centering | Flex column, align/justify center, 10px gap | Reliable copy positioning | ✓ |  |  | Robust and responsive; no absolute coordinates |
| Category typography | count 12/12 regular; title 18→20→24 medium, max 200px | Count/title scale |  | ✓ |  | SF Pro Rounded cannot be copied; map to approved local font |
| SF Pro Rounded roles | Regular 400, Medium 500, Semibold 600 | Typographic role reference |  | ✓ |  | Use role hierarchy, not Grainient's proprietary font files |
| Category reveal | desktop opacity 0/scale1.4 → opacity1/scale1; touch visible | Media interaction concept |  | ✓ |  | Scale 1.4 is aggressive; keyboard/reduced-motion parity must be fixed |
| Category focus behavior | Focus did not reveal image | None |  |  | ✓ | Inaccessible divergence from pointer behavior |
| Card radius system | 20px cards, 50px pills | Radius hierarchy | ✓ |  |  | Matches common Neuevault roles |
| Motion easing | Runtime-controlled; exact curve unknown | None until measured |  |  | ✓ | Do not invent or copy unverified timing |
| Responsive images | `srcset`, `sizes`, lazy loading | Media pipeline reference | ✓ |  |  | Directly applicable principle, not proprietary content |
| Video preload tiers | priority autoplay/preload auto; secondary preload none | Animated media policy |  | ✓ |  | Neuevault should retain viewport and reduced-motion safeguards |
| Footer information architecture | grouped product/new/creator/info/legal columns | Footer organization |  | ✓ |  | Useful grouping; content and exact spacing remain Neuevault-specific |
| 15px footer/page rhythm | consistent outer gutter | Footer alignment |  | ✓ |  | Align to Neuevault page-gutter tokens |
| Third-party-heavy landing page | 53 script responses, iframe, analytics/tooling | Performance caution |  |  | ✓ | Neuevault should avoid inheriting this runtime cost |
