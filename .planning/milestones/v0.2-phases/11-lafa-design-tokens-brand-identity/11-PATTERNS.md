# Phase 11: Lafa Design Tokens & Brand Identity - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 9 (8 modified, 1 already exists and needs value updates)
**Analogs found:** 9 / 9 (this phase is entirely self-referential — every "new" file is a modification of an existing file, so the analog for each file is itself, in its current pre-rebrand state)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `src/theme/tokens.ts` | config (design tokens) | transform (flat const exports, no logic) | itself (current version) | exact — full rewrite in place, same export shape |
| `src/theme/tokens.test.ts` | test | transform (verbatim-value assertions) | itself (current version) — also `__tests__/offline-pill.test.ts` for plain-export-assertion style | exact |
| `app.json` | config | request-response (static app manifest, no runtime flow) | itself (current version) | exact |
| `app/index.tsx` | component (Expo Router screen) | request-response (renders from store, calls `startQuiz`) | itself (current version) | exact |
| `app/quiz.tsx` | component (Expo Router screen) | request-response (renders from store, calls `selectAnswer`/`advance`) | itself (current version) | exact |
| `app/results.tsx` | component (Expo Router screen) | request-response (renders from store, calls `startQuiz`) | itself (current version) | exact |
| `src/components/OfflinePill.tsx` | component | request-response (reads `resolveVerbs()` once) | itself (current version) | exact |
| `src/feedback/ReportFeedbackModal.tsx` | component | event-driven (modal state machine: idle/submitting/success/error) | itself (current version) — token-consumption pattern borrowed from `src/components/OfflinePill.tsx` (the one file that already imports tokens correctly) | exact for structure; `OfflinePill.tsx` is the pattern source for *how* to import/apply tokens since this file currently has zero token imports |
| `src/quiz/share.ts` | utility | transform (pure string builder) | itself (current version) | exact |

No files in this phase are net-new — every target file already exists. There is no "No Analog Found" section because every file's own current version is the analog for its shape/structure; only token *values* and *key names* change, not the surrounding code patterns (component structure, prop shapes, StyleSheet usage, test structure).

## Pattern Assignments

### `src/theme/tokens.ts` (config, transform)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/theme/tokens.ts` (current, 31 lines)

**Current full content (to be replaced in place, same export shape/order):**
```typescript
export const colors = {
  background: "#FFFFFF",
  secondary: "#F2F2F7",
  accent: "#007AFF",
  error: "#FF3B30",
  success: "#34C759",
  text: "#000000",
  textSecondary: "#8E8E93",
};

export const spacing = {
  sm: 8,
  md: 16,
  lg: 24,
  xl2: 48,
  xl3: 64,
  choiceGap: 12,
};

export const radius = {
  control: 12,
};

export const typography = {
  caption: { fontSize: 14, fontWeight: "400" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const },
  heading: { fontSize: 20, fontWeight: "600" as const },
  display: { fontSize: 56, fontWeight: "600" as const, lineHeight: 62 },
};
```

