---
phase: 39-v1-0-tech-debt-cleanup
plan: 02
subsystem: docs
tags: [docs, eas, tech-debt]
requires: []
provides:
  - buildNumber-ignored documentation (CLAUDE.md, STACK.md)
  - dated corrections on archived 30-02 and 35-06 summaries
  - accurate screenshots README build instructions
affects: [CLAUDE.md, .planning/codebase/STACK.md]
key-files:
  modified:
    - CLAUDE.md
    - .planning/codebase/STACK.md
    - .planning/milestones/v1.0-phases/30-build-pipeline-hardening/30-02-SUMMARY.md
    - .planning/milestones/v1.0-phases/35-app-store-connect-readiness/35-06-SUMMARY.md
    - store/screenshots/README.md
decisions:
  - "app.json ios.buildNumber left at \"1\"; documented as ignored (eas.json remote appVersionSource + autoIncrement)"
metrics:
  completed: 2026-10-14
  tasks: 2
  files: 5
requirements: [DEBT-01, DEBT-05]
---

# Phase 39 Plan 02: Doc debt corrections Summary

Documented that `ios.buildNumber` is ignored in favour of EAS remote autoIncrement, and corrected the stale 30-02, 35-06 and screenshots README text with insert-only dated corrections.

## Commits
- b13206d: CLAUDE.md and STACK.md buildNumber note; STACK.md eas.json line and app.json values corrected
- 6fb5687: 30-02-SUMMARY (3 correction blocks), 35-06-SUMMARY (1), screenshots README (ios/ is gitignored)

## Deviations from Plan
- Worktree base was corrected via `git reset --hard a51c1f5` per the startup check (merge-base differed). No other deviations.

## Self-Check: PASSED
Correction counts verified (3 and 1), no removed lines in archived summaries, app.json/eas.json untouched.
