---
phase: 01-scaffold
reviewed: 2026-07-12T14:28:23Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - app/_layout.tsx
  - app/index.tsx
  - src/store/useQuizStore.ts
  - __tests__/smoke.test.ts
  - __tests__/useQuizStore.test.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-12T14:28:23Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This is a bare-bones Expo Router scaffold (root layout, index screen, an inert Zustand
store, and two smoke-level tests). The code itself is small and mostly correct — no
security issues, no logic bugs in what little logic exists. Findings are limited to one
CI/workflow-breaking gap (`lint` script has no installed ESLint dependencies) and a few
lower-severity notes about scaffold completeness that should be tracked before later
phases build on top of them.

## Warnings

### WR-01: `npm run lint` will fail (or hang) — no ESLint dependency is installed

**File:** `package.json:19` (script `"lint": "expo lint"`)
**Issue:** `package.json` defines a `lint` script that shells out to `expo lint`, but
`node_modules` contains no `eslint`, `eslint-config-expo`, or any ESLint-related package
(confirmed via `ls node_modules | grep -i eslint` → no matches), and there is no
`eslint.config.js`/`.eslintrc*` in the repo. `expo lint` performs first-run interactive
setup (it prompts to install missing ESLint dependencies) when it detects no config —
this works fine in an interactive terminal but will hang or fail non-interactively (CI,
pre-commit hooks, `gsd` automation) since there's no `--yes`/non-interactive flag wired
in. As written, any automated pipeline that runs `npm run lint` on this repo state will
break.
**Fix:** Either commit the ESLint config and add the dependency now:
```bash
npx expo lint --yes   # or: npm install --save-dev eslint eslint-config-expo
```
and commit the resulting `eslint.config.js`, or explicitly defer linting setup to a
follow-up phase and remove/no-op the `lint` script in the interim so CI doesn't silently
depend on an interactive prompt.

## Info

### IN-01: Root layout does not wrap navigation in `SafeAreaProvider`

**File:** `app/_layout.tsx:1-5`
**Issue:** `react-native-safe-area-context` is already a project dependency (per
`package.json`) and CLAUDE.md marks this app iOS-first, but `RootLayout` renders a bare
`<Stack screenOptions={{ headerShown: false }} />` with no `SafeAreaProvider` wrapper.
Today's single centered `<Text>` screen isn't affected, but once real screens add
headers, top-anchored content, or absolutely-positioned elements, missing the provider
at the root is easy to forget and causes notch/status-bar clipping bugs that are
annoying to retrofit later.
**Fix:**
```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

### IN-02: `typescript` devDependency (`~6.0.3`) does not match the stack guidance in CLAUDE.md

**File:** `package.json:31`
**Issue:** CLAUDE.md's technology stack notes explicitly say to stay on "the TypeScript
5.x line Expo's template installs" and to avoid manually bumping past it until the
Expo/Metro toolchain's compatibility with newer compiler internals is broadly validated.
The scaffolded `package.json` pins `typescript@~6.0.3`, which is neither the documented
5.x baseline nor an explicit, reasoned upgrade decision recorded anywhere in
`.planning/`. This may be an artifact of whatever `create-expo-app` template version was
used, but as it stands it's an undocumented deviation from the project's own locked
guidance.
**Fix:** Either confirm SDK 57's template genuinely ships `typescript@6.x` now (and
update CLAUDE.md's stack table to match reality), or pin back to the documented 5.x line
if this was an unintentional bump.

### IN-03: `useQuizStore` currently exposes no state transitions

**File:** `src/store/useQuizStore.ts:3-9`
**Issue:** `QuizStoreState` is typed as `{ status: "idle" }` — a single-member literal
union with no setter/action to ever change it. As written the store can never leave
`"idle"`, so it's inert scaffolding rather than a functioning state container. This is
presumably intentional for a phase-1 skeleton, but there's no `[TBD]`/`// TODO`-style
marker in the file itself flagging that the real state machine (question index, answers,
score, filters — per CLAUDE.md) is still to come, which risks it being mistaken for
"done" in a later review pass.
**Fix:** Either leave as-is but note in the phase plan/roadmap that this is intentionally
a placeholder pending Phase 2's quiz-session state design, or add a short inline comment
marking it as a scaffold pending real actions.

---

_Reviewed: 2026-07-12T14:28:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
