# Phase 26: Theme Palette Update - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-13
**Phase:** 26-theme-palette-update
**Areas discussed:** Error color, New aliases (pressed/info), Background/surface mapping

---

## Error color

| Option | Description | Selected |
|--------|-------------|----------|
| Keep old red #D64545 | Error/destructive states stay red — outside the 9 guideline colors, since none of them read as an error/danger color | ✓ |
| Use deep orange #C94A2D | Reuse a guideline color for error states — keeps the palette closed, but orange-on-orange may be less distinct | |

**User's choice:** Keep old red `#D64545`
**Notes:** None of the 9 guideline colors read as danger/error; reusing deep orange would reduce visual distinctiveness from `primary`.

---

## New aliases (pressed/info)

| Option | Description | Selected |
|--------|-------------|----------|
| pressed = deep orange, info = teal | deep orange as pressed/active state of primary (darker shade of same hue); teal as new "info" semantic color | ✓ |

**User's choice:** `pressed` → `#C94A2D` (deep orange), `info` → `#36799A` (teal)
**Notes:** Neither is wired into any component yet — this phase only adds the token values; Phase 28 wires them in.

---

## Background/surface mapping

| Option | Description | Selected |
|--------|-------------|----------|
| background = warm bg, surface = canvas | `background` (#FFF9F6) as main screen background, matching Phase 25's splash/icon background; `surface` (#F1EFED) as card/pill background | ✓ |

**User's choice:** `background` → `#FFF9F6`, `surface` → `#F1EFED`
**Notes:** Chosen for visual continuity with the Phase 25 warm background used in the app icon and splash source SVG.

---

## Claude's Discretion

- Exact key ordering in the `colors` object literal.
- Whether `tokens.test.ts`'s test structure (one `toEqual` per token group) is preserved as-is or split further.

## Deferred Ideas

None — discussion stayed within phase scope.
