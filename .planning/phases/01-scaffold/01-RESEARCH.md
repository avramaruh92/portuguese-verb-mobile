# Phase 1: Scaffold - Research

**Researched:** 2026-07-12
**Domain:** Expo Router + TypeScript + Zustand + jest-expo greenfield scaffolding (iOS-first)
**Confidence:** HIGH

## Summary

This phase is pure infrastructure: produce a booting Expo Router app with TypeScript strict mode,
a wired `jest-expo` test preset with one passing smoke test, and an importable (unused) Zustand
store scaffold. No domain logic. The critical finding is that Expo's current quick-start command —
`npx create-expo-app@latest --template default@sdk-57` — does **not** produce a bare single-route
app. It ships a tabs demo (`app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, themed components,
demo assets, a `scripts/reset-project.js` helper). This directly conflicts with CONTEXT.md D-04
("single index route only, no other stub routes"), so the plan MUST include an explicit cleanup
step — either running the template's own `npm run reset-project` script (which the default template
provides for exactly this purpose) or manually deleting the demo route group and replacing it with
a single `app/index.tsx` + `app/_layout.tsx`.

All six packages this phase installs (`expo`, `expo-router`, `zustand`, `zod`, `jest-expo`,
`@types/jest`) were verified against the npm registry via `npm view` and passed `slopcheck`
`[OK]` under `--ecosystem npm`. Current published versions as of 2026-07-12: `expo@57.0.4`,
`expo-router@57.0.4`, `zustand@5.0.14`, `zod@4.4.3`, `jest-expo@57.0.1`, TypeScript stays on the
5.x line the template installs (`typescript@7.0.2` also now exists on the registry as a Go-native
rewrite but is NOT recommended for this SDK per project-level STACK.md — do not let `npx expo
install` or template scaffolding pull it in unpinned).

**Primary recommendation:** Scaffold with `npx create-expo-app@latest --template default@sdk-57`
(gets Expo Router + TypeScript in lockstep with SDK 57 automatically), immediately strip the tabs
demo down to a single `app/index.tsx` route per D-04, layer `"strict": true` onto
`expo/tsconfig.base`, add `jest-expo` + `@types/jest` via `npx expo install -D`, add a trivial
`__tests__/smoke.test.ts`, and add an empty `src/store/useQuizStore.ts` Zustand store scaffold
that is imported (but not used) by a test to prove it doesn't throw at import time.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| App bootstrapping / native runtime | Client (Expo managed runtime) | — | Expo SDK + Metro own process startup; no server tier exists in this app |
| Routing (single empty route) | Client (Expo Router, file-based) | — | `app/` is the sole routing mechanism; no SSR, no backend routing |
| Quiz/session state container (unused scaffold this phase) | Client (Zustand store) | — | In-memory only, no persistence tier this phase or ever in v0 |
| Type safety / build-time validation | Client (TypeScript compiler) | — | `tsc --noEmit` runs locally/in CI, no server involved |
| Test execution | Client (Jest via jest-expo, Node process) | — | Tests run in Node against RN/Expo shims; no device or simulator needed for this criterion |

This phase has no backend/API/CDN tier — everything is local, offline, client-only, consistent
with CLAUDE.md's "no content-serving API, no direct database access" constraint.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `expo` | 57.0.4 [VERIFIED: npm registry] | Managed RN toolchain | Locked project-wide per `.planning/research/STACK.md`; confirmed current via `npm view expo version` |
| `expo-router` | 57.0.4 [VERIFIED: npm registry] | File-based routing | Versioned in lockstep with `expo`; installed automatically by the `default@sdk-57` template |
| `zustand` | 5.0.14 [VERIFIED: npm registry] | Quiz session state scaffold (unused this phase) | Locked project-wide; requires React 18+, satisfied by RN 0.86's bundled React |
| `typescript` | 5.x, whatever the template installs — do NOT bump to `typescript@7.0.2` [VERIFIED: npm registry exists, but avoidance is CITED: project STACK.md] | Type safety, strict mode | `typescript@7.0.2` is now published on the registry (confirmed via `npm view`) but Expo/Metro toolchain compatibility with the Go-native rewrite is not yet broadly validated as of SDK 57 — inherited constraint from project-level research, treat as locked |
| `jest-expo` | 57.0.1 [VERIFIED: npm registry] | Jest preset for RN/Expo module transforms | Official Expo-maintained preset; confirmed current via `npm view jest-expo version` |
| `@types/jest` | latest matching `jest@30.x` [VERIFIED: npm registry] | Type defs for Jest globals (`describe`/`it`/`expect`) | Required for `tsconfig.json`'s `"types": ["jest"]` to resolve under strict mode |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.4.3 [VERIFIED: npm registry] | Not exercised this phase, but install now per project STACK.md so Phase 2 doesn't need a separate install step | Optional to install in Phase 1 vs Phase 2 — Claude's discretion; installing now keeps `package.json` stable across the first two phases and lets `npx expo install` resolve everything once |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `--template default@sdk-57` (tabs demo, then strip) | `--template blank-typescript` (no router) + manual `expo-router` install | `blank-typescript` requires the full manual Expo Router installation flow (root layout, `expo-router/entry`, babel/metro config edits) — more steps and more surface area for scaffolding mistakes than starting from the router-ready default template and deleting the demo content. **Recommendation: use `default@sdk-57`, not `blank-typescript`.** This deviates from `.planning/research/STACK.md`'s literal installation snippet (which shows `blank-typescript`), because that snippet predates confirming CONTEXT.md D-04's exact route requirement — `default@sdk-57` is the correct choice for an Expo-Router-from-the-start project. |
| Config in `package.json` (`"jest": { "preset": "jest-expo" }`) | Separate `jest.config.js` | Official Expo docs show config living in `package.json`'s `"jest"` key as the primary path; a separate `jest.config.js` also works and is common in community examples. Either is fine — pick one and don't duplicate. **Recommendation: `package.json` `"jest"` key**, per official Expo unit-testing docs, since it's one file fewer for a scaffold this small. |

**Installation:**
```bash
npx create-expo-app@latest --template default@sdk-57
cd <project-dir>
npx expo install zustand zod
npx expo install -D jest-expo @types/jest
```

**Version verification:** Verified 2026-07-12 via `npm view <pkg> version`:
`expo@57.0.4`, `expo-router@57.0.4`, `zustand@5.0.14`, `zod@4.4.3`, `jest-expo@57.0.1`,
`typescript@7.0.2` (exists but not to be used — stay on template-installed 5.x),
`create-expo-app@4.0.0` (the scaffolding CLI itself), `eslint-config-expo@57.0.0`,
`react-test-renderer@19.2.7` (transitively pulled by `jest-expo`, no separate install needed).

## Package Legitimacy Audit

| Package | Registry | Source Repo | Postinstall script | slopcheck | Disposition |
|---------|----------|--------------|---------------------|-----------|-------------|
| `expo` | npm | github.com/expo/expo | none found | [OK] (npm ecosystem) | Approved |
| `expo-router` | npm | github.com/expo/expo | none found | [OK] (npm ecosystem) | Approved |
| `zustand` | npm | github.com/pmndrs/zustand | none found | [OK] (npm ecosystem) | Approved |
| `zod` | npm | github.com/colinhacks/zod | none found | [OK] (npm ecosystem) | Approved |
| `jest-expo` | npm | github.com/expo/expo | none found | [OK] (npm ecosystem) | Approved |
| `@types/jest` | npm | github.com/DefinitelyTyped/DefinitelyTyped | none found | [OK] (npm ecosystem) | Approved |

**Method:** `slopcheck` was installed successfully (`pip install slopcheck --break-system-packages`)
and run twice. **First run auto-detected the wrong ecosystem** (pypi, because this repo has no
`package.json` yet) and reported false-positive `[SLOP]` verdicts for `jest-expo`, `expo-router`,
`zustand`, and `@types/jest` — those names correctly don't exist on PyPI, they're npm packages.
Re-running with `--ecosystem npm` in an isolated scratch directory produced accurate `[OK]`
verdicts for all six packages. **Lesson for planner/executor:** if `slopcheck` is ever re-run in
this repo before `package.json` exists, force `--ecosystem npm` explicitly — auto-detection will
default to pypi and produce misleading blocks. `npm view <pkg> scripts.postinstall` returned empty
for all six packages — no suspicious postinstall behavior detected.

**Packages removed due to slopcheck [SLOP] verdict:** none (the four initial [SLOP] verdicts were
a pypi/npm ecosystem-detection false positive, corrected by re-running with `--ecosystem npm`).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
[iOS Simulator] ──launches──> [Expo managed runtime / Metro bundler]
                                        │
                                        ▼
                          [app/_layout.tsx — root layout]
                                        │
                                        ▼
                          [app/index.tsx — single empty route]
                                        │
                                        ▼
                        renders placeholder screen (View + Text)

[src/store/useQuizStore.ts] ──imported by── [__tests__/store.smoke.test.ts]
        (Zustand store, no consumers in app/ yet — proven import-safe only)

[Jest process, Node] ──runs── [__tests__/*.test.ts] ──via preset── [jest-expo]
                                        │
                        exercises: (a) trivial smoke assertion
                                   (b) useQuizStore import + initial-state check

[TypeScript compiler] ──tsc --noEmit── [entire src/ + app/ tree]
                        strict mode, zero errors required
```

A reader can trace the primary use case (app boots to empty screen) top-to-bottom: Simulator
launches the Expo runtime, Metro serves the bundle, the root layout mounts, the single route
renders. The test and typecheck paths are independent, parallel verification flows that don't
touch the simulator at all — this matters for how the phase's success criteria get verified (see
Validation Architecture below).