**Target shape (per UI-SPEC.md, D-01/D-02/D-04):** same flat-const-export pattern, `colors` object gets `primary`/`primarySoft`/`surface` replacing `accent`/`secondary`, `error`/`success`/`text`/`textSecondary` keep keys but change hex values, `background` unchanged; `radius` object gains a `pill: 999` key alongside unchanged `control: 12`; `spacing` and `typography` objects are untouched byte-for-byte. Preserve the exact export style (`export const X = { ... };`, no `as const` on the objects themselves, only on `typography`'s `fontWeight` fields).

---

### `src/theme/tokens.test.ts` (test, transform)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/theme/tokens.test.ts` (current, 54 lines) — this file already exists (the one CONVENTIONS.md-documented exception to the `__tests__/` co-location rule) and must be updated, not created fresh.

**Current structure to preserve (describe block name, one `it` per token-category, `toEqual` on the whole exported object where practical):**
```typescript
import { colors, spacing, radius, typography } from "./tokens";

describe("theme tokens (D-03 verbatim-value guard)", () => {
  it("colors export exact verbatim iOS-system palette", () => {
    expect(colors).toEqual({
      background: "#FFFFFF",
      secondary: "#F2F2F7",
      accent: "#007AFF",
      error: "#FF3B30",
      success: "#34C759",
      text: "#000000",
      textSecondary: "#8E8E93",
    });
  });
  // ...spacing, radius, typography.display/heading/body/bodyStrong/caption
});
```

**Target per UI-SPEC.md's Test Contract (TEST-02):** update the `colors` assertion to the new full key set (`primary`, `primarySoft`, `success`, `error`, `background`, `text`, `textSecondary`, `surface`) with new hex values, ADD explicit assertions that `colors.accent` and `colors.secondary` are `undefined` (new test cases, not present in the current file — this is the "no dead keys" check from D-02), update `radius` assertion to include `pill: 999` alongside unchanged `control: 12`, leave `spacing` and `typography` assertions byte-identical (regression-only, per D-05/D-06). Rename the outer `describe` block away from "D-03 verbatim-value guard" language since D-03 in Phase 11's CONTEXT.md means something different (the `primarySoft` reservation decision) than whatever D-03 meant in this file's original phase — pick a phase-11-appropriate description, e.g. `"theme tokens (Lafa palette + token completeness)"`.

---

### `app.json` (config, request-response/static)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/app.json` (current, 43 lines)

**Only field to change** (line 3):
```json
"name": "Portuguese Verb Quiz",
```
→
```json
"name": "Lafa",
```
Everything else in the file (`slug`, `scheme`, `ios`, `android`, `web`, `plugins`, `experiments`) stays byte-identical per D-08 — this is a single-key edit, not a rewrite. Note the `expo-splash-screen` plugin's `backgroundColor: "#208AEF"` (iOS-blue-ish) is explicitly out of scope per D-08 ("App icon and splash screen are out of scope") — do not touch it even though it looks related to the palette rebrand.

---

### `app/index.tsx` (component, request-response)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/app/index.tsx` (current, 200 lines)

**Imports pattern** (line 9, unchanged import structure, only token names inside consuming code change):
```typescript
import { colors, radius, spacing, typography } from "../src/theme/tokens";
```

**Heading text change** (line 61):
```tsx
<Text style={styles.heading}>Portuguese Verb Quiz</Text>
```
→
```tsx
<Text style={styles.heading}>Lafa</Text>
```

**Token rename call sites to update** (StyleSheet block, lines 122-199): `colors.secondary` → `colors.surface` at line 154 (`chip` background); `colors.accent` → `colors.primary` at lines 157 (`chipSelected`), 186 (`startButton`); `colors.error` stays `colors.error` (new hex value only, no rename) at line 181. No structural changes to the component — this is a pure find/replace of token keys plus the one heading string.

---

### `app/quiz.tsx` (component, request-response)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/app/quiz.tsx` (current, 273 lines)

**Imports pattern** (line 10, unchanged):
```typescript
import { colors, spacing, radius, typography } from "../src/theme/tokens";
```

**Answer-choice state styling to update** (BRAND-03/D-10 — behavior in `choiceStyle()` at lines 73-89 is untouched, only the StyleSheet color values it references change):
```typescript
choiceDefault: {
  backgroundColor: colors.secondary,   // → colors.surface
},
choiceCorrect: {
  backgroundColor: colors.success,     // key unchanged, new hex via tokens.ts
},
choiceWrong: {
  backgroundColor: colors.error,       // key unchanged, new hex via tokens.ts
},
choiceTextDefault: {
  color: colors.text,                  // key unchanged, new hex via tokens.ts
},
choiceTextOnColor: {
  color: colors.background,            // unchanged — stays white
},
```

**Other `colors.accent`/`colors.secondary` call sites to rename** (all → `colors.primary` / `colors.surface` respectively): `exitButtonText.color` (line 176, `accent`→`primary`), `progressTrack.backgroundColor` (line 197, `secondary`→`surface`), `progressFill.backgroundColor` (line 203, `accent`→`primary`), `choice.backgroundColor` (line 226, `secondary`→`surface`), `nextButton.backgroundColor` (line 249, `accent`→`primary`), `reportButtonText.color` (line 271, `accent`→`primary`).

---

### `app/results.tsx` (component, request-response)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/app/results.tsx` (current, 188 lines)

**Imports pattern** (line 8, unchanged):
```typescript
import { colors, radius, spacing, typography } from "../src/theme/tokens";
```

**Token rename call sites** (StyleSheet block, lines 120-188): `colors.accent` → `colors.primary` at lines 156 (`shareButton`), 167 (`tryAgainButton`), 186 (`backButtonText`); `colors.secondary` → `colors.surface` at line 180 (`backButton`). `colors.error`/`colors.text`/`colors.textSecondary`/`colors.background` keys stay the same name, new hex values flow through from `tokens.ts` automatically — no call-site edits needed for those.

---

### `src/components/OfflinePill.tsx` (component, request-response)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/components/OfflinePill.tsx` (current, 53 lines) — this is also the reference pattern for "correctly importing tokens" that `ReportFeedbackModal.tsx` should be migrated to match.

**Imports pattern** (line 6, unchanged):
```typescript
import { colors, radius, spacing, typography } from "../theme/tokens";
```

**Style block to update** (lines 40-53, BRAND-04/D-03/D-04 — this is the ONE place `primarySoft` and `radius.pill` are used):
```typescript
const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,   // → colors.primarySoft
    borderRadius: radius.control,        // → radius.pill
    paddingHorizontal: spacing.sm,       // unchanged (D-06)
    paddingVertical: spacing.sm / 2,     // unchanged (D-06)
    marginBottom: spacing.md,            // unchanged (D-06)
  },
  text: {
    ...typography.caption,               // unchanged (D-05)
    color: colors.textSecondary,         // → colors.primary (per UI-SPEC.md "OfflinePill text color")
  },
});
```
Component logic (`isLocalSource`, `useEffect`/`resolveVerbs()` polling, `OFFLINE_PILL_TEXT` constant, JSX) is entirely unchanged — this is a StyleSheet-values-only edit.

---

### `src/feedback/ReportFeedbackModal.tsx` (component, event-driven)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/feedback/ReportFeedbackModal.tsx` (current, 269 lines) for structure/state machine; `src/components/OfflinePill.tsx` (above) for the *target* token-import pattern, since this file currently has zero token imports and is the one documented anti-pattern in `ARCHITECTURE.md`.

**Current imports (no tokens imported at all — this is what must change):**
```typescript
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Subject, Tense } from "../dataset/types";
import { buildFeedbackPayload } from "./payload";
import { FEEDBACK_REASONS } from "./reasons";
import { submitFeedback } from "./submit";
import type { FeedbackReason, SubmitResult } from "./types";
```

**Target: add a token import line matching the project convention** (this file lives in `src/feedback/`, two levels from `src/theme/`, so the relative path is `../theme/tokens`, matching `OfflinePill.tsx`'s pattern from `src/components/`):
```typescript
import { colors, radius, spacing, typography } from "../theme/tokens";
```

**Placeholder text color prop (line 146) — currently a raw hex string, not a StyleSheet value, must also migrate:**
```tsx
placeholderTextColor="#8E8E93"
```
→
```tsx
placeholderTextColor={colors.textSecondary}
```

**ActivityIndicator hardcoded color (line 167) must also migrate:**
```tsx
<ActivityIndicator color="#FFFFFF" />
```
→
```tsx
<ActivityIndicator color={colors.background} />
```

**Full StyleSheet hardcoded-hex → token map to apply** (lines 183-269), per UI-SPEC.md's explicit table — every literal becomes a token reference, none stay literal:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,   // was "#FFFFFF"
    paddingHorizontal: spacing.md,          // was 16
    paddingVertical: spacing.lg,            // was 24
  },
  title: {
    ...typography.heading,                  // was { fontSize: 20, fontWeight: "600" }
    color: colors.text,                     // was "#000000"
    marginBottom: spacing.lg,               // was 24
  },
  reasonList: {
    gap: spacing.choiceGap,                 // was 12
    marginBottom: spacing.lg,               // was 24
  },
  reasonOption: {
    minHeight: 44,
    paddingHorizontal: spacing.md,          // was 16
    justifyContent: "center",
    borderRadius: radius.control,           // was 12
    backgroundColor: colors.surface,        // was "#F2F2F7" — NOT primarySoft (D-03)
  },
  reasonOptionSelected: {
    backgroundColor: colors.primary,        // was "#007AFF"
  },
  reasonOptionText: {
    ...typography.body,                     // was { fontSize: 16, fontWeight: "400" }
    color: colors.text,                     // was "#000000"
  },
  reasonOptionTextSelected: {
    color: colors.background,               // was "#FFFFFF"
  },
  textInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,          // was 16
    paddingVertical: spacing.sm,            // was 8
    borderRadius: radius.control,           // was 12
    backgroundColor: colors.surface,        // was "#F2F2F7" — NOT primarySoft (D-03)
    ...typography.body,                     // was { fontSize: 16, fontWeight: "400" }
    color: colors.text,                     // was "#000000"
    marginBottom: spacing.md,               // was 16
  },
  successText: {
    ...typography.body,                     // was { fontSize: 16, fontWeight: "400" }
    color: colors.success,                  // was "#34C759"
    marginBottom: spacing.md,               // was 16
  },
  errorText: {
    ...typography.body,                     // was { fontSize: 16, fontWeight: "400" }
    color: colors.error,                    // was "#FF3B30"
    marginBottom: spacing.md,               // was 16
  },
  submitButton: {
    minHeight: 44,
    borderRadius: radius.control,           // was 12
    backgroundColor: colors.primary,        // was "#007AFF"
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodyStrong,               // was { fontSize: 16, fontWeight: "600" }
    color: colors.background,               // was "#FFFFFF"
  },
  retryButton: {
    minHeight: 44,
    borderRadius: radius.control,           // was 12
    backgroundColor: colors.error,          // was "#FF3B30"
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,                  // was 16
  },
  retryButtonText: {
    ...typography.bodyStrong,               // was { fontSize: 16, fontWeight: "600" }
    color: colors.background,               // was "#FFFFFF"
  },
});
```
State machine (`ModalState` union, `handleSubmit`, `useEffect` reset-on-visible, timer-based auto-close) and all JSX structure are entirely unchanged — this is a StyleSheet-and-two-inline-props migration only, matching D-01/D-02/D-03's explicit note that `surface` (not `primarySoft`) is correct for this file's neutral backgrounds.

---

### `src/quiz/share.ts` (utility, transform)

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/quiz/share.ts` (current, 4 lines — single pure function, no imports)

