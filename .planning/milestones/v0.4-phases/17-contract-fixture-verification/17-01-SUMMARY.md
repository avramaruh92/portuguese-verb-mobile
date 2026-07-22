---
phase: 17-contract-fixture-verification
plan: 01
subsystem: testing
tags: [jest, zod, contract-testing, fixtures]

# Dependency graph
requires: []
provides:
  - Self-contained backend v0.4 content fixture in mobile test tree (__tests__/fixtures/content-verbs-v0.4.sample.json)
  - Proof test that validateDataset/LearningContentSchema/fetchRemoteVerbs accept the real backend v0.4 payload
affects: [18-content-integration, 19-learning-content-rollout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-repo contract fixtures copied byte-for-byte into __tests__/fixtures/, loaded via fs.readFileSync + JSON.parse (not a bare .json import) to avoid TS resolveJsonModule coupling"

key-files:
  created:
    - __tests__/fixtures/content-verbs-v0.4.sample.json
    - __tests__/contract-fixture.test.ts
  modified:
    - tsconfig.json

key-decisions:
  - "Added \"node\" to tsconfig.json's compilerOptions.types array (was [\"jest\"] only) so fs/path/__dirname resolve for the fs.readFileSync fixture-loading pattern this plan required; @types/node was already installed transitively, no new install needed"

patterns-established:
  - "Contract fixtures for cross-repo backend/mobile drift detection live in __tests__/fixtures/, copied verbatim (cp, no reformatting) to preserve Unicode NFC encoding and key order"

requirements-completed: [CONTRACT-01, CONTRACT-02, CONTRACT-03]

# Metrics
duration: 12min
completed: 2026-07-21
---

# Phase 17 Plan 01: Contract Fixture Verification Summary

**Proved mobile's validateDataset, LearningContentSchema, and fetchRemoteVerbs all accept the real backend v0.4 content fixture (50 verbs + learning block) byte-for-byte, via a self-contained test fixture with zero cross-repo coupling at test time.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-21T23:08:00Z
- **Completed:** 2026-07-21T23:20:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Copied the backend's `contracts/content-verbs-v0.4.sample.json` verbatim into `__tests__/fixtures/content-verbs-v0.4.sample.json` (50 verbs, learning.version 1, accented `pôr` intact)
- Wrote `__tests__/contract-fixture.test.ts` with five independent `it()` proofs: sanity shape check, `validateDataset` zero-errors, `LearningContentSchema.safeParse` success, `fetchRemoteVerbs` full HTTP+validation path (fetch mocked), and byte-for-byte accented/tied-form preservation (`pôr`/`pôs`, `falam` tie via `formIndex`)
- All five tests pass individually via `-t` filters matching "validateDataset", "LearningContentSchema", "fetchRemoteVerbs", "byte-for-byte"
- Full existing test suite (18 suites, 197 tests) remains green — no regression introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy the backend v0.4 sample fixture verbatim into the mobile test tree** - `f93e5e3` (feat)
2. **Task 2: Write contract-fixture.test.ts with five independent proofs** - `f4c2076` (test)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `__tests__/fixtures/content-verbs-v0.4.sample.json` - byte-for-byte copy of the backend's v0.4 content fixture (50 verbs + learning block)
- `__tests__/contract-fixture.test.ts` - five-proof CONTRACT-01/02/03 test suite
- `tsconfig.json` - added `"node"` to `compilerOptions.types` to unblock `fs`/`path`/`__dirname` typing

## Decisions Made
- Loaded the fixture via `fs.readFileSync(path.join(__dirname, ...))` + `JSON.parse`, not a bare `import fixture from "./fixtures/....json"`, per plan/research guidance — sidesteps any `resolveJsonModule` question entirely
- Passed `fixture.verbs` into `validateDataset` as-is (did not strip `formIndex`), since mobile's `VerbSchema` treats `formIndex` as a first-class optional field, unlike the backend's stricter seed schema

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json's `types` array excluded Node globals**
- **Found during:** Task 2 (writing contract-fixture.test.ts)
- **Issue:** `npm run typecheck` failed with `Cannot find name 'fs'`, `Cannot find name 'path'`, `Cannot find name '__dirname'` — `tsconfig.json`'s `compilerOptions.types` was `["jest"]` only, so even though `@types/node` was already installed (transitively, via other deps), TypeScript wasn't including it
- **Fix:** Added `"node"` to `compilerOptions.types`, changing `["jest"]` to `["jest", "node"]`
- **Files modified:** `tsconfig.json`
- **Verification:** `npm run typecheck` passes with zero errors after the change
- **Committed in:** `f4c2076` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy the plan's explicit `fs.readFileSync` requirement (chosen specifically to avoid `resolveJsonModule` uncertainty per research Pitfall 2) and to pass the plan's own acceptance criterion "`npm run typecheck` passes with the new test file present". No scope creep — no new package installed, only a config field addition using an already-present transitive dependency.

## Issues Encountered
None beyond the tsconfig deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The contract fixture and proof test are in place and passing; any future backend v0.4 content contract drift will now be caught locally by `npm test -- __tests__/contract-fixture.test.ts` instead of surfacing at runtime against the live backend
- Ready for Phases 18/19 which build on this content shape

---
*Phase: 17-contract-fixture-verification*
*Completed: 2026-07-21*
