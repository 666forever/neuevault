---
title: Neuevault Search and Form-Control Migration Report
status: completed
date: 2026-07-30
phase: 10-search-form-control-alignment
---

# Neuevault Search and form-control alignment

## 1. Phase status

Phase 10 is complete. Search geometry, native fields, filter
semantics, results summary, and Search empty presentation are aligned through
a scoped compatibility layer. Filtering, ordering, batching, routing, modal
history, authentication, downloads, data, and the catalog architecture remain
unchanged.

The complete local release suite passed. Publication and production results
are recorded in the final handoff for the atomic commit.

## 2. Files changed

- `styles.css`
- `src/pages/searchPage.js`
- `tests/unit/search-state.test.js`
- `tests/unit/search-controls.test.js`
- `tests/e2e/prototype.spec.js`
- this report

Ignored evidence is under
`.reference-audit/neuevault/search-controls/`. Its sanitized index is
`manifest.json`.

## 3. Current Search/control inventory

Search remains the lazy `src/pages/searchPage.js` route module. It reads the
existing `q`, `type`, `tag`, and `category` parameters, filters the stable
repository array synchronously, renders the existing `AssetGrid`, and returns
one cleanup callback for the input debounce.

The control group contains a real search input, native access select, and seven
button filters: All, Icons, Banners, Animated, Wallpapers, Portrait, and
Landscape. Asset batching remains eight records at a time in the existing
CSS-column masonry.

Before this phase:

- the Search panel expanded to the full 2024px page container;
- fields were 42px high with 18px padding, pill radius, and a 1px border;
- the native select measured approximately 167–170px;
- pills were 36px high, with 14px inline padding and 8px gaps;
- active filter state was visual-only;
- result count existed but inherited `display:none`;
- empty results used one dashed, 80px-padded message;
- interactive control changes did not mutate the URL.

## 4. Reference/current/target measurements

Grainient exposes no public Search route, Search filter, select, Search toolbar,
or Search empty state. Those reference values are **Unknown**. Its newsletter
field group is not promoted into a Search contract.

| Viewport | Reference Search width | Current control width | Target | Final |
|---:|---|---:|---:|---:|
| 1200 | Unknown | 1176px | available width, capped 1180px | 1176px |
| 1440 | Unknown | 1416px | 1180px | 1180px |
| 1600 | Unknown | 1576px | 1180px | 1180px |
| 1920 | Unknown | 1896px | 1180px | 1180px |

The approved Neuevault Field contract is authoritative for unknown reference
values. Final Chromium and Firefox geometry matched within sub-pixel
serialization.

## 5. Final route geometry

`.search-content` is centered at `min(100%, 1180px)`. It contains the title,
control panel, and result summary. The asset grid remains outside that cap and
retains the approved wide page container and masonry geometry.

At 1440px and above, the field row resolves to a 998px dominant search input,
170px native select, and 12px gap. At 1200px it resolves to 994/170px inside
1176px.

## 6. Title and introductory copy

The eyebrow, `Search the vault` heading, and approved introductory sentence
are unchanged. The title remains capped at 760px. Search-specific bottom
spacing is 44px; typography, line wrapping, and the broader route-page type
system are unchanged.

## 7. Input/select geometry

Both controls retain native semantics and use:

- height: 42px;
- radius: pill/999px;
- inline padding: 18px;
- border: semantic 1px default border;
- SF Pro Rounded Regular 400 at 14px;
- visible semantic focus border plus the global focus outline.

The search input now has a persistent associated label rather than relying on
placeholder or ARIA text alone. The native select likewise has a persistent
label and retains native arrow, option, keyboard, and touch behavior. The form
submit event is prevented, preserving the prior Enter behavior.

## 8. Filter-pill treatment

Filters retain 36px height, 14px inline padding, 8px wrapping gap, pill
radius, dark inactive surface, and acid selected surface. Hover uses the
existing control-hover surface. Disabled presentation uses the shared opacity.

Each filter now exposes `aria-pressed`; exactly one control is true and click,
Space, or Enter updates the visual and semantic state together. No roving
tabindex or hover-only behavior was introduced.

## 9. Toolbar and result summary

The result heading and real derived result count align with the 1180px Search
column. The count is now visibly displayed beneath the heading. The toolbar is
separated from results by 24px and wraps through the existing mobile
section-head behavior.

Search has no existing clear/reset control or sort control. None was invented.

## 10. Empty/loading/error states

Search-empty results now use a labelled section with:

- heading: `No matching assets`;
- preserved explanatory copy: `No assets match these filters.`;
- semantic surface and solid subtle border;
- 16px card radius;
- 64px desktop and 32px/20px mobile padding.

The existing delayed lazy-route loading state remains scoped, polite,
`aria-busy`, and geometry-stable. The existing one-reload chunk recovery and
retryable route error remain unchanged. Deterministic Chromium and Firefox
fixtures passed; expected console errors occur only in the deliberately
aborted chunk fixture.

## 11. URL/state synchronization

The existing contract is intentionally preserved:

