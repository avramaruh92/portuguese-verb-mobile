---
phase: 11-lafa-design-tokens-brand-identity
reviewed: 2026-07-19T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/theme/tokens.ts
  - src/theme/tokens.test.ts
  - app/index.tsx
  - app/quiz.tsx
  - app/results.tsx
  - src/components/OfflinePill.tsx
  - src/feedback/ReportFeedbackModal.tsx
  - src/quiz/share.ts
  - __tests__/quiz-share.test.ts
  - app.json
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase renames the app to "Lafa," replaces the old iOS-default token palette
(`accent`/`secondary`/`error`/`success` = `#007AFF`/`#F2F2F7`/`#FF3B30`/`#34C759`) with a new
Lafa palette (`primary`/`primarySoft`/`success`/`error` = `#E8663D`/`#FCE4DA`/`#2FA84F`/`#D64545`),
and threads the new tokens through every screen and the feedback modal (which previously
hardcoded its own hex values — that anti-pattern documented in `ARCHITECTURE.md` is now fixed).
The mechanical swap itself is clean and consistent — no leftover hardcoded hex values, no logic
changes, tests updated to match. No crash-risk or security issues were found.

The main defect class found is **text/background color-contrast regressions introduced by the
new palette**: several of the new token pairings that are used for on-screen text (primary
button text, offline pill text, correct/incorrect answer highlight text) fall below the WCAG AA
4.5:1 contrast minimum for normal-weight text at the sizes actually used in this app. This is a
systemic, provable defect traceable to the token values themselves (`src/theme/tokens.ts`), not
an isolated per-file mistake, and it affects nearly every primary CTA in the app (Start Quiz,
Next, Share Score, Try Again, Submit feedback) plus the new "Using saved content" pill. A second,
smaller finding: the phase renamed the app in `app.json` but did not update the splash screen /
Android adaptive icon background colors, which are still the old default-Expo blue, not the new
Lafa orange — leaving the launch experience visually inconsistent with the rebrand this phase
claims to deliver.

## Warnings

### WR-01: New palette fails WCAG AA text contrast on primary buttons and status highlights

**File:** `src/theme/tokens.ts:2-5`
**Issue:** The new `colors.primary` (`#E8663D`), `colors.success` (`#2FA84F`), and
`colors.error` (`#D64545`) values are all mid-brightness colors. Computed against WCAG 2.1
relative-luminance contrast math:

- `colors.background` (`#FFFFFF`) text on `colors.primary` background (or the reverse — primary
  text on white/surface background) ≈ **3.28:1**
- `colors.background` text on `colors.success` background ≈ **3.08:1**
- `colors.background` text on `colors.error` background ≈ **4.41:1**
- `colors.primary` text on `colors.primarySoft` background (`#FCE4DA`) ≈ **2.69:1**

All of these are below the WCAG AA minimum of 4.5:1 for normal-weight text under ~18.66px/14pt
bold — which is what every affected label in this app uses (`typography.body` = 16px/400,
`typography.bodyStrong` = 16px/600, `typography.caption` = 14px/400). None of the sizes used
qualify as WCAG "large text" (needs ≥24px regular or ≥18.66px bold), so the 3:1 large-text
exception does not apply.

This directly affects, at minimum:
- `app/index.tsx:183-198` — `startButton`/`startButtonText` (white text on primary orange)
- `app/index.tsx:156-165` — `chipSelected`/`chipTextSelected`
- `app/quiz.tsx:174-177` — `exitButtonText` (primary-colored text on white header)
- `app/quiz.tsx:231-245` — `choiceCorrect`/`choiceWrong` with `choiceTextOnColor` (white text on
  green/red highlight — the exact moment a learner needs to clearly read whether they got the
  answer right)
- `app/quiz.tsx:246-259, 269-272` — `nextButton`/`nextButtonText`, `reportButtonText`
- `app/results.tsx:153-187` — `shareButton`, `tryAgainButton`, `backButtonText`
- `src/components/OfflinePill.tsx:43-51` — pill text is orange-on-peach (~2.69:1, the worst
  ratio in the set) for the "Using saved content" indicator, which is meant to be legible at a
  glance on every screen
- `src/feedback/ReportFeedbackModal.tsx:207-216, 237-262` — `reasonOptionSelected`,
  `submitButton`, `retryButton`

