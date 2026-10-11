# Phase 28: UI Token Application - Pattern Map

**Mapped:** 2026-08-14
**Files analyzed:** 8
**Analogs found:** 8 / 8 (all in-repo; this phase mostly modifies existing files, no genuinely new component patterns except the `Pressable` function-style form, which has no in-repo analog — see below)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/theme/tokens.ts` | config (design tokens) | transform (static export) | self (existing `primary`/`primarySoft` pairing in same file) | exact |
| `src/theme/tokens.test.ts` | test | transform (assertion) | self (existing `toEqual()` block) | exact |
| `src/components/OfflinePill.tsx` | component | request-response (renders from resolved dataset source) | self (existing `primarySoft`/`primary` usage, to be swapped) | exact |
| `app/index.tsx` | route/component | request-response (user interaction → store action) | self (`startButton` style array); function-prop pattern has no existing analog anywhere in repo | role-match (existing button), no-analog (function-prop mechanism) |
| `app/quiz.tsx` | route/component | request-response | self (`choiceStyle()` conditional-style helper, `nextButton` style array) | role-match (existing button/choice styling), no-analog (function-prop mechanism) |
| `app/results.tsx` | route/component | request-response | self (`shareButton`/`tryAgainButton` style, mirrors `app/index.tsx` `startButton`) | role-match |
| `src/feedback/ReportFeedbackModal.tsx` | component (modal) | request-response | self (`submitButton`/`retryButton` style, near-identical structure to `ProductFeedbackModal.tsx`) | exact (cross-file twin) |
| `src/productFeedback/ProductFeedbackModal.tsx` | component (modal) | request-response | `src/feedback/ReportFeedbackModal.tsx` (near-identical twin component) | exact (cross-file twin) |

## Pattern Assignments

### `src/theme/tokens.ts` (config)

**Analog:** self — existing `colors` object literal (lines 1-12)

**Current structure** (lines 1-12):
```typescript
export const colors = {
  primary: "#F2643E",
  primarySoft: "#FDE7DF",
  pressed: "#C94A2D",
  info: "#36799A",
  success: "#1F7F66",
  error: "#D64545",
  background: "#FFF9F6",
  text: "#24201E",
  textSecondary: "#746D69",
  surface: "#F1EFED",
};
```

**Pattern to copy:** the `primary`/`primarySoft` adjacency (base color immediately followed by its "soft" tint variant) is the pairing convention to mirror for `info`/`infoSoft`. UI-SPEC.md (§"New token: `colors.infoSoft`") locks the exact insertion point and hex — insert `infoSoft: "#DCEBF0"` directly after the existing `info: "#36799A"` line:
```typescript
export const colors = {
  primary: "#F2643E",
  primarySoft: "#FDE7DF",
  pressed: "#C94A2D",
  info: "#36799A",
  infoSoft: "#DCEBF0",
  success: "#1F7F66",
  error: "#D64545",
  background: "#FFF9F6",
  text: "#24201E",
  textSecondary: "#746D69",
  surface: "#F1EFED",
};
```
No other export (`spacing`, `radius`, `typography`) changes.

---

### `src/theme/tokens.test.ts` (test)

**Analog:** self — existing `toEqual()` block (lines 4-17)

**Current pattern** (lines 4-17):
```typescript
it("colors export the exact Lafa palette", () => {
  expect(colors).toEqual({
    primary: "#F2643E",
    primarySoft: "#FDE7DF",
    pressed: "#C94A2D",
    info: "#36799A",
    success: "#1F7F66",
    error: "#D64545",
    background: "#FFF9F6",
    text: "#24201E",
    textSecondary: "#746D69",
    surface: "#F1EFED",
  });
});
```

**Change:** this is a single exhaustive `toEqual()` — add `infoSoft: "#DCEBF0",` in the same position as in `tokens.ts` (immediately after `info: "#36799A",`). Per CONTEXT.md's "Claude's Discretion" note, no restructuring into per-key assertions is needed; keep the single-block `toEqual()` form matching the existing test style throughout this file (every other test in the file also uses one `toEqual()` per token group — `spacing`, `radius` — so this is the established convention, not a new one).

---

### `src/components/OfflinePill.tsx` (component)

**Analog:** self — current `styles.container`/`styles.text` (lines 40-53)

**Current pattern** (lines 40-53):
```typescript
const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm / 2,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.primary,
  },
});
```

**Change:** swap `colors.primarySoft` → `colors.infoSoft` (container background) and `colors.primary` → `colors.info` (text color). No other property changes — radius, padding, margin, and `typography.caption` stay untouched. No import list changes needed (`colors` is already imported from `../theme/tokens`).

---

### `app/index.tsx` (route/component) — `startButton` pressed-state

**Analog:** self — current static-style `startButton` (lines 135-144, styles at 216-227)

**Current pattern** (lines 135-144):
```tsx
<Pressable
  onPress={handleStartQuiz}
  disabled={!canStart || starting}
  style={[styles.startButton, (!canStart || starting) && styles.startButtonDisabled]}
