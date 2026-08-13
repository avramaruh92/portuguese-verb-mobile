# Phase 27: Expo Config & Startup Flash Fix - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 3 (2 modified, 1 deleted)
**Analogs found:** 2 / 3 (config file has no code analog — it's declarative JSON; asset deletion has a plan-doc precedent, not a code analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `app.json` | config | N/A (declarative) | `app.json` itself (self-modification) | n/a — no code analog exists; edit in place |
| `app/_layout.tsx` | provider/root-component | event-driven (mount effects) | `app/_layout.tsx` itself (existing file, being extended) | exact — extend existing effect pattern |
| `assets/images/android-icon-background.png` (deletion) | asset | file-I/O | Phase 25's asset-cleanup precedent (`25-01-PLAN.md`) | role-match (process precedent, not code) |

## Pattern Assignments

### `app.json` (config)

**No code analog needed** — this is direct declarative JSON editing. Current full relevant state (`/Users/avi/portuguese-verb/portuguese-verb-mobile/app.json`):

```json
{
  "expo": {
    "userInterfaceStyle": "automatic",   // CONFIG-03 target: "light"
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",              // CONFIG-02 target: brand color (per REQUIREMENTS.md)
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",  // CONFIG-02: remove this key entirely
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",             // CONFIG-01 target: "#FFF9F6" (colors.background)
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 76                          // CONFIG-01 target: locked value from REQUIREMENTS.md
        }
      ],
      "expo-image",
      "expo-status-bar",
      "expo-web-browser"
    ]
  }
}
```

**Editing instructions:**
- Edit the `expo-splash-screen` plugin tuple's `backgroundColor` and `imageWidth` in place (CONFIG-01) — exact target values are in `.planning/REQUIREMENTS.md` CONFIG-01, not restated here since CONTEXT.md defers to that doc.
- Remove the `backgroundImage` key from `android.adaptiveIcon` entirely (CONFIG-02) — do not set it to `null`/`""`, delete the JSON key.
- Change top-level `"userInterfaceStyle": "automatic"` to `"userInterfaceStyle": "light"` (CONFIG-03).
- `expo-status-bar` is already listed as a plugin string (no options object) — no plugin-level config change needed for CONFIG-04; the status bar style is handled declaratively in `_layout.tsx` (see below), matching D-04's rationale ("expo-status-bar's static config is mostly for Android translucency, not the dark/light content choice").

---

### `app/_layout.tsx` (provider/root-component, event-driven)

**Analog:** itself — this is an in-place extension of the existing 16-line file, not a net-new file. Full current content:

```typescript
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { prefetch } from "../src/dataset/source";

export default function RootLayout() {
  useEffect(() => {
    prefetch();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: true }} />
    </SafeAreaProvider>
  );
}
```

**Imports pattern to extend** (add to existing import block, same relative-then-external ordering the file already uses — note this file currently puts external imports first then relative, consistent with CONVENTIONS.md import order):
```typescript
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { prefetch } from "../src/dataset/source";
import { colors } from "../src/theme/tokens";
```

**Effect pattern — separate effect per D-05** (mirror the existing bare `useEffect(() => { prefetch(); }, [])` shape, add a second sibling effect rather than merging concerns):
```typescript
useEffect(() => {
  prefetch();
}, []);

useEffect(() => {
  SystemUI.setBackgroundColorAsync(colors.background);
}, []);
```
Note: `SystemUI.setBackgroundColorAsync` returns a `Promise<void>`. There is **no existing fire-and-forget-with-try/catch precedent** anywhere in this codebase to copy — the closest analogous pattern (`prefetch()` in `src/dataset/source.ts:27-31`) is fire-and-forget but delegates its own internal error handling to `resolve()`'s try/catch (`src/dataset/source.ts:13-24`), which silently falls back rather than surfacing an error. If the executor wants matching internal safety, wrap only inside a helper, e.g. `SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});`, but no direct codebase precedent mandates this — CONTEXT.md explicitly leaves it to planner/executor discretion.

**Stack screenOptions pattern** (extend existing `screenOptions={{ headerShown: true }}` object — do not replace, add keys):
```typescript
<Stack
  screenOptions={{
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
  }}
/>
```

**StatusBar placement** — render once, as a sibling inside `SafeAreaProvider` alongside `Stack` (standard Expo Router root-layout pattern; no existing codebase example since this is the first usage, but this is the documented expo-status-bar usage shape):
```typescript
return (
  <SafeAreaProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ ... }} />
  </SafeAreaProvider>
);
```

**Per-screen non-interference confirmed:** `app/index.tsx` (lines 1-13, esp. `Stack, useRouter` import) and `app/quiz.tsx` (lines 1-14) both import `Stack` from `expo-router` for their own `<Stack.Screen options={{...}}>` calls, but neither sets `headerStyle`/`headerTintColor` in those per-screen options — confirmed via grep, only `headerShown`/`headerTitle` and back-button interception options are set per-screen. Root `screenOptions` changes are safe to make in isolation without touching `app/index.tsx` or `app/quiz.tsx`.

---

### `assets/images/android-icon-background.png` (deletion)

**Analog/precedent:** `.planning/phases/25-brand-asset-pipeline/25-01-PLAN.md` — this file documents that `android-icon-background.png` was deliberately left untouched in Phase 25 and explicitly deferred to this phase for removal alongside the `app.json` `backgroundImage` key deletion. No code pattern needed — this is a plain `git rm` / filesystem delete performed in the same change as the `app.json` CONFIG-02 edit (the asset and its config reference must be removed together, not independently).

---

## Shared Patterns

### Theme token usage
**Source:** `src/theme/tokens.ts` (lines 1-11)
**Apply to:** `app/_layout.tsx`'s new `SystemUI.setBackgroundColorAsync` call and `Stack screenOptions.headerStyle`/`headerTintColor`
```typescript
export const colors = {
  background: "#FFF9F6",
  text: "#24201E",
  // ...
};
```
Import `colors` from `"../src/theme/tokens"` (relative path — no alias convention exists in this codebase per CONVENTIONS.md) and reference `colors.background` / `colors.text` rather than hardcoding hex literals, matching every existing screen's convention (`app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `src/components/OfflinePill.tsx` all import tokens this way — `ReportFeedbackModal.tsx` is the one documented anti-pattern exception, do not copy it).

### Effect-per-concern separation
**Source:** `app/_layout.tsx` itself (existing `prefetch()` effect)
**Apply to:** the new `SystemUI` effect
Keep the new `SystemUI.setBackgroundColorAsync` call in its own `useEffect(() => {...}, [])`, not merged into the existing `prefetch()` effect — explicit decision D-05, and matches the codebase's general small-single-purpose-function ethos (CONVENTIONS.md "Function Design").

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app.json` plugin/config edits | config | n/a | No prior `expo-splash-screen`/`adaptiveIcon`/`userInterfaceStyle` edit pattern to copy from beyond the file's own current state — this is direct JSON editing against locked values in `.planning/REQUIREMENTS.md` CONFIG-01–03, not a code pattern. |
| `expo-status-bar` / `expo-system-ui` usage | provider wiring | event-driven | Both packages are installed dependencies but have zero prior usage anywhere in `src/`/`app/` (confirmed via `grep -rn "expo-system-ui\|SystemUI\|expo-status-bar\|StatusBar" src app`) — this phase is the first usage of both. Use each library's standard documented API shape (`<StatusBar style="dark" />`, `SystemUI.setBackgroundColorAsync(hex)`) rather than a codebase precedent. |

## Metadata

**Analog search scope:** `app/`, `src/theme/`, `src/dataset/source.ts`, `app.json`, `.planning/phases/25-brand-asset-pipeline/`
**Files scanned:** `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `src/theme/tokens.ts`, `src/dataset/source.ts`, `app.json`, `25-01-PLAN.md`
**Pattern extraction date:** 2026-08-13