### Recommended Project Structure

```
app/
├── _layout.tsx        # Root layout — Stack or Slot, no tabs, no providers needed yet
└── index.tsx           # The single empty root route (D-04) — renders "Portuguese Verb Quiz" placeholder per 01-UI-SPEC.md
src/
└── store/
    └── useQuizStore.ts  # Zustand store scaffold — minimal shape, no quiz logic yet (Phases 2-4 own that)
__tests__/
├── smoke.test.ts        # Trivial jest-expo smoke test
└── useQuizStore.test.ts # Proves the store imports and initializes without runtime error
tsconfig.json             # extends expo/tsconfig.base, strict: true, types: ["jest"]
package.json               # "jest": { "preset": "jest-expo" }, "scripts": { "test": "jest" }
```

Note `src/dataset/`, `src/quiz-engine/`, `src/api/`, `src/components/` from
`.planning/research/ARCHITECTURE.md`'s full recommended structure are **not** created this phase —
they belong to Phases 2-5 per the roadmap's build order. Creating empty placeholder folders for
them now is unnecessary scope creep for an infrastructure-only phase; each later phase creates its
own folder when it has real content to put there.

### Pattern 1: Router-ready template, then subtract to spec

**What:** Start from `create-expo-app`'s `default@sdk-57` template (which includes Expo Router,
TypeScript, and a tabs demo), then delete/replace the demo content down to exactly what D-04
specifies, rather than building up from a router-less blank template.

