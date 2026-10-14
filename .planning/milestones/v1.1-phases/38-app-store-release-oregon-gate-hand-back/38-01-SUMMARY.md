---
phase: 38-app-store-release-oregon-gate-hand-back
plan: 01
subsystem: release
tags: [app-store-connect, release, submission-log, review-notes]
requires:
  - phase: 37
    provides: "1.0.1 build 8 (EAS c5c481e4-4ebe-49ea-a32a-7ef76ca87563), Ready to Submit"
provides:
  - "Lafa 1.0.1 (8) submitted to App Review, status Waiting for Review"
  - "store/metadata/whats-new.txt and updated review-notes.md"
  - "Multi-version store/submission-log.md with v1.0.1 record"
affects: [38-02, 38-03]
tech-stack:
  added: []
  patterns: []
key-files:
  created: [store/metadata/whats-new.txt]
  modified: [store/metadata/review-notes.md, store/README.md, store/submission-log.md]
key-decisions:
  - "Automatic release with phased release OFF (D-07)"
requirements-completed: [REL-03]
completed: 2026-10-11
---

# Phase 38 Plan 01: Submit Lafa 1.0.1 to App Review Summary

Lafa 1.0.1 (build 8) was submitted to App Review with automatic release and phased release OFF, and the submission is recorded in a multi-version log.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Store copy, multi-version log, Frankfurt preflight (4/4 pass) | 75bf931 |
| 2 | Developer submitted 1.0.1 in ASC (human action, no commit) | n/a |
| 3 | Record the 1.0.1 submission in the log | 6ea2a9e |

## Recorded facts

- Status before submit: "Prepare for Submission" (time not noted).
- Status after submit: "Waiting for Review", ~2026-10-11T19:05Z (~20:05 WEST).
- What's New pasted unchanged; build 1.0.1 (8) attached; "Automatically release this version".
- Phased release: confirmed OFF at ~19:10Z.

## Deviations from Plan

**1. Review notes entered after submit.** The plan had the notes replaced before submit. The 1.0.0 notes were attached at the moment of submit; the developer pasted `store/metadata/review-notes.md` into App Review Information while the version was "Waiting for Review" (~2026-10-11T19:10Z). Logged honestly in the Fields table.

**2. Phased release set after submit.** It was unchecked at submit and confirmed OFF ~5 minutes later.

**3. Add for Review needed a Save.** The button stayed inactive until the developer clicked Save on the version page (no ASC error shown). No other blockers.

Status times for "Prepare for Submission" were not noted and are recorded as such, not invented.

## Known Stubs

None.

## Self-Check: PASSED

Commits 75bf931 and 6ea2a9e exist; the Task 3 automated verify printed ok.