>
  {starting ? <ActivityIndicator size="small" color={colors.background} /> : null}
  <Text style={styles.startButtonText}>
    {starting ? "Starting…" : "Start Quiz"}
  </Text>
</Pressable>
```

**New pattern (function-form `style` prop, per UI-SPEC.md §"Interaction States"):** no existing `Pressable` in the codebase uses this form — this is the first. UI-SPEC.md provides the exact mechanism to use verbatim:
```tsx
style={({ pressed }) => [
  styles.startButton,
  (!canStart || starting) && styles.startButtonDisabled,
  pressed && { backgroundColor: colors.pressed },
]}
```
Compose with (not replace) the existing `startButtonDisabled` conditional entry — same array-of-conditionals pattern already in use, just converting the outer `style={[...]}` array literal into a `style={({ pressed }) => [...]}` function returning that same array shape, with the pressed override appended last (so it wins over the base `startButton` background but should logically not fire when disabled — verify tap is blocked by `disabled` prop regardless, consistent with RN's default `Pressable` behavior of not firing `pressed` visuals differently based on `disabled`; `disabled` already prevents `onPress`).

**Style block context** (lines 216-227, unchanged apart from no new style key needed — `colors.pressed` is used inline, not as a new named style):
```typescript
startButton: {
  minHeight: 44,
  borderRadius: radius.control,
  backgroundColor: colors.primary,
  flexDirection: "row",
  gap: spacing.sm,
  justifyContent: "center",
  alignItems: "center",
},
startButtonDisabled: {
  opacity: 0.4,
},
```

---

### `app/quiz.tsx` (route/component) — choice buttons (pre-lock only) + `nextButton`

**Analog:** self — `choiceStyle()` helper (lines 82-98) and `nextButton` static style (lines 155-161, styles at 277-286)

**Current choice-style pattern** (lines 82-98):
```typescript
function choiceStyle(choice: string, correctAnswer: string) {
  if (lockedChoice === null) {
    return { container: styles.choiceDefault, text: styles.choiceTextDefault };
  }
  const isSelected = choice === lockedChoice;
  const isCorrect = choice === correctAnswer;
  if (isSelected && isCorrect) {
    return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
  }
  if (isSelected && !isCorrect) {
    return { container: styles.choiceWrong, text: styles.choiceTextOnColor };
  }
  if (!isSelected && isCorrect && lockedChoice !== correctAnswer) {
    return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
  }
  return { container: styles.choiceDefault, text: styles.choiceTextDefault };
}
```

**Current render call site** (lines 139-150):
```tsx
{question.choices.map((choice) => {
  const style = choiceStyle(choice, question.correctAnswer);
  return (
    <Pressable
      key={choice}
      onPress={() => selectAnswer(choice)}
      style={[styles.choice, style.container]}
    >
      <Text style={[styles.choiceText, style.text]}>{choice}</Text>
    </Pressable>
  );
})}
```

**Required change:** convert the `style={[...]}` array to `style={({ pressed }) => [...]}`, appending a pressed override **only when `lockedChoice === null`** (per D-03: pressed-state must not apply once a choice is locked, since success/error coloring takes over):
```tsx
<Pressable
  key={choice}
  onPress={() => selectAnswer(choice)}
  style={({ pressed }) => [
    styles.choice,
    style.container,
    lockedChoice === null && pressed && { backgroundColor: colors.pressed },
  ]}
>
```
This composes with (does not replace) the existing `choiceStyle()`-driven conditional array — `choiceStyle()` itself needs no change since it already returns `styles.choiceDefault` (which is `colors.surface`) for the unlocked case; the pressed override is layered on top only in that unlocked branch.

**Current `nextButton` pattern** (lines 155-161, style at 277-283):
```tsx
<Pressable
  onPress={handleAdvance}
  style={[styles.nextButton, lockedChoice === null && styles.nextButtonHidden]}
  pointerEvents={lockedChoice === null ? "none" : "auto"}