**When to use:** Any time the desired end state is "Expo Router app" and the official default
template already wires Router correctly — subtracting demo content is lower-risk than manually
wiring Router's babel/metro config from a blank template.

**Example:**
```bash
# Source: https://docs.expo.dev/router/introduction/ (quick start command)
npx create-expo-app@latest --template default@sdk-57

# The default template ships its own reset helper for exactly this "strip the demo" step:
# Source: expo-template-default (github.com/expo/expo-template-default) package.json scripts
npm run reset-project
# This moves demo app/ content to app-example/ and leaves a minimal app/index.tsx + app/_layout.tsx.
# Verify the result still matches D-04 (single index route) — the reset script's exact output
# should be confirmed against the installed template version at execution time, not assumed here.
```

### Pattern 2: `package.json`-embedded Jest config with `jest-expo` preset

**What:** Configure Jest entirely inside `package.json`'s `"jest"` key rather than a separate
`jest.config.js`.

**When to use:** Standard for Expo projects per official docs; avoids an extra config file for a
single-preset setup.

**Example:**
```json
// Source: https://docs.expo.dev/develop/unit-testing/
{
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```
Note: official docs show `"test": "jest --watchAll"` for local dev loops; for this phase's
acceptance criterion ("test suite executes and passes"), prefer a plain `"test": "jest"` (single
run, non-watching, correct exit code) — `--watchAll` never exits and is wrong for scripted
verification. Keep `--watchAll` as an optional second script (`"test:watch"`) if desired, not the
default `test` script.

### Pattern 3: Strict TypeScript layered on `expo/tsconfig.base`