**Current:**
```typescript
export function buildShareMessage(correct: number, total: number): string {
  return `I scored ${correct}/${total} on Portuguese Verb Quiz!`;
}
```
**Target (D-09):**
```typescript
export function buildShareMessage(correct: number, total: number): string {
  return `I scored ${correct}/${total} on Lafa!`;
}
```
Pure single-line string-literal substitution — no other change. No token/color involvement (this is text-only).

---

### `__tests__/quiz-share.test.ts` (test, transform) — companion test to `src/quiz/share.ts`

**Analog:** itself, `/Users/avi/portuguese-verb/portuguese-verb-mobile/__tests__/quiz-share.test.ts` (current, 21 lines)

All three assertions currently expect `"...on Portuguese Verb Quiz!"` and must be updated to `"...on Lafa!"`:
```typescript
describe("buildShareMessage", () => {
  it("builds message for a mid-range score", () => {
    expect(buildShareMessage(8, 10)).toBe("I scored 8/10 on Lafa!");
  });
  it("builds message for a zero score", () => {
    expect(buildShareMessage(0, 10)).toBe("I scored 0/10 on Lafa!");
  });
  it("builds message for a perfect score", () => {
    expect(buildShareMessage(10, 10)).toBe("I scored 10/10 on Lafa!");
  });
});
```

