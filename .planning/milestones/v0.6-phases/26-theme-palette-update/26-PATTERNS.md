# Phase 26: Theme Palette Update - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 2
**Analogs found:** 2 / 2 (self-analogs — both files already exist and are edited in place, not created new)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/theme/tokens.ts` | config (design tokens) | transform (static data literal, no logic) | itself (current `colors` export, lines 1-10) | exact (in-place edit) |
| `src/theme/tokens.test.ts` | test | request-response n/a — plain assertion (CRUD-less unit test) | itself (current `colors` `toEqual` block, lines 4-15) | exact (in-place edit) |

Both files are edited in place — there is no cross-module analog search needed since the "closest analog" to a hex-value edit is the file's own current structure. No other file in the codebase defines a comparable flat color-token object, so no secondary analog was needed.

## Pattern Assignments

### `src/theme/tokens.ts` (config, transform)

**Analog:** itself, `src/theme/tokens.ts` lines 1-10 (current `colors` object)

**Current pattern to preserve exactly (object literal shape, export style):**
```typescript
export const colors = {
  primary: "#E8663D",
  primarySoft: "#FCE4DA",
  success: "#2FA84F",
  error: "#D64545",
  background: "#FFFFFF",
  text: "#1C1B1A",
  textSecondary: "#6B6560",
  surface: "#F2F2F1",
};
```

**What changes (per CONTEXT.md D-01..D-11):** only the `colors` object's key set and hex values. `spacing`, `radius`, `typography` (lines 12-32) are untouched — do not touch them, do not reformat them.

**Target `colors` object** (from CONTEXT.md, key ordering is Claude's discretion):
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

**Style conventions to preserve:**
- `export const colors = { ... };` — plain object literal, no `as const`, no type annotation (matches existing style; other token exports in the same file, e.g. `spacing`/`radius`, follow the same untyped-object-literal pattern — see `src/theme/tokens.ts:12-24`).
- Named export only, no default export (matches project-wide convention in CONVENTIONS.md — "always named exports, no default exports observed anywhere in `src/`").
- No import changes needed — this file has zero imports today and needs none for a pure data change.

---

### `src/theme/tokens.test.ts` (test, n/a)

**Analog:** itself, `src/theme/tokens.test.ts` lines 1-20 (current `colors` test block)

**Current pattern to preserve exactly (exact `toEqual` snapshot style, not `toMatchObject`):**
```typescript
import { colors, spacing, radius, typography } from "./tokens";

describe("theme tokens (Lafa palette + token completeness)", () => {
  it("colors export the exact Lafa palette", () => {
    expect(colors).toEqual({
      primary: "#E8663D",
      primarySoft: "#FCE4DA",
      success: "#2FA84F",
      error: "#D64545",
      background: "#FFFFFF",
      text: "#1C1B1A",
      textSecondary: "#6B6560",
      surface: "#F2F2F1",
    });
  });

  it("colors no longer export the old accent/secondary keys", () => {
    expect((colors as Record<string, unknown>).accent).toBeUndefined();
    expect((colors as Record<string, unknown>).secondary).toBeUndefined();
  });
  ...
```

**What changes:** only the first `it("colors export the exact Lafa palette", ...)` block's expected object (lines 5-14) must be replaced with the full new 10-key `colors` object matching `tokens.ts` exactly (whichever key order is chosen there — `toEqual` is order-independent for object literals, so ordering doesn't need to match key-for-key, but the key set and values must be identical).

**What must NOT change:**
- The `describe`/`it` block structure and naming style (`it("colors export the exact Lafa palette", ...)`) — per CONTEXT.md's "Claude's Discretion" note, splitting further is allowed but not required; the existing single-`toEqual`-per-group pattern is the established convention and should be the default unless there's a reason to split.
- The second `it("colors no longer export the old accent/secondary keys", ...)` block (lines 17-20) — `accent`/`secondary` were never part of either the old or new palette, so this assertion remains valid and unchanged.
- All `spacing`/`radius`/`typography` test blocks (lines 22-59) — untouched, no `spacing`/`radius`/`typography` edits in this phase.
- The `describe` title itself (`"theme tokens (Lafa palette + token completeness)"`) — no rename requested in CONTEXT.md.

**Testing pattern convention (from CONVENTIONS.md/STACK.md):** Jest via `jest-expo` preset, plain unit test with no `@testing-library/react-native` needed (pure data assertions), file is one of the rare test files co-located next to its source (`src/theme/tokens.test.ts` sits beside `src/theme/tokens.ts`, not under `__tests__/`) — this co-location is already established and must be preserved, not moved to `__tests__/`.

---

## Shared Patterns

### Exact-value `toEqual` assertions over old/new hex literals
**Source:** `src/theme/tokens.test.ts` lines 4-15
**Apply to:** the updated `colors` test block — replace the entire expected object per-key with the CONTEXT.md D-01..D-10 mapping; do not use `toMatchObject` or partial key checks, matching the existing "exact snapshot, not partial" convention noted in CONTEXT.md's `code_context` section.

### No `as const` / no type widening on token objects
**Source:** `src/theme/tokens.ts` lines 1-24 (`colors`, `spacing`, `radius` are all untyped plain object literals; only `typography`'s nested values use `as const` for `fontWeight` literals, e.g. line 27 `fontWeight: "400" as const`)
**Apply to:** `colors` — do not add `as const` to the `colors` object itself; this differs from `typography`'s per-field `as const` usage and should not be introduced as new scope creep.

## No Analog Found

None — both in-scope files already exist with a clear current pattern to follow; no cross-file analog search was necessary.

## Metadata

**Analog search scope:** `src/theme/tokens.ts`, `src/theme/tokens.test.ts` (self-analogs only, per phase scope)
**Files scanned:** 2 (both fully read, ≤ 33 lines and ≤ 61 lines respectively — no large-file strategy needed)
**Pattern extraction date:** 2026-08-13