>
  <Text style={styles.nextButtonText}>Next</Text>
</Pressable>
```
**Change:** same conversion — `style={({ pressed }) => [styles.nextButton, lockedChoice === null && styles.nextButtonHidden, pressed && { backgroundColor: colors.pressed }]}`. `nextButton` is only interactive/visible once a choice is locked (per `pointerEvents`), so no additional lockedChoice-gating is needed on the pressed override itself (unlike the choice buttons).

**Out of scope for this file:** `reportButton`/`exitButtonText` links stay untouched (D-03 explicitly excludes text links).

---

### `app/results.tsx` (route/component) — `shareButton`, `tryAgainButton`

**Analog:** `app/index.tsx`'s `startButton` (same primary-CTA shape: `minHeight: 44`, `borderRadius: radius.control`, `backgroundColor: colors.primary`)

**Current pattern** (lines 103-116):
```tsx
<Pressable onPress={handleShare} style={styles.shareButton}>
  <Text style={styles.shareButtonText}>Share Score</Text>
</Pressable>

<Pressable
  onPress={handleTryAgain}
  disabled={starting}
  style={styles.tryAgainButton}
>
  {starting ? <ActivityIndicator size="small" color={colors.background} /> : null}
  <Text style={styles.tryAgainButtonText}>
    {starting ? "Starting…" : "Try Again"}
  </Text>
</Pressable>
```

**Change:**
```tsx
<Pressable
  onPress={handleShare}
  style={({ pressed }) => [styles.shareButton, pressed && { backgroundColor: colors.pressed }]}
>
  <Text style={styles.shareButtonText}>Share Score</Text>
</Pressable>

<Pressable
  onPress={handleTryAgain}
  disabled={starting}
  style={({ pressed }) => [styles.tryAgainButton, pressed && { backgroundColor: colors.pressed }]}
>
  ...
</Pressable>
```
Note `tryAgainButton` currently has no disabled-style entry in its style array (unlike `app/index.tsx`'s `startButton`/`startButtonDisabled` pair) — only add the pressed conditional, don't invent a disabled style that doesn't already exist (out of scope for this phase).

**Explicitly excluded:** `backButton` ("Back to Setup") — not in the in-scope table (UI-SPEC.md explicitly lists it under "out of scope").

---

### `src/feedback/ReportFeedbackModal.tsx` (component/modal) — submit + retry buttons

**Analog:** self, and near-identical twin `src/productFeedback/ProductFeedbackModal.tsx`

**Current submit button pattern** (lines 172-182):
```tsx
<Pressable
  onPress={handleSubmit}
  disabled={isSubmitting}
  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
>
  {isSubmitting ? (
    <ActivityIndicator color={colors.background} />
  ) : (
    <Text style={styles.submitButtonText}>Submit feedback</Text>
  )}
</Pressable>
```
**Change:**
```tsx
<Pressable
  onPress={handleSubmit}
  disabled={isSubmitting}
  style={({ pressed }) => [
    styles.submitButton,
    isSubmitting && styles.submitButtonDisabled,
    pressed && { backgroundColor: colors.pressed },
  ]}
>
```

**Current retry button pattern** (lines 184-188):
```tsx
{showRetry ? (
  <Pressable onPress={handleSubmit} style={styles.retryButton}>
    <Text style={styles.retryButtonText}>Retry submission</Text>
  </Pressable>
) : null}
```
**Change:** `retryButton`'s base background is `colors.error` (not `colors.primary`) — UI-SPEC.md's Interaction States table lists "retry button" generically under pressed-state scope without carving out an exception, so apply the same mechanism, still using `colors.pressed` as the override (consistent with D-03/D-04's single pressed color for all in-scope primary-action buttons, retry included):
```tsx
{showRetry ? (
  <Pressable
    onPress={handleSubmit}
    style={({ pressed }) => [styles.retryButton, pressed && { backgroundColor: colors.pressed }]}
  >
    <Text style={styles.retryButtonText}>Retry submission</Text>
  </Pressable>
) : null}
```

**Out of scope:** `reasonOption` chips (lines 130-148) — not in the in-scope table, matches "chips" exclusion in D-03.

---

### `src/productFeedback/ProductFeedbackModal.tsx` (component/modal) — submit + retry buttons

**Analog:** `src/feedback/ReportFeedbackModal.tsx` (structurally identical twin, same `styles.submitButton`/`styles.retryButton` shape, same `isSubmitting`/`showRetry` state pattern)

**Current submit button pattern** (lines 164-177) — note this file's submit button already has a compound disabled condition (`isSubmitDisabled = isSubmitting || message.trim().length === 0`), unlike `ReportFeedbackModal.tsx`:
```tsx
<Pressable
  onPress={handleSubmit}
  disabled={isSubmitDisabled}
  style={[
    styles.submitButton,
    isSubmitDisabled && styles.submitButtonDisabled,
  ]}
