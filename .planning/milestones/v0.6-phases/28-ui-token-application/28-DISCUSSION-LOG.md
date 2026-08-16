# Phase 28: UI Token Application - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 28-UI Token Application
**Areas discussed:** Setup heading treatment, Pressed-state styling, OfflinePill's info color, Scope check

---

## Setup heading treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Text-only | Keep current typography.heading + colors.text treatment | ✓ |
| Icon mark + text | Add icon.png next to/above "Lafa" text via Image | |
| Icon-only wordmark | Replace text with just the icon mark | |

**User's choice:** Text-only.
**Notes:** No SVG rendering pipeline exists in the app (no react-native-svg import found); icon-only was rejected since UI-01 disallows inventing a wordmark.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is | typography.heading (20px/600) + colors.text, no change | ✓ |
| Bump to typography.display | Use 56px/600 to make "Lafa" read as a proper brand mark | |

**User's choice:** Keep as-is.
**Notes:** Phase is about token correctness, not a heading redesign.

---

## Pressed-state styling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, primary actions only | Wire colors.pressed into Start Quiz, quiz choices, primary/destructive modal buttons | ✓ |
| Yes, everywhere | Wire into every Pressable including chips and links | |
| No — out of scope | Leave colors.pressed unused this phase | |

**User's choice:** Yes, primary actions only.

| Option | Description | Selected |
|--------|-------------|----------|
| Pressable style function | style={({pressed}) => [...]} — RN built-in, no extra state | ✓ |
| onPressIn/onPressOut + useState | Manual press-state tracking | |

**User's choice:** Pressable style function.

| Option | Description | Selected |
|--------|-------------|----------|
| Start Quiz (Setup) | app/index.tsx startButton | ✓ |
| Quiz choice buttons (before lock) | app/quiz.tsx answer choices, pre-lock only | ✓ |
| Next / Share / Try Again | app/quiz.tsx nextButton, app/results.tsx shareButton/tryAgainButton | ✓ |
| Feedback modal Submit/Retry buttons | ReportFeedbackModal + ProductFeedbackModal primary/retry buttons | ✓ |

**User's choice:** All four selected — every primary-action button gets pressed-state styling.

---

## OfflinePill's info color

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, switch to info | Matches Phase 26's D-10 stated intent for OfflinePill | ✓ |
| No, keep primarySoft/primary | Leave current orange treatment | |

**User's choice:** Yes, switch to info.

| Option | Description | Selected |
|--------|-------------|----------|
| Add colors.infoSoft token | New light-teal tint mirroring primary/primarySoft pairing | ✓ |
| Reuse colors.surface as background | No new token, less visually distinct | |

**User's choice:** Add colors.infoSoft token.

---

## Scope check — is there more to do at all?

| Option | Description | Selected |
|--------|-------------|----------|
| That's the full scope | Heading confirmation + pressed-state + OfflinePill info switch is the complete phase 28 scope | ✓ |
| There's more — let me describe it | Additional visual work beyond what's covered | |

**User's choice:** That's the full scope.
**Notes:** Codebase scout confirmed zero literal hex outside `src/theme/tokens.ts`/`tokens.test.ts` and zero old-palette hex anywhere in `app/`/`src/` — UI-02's hex-removal criterion is already structurally satisfied by existing token indirection.

---

## Claude's Discretion

- Exact hex value for the new `colors.infoSoft` token (light tint of `#36799A`, analogous to how `primarySoft` relates to `primary`).
- Exact key placement/ordering of `infoSoft` in the `colors` object literal.
- Whether `tokens.test.ts`'s per-token-group `toEqual()` structure needs restructuring or just an added assertion line.

## Deferred Ideas

None — pressed-state styling was explicitly scoped down to primary actions only (a deliberate exclusion of chips/text links), not deferred to a future phase.