**Fix:** Either darken `colors.primary`/`colors.success`/`colors.error` until white-on-color hits
≥4.5:1 (e.g. shift `primary` toward `#C74E28`-ish territory, verify with a contrast calculator),
or keep the current hues for large decorative surfaces only and introduce a separate, darker
"on-primary text" pairing (or use dark text instead of white on the lighter tokens, e.g.
`primarySoft` + `text` instead of `primarySoft` + `primary` for `OfflinePill`). Re-run contrast
math for every token pairing before locking the palette, since this is a rebrand meant to ship
broadly, not a placeholder.

### WR-02: Splash screen and Android adaptive icon still use the pre-rebrand blue, not the new Lafa palette

**File:** `app.json:14-20, 29-35`
**Issue:** This phase renamed `expo.name` to `"Lafa"` and shipped a full new orange-based color
palette, but `android.adaptiveIcon.backgroundColor` (`#E6F4FE`) and the `expo-splash-screen`
plugin's `backgroundColor` (`#208AEF`) are untouched — both are shades of blue left over from the
original Expo template, unrelated to `colors.primary` (`#E8663D`) or any other token in
`src/theme/tokens.ts`. The result: a user launching the freshly-rebranded "Lafa" app sees a blue
splash screen and (on Android) a blue-backed adaptive icon before the in-app orange branding ever
appears — an inconsistent first impression for a phase explicitly scoped as "brand identity."
**Fix:** Update `android.adaptiveIcon.backgroundColor` and the `expo-splash-screen` plugin's
`backgroundColor` in `app.json` to use `colors.background` or `colors.primary`/`colors.primarySoft`
(matching whatever the actual splash/icon artwork expects), so the native launch surfaces match
the new palette.

### WR-03: `OfflinePill` retains a bare-integer magic number instead of a token

**File:** `src/components/OfflinePill.tsx:46`
**Issue:** `paddingVertical: spacing.sm / 2` computes the pill's vertical padding by dividing an
existing token at the call site rather than defining a dedicated spacing token (e.g.
`spacing.xs`). This isn't new to this phase, but the phase touched this exact style block
(`radius.control` → `radius.pill`, `colors.secondary` → `colors.primarySoft`) without cleaning it
up, and it's the kind of ad-hoc derived value the tokens module is supposed to prevent per
`CONVENTIONS.md`'s "never inline hex/px literals in new domain components" guidance.
**Fix:** Add an explicit `spacing.xs: 4` (or similar) token and reference it directly instead of
dividing `spacing.sm` inline.

## Info

### IN-01: Home screen "Lafa" wordmark uses the same 20px heading style as every section label

**File:** `app/index.tsx:61, 129-134`
**Issue:** `tokens.ts` introduces a dedicated `typography.display` style (56px/600/lineHeight 62)
that is used exactly once, for the results-screen score (`app/results.tsx:132-136`). The app name
"Lafa" on the home/setup screen — the single most brand-defining piece of text in the whole app —
renders with `typography.heading` (20px/600), which is visually indistinguishable in weight/size
from `verbHeading` in `app/quiz.tsx:208-212` (a per-question verb label) and `title` in
`ReportFeedbackModal.tsx:191-195` (a modal title). For a phase whose stated goal is "brand
identity," the wordmark doesn't read as a wordmark.
**Fix:** Consider applying `typography.display` (or a new, smaller dedicated wordmark style) to
the "Lafa" heading on `app/index.tsx` so it visually anchors the rebrand, rather than reusing the
same style as generic section headings.

### IN-02: `tokens.test.ts` re-asserts the literal token values rather than testing derived behavior

**File:** `src/theme/tokens.test.ts:5-59`
**Issue:** Every assertion in this file is `expect(colors).toEqual({ ...exact same literal object
as tokens.ts... })`. This is a tautological snapshot — it will pass for any value chosen in
`tokens.ts` as long as the test file is updated in lockstep with it (which is exactly what
happened in this diff), so it protects against nothing except an accidental typo mismatch between
the two files. It provides no signal on whether the values are individually correct (e.g. it
would not have caught the WCAG contrast issue in WR-01).
**Fix:** Not blocking, but consider whether a contrast-ratio assertion (e.g. asserting
`colors.background` on `colors.primary` meets a minimum ratio) would provide more real protection
than a value-mirroring snapshot test.

---

_Reviewed: 2026-07-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
