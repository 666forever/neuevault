---
title: Neuevault Footer and Application Shell Migration Report
status: completed
authority: migration-evidence
date: 2026-07-30
phase: 12-footer-application-shell-alignment
---

# Neuevault footer and final application-shell alignment

## 1. Phase status

Phase 12 is complete. The complete local release gate and Pages-runtime
verification passed before publication. The footer and short-page shell are aligned without
changing route content, cards, grids, Search, overlays, authentication,
downloads, data, Cloudinary, or prior visual phases.

## 2. Files changed

- `index.html`
- `styles.css`
- `tests/unit/design-system.test.js`
- `tests/unit/footer.test.js`
- `tests/e2e/prototype.spec.js`
- five checklist-only historical migration-report corrections
- this report

Ignored evidence is indexed by
`.reference-audit/neuevault/footer-shell/manifest.json`.

## 3. Current footer inventory

Before Phase 12, `index.html` owned one persistent semantic footer containing
only the existing home/brand link, “Independently curated. Built for
discovery.”, and `© 2026 Neuevault`. It had no grouped navigation and no
external links. The 1320px footer used 24px gutters, 180px top separation,
50/45px padding, a subtle divider, 11px text, and a 131px desktop height.
Through 700px it became a three-item grid with 100px separation and a 230px
height.

The logo artwork was already decorative, but the footer text lacked the
canonical `.brand-wordmark` class and therefore did not explicitly own the
approved TBJ role.

## 4. Current shell inventory

`index.html` owns one header, `main#app`, one footer, modal/auth roots, and the
toast. `app.js` replaces only main content, so footer rendering and listener
cleanup are not route-owned. Before this phase, body was not a column shell.
Short About and Not Found routes ended around 760px and 707px respectively in
a 1000px viewport, leaving the footer above the viewport bottom. Long pages
flowed normally.

## 5. Reference/current/target measurements

Grainient confirms a full-width black footer context, repeated grouped site
links, group headings, creator/information/legal organization, and a repeated
footer landmark. Its exact width, padding, gaps, mobile order, and hover timing
are **Unknown**. Neuevault's approved specification is authoritative.

| Contract | Reference | Current | Target/final |
|---|---|---:|---:|
| Outer footer | full-width black context | capped element | full-width shell |
| Inner maximum | Unknown | 1320px | 1320px |
| Gutter | Unknown | 24px all widths | 24px desktop / 16px mobile |
| Content separation | Unknown | 180px / 100px mobile | 128px / 80px mobile |
| Padding | Unknown | 50/45px | 48/40px desktop; 40/32px mobile |
| Typography | Unknown | 11px | 13/18px, 400/600 |
| Information structure | grouped | utility row | brand + two real-route groups + legal |
| Desktop footer height | Unknown | 131px | 386px |
| Mobile footer height | Unknown | 230px | 468px |
| Short-page bottom | Unknown | 707–760px at 1000px | viewport bottom |

## 6. Final footer geometry

`.site-footer` is a full-width normal-flow shell. `.footer-inner` is centered
at `min(100% - 48px, 1320px)`, changing to 16px side gutters through 700px.
Desktop uses 48px top and 40px bottom padding. The primary layout is a brand
column plus two navigation groups; the legal line is separated beneath it.

At 1200/1440/1600/1920 the inner width resolves to
1152/1320/1320/1320px. At 320/375/520/700 it resolves to viewport minus 32px.

## 7. Final surface/divider treatment

The footer remains on the page's black surface, without radius, gradient,
shadow, glow, or floating-card treatment. The inner frame has one semantic
subtle top divider. The legal row repeats the same restrained divider. No
full-page background or preceding component geometry changed.

## 8. Brand treatment

The existing home link, 54×28 logo shell, 18px real logo mask, brand gap, and
“Neuevault.” wording remain. The wordmark now uses the canonical
`.brand-wordmark` role, keeping TBJ Neuetra brand-only. Decorative artwork is
hidden, and the anchor has one accessible name: “Neuevault home”. The existing
descriptor remains under the brand with no new product copy.

## 9. Navigation-group treatment

Only existing internal routes are represented:

- Browse: Recently Added, Icons, Banners, Animated, Wallpapers.
- Neuevault: Collections, Search, About.

Each group is a labelled semantic nav with an H2 and list. Links remain real
anchors and use the existing document-level SPA interception. No social,
external, placeholder, newsletter, contact, legal, or “Coming soon” link was
invented. Footer links intentionally do not use rolling labels; hover/focus is
a restrained color transition.

## 10. Copyright/legal treatment

The exact current wording `© 2026 Neuevault` is preserved. It sits in a
separate legal row, wraps naturally, and uses the approved 13/18px footer role.
No privacy or terms destination exists, so none was fabricated.

## 11. Section-to-footer rhythm

Long routes use exactly 128px between final route content and the footer,
reducing to 80px through 700px. Short pages may have a larger effective gap
because the flexible main region absorbs unused viewport height. This keeps
the footer bottom-aligned without fixed positioning, overlap, or an artificial
blank block inside route content.

## 12. Short-page behavior

`html` has a 100% minimum height; body is a `min-height:100vh` flex column;
`main#app` is the flexible region; footer is nonshrinking normal flow. About,
Not Found, loading, and route-error fixtures keep the footer at or beyond the
viewport bottom. Modal body locking continues to set only overflow.

## 13. Long-page behavior

Homepage, archive, Search results, Search empty, and collection detail retain
natural document height. Their final content-to-footer gap is 128px desktop or
80px mobile. No fixed footer, overlap, asset-grid margin, batching change, or
route-specific height hack was introduced.

## 14. Responsive behavior

