# Phase 12: Tense Label Refresh - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 3 (2 modified source files, 1 modified test file)
**Analogs found:** 3 / 3 (all are self-analogs — this phase modifies existing files in place, no new files created)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/quiz/labels.ts` | utility (lookup/data module) | transform (static map lookup) | itself (existing file, in-place edit) | exact — self-analog |
| `app/quiz.tsx` | component (Expo Router screen) | request-response (renders store state) | itself (existing file, in-place edit) | exact — self-analog |
| `__tests__/quiz-labels.test.ts` | test | transform (assertion over static data) | itself (existing file, in-place edit) | exact — self-analog |

This phase has no genuinely new files — all three targets already exist and are edited in place. There is no need to search elsewhere in the codebase for an analog; the pattern to copy is each file's own existing structure, extended consistently. The one novel wrinkle (a partial `Record` covering only 2 of 4 `Tense` values) has no existing analog anywhere in `src/` — flagged below under "No Analog Found."

## Pattern Assignments

### `src/quiz/labels.ts` (utility, transform)

**Analog:** itself — `src/quiz/labels.ts` (full file, 17 lines, read in one pass)

**Current full content** (lines 1-17):
```typescript
import type { Subject, Tense } from "../dataset/types";

export const subjectLabels: Record<Subject, string> = {
  eu: "eu",
  tu: "tu",
  ele_ela: "ele/ela",
  nos: "nós",
  voces: "vocês",
  eles_elas: "eles/elas",
};

