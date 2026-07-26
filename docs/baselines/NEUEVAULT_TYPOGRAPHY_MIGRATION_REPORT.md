---
title: Neuevault Typography Migration Report
status: validation-blocked
authority: migration-evidence-report
based-on:
  - ../specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md
  - ./NEUEVAULT_VISUAL_BASELINE.md
  - ./NEUEVAULT_VISUAL_BASELINE_CAPTURE_REPORT.md
report-date: 2026-07-26
---

# Neuevault Typography Migration Report

## 1. Phase status

The approved Phase 3 direction is now a deliberate hybrid SF system:

- SF Pro Rounded 400, 500, and 600 for public UI/display roles;
- non-rounded SF Pro 700 for the hero title and explicitly approved 700
  display roles;
- TBJ Neuetra for the Neuevault wordmark only.

The specification amendment is complete, but Phase 3 remains
**validation-blocked** because no repository-local non-rounded SF Pro or
SF Pro Display face satisfies every 700 requirement.

## 2. Files changed

This documentation/prerequisite phase changes only:

- `docs/specifications/NEUEVAULT_DESIGN_SYSTEM_SPEC.md`
- `docs/baselines/NEUEVAULT_TYPOGRAPHY_MIGRATION_REPORT.md`

Ignored evidence:

- `.reference-audit/neuevault/typography/sf-pro-700-audit.json`

No production CSS, test, component, public font, source font, dependency,
route, data, authentication, download, category, or deployment file changed.

## 3. Font-file audit

The complete repository and untracked worktree were searched for local
SF Pro, SF Pro Display, SF Pro Text, Bold, and 700 candidates. The strongest
non-rounded candidates are:

| Candidate | Git state | Bytes | SHA-256 | Internal names | Weight | Width | Style | Chromium | Firefox | Result |
|---|---|---:|---|---|---:|---:|---|---|---|---|
| `content/fonts/SF Pro/SF-Pro.woff2` | untracked | 2,483,044 | `375827d39a59f31305420b5e90f1f26d5ace26d1dfad78cfb211ee8ceb9eebb8` | SF Pro / Regular / SF Pro / SFPro-Regular | 400 | 5 | normal | loads | loads | reject: not static 700 |
| `content/fonts/SF Pro Display/SF-Pro-Display-Bold.woff2` | untracked | 1,200,668 | `3cdd77b120a1838f18cbc407a77157d43a58f37b6ab8425e7feac30085b71a30` | SF Pro Display / Bold / SF Pro Display Bold / SFProDisplay-Bold | **600** | 5 | normal | loads | loads | reject: OS/2 is 600 |
| `content/fonts/SF Pro Text/SF-Pro-Text-Bold.woff2` | untracked | 1,193,836 | `30dfe1e791a7993bc32960a58c35d23b3bc2053ef8f8fa483e94dcaa985f2747` | SF Pro Text / Bold / SF Pro Text Bold / SFProText-Bold | **600** | 5 | normal | loads | loads | reject: OS/2 is 600 |

For comparison, the malformed rounded candidate remains ineligible:

| Candidate | SHA-256 | Weight | Width | Style | Chromium | Firefox | Result |
|---|---|---:|---:|---|---|---|---|
| `content/fonts/SF Pro Rounded/SF-Pro-Rounded-Bold.woff2` | `6383cf565981e65fbbdf6b9a88a8aeb447bf3cd79c45fa72fe694bc44c13b6f3` | 700 | 5 | normal | rejected by OTS | rejected by sanitizer | wrong family for amended role and malformed `name` table |

All candidates were tested as local WOFF2 resources with explicit normal
style and requested CSS weight 700. Browser loading does not override the
internal OS/2 weight requirement.

## 4. @font-face declarations

No `@font-face` declaration was added. Phase 3 must eventually publish:

- SF Pro Rounded Regular 400;
- SF Pro Rounded Medium 500;
- SF Pro Rounded Semibold 600;
- a browser-safe local non-rounded SF Pro Bold 700;
- the existing TBJ Neuetra wordmark face.

## 5. Typography token migration

No token was changed. The future token model must distinguish the Rounded
400/500/600 stack from the non-rounded 700 display family rather than relying
on a system-installed family or a fallback accident.

## 6. Consumer migration

The approved future mapping is:

| Family/weight | Roles |
|---|---|
| SF Pro Rounded 400 | body, compact body, metadata, captions, fields, category counts, regular footer |
| SF Pro Rounded 500 | navigation, hero eyebrow/description, category titles, errors |
| SF Pro Rounded 600 | standard buttons, route/section/card/modal/empty headings, badges, emphasized footer |
| SF Pro 700 | hero title and only other explicitly approved 700 display roles, including an explicitly 700 hero CTA |
| TBJ Neuetra 400 | Neuevault wordmark only |

No consumer was migrated in this documentation phase.

## 7. Arimo/Archivo/Inter removal

Arimo, Archivo, and Inter remain removed from the approved future system but
remain current production compatibility families until Phase 3 implementation
passes. No production family was removed in this task.

## 8. Role-by-role metrics

The approved metrics remain unchanged. The hero title row now explicitly reads
SF Pro, 46px, 700, 48px. Every 400/500/600 row remains SF Pro Rounded. Any
explicitly approved 700 control/display role uses the same validated
non-rounded family.

## 9. Responsive validation

Not run because no font was activated. Phase 3 still requires Chromium and
Firefox coverage at 320, 375, 520, 700, 701, 768, 1024, 1199, 1200, 1439,
1440, 1600, and 1920 pixels after a valid four-face set exists.

## 10. Hero validation

The future hero title uses non-rounded SF Pro 700 while preserving its exact
semantic line spans and 46/48 metrics. The current hero remains unchanged.

## 11. Category validation

Category count/title roles remain SF Pro Rounded 400/500. Category geometry,
the current 16px compatibility gap, reveal behavior, animated-cover lifecycle,
touch handling, and reduced motion were not changed. The future category gap
and reveal remain separate phases.

## 12. Accessibility and behavior

No accessible name, role, focus order, route, modal, authentication, download,
mobile-menu, category, or media behavior changed.

## 13. Console and network

The isolated audit loaded the general SF Pro, SF Pro Display Bold, and SF Pro
Text Bold candidates in both Chromium and Firefox without parser messages.
They remain invalid because their OS/2 weights are 400, 600, and 600.

The rounded 700 candidate reproduced its known `name`-table sanitizer failure
in both browsers. No production request or browser bundle changed.

## 14. Build and test results

| Check | Result |
|---|---|
| specification consistency | pass |
| obsolete Rounded 700 requirement removed | pass |
| Rounded roles constrained to 400/500/600 | pass |
| non-rounded SF Pro owns approved 700 roles | pass |
| TBJ wordmark-only | pass |
| no Arimo/Archivo/Inter future role | pass |
| no synthetic/fallback 700 allowed | pass |
| repository/worktree candidate search | pass |
| valid local non-rounded 700 found | **no** |
| production build/tests | not required; no production file changed |

## 15. Visual comparison classification

No visual candidate exists. Classification: **approved design-direction
amendment with unresolved local-font prerequisite**.

## 16. Deferred typography items

The user must supply a local static normal-width SF Pro or SF Pro Display Bold
web font that:

- reports OS/2 `usWeightClass: 700`;
- reports width class 5 and normal style;
- has coherent SF Pro Bold naming;
- loads without sanitizer/parser warnings in Chromium and Firefox;
- is suitable for committed local web delivery.

System-installed SF Pro, synthetic 700, Rounded Semibold 600, Rounded Heavy
800, Rounded Black 900, and the malformed Rounded Bold file are prohibited.

## 17. Rollback boundary

This amendment is documentation-only. Reverting its single documentation
commit restores the previous all-rounded specification and report. It does
not affect production or require a deployment rollback.

## 18. Completion checklist

- [x] hybrid SF direction approved
- [x] Rounded 400/500/600 roles documented
- [x] non-rounded SF Pro 700 role documented
- [x] hero title row amended
- [x] TBJ remains wordmark-only
- [x] Arimo, Archivo, and Inter have no future role
- [x] synthetic, fallback, relabeled, 600-as-700, and 800-as-700 paths prohibited
- [x] repository and untracked worktree searched
- [x] candidates parsed and browser-tested
- [ ] valid local non-rounded SF Pro 700 found
- [x] production CSS untouched
- [x] no font activated, copied, modified, or committed
- [ ] Phase 3 ready to resume

The hybrid design direction is approved, but Phase 3 still requires a valid
local non-rounded SF Pro 700 web font.
