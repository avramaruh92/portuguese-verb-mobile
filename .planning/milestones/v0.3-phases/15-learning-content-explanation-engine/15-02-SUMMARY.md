---
phase: 15-learning-content-explanation-engine
plan: 02
subsystem: dataset
tags: [zod, typescript, learning-content, dataset-fetch, breaking-change]

requires:
  - "15-01: src/learning/types.ts (LearningContent, FormMatch), src/learning/schema.ts (LearningContentSchema, FormMatchSchema)"
provides:
  - "src/dataset/validate.ts: VerbSchema.formIndex optional field"
  - "src/dataset/remote.ts: fetchRemoteVerbs() returns { verbs, learning } instead of Verb[]"
  - "src/dataset/source.ts: resolveVerbs()/cachedResult snapshot carries { verbs, source, learning }"
affects: [15-03, 16]

tech-stack:
  added: []
  patterns:
    - "safeParse-and-degrade for optional network payload fields: LearningContentSchema.safeParse(payload.learning) never throws, degrading to undefined on malformed/absent input while verbs validation still throws on invalid shape"

key-files:
  created: []
  modified:
    - src/dataset/validate.ts
    - src/dataset/remote.ts
    - src/dataset/source.ts
    - __tests__/dataset-remote.test.ts
    - __tests__/dataset-source.test.ts
    - __tests__/useQuizStore.test.ts

key-decisions:
  - "fetchRemoteVerbs's return-shape change (Verb[] -> { verbs, learning }) landed as one atomic commit with source.ts and both test files, per RESEARCH.md/PATTERNS.md's explicit instruction not to split this breaking change across waves"
  - "OfflinePill.tsx and useQuizStore.ts required zero code changes — both destructure only named fields (source/verbs) from resolveVerbs(), so the widened snapshot shape is additive from their perspective; only their test mocks needed the extra learning: undefined key to satisfy the type"
  - "Local-fallback branch in source.ts always sets learning: undefined (never carries learning), per D-05 from RESEARCH.md"

patterns-established:
  - "Single safeParse-degrade branch isolates an optional/untrusted payload field from the required-field validation path — a malformed learning block can never flip source to local or throw, only the verbs field's own validateDataset check can trigger the local fallback"

requirements-completed: [EXPL-01]

duration: 12min
completed: 2026-07-20
---

# Phase 15 Plan 02: Dataset Fetch/Snapshot Learning Content Threading Summary

Threaded the backend's optional `learning` block and per-verb `formIndex` through the fetch/snapshot pipeline: `fetchRemoteVerbs()` now returns `{ verbs, learning }` (breaking change, landed atomically with all callers/tests), and `resolveVerbs()`'s cached snapshot carries `learning` alongside `verbs`/`source`.

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-20T18:20:00Z
- **Completed:** 2026-07-20T18:32:00Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments

- `src/dataset/validate.ts`'s `VerbSchema` gained an optional `formIndex: z.record(z.string(), z.array(FormMatchSchema)).optional()` field, importing `FormMatchSchema` from `../learning/schema` — no other field touched.
- `src/dataset/remote.ts`'s `fetchRemoteVerbs` return type changed from `Promise<Verb[]>` to `Promise<{ verbs: Verb[]; learning: LearningContent | undefined }>`. The existing `verbs` validation (AbortController/timeout, `response.ok` check, array check, `validateDataset` throw) is untouched — still throws on any invalid `verbs` shape. A new `LearningContentSchema.safeParse(payload.learning)` branch degrades to `learning: undefined` on any malformed or absent `learning` block, never throwing and never affecting the `verbs` fetch outcome (Pitfall 3 satisfied).
- `src/dataset/source.ts`'s `cachedResult`/`resolveVerbs()` widened to `{ verbs, source, learning }`. The remote branch destructures `learning` straight through from `fetchRemoteVerbs()`; the local-fallback (catch) branch always sets `learning: undefined`, per D-05. Still exactly one module-level cache (`cachedResult`) — no second cache added.
- Audited `src/components/OfflinePill.tsx` and `src/store/useQuizStore.ts`: both destructure only named fields (`source`, `verbs`) from `resolveVerbs()`'s resolved object, so the widened snapshot shape required zero production-code changes in either file — confirmed via a clean `npx tsc --noEmit`.
- Updated all three affected test files to the new shape: `dataset-remote.test.ts` (bare-array assertion → `{ verbs, learning: undefined }`, plus three new cases for learning present-valid / present-malformed / absent), `dataset-source.test.ts` (all `fetchRemoteVerbs` mocks and `resolveVerbs()` assertions include `learning`, plus one new test asserting a non-undefined `learning` flows through), `useQuizStore.test.ts` (all six `mockedResolveVerbs.mockResolvedValue` calls include `learning: undefined` to satisfy the widened mock type).

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend VerbSchema + fetchRemoteVerbs return shape + resolveVerbs snapshot** - `7449c80` (feat)
2. **Task 2: Update consumers and tests to the widened snapshot shape** - `f8000bc` (test)

**Plan metadata:** committed alongside this SUMMARY.

## Files Created/Modified

- `src/dataset/validate.ts` - added optional `formIndex` field to `VerbSchema`
- `src/dataset/remote.ts` - `fetchRemoteVerbs` returns `{ verbs, learning }`, `learning` parsed via safeParse-and-degrade
- `src/dataset/source.ts` - `cachedResult`/`resolveVerbs` snapshot widened with `learning`; local fallback always `learning: undefined`
- `__tests__/dataset-remote.test.ts` - updated existing assertion, added 3 new learning-parsing cases
- `__tests__/dataset-source.test.ts` - updated mocks/assertions to include `learning`, added 1 new flow-through test
- `__tests__/useQuizStore.test.ts` - added `learning: undefined` to all 6 `mockedResolveVerbs` mocks

## Deviations from Plan

None - plan executed exactly as written. `OfflinePill.tsx` and `src/store/useQuizStore.ts` were audited per the plan's instruction and required no code changes (only their test mocks needed updating), which the plan anticipated as the likely outcome.

## Verification

- `npx tsc --noEmit` — clean across the whole project.
- `npm test` — 180/180 tests pass across 16 suites (4 new tests added: 3 in `dataset-remote.test.ts`, 1 in `dataset-source.test.ts`; no regressions).
- `grep -n "LearningContentSchema.safeParse" src/dataset/remote.ts` — present.
- `grep -n "learning" src/dataset/source.ts` — present on both remote and local branches.
- `grep -c "mockResolvedValue(\[" __tests__/dataset-source.test.ts` — returns 0 (no bare-array mocks remain).
- Every `mockedResolveVerbs.mockResolvedValue(` call in `__tests__/useQuizStore.test.ts` includes `learning` (6/6 confirmed via grep).

## Self-Check: PASSED

- FOUND: src/dataset/validate.ts (formIndex field present)
- FOUND: src/dataset/remote.ts (widened return type + safeParse)
- FOUND: src/dataset/source.ts (widened snapshot + learning on both branches)
- FOUND: __tests__/dataset-remote.test.ts (updated + 3 new cases)
- FOUND: __tests__/dataset-source.test.ts (updated + 1 new case)
- FOUND: __tests__/useQuizStore.test.ts (6/6 mocks updated)
- FOUND commit 7449c80
- FOUND commit f8000bc
