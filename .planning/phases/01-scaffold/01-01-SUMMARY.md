---
phase: 01-scaffold
plan: 01
subsystem: infra
tags: [expo, expo-router, typescript, zustand, jest-expo, react-native]

# Dependency graph
requires: []
provides:
  - Booting Expo Router app skeleton (app/_layout.tsx + app/index.tsx, single root route)
  - Strict TypeScript config (expo/tsconfig.base + strict + noUncheckedIndexedAccess)
  - jest-expo test preset wired via package.json, npm test script (no watch mode)
  - Zustand store scaffold at src/store/useQuizStore.ts establishing the src/<domain>/ convention
  - Green baseline test suite (smoke + store import-safety tests)
affects: [01-scaffold-plan-02, 02-dataset, 03-quiz-engine, 04-quiz-ui, 05-feedback]

# Tech tracking
tech-stack:
  added: [expo@57.0.4, expo-router@57.0.4, react-native@0.86.0, zustand@5.0.14, zod@4.4.3, jest-expo@57.0.1, typescript@6.0.3]
  patterns:
    - "app/ is routes-only (Expo Router file-based); all domain/business logic lives under sibling src/<domain>/ trees (D-02)"
    - "Flat __tests__/ directory convention for Jest specs, one file per source module"
    - "jest config lives in package.json's \"jest\" key only — no separate jest.config.js"

key-files:
  created:
    - app/_layout.tsx
    - app/index.tsx
    - src/store/useQuizStore.ts
    - __tests__/smoke.test.ts
    - __tests__/useQuizStore.test.ts
    - tsconfig.json
    - app.json
    - package.json
  modified: []

key-decisions:
  - "Expo SDK 57's default template places generated routes/components under src/app, src/components, etc. rather than a root app/ directory. Manually restructured to root app/ (routes-only) + src/store/ to satisfy this plan's D-02 and D-04 requirements exactly, rather than adopting the template's default src/app layout."
  - "Removed unused template demo assets (tab icons, react-logo, tutorial-web.png, expo-badge images, logo-glow.png) not referenced by app.json, keeping only icon/splash/favicon/android-adaptive-icon assets actually wired into the config."
  - "Renamed app/app.json identifiers from template default (mobile-scaffold) to portuguese-verb-mobile / 'Portuguese Verb Quiz' to match the actual project."

patterns-established:
  - "Pattern 1: app/ holds only Expo Router route files; all other code lives in src/<domain>/"
  - "Pattern 2: __tests__/<module>.test.ts flat convention, one spec file per source module"
  - "Pattern 3: jest config declared inline in package.json's jest key, never a separate jest.config.js"

requirements-completed: []

# Metrics
duration: 55min
completed: 2026-07-12
---

# Phase 1 Plan 1: Scaffold Summary

**Expo Router + strict TypeScript + Zustand + jest-expo walking-skeleton app booting from a single root route, with a green two-test suite.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-07-12T11:19:40Z (approx.)
- **Completed:** 2026-07-12T11:19:14Z (last commit, local time 12:19:14+01:00)
- **Tasks:** 2 completed (Task 2 executed as TDD: RED → GREEN)
- **Files modified:** 15 created (app.json, app/_layout.tsx, app/index.tsx, 9 asset files, package.json, package-lock.json, tsconfig.json, plus __tests__/smoke.test.ts, __tests__/useQuizStore.test.ts, src/store/useQuizStore.ts)