- `q`, `type`, `tag`, and `category` initialize state;
- duplicate values use the first `URLSearchParams` value;
- local input/access/type changes filter without mutating the URL;
- refresh reconstructs the URL-authored state;
- access remains a local control and is not a new query parameter.

The approved specification still records full interactive Search URL
synchronization as deferred. This phase does not invent `pushState` versus
`replaceState` behavior.

## 12. Back/Forward behavior

Direct Search URLs reconstruct correctly. Back from an asset modal returns to
the exact Search URL and restores the originating card focus; Forward reopens
the same stable-ID modal. Search background state, modal history, and scroll
ownership remain unchanged.

## 13. Keyboard and touch results

Tab order is input, native select, filters in source order, result cards, then
batch action. Space and Enter activate filter buttons. The select retains
native arrow-key behavior. Focus rings are visible and unclipped.

Touch fixtures activate a filter on the first tap. Controls do not depend on
hover and no double navigation or stuck state was observed.

## 14. Responsive behavior

- 320–700: full-width stacked input/select; wrapping filters; compact empty
  state; two-column asset grid unchanged.
- 701–1199: dominant input plus readable 170px native select; wrapping toolbar.
- 1200+: control/summary column caps at 1180px; asset grid remains wide.

Chromium and Firefox passed 320, 375, 520, 700, 701, 768, 1024, 1199, 1200,
1440, 1600, and 1920px with zero horizontal overflow.

## 15. Accessibility

The page now exposes one Search landmark, persistent labels for input/select,
one named filter group, singular filter names/state, one understandable result
count, a semantic empty heading, native controls, logical tab order, and
unchanged one-tab-stop asset cards.

Reduced-motion retains all content and immediate field/pill state. No excessive
per-keystroke live announcement was added.

## 16. Visual evidence

The ignored evidence contains 24 final geometry records, Chromium/Firefox
screenshots at the required breakpoint bands, default/populated/empty/long
query/multiple-constraint/focus/touch/reduced fixtures, delayed loading,
chunk-error, and Search-modal history evidence.

| Area | Classification |
|---|---|
| 1180px desktop Search column | matched approved target |
| 42px native fields | matched specification |
| 36px filters and active semantics | intentionally adapted |
| Wide asset-grid geometry | matched previous phase |
| Grainient Search geometry | remaining unknown |
| URL mutation after local changes | intentionally unchanged/deferred |

## 17. Console, network, and bundle results

The settled 24-record browser matrix contains no console warning/error and no
unexpected request failure. Expected chunk fixture aborts are isolated and
labelled. The final entry is 483,247 bytes (49,888 gzip; 38,143 Brotli), total
JavaScript is 493,152 bytes (53,942 gzip), and the largest lazy chunk is 5,051
bytes. The bundle budget passes.

## 18. Unit/E2E/build/audit results

| Gate | Result |
|---|---|
| Search-state unit tests | pass — 4 |
| Search-control unit tests | pass — 5 |
| Focused Search Playwright | pass — 4 |
| `npm test` | pass — 22 files, 118 tests |
| `npm run build` | pass — Vite 7.3.6 |
| `npm run validate:assets` | pass — 234 assets, 4 collections, 4 categories |
| `npm run test:e2e` | pass — 69 passed, 23 intentionally skipped |
| `npm run audit:bundle` | pass — entry 483,247 bytes |
| `npm run audit:cache-headers` | pass |
| `npm run audit:cloudinary-secrets` | pass |
| `npm run cloudinary:verify` | pass — 234 manifest assets against 235 remote resources |
| Local Pages runtime | Search fixtures and protected API boundaries pass |

## 19. Remaining intentional differences

There is no Grainient Search surface to copy. Neuevault retains its own wide
asset result canvas, acid selected filters, native access select, and current
local-only interactive state model.

## 20. Deferred Search work

Full interactive URL synchronization, a future repository/server search
contract, autocomplete, suggestions, fuzzy search, ranking, and server-side
search remain outside this phase. Search still has no clear/reset or sort
control because none existed and no new behavior was authorized.

## 21. Rollback boundary

One atomic Phase 10 commit is the rollback boundary. Reverting it restores the
full-width Search controls, prior title spacing, hidden result count,
visual-only active pills, dashed empty message, focused tests, and this report.

It does not alter or roll back filtering, ordering, batching, routes,
parameters, modal history, authentication, downloads, data, Cloudinary,
typography, icons, cards, masonry, or deployment configuration.

## 22. Completion checklist

- [x] reference unknowns recorded rather than inferred
- [x] current and target measurements recorded before editing
- [x] Search control/summary width aligned
- [x] native input/select geometry preserved and labelled
- [x] filter active semantics aligned
- [x] real result count visible
- [x] stable Search empty state
- [x] loading/error architecture preserved
- [x] URL/query/filter contract unchanged
- [x] modal Search background and history pass
- [x] keyboard/touch/reduced-motion pass
- [x] Chromium/Firefox matrix passes without overflow
- [x] complete release gate passes
- [x] atomic commit and push complete
- [x] Cloudflare deployment and production-host verification complete
