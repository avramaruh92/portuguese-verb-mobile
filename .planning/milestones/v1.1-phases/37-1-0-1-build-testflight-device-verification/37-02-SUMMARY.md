---
phase: 37-1-0-1-build-testflight-device-verification
plan: 02
subsystem: release
tags: [eas, testflight, release]
requires:
  - phase: 37-01
    provides: version 1.0.1 and pre-build gates
provides:
  - EAS production build c5c481e4-4ebe-49ea-a32a-7ef76ca87563 (1.0.1, build 8)
  - TestFlight install on a real iPhone, recorded in 37-EVIDENCE.md
affects: [37-03, 37-04]
tech-stack:
  added: []
  patterns: []
key-files:
  modified:
    - .planning/phases/37-1-0-1-build-testflight-device-verification/37-EVIDENCE.md
key-decisions:
  - "Build started without --auto-submit; submission done separately by the developer"
requirements-completed: [REL-01, REL-02]
duration: ~4h wall clock (includes developer wait)
completed: 2026-10-11
---

# Phase 37 Plan 02: EAS production build and TestFlight install Summary

Lafa 1.0.1 build 8 (EAS id c5c481e4-4ebe-49ea-a32a-7ef76ca87563) was built with the production profile, submitted via eas submit, and installed from TestFlight on an iPhone 14 Pro (iOS 26.6.1) on 2026-10-11, showing "1.0.1 (8)".

## Results

- REL-01: build FINISHED, version 1.0.1, build number 8, recorded in 37-EVIDENCE.md (commit 63ff404).
- REL-02: eas submit succeeded; ASC status "Ready to Submit" (verbatim); TestFlight shows 1.0.1 (8), matching REL-01.

## Notes for plan 37-03

- The device had an iOS 27.0.1 update pending after install; record the iOS version actually used for E2E.
- The developer anecdotally noted the app feels much faster (not evidence).

## Deviations from Plan

None - plan executed as written.

## Self-Check: PASSED
