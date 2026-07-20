# Neuevault design system

Neuevault uses a restrained, editorial interface: near-black surfaces, quiet borders, compact typography, and acid green reserved for actions, focus, and route state. The deployed interface is the visual baseline. Tokens make that baseline repeatable; they are not permission to redesign it.

## Token hierarchy

Tokens live in `styles.css` and follow four levels:

1. **Primitives** define the palette and numerical scales: `--gray-*`, `--text-*`, `--space-*`, and `--radius-*`.
2. **Semantic tokens** describe interface roles: `--bg-page`, `--text-muted`, `--border-default`, and `--focus-ring`.
3. **Component tokens** preserve deliberate component contracts: `--type-nav-size`, `--control-height-field`, `--radius-media`, and `--nav-gap`.
4. **Intentional exceptions** remain local when they are unique optical or media values, such as hero gradient stops, crop positions, overlay alpha, and modal navigation offsets.

Component rules should consume semantic or component tokens. Raw primitives are acceptable in the token layer and for a documented visual distinction that has no reusable role.

## Color

The primitive palette runs from `--color-black` and `--gray-950` through `--gray-50` and `--color-white`. `--color-acid` is `#c2f13c`.

Common semantic roles:

- `--bg-page`, `--bg-surface`, `--bg-surface-raised`, `--bg-control`, `--bg-modal`
- `--text-primary`, `--text-secondary`, `--text-muted`, `--text-subtle`, `--text-inverse`, `--text-accent`
- `--border-subtle`, `--border-default`, `--border-strong`, `--border-interactive-color`
- `--focus-ring` for keyboard focus

Media darkness, hero gradients, cover grayscale, and readability overlays remain locally tuned because their alpha values are image-dependent rather than general surface colors.

## Typography

- UI: `--font-ui` (`Inter`)
- Brand: `--font-brand` (`TBJ Neuetra`)
- Category and hero copy: `--font-category` (local Arimo variable font, 400–700)
- Hero eyebrow: `--font-hero-eyebrow` (local Archivo variable font, 100–900 with 62–125% width)
- Scale: `--text-xs` through `--text-hero`
- Weights: regular, medium, semibold, bold, and heavy
- Semantic roles: body, nav, button, caption, card title, modal/auth title, and hero title/copy

Use a semantic type role when a component contract exists. Use a primitive size for secondary copy that does not form a repeated role. Preserve the existing tracking tokens for brand, navigation, buttons, and compact labels.

## Spacing and layout

The spacing scale is `4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`. Optical values may remain local when moving them to the scale would alter approved alignment.

Containers:

- Navigation: `--container-nav` (1536px)
- Page/media: `--container-page` (2024px)
- Content sections: `--container-content` (1080px)
- Footer: `--container-footer` (1320px)
- Desktop hero gutter: `--page-gutter` (12px)

Section rhythm uses `--section-space`, `--section-space-wide`, and `--section-space-mobile`. Responsive gutters are applied by the existing breakpoints rather than by component-specific offsets.

## Radius, controls, and icons

Radius roles include compact, standard, card, media, asset, large, hero/modal, pill, and circle. The 13px nested cover and 15px asset radii remain explicit component tokens because they preserve the approved nested geometry. Shared cards reduce from 16px to 14px below 700px.

Control heights:

- Small navigation control: `--control-height-sm` (34px)
- Medium/hero control: `--control-height-md` (40px)
- Search/select field: `--control-height-field` (42px)
- Authentication control: `--control-height-auth` (44px)
- Large modal action: `--control-height-lg` (46px)

Icon roles are small, medium, large, extra-large, circular control, and brand artwork. Masked SVG icons inherit `currentColor`; do not force dimensions that distort their aspect ratio.

## Motion, shadows, and layers

Interactions use `--duration-fast`, `--duration-normal`, `--duration-media`, `--duration-cover`, and `--ease-standard`. Buttons share the hover-lift token. Image scaling, static/animated crossfades, the grid spinner, and toast motion retain their established behavior.

Hero title and description shadows use named tokens. Do not introduce new elevation or glow without an approved visual need.

Layer order:

- Header: `--z-header`
- Asset modal: `--z-modal`
- Authentication dialog: `--z-auth-dialog`
- Toast: `--z-toast`

Media overlays use the low `--z-content-overlay` and `--z-control-overlay` roles. Hero copy sits above both through `--z-hero-content`.

## Component primitives

### Buttons

`.button` owns alignment, minimum height, padding, pill radius, typography, cursor, transition, hover, disabled, and focus behavior. Use existing variants:

```html
<button class="button button-light">Sign in</button>
<a class="button button-accent">Collections</a>
<button class="button button-dark">Secondary action</button>
<a class="button hero-cta">Get Full Access</a>
```

Use a modifier or semantic parent rule for a genuine variant. Do not recreate the button foundation on a feature class.

### Inputs and selects

`.search-input` and `.select` share surface, border, foreground, pill radius, field height, padding, and focus border. New text controls should reuse this foundation before adding a new control contract.

### Cards

Category, collection, and asset cards share semantic surfaces, subtle borders, radius roles, overflow behavior, and motion tokens. Their media ratios and interaction treatments intentionally remain distinct. Modal and authentication panels use the same surface and border roles without being forced into gallery-card geometry.

Homepage category cards use a dedicated responsive contract derived from the Figma composition: `--category-grid-max` is 1888px, the desktop gap is 16px, cards use the 460/478 ratio and a 20px radius, and the centered copy block is capped at 225px. Count and title copy use the locally served Arimo variable font at weight 621, with 12px and 24px sizes respectively and a shared 29px line height. The copy block owns the subtle drop shadow.

On hover-capable devices, category media rests at zero opacity and reveals at full opacity on hover or keyboard focus, with original color and only an 8% readability veil. Non-hover devices keep the static preview visible so the cards do not depend on pointer hover. Public animated covers still load only during hover/focus, unload afterward, and stay static for reduced motion or restricted media. Figma absolute coordinates describe the reference frame only and must never be copied into responsive production components.

### Homepage hero

The homepage hero uses a responsive `1890 / 887` frame capped at 1890px wide and 887px high, with the existing 560px minimum height on non-mobile layouts and the established 540px mobile height. Its content flows naturally inside a centered 658px column; Figma's fixed internal coordinates are reference measurements, not production positioning.

The visual stack is content, the single non-repeating `1890 × 887` authored grain, the Figma linear gradient, video, and the `--bg-surface` fallback. Grain uses `/assets/textures/hero_grain.png` at `100% 100%` and full authored opacity. The gradient is the sole hero shade layer; do not restore the previous radial vignette.

The eyebrow uses Archivo at 12px/500 inside a 28px-high non-interactive pill. The title, description, and CTA use Arimo. Desktop title typography is 46/48px at weight 700; description typography is 13/14px at weight 500. The CTA remains a shared `.button` variant with a 164×47px contract and preserves its `/recent` destination.

### Badges and pills

`.badge`, `.format-badge`, `.lock`, `.tag`, `.filter`, `.user-menu`, and `.sign-out` use the shared pill radius and compact type roles. Preserve format/lock placement and access meaning.

### Modals

The asset and authentication overlays use separate layer tokens and layouts. Asset actions share the button foundation and remain sticky within the information panel. Close and navigation controls use circular radius and control-size roles. Preserve focus trapping, Escape behavior, and background scroll locking.

### Navigation

Navigation uses `--type-nav-*`, `--nav-gap`, semantic link colors, and a visible underline plus color for the active route. The intermediate desktop gap uses `--nav-gap-compact`; mobile menu spacing remains inside the shared breakpoint.

Repeated composition contracts use component tokens: `--brand-gap`, `--nav-actions-gap`, `--hero-frame-*`, `--hero-content-max`, `--tracking-hero-title`, and the hero content-gap tokens. Keep unique crop and overlay adjustments local rather than expanding this set mechanically.

## Responsive and reduced motion

The desktop navigation collapses below 1200px. Shared card radius changes below 700px, the gallery becomes two columns, modal layout stacks, and controls remain reachable. New work must be checked at 320, 375, 768, 1024, 1199, 1200, 1439, 1440, and 1920px.

`prefers-reduced-motion: reduce` disables transitions and smooth scrolling and prevents hero animation behavior. New motion must respect the same media query and must not be essential to understanding or operating a control.

## Adding UI or tokens

**New UI work must use an existing token and component primitive before introducing a new value.**

A new token should be added only when the value is reused, represents a genuine semantic role, or belongs to an intentional scale. Do not create a token merely to hide every individual literal. Do not introduce one-off one- or two-pixel variations when an existing control, spacing, radius, or type role already applies.

When an exception is necessary:

1. Confirm that using the nearest existing role changes the approved composition.
2. Keep the value local if it is unique.
3. Add a short comment only when its intent would otherwise be unclear.
4. Verify responsive, keyboard, and reduced-motion states.

Before merging CSS work, build the application, compare representative computed styles against production, check horizontal overflow at every supported breakpoint, and run the complete unit and browser suites.
