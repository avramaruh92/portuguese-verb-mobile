---
gsd_state_version: 1.0
milestone: v0.5
milestone_name: iOS TestFlight Readiness
status: ready_to_plan
stopped_at: Phase 21 complete (2/2) — ready to discuss Phase 22
last_updated: 2026-07-23T17:42:12.248Z
last_activity: 2026-07-23 -- Phase 21 execution started
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-22)

**Core value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.
**Current focus:** Phase 22 — icon & splash asset pipeline

## Current Position

Phase: 22
Plan: Not started
Status: Ready to plan
Last activity: 2026-07-23

## Performance Metrics

**Velocity (v0.0-v0.4, shipped):**

- Total plans completed: 60 (v0.0: 22, v0.1: 13, v0.2: 4, v0.3: 8, v0.4: 7, +4 counting Phase 10.1)
- Total execution time: v0.0 ~1.3 days, v0.1 ~6 days, v0.2 ~7 days, v0.3 ~1 day, v0.4 ~2 days (kickoff to ship)

**v0.5 phases (planned, not yet executed):**

| Phase | Requirements | Status |
|-------|--------------|--------|
| 20. Native Build Risk Front-Loading | BUILD-01, BUILD-02 | Complete |
| 21. Release Identity Lock | IDENT-01, IDENT-02, IDENT-03, IDENT-04 | Not started |
| 22. Icon & Splash Asset Pipeline | ICON-01, ICON-02, ICON-03, ICON-04 | Not started |
| 23. EAS Build/Submit Configuration | EASCFG-01, EASCFG-02, EASCFG-03 | Not started |
| 24. Quality Gates, Preflight & First Submit | SHIP-01, SHIP-02, SHIP-03, SHIP-04, SHIP-05 | Not started |
| Phase 20 P01 | 12min | 2 tasks | 2 files |
| Phase 20 P02 | ~50min | 3 tasks | 3 files |

## Accumulated Context

### Roadmap Evolution

- v0.5 roadmap created 2026-07-22 — 5 phases (20-24) derived from 18 v0.5 requirements, following the 5-phase structure recommended by `.planning/research/SUMMARY.md`: native build risk front-loaded (Phase 20), release identity locked before any real build (Phase 21), icon/splash baked in before the real build (Phase 22), eas.json/credentials declared once identity is final (Phase 23), quality gates + preflight + first real submit last (Phase 24). 100% requirement coverage, no orphans.
- v0.4 shipped 2026-07-22 — all 3 phases complete, 251/251 tests passing, milestone audit passed 14/14 requirements, archived to `.planning/milestones/v0.4-*`.
- v0.3 shipped 2026-07-21 — all 4 phases complete, 192/192 tests passing, archived to `.planning/milestones/v0.3-*`.

### Decisions

Decisions are logged in PROJECT.md Key Decisions table (v0.0-v0.4 decisions all show final outcomes). No new v0.5 decisions logged yet — this is a release-engineering milestone with scope locked from the source codex plan.

- [Phase 20]: Pin eas-cli as devDependency + npm run eas script (D-04) despite triggering 2 new expo-doctor advisory checks — Deliberate tradeoff to bypass stale global eas-cli@20.0.0 shadowing bare npx on this dev machine (RESEARCH.md Pitfall 1); BUILD-01's expo-doctor 0-failures criterion was independently satisfied before eas-cli was added

### Pending Todos

- Await user approval of v0.5 ROADMAP.md, then begin `/gsd:plan-phase 20`.

### Blockers/Concerns

None open. Key ordering constraint to respect during execution (per research): bundle ID/slug/scheme (Phase 21) must be locked before the real EAS credentials/project link exist — Phase 20's throwaway build should use minimal/placeholder config, not the final identity.

## Deferred Items

Items acknowledged and carried forward to v2 (unchanged by v0.5 roadmap creation):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | PROG-01 Typed-answer quiz mode with diacritic normalization | Deferred | Project init |
| v2 | PROG-02 On-device progress/streak tracking | Deferred | Project init |
| v2 | PROG-03 Spaced repetition scheduling | Deferred | Project init |
| v2 | FETCH-06 Dataset staleness/version metadata | Deferred (P3) | v0.1 requirements definition |
| v2 | QUIZ-09 Question-progress indicator ("Question X of 10") | Deferred (P2) | v0.1 requirements definition |
| v2 | UI-04 Answer-selection feedback animation | Deferred (P3) | v0.1 requirements definition |
| v2 | RELEASE-01 `.eas/workflows/` automated build+submit CI pipeline | Deferred | v0.5 requirements definition |
| v2 | RELEASE-02 Full public App Store listing (screenshots, description, privacy nutrition label) | Deferred | v0.5 requirements definition |
| v2 | RELEASE-03 Android build/Play Console setup | Deferred | v0.5 requirements definition |

Known non-blocking tech debt carried from prior milestone audits — none block the next milestone:

- Locked Lafa palette computes below WCAG AA 4.5:1 contrast on several text/background pairings — user reviewed on-device in Expo Go and accepted as-is
- `OfflinePill` not rendered on Results' no-session fallback branch (carried from v0.1, deliberate scope choice)
- `app/results.tsx`'s `handleBackToSetup()` doesn't call `reset()` before navigating (carried from v0.1, currently harmless)
- Cross-verb distractor `formIndex`-miss gap (Phase 14/15/16) — explanation coverage uneven across distractor tiers, fail-closed, explicitly deferred
- `selectExplanation`'s selected-label interpolation only populates on match-agreement (v0.4, Phase 18) — template-content edge case, no current template exercises it
- Phases 15 (v0.3), 17/18/19 (v0.4) `VALIDATION.md` task tables never updated post-execution (stale "pending" status) — cosmetic doc-sync gap, confirmed recurring pattern (see RETROSPECTIVE.md)

## Session Continuity

Last session: 2026-07-23T12:40:26.323Z
Stopped at: Phase 21 context gathered
Resume file: .planning/phases/21-release-identity-lock/21-CONTEXT.md

## Operator Next Steps

- Review and approve `.planning/ROADMAP.md` (v0.5 section, Phases 20-24)
- Run `/gsd:plan-phase 20` to begin Phase 20: Native Build Risk Front-Loading