>
```
**Change:**
```tsx
<Pressable
  onPress={handleSubmit}
  disabled={isSubmitDisabled}
  style={({ pressed }) => [
    styles.submitButton,
    isSubmitDisabled && styles.submitButtonDisabled,
    pressed && { backgroundColor: colors.pressed },
  ]}
>
```

**Current retry button pattern** (lines 179-183) — identical shape to `ReportFeedbackModal.tsx`'s retry button:
```tsx
{showRetry ? (
  <Pressable onPress={handleSubmit} style={styles.retryButton}>
    <Text style={styles.retryButtonText}>Retry submission</Text>
  </Pressable>
) : null}
```
**Change:** same as `ReportFeedbackModal.tsx`:
```tsx
{showRetry ? (
  <Pressable
    onPress={handleSubmit}
    style={({ pressed }) => [styles.retryButton, pressed && { backgroundColor: colors.pressed }]}
  >
    <Text style={styles.retryButtonText}>Retry submission</Text>
  </Pressable>
) : null}
```

**Out of scope:** `categoryOption` chips (lines 122-140) — not in the in-scope table.

---

## Shared Patterns

### Pressed-state mechanism (new this phase, no prior in-repo precedent)
**Source:** UI-SPEC.md §"Interaction States — Pressed State" (locks the exact form)
**Apply to:** `app/index.tsx` (`startButton`), `app/quiz.tsx` (choice buttons pre-lock, `nextButton`), `app/results.tsx` (`shareButton`, `tryAgainButton`), `src/feedback/ReportFeedbackModal.tsx` (submit + retry), `src/productFeedback/ProductFeedbackModal.tsx` (submit + retry)
```tsx
<Pressable
  style={({ pressed }) => [
    styles.someButton,
    /* any existing conditional disabled/state styles stay in the array too */
    pressed && { backgroundColor: colors.pressed },
  ]}
  ...
>
```
Key rule: this is a pure conversion of an existing `style={[...]}` array literal into a `style={({ pressed }) => [...]}` function that returns the same array shape plus one appended `pressed && {...}` entry. Do not use `onPressIn`/`onPressOut`/`useState` — no existing precedent for that pattern, and it is explicitly rejected in CONTEXT.md D-04.

### `primary`/`primarySoft` → `info`/`infoSoft` token-pairing convention
**Source:** `src/theme/tokens.ts` lines 2-3 (existing `primary`/`primarySoft` adjacency)
**Apply to:** `src/theme/tokens.ts` (new `infoSoft` key), `src/components/OfflinePill.tsx` (consumer swap)
The "base" token is a saturated brand/status color; the "Soft" companion is a pale background tint meant to sit under text/icons colored with the base token. `infoSoft` (`#DCEBF0`) is the teal-family counterpart to `primarySoft` (`#FDE7DF`), following this exact structural relationship.

### Exhaustive `toEqual()` test-assertion style
**Source:** `src/theme/tokens.test.ts` (every test in the file)
**Apply to:** `src/theme/tokens.test.ts`'s `colors` assertion update
Each token group (`colors`, `spacing`, `radius`) is asserted with one full-object `toEqual()`, not per-key `toBe()` checks — new keys are added directly into the existing literal, not as separate new `it()` blocks.

## No Analog Found

None — every file in scope has at least a strong self-analog (existing style block to convert) or a structural twin (`ReportFeedbackModal.tsx` ↔ `ProductFeedbackModal.tsx`). The one genuinely new mechanism (`Pressable`'s `style={({pressed}) => ...}` function-prop form) has no in-repo precedent to copy from — its exact usage is instead fully specified by `28-UI-SPEC.md`'s "Interaction States" section, which downstream plans should treat as the authoritative source for that one pattern.

## Metadata

**Analog search scope:** `app/`, `src/theme/`, `src/components/`, `src/feedback/`, `src/productFeedback/` (all files in phase scope read directly; no broader repo grep needed since every target file already contains its own closest analog)
**Files scanned:** 8 (all files in phase scope) + `28-CONTEXT.md` + `28-UI-SPEC.md`
**Pattern extraction date:** 2026-08-14