- 320–700: brand stacks above a two-column navigation grid; 16px gutters;
  80px separation; readable 13/18px type.
- 701–1199: brand and two groups share a balanced compact desktop grid.
- 1200+: 1320px cap and wider grid distribution.

Chromium and Firefox passed 320, 375, 520, 700, 701, 768, 1024, 1199, 1200,
1439, 1440, 1600, and 1920px without overflow or clipping.

## 15. Cross-route shell audit

All 182 settled route/viewport/browser records contain exactly one header, one
main, and one footer in logical DOM order. The tested routes are Home, Icons,
Search results, Search empty, collection detail, About, and Not Found.
Deterministic loading and route-error fixtures also retain one footer and the
existing busy/alert semantics. Route transitions never duplicate the footer.

## 16. Overflow and zoom audit

Every required width recorded zero horizontal overflow and zero footer
overlap. Long labels, legal text, focus outlines, 320px Firefox, touch, and
scrollbar-width differences remain contained. The cross-browser 200% layout
equivalent (720 CSS pixels at device scale 2) records zero overflow; native
Chromium zoom is verified at publication. No asset-grid or route containment
rule was changed.

## 17. Accessibility

The shell exposes one header, main, and footer landmark in order. Footer groups
have real headings, nav labels, lists, singular link names, and visible
focus outlines. Decorative brand artwork remains hidden. No hidden control,
fake heading, duplicate brand name, placeholder link, or hover dependency was
introduced.

## 18. Reduced-motion and touch results

Touch fixtures show all primary links and activate them on first tap.
Reduced-motion resolves link transitions to `0s`; content and focus remain
visible. The footer has no entrance, parallax, or rolling animation.

## 19. Migration-report publication cleanup

Only supported checklist lines were corrected:

| Phase | Commit | Cloudflare deployment | Correction |
|---|---|---|---|
| Collection geometry | `0401ea8` | `8f1940f1-9f75-45d3-84ff-c3cac661a085` | commit/push and production verification checked |
| Asset card/grid | `e9e63c1` | `77ff715c-253e-47d5-b4bc-15e74cba2757` | commit/push and production verification checked |
| Modal/auth | `2e73d71` | `78434520-634a-4897-bb88-d5412944573c` | commit/push and production verification checked |
| Search/forms | `372a423` | `5fd75bd0-3713-4b7c-90c7-ff42a310a617` | commit/push and production verification checked |
| Route/editorial | `eff359c` | `6112fa68-cd25-4250-bd6c-c9a7127e2f77` | publication lines added and checked |

No historical measurements, conclusions, dates, or technical results changed.

## 20. Visual evidence

Ignored evidence contains 182 Chromium/Firefox responsive records, screenshots
at 320, 700, 1200, 1440, and 1920px, focus for both groups, touch,
reduced-motion, zoom, loading, and error fixtures.

| Area | Classification |
|---|---|
| 1320px footer inner | matched approved contract |
| 13/18px footer type | matched approved contract |
| Grouped real-route information structure | intentionally adapted |
| Short-page bottom alignment | matched shell objective |
| Grainient exact geometry | remaining unknown |
| External link treatment | not applicable; none exists |

## 21. Console, network, and bundle results

The 182 settled records contain no console warning/error and no unexpected
request failure after the local session endpoint is deterministically
fulfilled. The final entry is 483,969 bytes (50,014 gzip; 38,229 Brotli);
total JavaScript is 494,018 bytes (54,135 gzip; 41,637 Brotli). The largest
lazy chunk remains the 5,051-byte asset modal. No route or dependency boundary
changed.

## 22. Unit/E2E/build/audit results

| Gate | Result |
|---|---|
| Focused footer/design-system unit tests | pass — 13 |
| Focused footer shell Playwright | pass — desktop/mobile |
| `npm test` | pass — 24 files / 129 tests |
| `npm run build` | pass — Vite 7.3.6 |
| `npm run validate:assets` | pass — 234 assets / 4 collections / 4 categories |
| `npm run test:e2e` | pass — 73 passed / 23 intentional skips |
| `npm run audit:bundle` | pass |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass — 234 manifest records / 235 remote resources |
| Local Pages runtime | pass — direct routes, modal history, session, and restricted boundary |

## 23. Remaining intentional differences

Neuevault uses two concise groups instead of Grainient's broader commercial,
creator, and legal information architecture because Neuevault has no approved
matching destinations. Exact Grainient footer geometry remains unknown.

## 24. Deferred shell/footer work

No new external, social, legal, account, contact, newsletter, or product page
is proposed. A dynamic copyright helper is unnecessary while the preserved
source contract is a current authored year.

## 25. Rollback boundary

One atomic Phase 12 commit is the rollback boundary. Reverting it restores the
three-item utility footer, previous spacing/typography, non-flex body shell,
focused tests, this report, and checklist-only publication corrections. It
does not affect routes, content components, Search, cards, grids, modal
history, authentication, downloads, data, Cloudinary, or prior visual work.

## 26. Completion checklist

- [x] current/reference/target audit completed before editing
- [x] one semantic footer and one main landmark
- [x] real brand, route links, copyright, and copy preserved
- [x] grouped link semantics and singular names
- [x] 1320px width and responsive gutters
- [x] short-page flex shell and normal long-page flow
- [x] no fixed footer, overlap, or horizontal overflow
- [x] keyboard, touch, reduced motion, and zoom fixtures pass
- [x] checklist cleanup limited to supported publication lines
- [x] Chromium/Firefox evidence matrix passes
- [x] complete release gate passes
- [x] atomic commit scope verified
- [x] local Pages runtime and protected boundary pass
