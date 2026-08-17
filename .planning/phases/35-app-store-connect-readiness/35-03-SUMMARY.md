---
phase: 35-app-store-connect-readiness
plan: 03
subsystem: infra
tags: [app-store-connect, documentation, store-listing]

requires:
  - phase: 35-app-store-connect-readiness (plan 01/02)
    provides: earlier readiness config (e.g. app.json supportsTablet, docs/ support+privacy pages)
provides:
  - Versioned App Store Connect listing copy under store/ (subtitle, keywords, category, description, review notes)
affects: [35-07 (manual App Store Connect submission)]

tech-stack:
  added: []
  patterns: ["store/ as a zero-code-coupling documentation tier, mirroring .planning/'s versioned-Markdown convention"]

key-files:
  created:
    - store/README.md
    - store/metadata/subtitle.txt
    - store/metadata/keywords.txt
    - store/metadata/category.md
    - store/metadata/description.md
    - store/metadata/review-notes.md
  modified: []

key-decisions:
  - "Subtitle 'European Portuguese verbs' (25 chars) carries the what-it-is signal since the app name 'Lafa' is opaque"
  - "Keywords list (96 chars) avoids repeating the app name/subtitle words Apple already indexes"
  - "Review notes enumerate all three real network calls (GET /content/verbs, POST /feedback, POST /product-feedback), correcting CLAUDE.md's stale two-endpoint framing"

patterns-established:
  - "store/ metadata files are plain Markdown/text, no frontmatter, hand-transcribed into App Store Connect — never imported by build tooling"

requirements-completed: [STORE-01]

duration: 12min
completed: 2026-08-17
---

# Phase 35 Plan 03: App Store Connect Listing Copy Summary

**Authored the full App Store Connect listing text (subtitle, keywords, category, description, App Review notes) under `store/`, each within Apple's character limits and carrying all three D-06 mandatory facts (free, no account, European Portuguese).**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-17T00:00:00Z (approx)
- **Completed:** 2026-08-17
- **Tasks:** 2
- **Files modified:** 6 created

## Accomplishments
- `store/` tree created as a pure documentation tier with a README mapping each file to its App Store Connect field
- Subtitle (25/30 chars) and keywords (96/100 chars, no comma-space) both within Apple's limits
- Description states the core loop, all four tenses and six subject pronouns, and the three D-06 facts (free/no-account/European Portuguese) in a direct, marketing-fluff-free tone with no exclamation marks or emoji
- App Review notes enumerate all three real network calls with exact endpoints and field lists, state there is no login/gating, give a reviewer reproduction path, and provide a contact email

## Task Commits

1. **Task 1: Create store/ and author subtitle, keywords, category, and description** - `8950481` (docs)
2. **Task 2: Author the App Review notes** - `dcbb57c` (docs)

**Plan metadata:** (this commit)

## Files Created/Modified
- `store/README.md` - states zero code coupling and maps each metadata file to its ASC field
- `store/metadata/subtitle.txt` - "European Portuguese verbs" (25 chars)
- `store/metadata/keywords.txt` - 11-term comma-separated keyword string (96 chars)
- `store/metadata/category.md` - Education as sole primary category (D-04), explicit no-secondary note
- `store/metadata/description.md` - full listing description (1182 chars) covering how-it-works, coverage, and the three D-06 facts
- `store/metadata/review-notes.md` - App Review Notes field text (2091 chars) covering no-login, reproduction path, all three network calls, backend cold-start note, PT-PT vs PT-BR note, contact

## Decisions Made
None beyond what the plan specified — followed the plan's exact subtitle/keyword/description structure and review-notes ordering as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This copy will be manually transcribed into App Store Connect in a later plan (35-07).

## Next Phase Readiness

`store/metadata/` now holds every listing text field except screenshots (STORE-06, separate plan) and the privacy nutrition-label answers (separate plan). Ready for the manual App Store Connect transcription step in plan 35-07, once screenshots and privacy answers are also complete.

---
*Phase: 35-app-store-connect-readiness*
*Completed: 2026-08-17*

## Self-Check: PASSED
