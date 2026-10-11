---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Warm Brand Polish + App Store Submission Readiness
status: Awaiting next milestone
stopped_at: v1.0 milestone complete, archived and tagged
last_updated: "2026-10-11T11:52:20.542Z"
last_activity: 2026-10-11 — Milestone v1.0 completed and archived
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 16
  completed_plans: 16
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-11)

**Core value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.
**Current focus:** Planning next milestone — lead with the Frankfurt API base-URL switch (hard stop 2026-11-01)

## Current Position

Phase: Milestone v1.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-10-11 — Milestone v1.0 completed and archived

## Performance Metrics

**Velocity (v0.0-v1.0, shipped):**

- Plans per milestone: v0.0: 22, v0.1: 13, v0.2: 4, v0.3: 8, v0.4: 7, v0.5: 11, v0.6: 8, v1.0: 16
- Kickoff to ship: v0.0 ~1.3 days, v0.1 ~6 days, v0.2 ~7 days, v0.3 ~1 day, v0.4 ~2 days, v0.5 ~3 days, v0.6 ~3 days, v1.0 56 days (phases 30-34 in 1 day; Phase 35 spanned Apple review + an info-request resubmission)

## Accumulated Context

### Roadmap Evolution

- v1.0 roadmap created 2026-08-16 — 6 phases (30-35) derived from BUILD/BRAND/LOCKUP/UX/VALID/STORE requirement categories, following research/SUMMARY.md's suggested ordering. 27/27 v1.0 requirements mapped, no orphans. Sequencing: 30 (Node/lockfile pin) must lead — prerequisite, not a feature, with 3x prior-incident evidence (v0.5 Phase 20, Phase 24, v0.6 Phase 29). 31 (brand source + generator id-rewrite) depends on 30 since it adds a new build-time dependency and regenerates assets. 32 (homepage lockup) depends on 31 — shares the same generator script, isolates risk to one variable at a time. 33 (quiz press-state fix) is fully independent, can run in parallel with 31-32. 34 (validate-brand.ts extension) depends on 31+32 since it asserts against their real generated output. 35 (App Store Connect submission) is strictly last — terminal action, screenshots/build must reflect the fully finished state.
- v0.6 shipped 2026-08-16 — all 5 phases complete, 14/14 requirements verified, 251/251 tests passing, dated developer sign-off on a real EAS preview build, archived to `.planning/milestones/v0.6-*`.

### Decisions

Full decision log in PROJECT.md Key Decisions (v0.0-v1.0, all with outcomes). No decisions yet for the next milestone.

### Pending Todos

- **Frankfurt API base-URL switch — hard stop 2026-11-01.** Update `src/dataset/remote.ts`, `src/feedback/submit.ts`, `src/productFeedback/submit.ts` and the App Review notes to `https://portuguese-verb-api-fra.onrender.com`, then ship an App Store update. Blocks backend REGION-05 (Oregon deletion).

### Blockers/Concerns

None open.

## Deferred Items

Items acknowledged and carried forward (unchanged at v1.0 close):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | PROG-01 Typed-answer quiz mode with diacritic normalization | Deferred | Project init |
| v2 | PROG-02 On-device progress/streak tracking | Deferred | Project init |
| v2 | PROG-03 Spaced repetition scheduling | Deferred | Project init |
| v2 | FETCH-06 Dataset staleness/version metadata | Deferred (P3) | v0.1 requirements definition |
| v2 | QUIZ-09 Question-progress indicator ("Question X of 10") | Deferred (P2) | v0.1 requirements definition |
| v2 | UI-04 Answer-selection feedback animation | Deferred (P3) | v0.1 requirements definition |
| v2 | RELEASE-01 `.eas/workflows/` automated build+submit CI pipeline | Deferred | v0.5 requirements definition |
| v2 | RELEASE-04 Additional device-size screenshot sets | Deferred | v1.0 requirements definition |
| v2 | RELEASE-05 Localized App Store listing copy | Deferred | v1.0 requirements definition |
| v2 | External (non-team) TestFlight testers — triggers Apple Beta App Review | Deferred | v0.5, Phase 24 checkpoint |

Known non-blocking tech debt: see PROJECT.md "Next Milestone" and `.planning/milestones/v1.0-MILESTONE-AUDIT.md` (validate-brand colour/cwd robustness and ungated lockup crop constants, Fastify 6 `disableRequestLogging` deprecation, `ios/` README reference, WCAG palette spot-check, v0.3 distractor `formIndex` gap).

## Quick Tasks Completed

| ID | Description | Date | Commit | Directory |
|----|--------------|------|--------|-----------|
| 260816-k8y | Remove eas-cli devDependency and redundant eas script | 2026-08-16 | b537116 | [260816-k8y-remove-eas-cli-from-devdependencies-and-](./quick/260816-k8y-remove-eas-cli-from-devdependencies-and-/) |

## Session Continuity

Last session: 2026-10-11
Stopped at: v1.0 milestone complete, archived and tagged
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