## Accomplishments
- Scaffolded Expo SDK 57 (expo-router 57.0.4, React Native 0.86.0) via `npx create-expo-app`, restructured into repo root as `app/` (routes-only, single index route) per D-02/D-04
- Installed zustand@5.0.14, zod@4.4.3 (deps) and jest-expo@57.0.1, @types/jest (devDeps) via `npx expo install`
- Wired strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`, `types: ["jest"]` extending `expo/tsconfig.base`)
- Wired jest-expo preset via `package.json`'s `jest` key, `npm test` (plain `jest`, no `--watchAll`) and `npm run typecheck` scripts
- Created `src/store/useQuizStore.ts` Zustand scaffold (`status: 'idle'`)
- Two passing tests: trivial smoke assertion and store import-safety check
- `npx expo export --platform ios`, `npm test`, and `npx tsc --noEmit` all pass green

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Expo Router app and strip to a single root route** - `169a310` (feat)
2. **Task 2: Wire strict TypeScript, jest-expo, the Zustand store scaffold, and passing tests** - TDD cycle:
   - RED: `7f2d39a` (test) - failing store test + jest wiring
   - GREEN: `6e8dfc2` (feat) - store implementation, tests pass

_No refactor commit needed — store implementation was already minimal._

## Files Created/Modified
- `app/_layout.tsx` - Root Expo Router Stack, headerShown false
- `app/index.tsx` - Single route rendering centered "Portuguese Verb Quiz" placeholder (Heading token: 20px/600/#000 on #FFFFFF)
- `src/store/useQuizStore.ts` - Zustand store scaffold, `status: 'idle'`
- `__tests__/smoke.test.ts` - Trivial jest-expo preset smoke test
- `__tests__/useQuizStore.test.ts` - Store import-safety test (`getState().status === 'idle'`)
- `tsconfig.json` - Strict TS config extending `expo/tsconfig.base`
- `app.json` - Expo app config (name/slug/scheme updated to project identity)
- `package.json` - Dependencies, jest preset, test/typecheck scripts
- `assets/` - Icon, splash, favicon, android-adaptive-icon images (template demo assets removed)

## Decisions Made
- Expo SDK 57's default template scaffolds routes under `src/app/` (not root `app/`) — this was anticipated by the plan's Open Question 1 ("adapt to actual template output"). Manually moved/rebuilt as root `app/` (routes-only) + `src/store/` to satisfy D-02 (app/ routes-only, domain code in sibling src/) and D-04 (single index route) literally, and to match this plan's verification script (`ls app/`) and interface templates exactly.
- Kept all Expo-router-required template dependencies (`expo-constants`, `expo-linking`, `expo-splash-screen`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, etc.) since these are load-bearing for expo-router/navigation, not optional demo cruft — only removed unreferenced demo image assets and the tabs-demo route files.
- Renamed app identity from template default `mobile-scaffold` to `portuguese-verb-mobile` / "Portuguese Verb Quiz" (app.json name/slug/scheme, package.json name) to match the actual project.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restructured template's default `src/app`/`src/components` layout into plan-required root `app/` + `src/store/`**
- **Found during:** Task 1
- **Issue:** `npx create-expo-app@latest --template default@sdk-57` places generated routes under `src/app/` (with `src/components/`, `src/hooks/`, `src/constants/`), not the root `app/` directory the plan's interfaces, verification script (`ls app/`), and acceptance criteria assume.
- **Fix:** Copied only the needed scaffold outputs (`package.json`, `package-lock.json`, `app.json`, `assets/`) into the repo root, then hand-authored `app/_layout.tsx` and `app/index.tsx` at the root per the plan's exact interface templates, and created `src/store/` fresh — discarding the template's demo `src/components`, `src/hooks`, `src/constants`, `src/global.css`, and `scripts/reset-project.js` entirely rather than running `reset-project` (which assumes the `src/app` layout).
- **Files modified:** app/_layout.tsx, app/index.tsx (created); template's src/app, src/components, src/hooks, src/constants never copied to destination
- **Verification:** `ls app/` shows exactly `_layout.tsx index.tsx`; `npx expo export --platform ios` bundles cleanly from the root `app/` directory (Expo Router auto-detects root `app/` before falling back to `src/app/`)
- **Committed in:** 169a310 (Task 1 commit)

**2. [Rule 3 - Blocking] `npx expo install jest-expo @types/jest -- --save-dev` placed packages in `dependencies` instead of `devDependencies`**
- **Found during:** Task 2 setup
- **Issue:** The `--save-dev` flag passed after `--` was not honored by the expo CLI wrapper; both packages landed under `dependencies`.
- **Fix:** Manually moved `jest-expo` and `@types/jest` entries to `devDependencies` in `package.json`, then re-ran `npm install` to reconcile the lockfile.
- **Files modified:** package.json, package-lock.json
- **Verification:** `package.json` devDependencies contains both entries; `npm test` still resolves jest-expo correctly
- **Committed in:** 169a310 (Task 1 commit)

**3. [Rule 3 - Blocking] Removed unused template demo image assets**
- **Found during:** Task 1
- **Issue:** Template ships demo assets (tab icons, react-logo variants, tutorial-web.png, expo-badge images, logo-glow.png) not referenced anywhere in `app.json` or app code — leftover from the stripped tabs demo.
- **Fix:** Deleted the unreferenced asset files, keeping only icon/splash/favicon/android-adaptive-icon images that `app.json` actually points to.
- **Files modified:** assets/images/ (deletions)
- **Verification:** `npx expo export --platform ios` still bundles cleanly after removal; `git status` shows a clean asset set matching app.json references
- **Committed in:** 169a310 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking issues preventing plan verification from passing as literally specified)
**Impact on plan:** All three were necessary to reconcile the plan's literal path/verification assumptions with the actual current Expo SDK 57 template output and CLI flag behavior. No scope creep — no additional features, folders, or dependencies beyond what the plan specified.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Toolchain proven end-to-end: bundling (`expo export`), testing (`jest-expo`), type-checking (`tsc --noEmit`) all green
- `app/`, `src/store/`, `__tests__/` conventions established for Phases 2-5 to follow
- Plan 02 (visual/simulator confirmation checkpoint) can proceed against this scaffold
- No blockers

---
*Phase: 01-scaffold*
*Completed: 2026-07-12*