**What:** Extend Expo's base tsconfig and explicitly opt into `"strict": true`, plus `"types":
["jest"]` so Jest globals type-check under strict mode.

**Example:**
```json
// Source: https://docs.expo.dev/guides/typescript/ (official recommendation)
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "types": ["jest"]
  }
}
```
Per CONTEXT.md, additional strict flags beyond `"strict": true` (e.g.
`noUncheckedIndexedAccess`) are Claude's discretion. Recommendation: add
`"noUncheckedIndexedAccess": true` now — it's cheap to satisfy on an empty scaffold and pays off
directly once `src/dataset/verbs.ts` (Phase 2) does array/record lookups by tense/subject key,
which is exactly the class of bug (missing conjugation cell) the project's own constraints call
out as worth catching at compile time.

### Anti-Patterns to Avoid

- **Leaving the tabs demo in place and calling it done:** The `default@sdk-57` template's shipped
  `app/(tabs)/index.tsx` + `app/(tabs)/explore.tsx` + themed components satisfy "app boots" but
  violate D-04 ("single index route only, no stub routes"). This must be explicitly cleaned up,
  not left as "good enough."
- **Adding a `jest.config.js` AND a `package.json` `"jest"` key:** Having both is a known source of
  "which config actually wins" confusion in the Jest ecosystem. Pick one (this research recommends
  `package.json`).
- **Installing `typescript@7` because `npm view` shows it as current:** The registry having a newer
  major does not mean it's the right choice for this Expo SDK — see Standard Stack table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| RN/Expo Jest module transforms (native module mocks, `transformIgnorePatterns` for `react-native`/`expo`/etc.) | Custom Babel + Jest config | `jest-expo` preset | Official preset exists precisely to solve this; hand-rolling reliably reproduces "works locally, fails in CI" bugs (per `.planning/research/STACK.md`, already locked as a "what NOT to do") |
| Expo Router wiring (babel plugin, `expo-router/entry`, root layout conventions) | Manually configuring Expo Router on top of `blank-typescript` | `default@sdk-57` template (Router pre-wired) then subtract demo content | Fewer manual config steps = fewer places to introduce a scaffolding bug in an infrastructure-only phase where "it boots with no errors" is the entire success criterion |

**Key insight:** For a scaffold phase, the highest-value move is minimizing hand-wiring by starting
from the template that already has the target end-state's plumbing (Router + TS), then subtracting
down to spec — not composing plumbing manually from a blanker starting point.

## Common Pitfalls

### Pitfall 1: Default template's demo content silently satisfies "it boots" while violating D-04

**What goes wrong:** `npx create-expo-app@latest --template default@sdk-57` produces a fully
working, boots-cleanly app — but with a tabs layout and two demo routes, not the single empty
`index` route D-04 requires. A plan that just scaffolds-and-verifies-boot without an explicit
"strip to single route" task will pass success criterion 1 while violating a locked decision.
**Why it happens:** The template is optimized for "show off Expo Router features to a new
developer," not for a minimal-infra phase.
**How to avoid:** Include an explicit task to run `npm run reset-project` (or manually delete
`app/(tabs)/` and demo `components/`/`hooks/`/`constants/` folders) and confirm `app/` contains
only `_layout.tsx` and `index.tsx` before marking the phase done.
**Warning signs:** `app/` directory contains more than 2 files, or a `(tabs)` folder exists.

### Pitfall 2: `"test": "jest --watchAll"` never exits in non-interactive/CI verification

**What goes wrong:** Official Expo docs' example test script uses `--watchAll`, which is correct
for local dev but will hang forever (never returns an exit code) when an executor or CI runs `npm
test` to verify criterion 2 ("test suite executes and passes").
**Why it happens:** Docs are written for the interactive local-dev case, not scripted verification.
**How to avoid:** Use a plain `"test": "jest"` (or `"jest --ci"`) as the default script for
verification purposes; keep `--watchAll` as a separate opt-in script if desired.
**Warning signs:** A verification command that never returns / times out.

### Pitfall 3: `npx expo start` alone cannot be scripted-verified for "boots to empty screen, no errors"

**What goes wrong:** `npx expo start` opens an interactive Metro dev server and expects a human (or
a manually-launched simulator) to load the app; it has no built-in "confirm the screen rendered
with zero errors" exit code. An executor cannot mechanically prove success criterion 1 purely by
running this command and checking its exit code, because the command itself doesn't exit — it's a
long-running dev server.
**Why it happens:** `expo start` is a dev-loop tool, not a CI/verification tool.
**How to avoid:** Use layered verification (see Validation Architecture below): automated proxies
(`tsc --noEmit`, `npx expo export`, `jest`) catch bundling/type errors without needing the
simulator at all; reserve an actual simulator boot + visual confirmation as a
`checkpoint:human-verify` step, since this agent environment has Xcode/simctl installed but no way
to visually inspect simulator output.
**Warning signs:** A plan or verify-work step that treats "ran `expo start` for N seconds without a
crash log" as sufficient proof of criterion 1 — it's a reasonable automated proxy but not a
substitute for an actual human glance at the simulator.

### Pitfall 4: `npx expo install` vs plain `npm install` version drift

**What goes wrong:** Running `npm install zustand` instead of `npx expo install zustand` can pull a
Zustand version that's technically compatible but not the one Expo's dependency resolution would
have chosen, and for any Expo-adjacent native package (not the case for pure-JS `zustand`/`zod`,
but relevant for `jest-expo`) using plain `npm install` risks a version outside the SDK's tested
compatibility range.
**Why it happens:** `npx expo install` consults Expo's version-compatibility table; plain `npm
install` just takes npm's dependency resolver's answer.
**How to avoid:** Use `npx expo install <pkg>` for every package in this phase's installation list,
per `.planning/research/STACK.md`'s already-locked guidance.
**Warning signs:** `npx expo-doctor` (if run) flags a version mismatch warning.

## Code Examples

### Minimal root layout + single route (satisfies D-04, criterion 1)

```tsx
// Source: pattern synthesized from Expo Router official docs (docs.expo.dev/router/introduction/)
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