---

## Shared Patterns

### Token import convention (relative path depth by file location)
**Source:** `app/index.tsx` line 9 (`../src/theme/tokens`), `src/components/OfflinePill.tsx` line 6 (`../theme/tokens`)
**Apply to:** `src/feedback/ReportFeedbackModal.tsx` needs `../theme/tokens` (same depth as `OfflinePill.tsx`, both one level under `src/`). Screens under `app/` need `../src/theme/tokens`. No path aliases exist in this codebase (per CONVENTIONS.md) — always relative.

### Token rename map (apply verbatim across every consuming file)
**Source:** UI-SPEC.md's "Token rename map" table, cross-checked against actual call sites found in this pass
**Apply to:** `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `src/components/OfflinePill.tsx`, `src/feedback/ReportFeedbackModal.tsx`
```
colors.accent    → colors.primary        (everywhere)
colors.secondary → colors.surface        (everywhere EXCEPT OfflinePill)
colors.secondary → colors.primarySoft    (OfflinePill container background ONLY)
colors.textSecondary → colors.primary    (OfflinePill text color ONLY — per UI-SPEC.md's component-level table, not the generic rename map)
colors.error/success/text/textSecondary/background → same key names, new hex values (no call-site edits needed beyond tokens.ts itself)
radius.control   → unchanged everywhere except OfflinePill container, which becomes radius.pill
```

### Hardcoded-hex elimination pattern (StyleSheet + inline props)
**Source:** `src/components/OfflinePill.tsx` (already-correct baseline) vs. `src/feedback/ReportFeedbackModal.tsx` (the file needing full migration)
**Apply to:** `src/feedback/ReportFeedbackModal.tsx` only (the sole remaining hardcoded-hex file per ARCHITECTURE.md's documented anti-pattern). Watch for hex values in BOTH the `StyleSheet.create` block AND inline JSX props (`placeholderTextColor="#8E8E93"`, `<ActivityIndicator color="#FFFFFF" />`) — a StyleSheet-only grep will miss the two inline prop occurrences.

### Brand-name text substitution
**Source:** UI-SPEC.md's "App Identity Copy" table
**Apply to:** `app.json` (`expo.name`), `app/index.tsx` (heading `<Text>`), `src/quiz/share.ts` (`buildShareMessage` template literal) — three distinct locations, each a single string-literal edit, no structural changes. Companion test `__tests__/quiz-share.test.ts` must be updated in lockstep with `share.ts`'s string change or its three `toBe` assertions will fail.

## No Analog Found

None — every file in this phase's scope already exists in the codebase; there are no net-new files to create. All patterns above describe in-place edits, not new-file scaffolding.

## Metadata

**Analog search scope:** `src/theme/`, `src/components/`, `src/feedback/`, `src/quiz/`, `app/`, `__tests__/`, `app.json` (full phase file list, as identified in `11-CONTEXT.md`'s "Files to modify" section and cross-verified against `11-UI-SPEC.md`'s Component-Level Application and App Identity Copy sections)
**Files scanned:** 11 (`src/theme/tokens.ts`, `src/theme/tokens.test.ts`, `app.json`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `src/components/OfflinePill.tsx`, `src/feedback/ReportFeedbackModal.tsx`, `src/quiz/share.ts`, `__tests__/quiz-share.test.ts`, `__tests__/offline-pill.test.ts`)
**Pattern extraction date:** 2026-07-19