export const tenseLabels: Record<Tense, string> = {
  present_indicative: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  future: "Future",
};
```

**Pattern to follow:**
- Keep `tenseLabels` as a full `Record<Tense, string>` (D-08 requires this — do not narrow its type or shape). Only change the two string values:
  - `preterite: "Preterite"` → `preterite: "Completed past"`
  - `imperfect: "Imperfect"` → `imperfect: "Imperfect past"`
  - `present_indicative` and `future` values stay untouched (D-01).
- Add a **new, separate** export for the Portuguese grammar names, covering only `preterite`/`imperfect` (D-05, D-08). Since no `Partial<Record<...>>` pattern exists elsewhere in this codebase, the simplest convention-consistent approach is to mirror the existing flat-object-literal style used by `subjectLabels`/`tenseLabels` but typed as `Partial<Record<Tense, string>>` or an explicit two-key object type — exact shape is implementer's discretion per D-08, but it must:
  - Be a new named export (not a mutation of `tenseLabels`)
  - Live in this same file (per the "Module Design" convention in CONVENTIONS.md: one `types.ts`-less domain file here, so a second flat const export is consistent with how `subjectLabels` and `tenseLabels` already coexist in one file)
  - Use `import type { Tense } from "../dataset/types"` (already imported) for typing
- Naming: no existing convention for a "secondary label" map to follow exactly, but sibling maps are named `<noun>Labels` (`subjectLabels`, `tenseLabels`) — a name like `tenseGrammarNames` or `tensePortugueseNames` fits that pattern (`camelCase`, noun-first, `-Names`/`-Labels` suffix per CONVENTIONS.md's "Variables"/"Types" naming rules). This is Claude's Discretion per D-08 — not a hard requirement, just the closest-fit convention.

**Import pattern** (unchanged, line 1):
```typescript
import type { Subject, Tense } from "../dataset/types";
```
This `import type` for a type-only import is the project-wide convention (CONVENTIONS.md "Import Organization" — `import type` used consistently to separate type-only imports from value imports).

---

### `app/quiz.tsx` (component, request-response)

**Analog:** itself — `app/quiz.tsx` (targeted read, lines 1-20 imports + lines 100-140 meta row + lines 200-220 styles)

**Imports pattern** (lines 1-11):
```typescript
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { verbs } from "../src/dataset/verbs";
import { ReportFeedbackModal } from "../src/feedback/ReportFeedbackModal";
import { colors, spacing, radius, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";
```
When the new Portuguese-name lookup is added to `src/quiz/labels.ts`, extend this existing named import (line 7) — e.g. `import { subjectLabels, tenseLabels, tenseGrammarNames } from "../src/quiz/labels";` — rather than a separate import statement, matching how `subjectLabels`/`tenseLabels` are already imported together.

**Core meta-row render pattern** (lines 118-124, current):
```typescript
<View style={styles.questionBlock}>
  <Text style={styles.verbHeading}>{question.verb}</Text>
  <Text style={styles.metaRow}>
    {currentVerb?.translation ?? ""} · {tenseLabels[question.tense]} ·{" "}
    {subjectLabels[question.subject]}
  </Text>
</View>
```

**Pattern to follow (D-03/D-04/D-05):**
- Keep the single-line, `·`-separated template structure — do not restructure into a second row (D-04 explicitly rejects a caption-sized secondary row).
- Add the Portuguese grammar name as an inline parenthetical immediately after the tense label, only when the current tense's grammar-name lookup has an entry (preterite/imperfect), e.g. conceptually:
  ```typescript
  {tenseLabels[question.tense]}
  {tenseGrammarNames[question.tense] ? ` (${tenseGrammarNames[question.tense]})` : ""}
  ```
  This is the shape to fit into the existing template-literal-style JSX text block — exact JSX mechanics (string concatenation inline vs. a small computed variable above the `return`) are implementer's discretion, but the **rendered output** must match D-04's example exactly: `"correr · Completed past (Pretérito perfeito) · eles/elas"`.
- For D-07's optional de-emphasis styling, if choosing to nest a second `<Text>` for the parenthetical (rather than reusing `colors.text` inline), follow the existing token-based styling convention already used one line up in `styles.metaRow` (see Styles pattern below) — i.e. a nested `<Text style={{ color: colors.textSecondary }}>` or a new named style key added to the `StyleSheet.create` block, not a hardcoded hex value (per ARCHITECTURE.md's "Anti-Patterns" section warning against hardcoded style literals — `ReportFeedbackModal.tsx` is the counter-example to avoid repeating).
- `app/index.tsx` is NOT touched (D-06) — do not propagate this pattern there even though it also imports `tenseLabels`.

**Styles pattern** (lines 213-216, `metaRow` style, for reference/reuse):
```typescript
metaRow: {
  ...typography.body,
  color: colors.text,
},
```
If D-07's nested `<Text>` approach is chosen, a sibling style key (e.g. `metaRowSecondary`) should follow this same `...typography.<token>` + `color: colors.<token>` spread pattern — likely `...typography.caption` + `color: colors.textSecondary` for the de-emphasized variant, both already-defined tokens in `src/theme/tokens.ts` (no new token values needed).

---

### `__tests__/quiz-labels.test.ts` (test, transform)

**Analog:** itself — `__tests__/quiz-labels.test.ts` (full file, 29 lines, read in one pass)

**Current full content** (lines 1-29):
```typescript
import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { SUBJECTS, TENSES } from "../src/dataset/types";

describe("subjectLabels", () => {
  it("covers every Subject value with a non-empty label", () => {
    SUBJECTS.forEach((subject) => {
      expect(typeof subjectLabels[subject]).toBe("string");
      expect(subjectLabels[subject].length).toBeGreaterThan(0);
    });
  });

  it("maps ele_ela to the exact expected label", () => {
    expect(subjectLabels.ele_ela).toBe("ele/ela");
  });
});

describe("tenseLabels", () => {
  it("covers every Tense value with a non-empty label", () => {
    TENSES.forEach((tense) => {
      expect(typeof tenseLabels[tense]).toBe("string");
      expect(tenseLabels[tense].length).toBeGreaterThan(0);
    });
  });

  it("maps present_indicative to the exact expected label", () => {
    expect(tenseLabels.present_indicative).toBe("Present");
  });
});
```

**Pattern to follow (D-10):**
- Preserve the existing structure exactly: one `describe` block per exported map, a "covers every value with non-empty string" loop test, and one explicit full-string-value assertion test.
- Update/add explicit-value assertions for the new strings — per D-10, keep the "explicit assertion for one full string value" style, extended to cover both changed values:
  ```typescript
  it("maps preterite to the exact expected label", () => {
    expect(tenseLabels.preterite).toBe("Completed past");
  });

  it("maps imperfect to the exact expected label", () => {
    expect(tenseLabels.imperfect).toBe("Imperfect past");
  });
  ```
- The existing `"maps present_indicative to the exact expected label"` test (asserting `"Present"`) stays unchanged — it's the untouched-value regression check per D-01.
- Import line 1 needs extending only if the new Portuguese-grammar-name export gets its own test coverage (Claude's Discretion per the CONTEXT.md "Claude's Discretion" section — TEST-01 only strictly requires the primary `tenseLabels` assertions above). If added, follow the same `describe`-per-export, loop-plus-explicit-assertion structure, e.g. a new `describe("tenseGrammarNames", ...)` block mirroring the `tenseLabels` block but only iterating `["preterite", "imperfect"]` instead of all of `TENSES` (since the new map is partial, per D-08).
- Do not introduce `@testing-library/react-native` or any component-rendering test for the `app/quiz.tsx` JSX change — this codebase's established constraint (CLAUDE.md "Testing" section, confirmed by STACK.md) is plain-function unit tests only, no component rendering. The meta-row JSX change in `app/quiz.tsx` itself is not expected to get a rendered-component test; label-map correctness is what `quiz-labels.test.ts` verifies.

## Shared Patterns

### Zod/type-safety convention for `Tense`-keyed data
**Source:** `src/dataset/types.ts` (`Tense` union + `TENSES` const array, referenced but not modified this phase)
**Apply to:** `src/quiz/labels.ts`'s new Portuguese-grammar-name lookup
Both existing maps (`subjectLabels`, `tenseLabels`) are typed against the shared `Tense`/`Subject` unions from `src/dataset/types.ts`, never re-declaring the literal keys. The new partial map should do the same — type it against `Tense` (via `Partial<Record<Tense, string>>` or an equivalent explicit two-key type), not a freestanding string-literal union.

### Design tokens over hardcoded values
**Source:** `src/theme/tokens.ts` (`colors`, `spacing`, `radius`, `typography`)
**Apply to:** any new/modified style in `app/quiz.tsx`
Every current screen (including `app/quiz.tsx`'s existing `metaRow` style) sources colors/spacing/typography from `src/theme/tokens.ts`. Do not hardcode hex values or pixel sizes for the new parenthetical styling — this is called out explicitly as an anti-pattern to avoid (ARCHITECTURE.md, `ReportFeedbackModal.tsx` is the negative example).

### Backend contract isolation
**Source:** `src/feedback/payload.ts` (not modified this phase, read for verification only)
**Apply to:** verification step after implementing `src/quiz/labels.ts`/`app/quiz.tsx` changes
Confirmed (D-09): `buildFeedbackPayload` sources `tense` from `question.tense` (the raw `Tense` enum literal), never from `tenseLabels[...]` or the new Portuguese-name lookup. No shared pattern needs to change to preserve this — just grep `tenseLabels` usage after implementation to confirm `src/feedback/` still has zero references.

## No Analog Found

| File/Pattern | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Partial `Record<Tense, string>` lookup (D-08's new Portuguese-grammar-name map) | utility (lookup/data) | transform | No existing map in `src/` is partial/covers a subset of an enum's keys — `subjectLabels` and `tenseLabels` are both full `Record<K, string>` over every union member. This is a genuinely new shape for this codebase; the planner/executor should treat CONTEXT.md's D-08 guidance (must not overload `tenseLabels`, must be a separate export) as the binding constraint rather than searching for a closer analog that doesn't exist. |

## Metadata

**Analog search scope:** `src/quiz/labels.ts`, `app/quiz.tsx`, `__tests__/quiz-labels.test.ts`, `src/theme/tokens.ts`, `src/dataset/types.ts`, `src/feedback/payload.ts` (verification read), grep across `src/` for `Partial<Record`
**Files scanned:** 6 read/grepped, 3 are the phase's edit targets (self-analogs — no new files this phase)
**Pattern extraction date:** 2026-07-19