```tsx
// app/index.tsx — per 01-UI-SPEC.md: single centered "Portuguese Verb Quiz" placeholder text
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Portuguese Verb Quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  heading: { fontSize: 20, fontWeight: '600', color: '#000000' },
});
```

### Trivial jest-expo smoke test (criterion 2)

```ts
// Source: pattern from official docs.expo.dev/develop/unit-testing/ community smoke-test convention
// __tests__/smoke.test.ts
describe('jest-expo smoke test', () => {
  it('runs and passes', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Zustand store scaffold + import-safety test (criterion 4)

```ts
// src/store/useQuizStore.ts — minimal scaffold, no quiz logic this phase
import { create } from 'zustand';

interface QuizStoreState {
  status: 'idle';
}

export const useQuizStore = create<QuizStoreState>(() => ({
  status: 'idle',
}));
```

```ts
// __tests__/useQuizStore.test.ts
import { useQuizStore } from '../src/store/useQuizStore';

describe('useQuizStore scaffold', () => {
  it('imports and initializes without runtime error', () => {
    expect(useQuizStore.getState().status).toBe('idle');
  });
});
```

### tsconfig.json (strict mode, criterion 3)

```json
// Source: https://docs.expo.dev/guides/typescript/
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["jest"]
  }
}
```

### package.json test wiring

```json
{
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `create-react-native-app` / manual RN CLI init | `npx create-expo-app@latest --template default@sdk-57` | Long-standing (years), reconfirmed current for SDK 57 as of this research | Single command produces Router + TS wired correctly; no manual Metro/babel config needed |
| Manually wiring Expo Router onto a blank template | Starting from the router-ready `default` template | Default template has shipped Router-first for multiple SDK cycles | Fewer manual wiring steps, lower error surface for a scaffold phase |

**Deprecated/outdated:** None specific to this phase's narrow scope — no deprecated APIs are
exercised by an empty scaffold.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `npm run reset-project`'s exact output (which files it deletes/moves) matches "single index route only" without further manual cleanup | Architecture Patterns, Pattern 1 | If the reset script leaves extra demo files or a different route shape than expected, the executor needs a manual verification+cleanup step rather than trusting the script's output blindly — low risk, easily caught by listing `app/` after running it |
| A2 | `typescript@7.0.2`'s Expo/Metro incompatibility is inherited from project-level `.planning/research/STACK.md` and was not independently re-verified against SDK 57 in this session (only confirmed the version exists on the registry) | Standard Stack | If Expo has since validated TS7 compatibility, staying on 5.x is merely conservative, not wrong — low risk either way, but flagged since this session did not re-fetch TypeScript-7-on-Expo-SDK-57 compatibility evidence directly |

## Open Questions

1. **Exact `default@sdk-57` template folder contents at scaffold time**
   - What we know: The template ships Expo Router + TypeScript + a tabs demo (`index.tsx`,
     `explore.tsx`, themed components, a `reset-project.js` helper) per WebSearch synthesis and the
     `expo-template-default` GitHub repo's stated purpose.
   - What's unclear: The literal current file list/names may have shifted slightly between SDK
     releases (component names, exact demo screen content) — this session did not directly fetch
     the SDK-57-pinned template's file tree.
   - Recommendation: Executor should run `ls app/` immediately after scaffolding and adapt the
     cleanup step to whatever's actually present, using D-04 ("single index route, no other stub
     routes") as the acceptance bar rather than a hardcoded file list.

2. **How to mechanically/objectively verify criterion 1 (simulator boot, no errors) in this
   execution environment**
   - What we know: Xcode (`/Applications/Xcode.app`), `xcrun simctl` (iPhone 17 Pro / iOS 26.2
     available), and CocoaPods are all installed in this environment (verified via Bash probes) —
     so a real `npx expo run:ios` build+launch is technically possible, but is slow (native build)
     and its success still doesn't visually confirm "empty screen renders correctly" without a
     screenshot/human glance.
   - What's unclear: Whether the executing agent in this GSD workflow has any mechanism to capture
     or inspect a simulator screenshot, or whether this criterion is expected to route through a
     `checkpoint:human-verify` step.
   - Recommendation: Plan should use automated proxies (`tsc --noEmit`, `npx expo export --platform
     ios` for a bundling smoke check, `jest`) for everything that can be scripted, and insert a
     `checkpoint:human-verify` task for the final "run `npx expo start`, open iOS Simulator, confirm
     empty screen with placeholder text and no red-screen error" step — this is the one criterion
     that genuinely needs a human eye in this environment.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Xcode / Xcode CLT | iOS Simulator builds (`npx expo run:ios`) | ✓ | Xcode.app at `/Applications/Xcode.app/Contents/Developer` | — |
| `xcrun simctl` | Booting/inspecting iOS simulators | ✓ | iOS 26.2 runtime, iPhone 17 Pro/Pro Max/Air/17 devices available | — |
| CocoaPods (`pod`) | Native iOS build step for `expo run:ios` | ✓ | 1.16.2 | — |
| Node.js | All tooling | ✓ | v25.0.0 | — |
| npm | Package installs | ✓ | 11.17.0 | — |
| Watchman | Metro file-watching (recommended, not required) | ✗ | — | Metro falls back to Node's built-in filesystem watcher; slower on large trees but this is a tiny greenfield scaffold, so no action needed |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** Watchman (optional perf tool) — Metro works without it for
a project this small; installing it (`brew install watchman`) is a nice-to-have, not a blocker.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x via `jest-expo@57.0.1` preset (no config file exists yet — this phase creates it) |
| Config file | `package.json` `"jest"` key (to be created this phase, per Pattern 2 above) |
| Quick run command | `npm test` (maps to `jest`, single run) |
| Full suite command | `npm test` (same — suite is trivial, 2 test files total this phase) |

### Phase Requirements → Test Map

This phase has no `REQ-XX` IDs (infrastructure only). Mapping success criteria instead:

| Success Criterion | Behavior | Test Type | Automated Command | File Exists? |
|--------------------|----------|-----------|---------------------|--------------|
| 1. `npx expo start` boots to empty root screen, no errors | App bundles and renders without error | smoke (bundling) + manual visual | `npx expo export --platform ios` (bundling proxy, exits non-zero on error) — visual confirmation via `checkpoint:human-verify` | ❌ Wave 0 (no export config needed, but task must exist) |
| 2. Test suite executes and passes trivial smoke test | jest-expo preset runs | unit | `npm test` | ❌ Wave 0 — `__tests__/smoke.test.ts` |
| 3. TypeScript strict mode compiles, zero errors | Static type check | typecheck | `npx tsc --noEmit` | ❌ Wave 0 — `tsconfig.json` with `strict: true` |
| 4. Zustand store scaffold importable, no runtime error | Store module loads, initial state readable | unit | `npm test` (covers `useQuizStore.test.ts`) | ❌ Wave 0 — `src/store/useQuizStore.ts` + `__tests__/useQuizStore.test.ts` |

### Sampling Rate

- **Per task commit:** `npm test && npx tsc --noEmit`
- **Per wave merge:** `npm test && npx tsc --noEmit && npx expo export --platform ios`
- **Phase gate:** All of the above green, plus one `checkpoint:human-verify` confirming the actual
  iOS Simulator boot and empty-screen render, before `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] `package.json` `"jest"` key + `"test": "jest"` script — no test runner wired yet (greenfield repo)
- [ ] `tsconfig.json` with `"strict": true`, `"types": ["jest"]` — doesn't exist yet
- [ ] `__tests__/smoke.test.ts` — covers success criterion 2
- [ ] `__tests__/useQuizStore.test.ts` — covers success criterion 4
- [ ] `src/store/useQuizStore.ts` — the scaffold itself, covers success criterion 4
- [ ] A `checkpoint:human-verify` task for success criterion 1's visual simulator confirmation — no
  automated equivalent exists for "renders correctly with no errors" beyond the bundling-level proxy

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | No auth anywhere in this product (locked, CLAUDE.md "Auth Model: None") |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access-controlled resources this phase |
| V5 Input Validation | No | No user input, no network calls, no dataset parsing this phase — pure scaffold |
| V6 Cryptography | No | No secrets, no crypto, no credentials — this phase never touches Supabase or the feedback API |

This phase installs zero packages with native code execution risk beyond Expo's own toolchain
(already audited above), makes zero network calls, and stores zero user data. Security surface
area for Phase 1 is effectively the Package Legitimacy Audit above — no ASVS category has an
actionable finding this phase.

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Supply-chain risk from a slopsquatted/hallucinated npm package | Tampering | Package Legitimacy Audit (this document) — all 6 packages verified `[OK]` via `slopcheck --ecosystem npm` and `npm view`; no unverified packages remain in this phase's install list |

## Sources

### Primary (HIGH confidence)
- https://docs.expo.dev/router/introduction/ — official quick-start command (`create-expo-app@latest --template default@sdk-57`)
- https://docs.expo.dev/develop/unit-testing/ — official jest-expo installation steps, package.json config, tsconfig `types: ["jest"]`
- https://docs.expo.dev/guides/typescript/ — official strict-mode tsconfig recommendation
- `npm view <pkg> version` for `expo`, `expo-router`, `zustand`, `zod`, `jest-expo`, `typescript`, `create-expo-app`, `eslint-config-expo`, `react-test-renderer` — direct registry queries, 2026-07-12
- `slopcheck install <pkgs> --ecosystem npm` — direct tool execution, all 6 packages `[OK]`
- `npm view <pkg> scripts.postinstall` for all 6 packages — direct registry queries, all empty
- Local environment probes (Bash): `xcode-select -p`, `xcrun simctl list devices available`, `pod --version`, `node --version`, `npm --version`, `command -v watchman` — direct execution, 2026-07-12
- `.planning/research/STACK.md` and `.planning/research/ARCHITECTURE.md` — already-completed project-level research, reused per instructions

### Secondary (MEDIUM confidence)
- WebSearch synthesis on `default@sdk-57` template's tabs-demo folder contents (`app/(tabs)/index.tsx`, `explore.tsx`, `expo-template-default` GitHub repo, `reset-project.js` helper) — not independently fetched from the pinned SDK-57 template's actual file tree this session; flagged as Open Question 1
- WebSearch synthesis on `jest.config.js` vs `package.json`-embedded config conventions — cross-referenced against official docs (which show `package.json`), consistent

### Tertiary (LOW confidence)
- None retained — all LOW-confidence findings from initial WebSearch passes were either verified against official docs (jest-expo config, smoke test pattern) or explicitly flagged in Open Questions (template exact contents)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified via `npm view` against the live registry; package legitimacy independently confirmed via `slopcheck`
- Architecture: HIGH — Expo Router/Jest conventions confirmed via official docs; project structure inherited from already-approved `.planning/research/ARCHITECTURE.md`
- Pitfalls: HIGH — template demo-content conflict and `--watchAll` non-exit issue are both directly verifiable/reasoned from official docs and CONTEXT.md's locked D-04, not speculative

**Research date:** 2026-07-12
**Valid until:** 2026-08-11 (30 days — Expo SDK/package versions and templates move at a moderate pace; re-verify versions if planning is delayed past this window)

---
*Phase: 1-Scaffold*
*Research completed: 2026-07-12*
