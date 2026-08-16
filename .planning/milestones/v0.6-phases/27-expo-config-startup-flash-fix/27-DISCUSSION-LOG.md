# Phase 27: Expo Config & Startup Flash Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-13
**Phase:** 27-Expo Config & Startup Flash Fix
**Areas discussed:** Orphaned background asset, Header token mapping, Status bar approach, expo-system-ui wiring

---

## Orphaned background asset

| Option | Description | Selected |
|--------|-------------|----------|
| Delete the file | Remove `assets/images/android-icon-background.png` along with the app.json reference — keeps the asset directory free of dead files, matches Phase 25's asset-cleanup precedent. | ✓ |
| Leave the file, just drop the reference | Only edit app.json; leave the PNG in `assets/images/` in case it's needed again later. | |

**User's choice:** Delete the file
**Notes:** None

---

## Header token mapping

| Option | Description | Selected |
|--------|-------------|----------|
| background + text | `headerStyle.backgroundColor` = `colors.background` (#FFF9F6), `headerTintColor` = `colors.text` (#24201E, dark ink). | ✓ |
| surface + primary | `headerStyle.backgroundColor` = `colors.surface` (#F1EFED), `headerTintColor` = `colors.primary` (#F2643E orange). | |

**User's choice:** background + text
**Notes:** None

---

## Status bar approach

| Option | Description | Selected |
|--------|-------------|----------|
| `<StatusBar style="dark" />` in _layout.tsx | Render expo-status-bar's component once in RootLayout. Declarative, React-driven. | ✓ |
| app.json plugin/expo-status-bar config | Configure status bar style via static app.json config instead of a component. | |

**User's choice:** `<StatusBar style="dark" />` in _layout.tsx
**Notes:** None

---

## expo-system-ui wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Own separate useEffect | Independent effect from the existing `prefetch()` effect — different concern. | ✓ |
| Same effect as prefetch() | Add the SystemUI call alongside `prefetch()` in the existing useEffect. | |

**User's choice:** Own separate useEffect
**Notes:** None

---

## Claude's Discretion

- Exact hex/imageWidth/userInterfaceStyle values for CONFIG-01/02/03 (already fully specified by REQUIREMENTS.md).
- Whether `SystemUI.setBackgroundColorAsync` needs error handling — left to planner/executor to check existing codebase precedent.

## Deferred Ideas

None — discussion stayed within phase scope. Per-screen palette application beyond the header is Phase 28's scope.
