---
phase: 24-quality-gates-preflight-first-submit
plan: 01
subsystem: ui
tags: [react, react-hooks, eslint, react-compiler, expo]

# Dependency graph
requires: []
provides:
  - "npm run lint exits 0 with zero errors across the project"
  - "Render-time state-reset pattern for visible-prop-driven modals (React Compiler compatible)"
affects: [24-02, first-eas-submit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Render-time state reset via a tracked previous-prop useState value (not useRef, since React Compiler forbids ref.current access during render)"

key-files:
  created: []
  modified:
    - src/feedback/ReportFeedbackModal.tsx
    - src/productFeedback/ProductFeedbackModal.tsx

key-decisions:
  - "Used useState (prevVisible/setPrevVisible) instead of the plan's literal useRef-based prevVisibleRef pattern, because this project has React Compiler enabled (app.json experiments.reactCompiler: true), which flags reading/writing ref.current during render as a lint error (react-hooks/refs) via the react-hooks-eslint-plugin's compiler-integration rules bundled in eslint-config-expo"

patterns-established:
  - "Render-time state reset: track the previous value of a boolean prop (e.g. `visible`) in useState, compare on every render, and call reset setters conditionally in the render body instead of inside a useEffect — avoids react-hooks/set-state-in-effect. On this Compiler-enabled project, the previous-value tracker itself must also be useState (not useRef), since Compiler forbids ref reads/writes during render (react-hooks/refs)."

requirements-completed: [SHIP-01]

# Metrics
duration: 12min
completed: 2026-07-25
---

# Phase 24 Plan 01: Fix set-state-in-effect lint errors in feedback modals Summary

**Replaced effect-based form resets in both feedback modals with render-time `useState`-tracked previous-visible comparisons, eliminating both `react-hooks/set-state-in-effect` lint errors so `npm run lint` exits 0 project-wide.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-25T13:22:00Z
- **Completed:** 2026-07-25T13:34:03Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `ReportFeedbackModal.tsx` no longer calls `setReason`/`setMessage`/`setState`/`setLastStatus` inside a `useEffect` body — the reset now happens during render, guarded by a `visible !== prevVisible` comparison
- `ProductFeedbackModal.tsx` mirrors the identical fix for `setCategory`/`setMessage`/`setState`/`setLastStatus`
- `npm run lint` now exits 0 with zero errors (both previously-known `react-hooks/set-state-in-effect` errors gone)
- `npm run typecheck` and `npm test` (251 tests, 21 suites) both still pass unchanged — no behavior regression
- The pending success-timer `useEffect` (`[visible]` deps) is unchanged and still clears `timerRef.current` on every `visible` transition and on unmount, preserving the close/reopen-mid-timer behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace effect-based reset with render-time ref reset in ReportFeedbackModal** - `9ad786f` (fix)
2. **Task 2: Mirror the identical render-time ref reset in ProductFeedbackModal** - `4e311bb` (fix)

_Note: task names above are the plan's original titles; the implemented pattern uses `useState`, not `useRef`, per the deviation documented below._

## Files Created/Modified
- `src/feedback/ReportFeedbackModal.tsx` - Render-time `prevVisible`/`setPrevVisible` state tracker replaces the effect-based reset; timer-clearing effect unchanged
- `src/productFeedback/ProductFeedbackModal.tsx` - Identical fix, substituting `category`/`setCategory` for `reason`/`setReason`

## Decisions Made
- Followed the plan's D-01 intent (render-time reset via a tracked previous-`visible` value, no `key`-remount) but implemented the tracker with `useState` instead of the plan's literal `useRef` example, because this codebase has React Compiler enabled (`app.json` `experiments.reactCompiler: true`). React Compiler's ESLint integration (bundled in `eslint-config-expo`'s `react-hooks` rules) flags `react-hooks/refs` errors ("Cannot access ref value during render" / "Cannot update ref during render") for any `ref.current` read or write inside the render body — which is exactly what the plan's `useRef`-based example does. Swapping to `useState` for the previous-value tracker is React's own documented alternative for this exact pattern ("Adjusting state when a prop changes") and is Compiler-safe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's literal `useRef`-based prevVisibleRef pattern fails lint under this project's React Compiler config**
- **Found during:** Task 1 (ReportFeedbackModal)
- **Issue:** The plan's exact code (`const prevVisibleRef = useRef(visible); if (visible && !prevVisibleRef.current) {...}; prevVisibleRef.current = visible;`) causes three new `react-hooks/refs` ESLint errors ("Cannot access ref value during render" / "Cannot update ref during render") because this project has `experiments.reactCompiler: true` set in `app.json`, and the Compiler-integrated `react-hooks` ESLint rules (via `eslint-config-expo`) forbid reading or writing `ref.current` during the render body. This constraint wasn't visible in the pattern map since there's no other in-repo `useRef`-in-render precedent to have caught it earlier.
- **Fix:** Replaced the `useRef`-based previous-visible tracker with a `useState`-based one (`const [prevVisible, setPrevVisible] = useState(visible); if (visible !== prevVisible) { setPrevVisible(visible); if (visible) { ...reset fields... } }`), which is React's own documented pattern for "adjusting state when a prop changes" and does not touch a ref during render. Applied identically to both files.
- **Files modified:** `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`
- **Verification:** `npx eslint src/feedback/ReportFeedbackModal.tsx` and `npm run lint` (project-wide) both exit 0; `npm run typecheck` exits 0; `npm test` — 251/251 tests pass.
- **Committed in:** `9ad786f` (ReportFeedbackModal), `4e311bb` (ProductFeedbackModal)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary correctness fix — the plan's literal example would not have satisfied its own "npm run lint exits 0" must-have truth under this project's actual ESLint config. Behavior (field resets on visible flip, timer clearing on every visible transition and unmount) is unchanged; only the internal tracking mechanism differs (`useState` vs `useRef`). No scope creep — same two files, same shape of fix.

## Issues Encountered
None beyond the lint-vs-Compiler conflict documented above, which was resolved within the task.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
`npm run lint` now exits 0 project-wide, satisfying the SHIP-01 hard gate ahead of the first real EAS build/submit. Both feedback modals retain identical user-visible behavior (verified via the full existing Jest suite, 251/251 passing, and manual review of the reset/timer logic). Ready for plan 02 (preflight script) in this phase.

---
*Phase: 24-quality-gates-preflight-first-submit*
*Completed: 2026-07-25*

## Self-Check: PASSED
