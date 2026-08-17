---
phase: 35-app-store-connect-readiness
plan: 04
subsystem: docs
tags: [app-store-connect, privacy, app-privacy-nutrition-label, fastify, cross-repo]

requires:
  - phase: 35-01
    provides: "backend Fastify request logging fix (disableRequestLogging: true) already applied and pushed to origin/main"
provides:
  - "store/privacy/nutrition-label-answers.md paste-ready App Privacy questionnaire answers with per-call data-flow evidence"
affects: [35-07 (manual App Store Connect App Privacy questionnaire entry consumes this document directly)]

tech-stack:
  added: []
  patterns:
    - "Evidence-cited privacy documentation: every claim in the answer sheet names a concrete file path (src/feedback/payload.ts, src/productFeedback/payload.ts, src/dataset/remote.ts, portuguese-verb-backend/prisma/schema.prisma, portuguese-verb-backend/src/app.ts) or a commit SHA, never asserted from memory"

key-files:
  created:
    - store/privacy/nutrition-label-answers.md
  modified: []

key-decisions:
  - "Task 1 (author the answer sheet) completed and committed. Task 2 (confirm on the live Render deployment that client IPs no longer appear in the log stream) is a blocking checkpoint:human-verify — it requires the developer to watch Render's live dashboard log stream while a request is issued, which has no CLI/API surface available here and cannot be automated. Execution paused there rather than writing an unverified claim into the answer sheet."

requirements-completed: []

duration: ~15min (Task 1 only)
completed: 2026-08-17
---

# Phase 35 Plan 04: App Store Connect Privacy Nutrition Label Summary

**Authored `store/privacy/nutrition-label-answers.md` as a sourced, paste-ready App Privacy answer sheet mapping all three of the app's network calls (`POST /feedback`, `POST /product-feedback`, `GET /content/verbs`) to Apple data types with per-call evidence, and closed D-09 in writing (Option A taken, backend commit `f06c46b`) — the live-deployment log verification (Task 2) is paused at a blocking checkpoint pending the developer watching Render's live log stream.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 1 of 2 completed (Task 2 is a blocking human-verify checkpoint requiring live observation of Render's dashboard log stream)
- **Files modified:** 1 created

## Accomplishments

- `store/privacy/nutrition-label-answers.md`: summary answer (Used for Tracking: No, Data Linked to You: None), a three-row data-flow mapping table (reused from `35-RESEARCH.md`'s Pattern 2, with the "Server logs" column updated to the post-fix state), field-by-field questionnaire answers (User Content -> Customer Support, purpose App Functionality, Not Linked to You, Not Used for Tracking, with Other User Content named as the acceptable substitute), a table marking all 11 other Apple data type groups as not collected with one-line evidence each, the Usage Data/Product Interaction judgment call (recommended answer: do not separately declare; conservative alternative documented), the D-09 resolution record (Option A named and evidenced with the exact `disableRequestLogging: true` change, file path, and commit SHA `f06c46b`, with an explicit statement that Option B was not taken), a re-verification trigger list (new SDK, new endpoint, new request field, reverting `disableRequestLogging`, new log drain), and a placeholder `## Live log verification` section awaiting Task 2's checkpoint resolution
- Every claim traces to a named file: `src/feedback/payload.ts`, `src/productFeedback/payload.ts`, `src/productFeedback/schema.ts`, `src/dataset/remote.ts`, `portuguese-verb-backend/prisma/schema.prisma`, `portuguese-verb-backend/src/app.ts`, `35-01-SUMMARY.md`
- All Task 1 automated verification checks pass (grep for `Data Not Linked to You`/`Linked to you`, `/product-feedback`, `/content/verbs`, `disableRequestLogging`, `user content`, `app functionality`, `tracking`, `prisma/schema.prisma`, `Option A`)
- Pre-checkpoint spot checks for Task 2 already run and passing: `curl -s -o /dev/null -w '%{http_code}' https://portuguese-verb-api.onrender.com/health` → `200`; `grep -q "disableRequestLogging: true" portuguese-verb-backend/src/app.ts` → present; `npm run typecheck` → exit 0

## Task Commits

1. **Task 1: Author store/privacy/nutrition-label-answers.md** - `5782c08` (docs)

**Plan metadata:** not yet created — plan is paused at Task 2's checkpoint, so the final `docs(35-04): complete plan` metadata commit and STATE.md/ROADMAP.md updates have not been made. They will be created after the checkpoint resolves and the `## Live log verification` section is appended.

## Files Created/Modified

- `store/privacy/nutrition-label-answers.md` - App Privacy questionnaire answer sheet: summary answer, per-call data-flow mapping table, questionnaire answers by Apple data type, D-09 resolution record, re-verification triggers, pending live-log-verification section

## Decisions Made

- Followed the plan's explicit framing that Task 2's live-log observation cannot be automated (no Render CLI/API surface available in this environment) — this is a genuine `checkpoint:human-verify` with `gate="blocking"`, not an auto-approvable "verify already-done work" gate. No claim about the live log stream was written into the answer sheet; the section is left as an explicit placeholder pending developer confirmation, per the plan's instruction not to write the verification claim unless actually confirmed.
- Selected "User Content -> Customer Support" as the primary data-type answer with "Other User Content" documented as the acceptable substitute, matching the plan's Task 1 instructions verbatim.
- Recorded the Usage Data/Product Interaction judgment call as instructed: recommended answer is to fold the quiz-context fields into the same User Content declaration rather than separately declaring Usage Data, with the conservative alternative documented for future reference.

## Deviations from Plan

None - Task 1 executed exactly as written.

## Issues Encountered

None for Task 1. Task 2 is blocked on developer access to the Render dashboard's live log stream, which is expected per the plan (it is explicitly framed as a checkpoint, not an executor failure).

## Next Phase Readiness

- The answer sheet is complete and ready to be pasted into App Store Connect (plan 35-07) once Task 2's live-log verification closes the loop.
- Plan 35-04 is NOT complete — STATE.md/ROADMAP.md have intentionally not been advanced. A continuation agent should resume at Task 2 after the developer confirms the live Render log stream shows no `incoming request`/`remoteAddress` lines for a fresh request.

---
*Phase: 35-app-store-connect-readiness*
*Completed: Task 1 only, 2026-08-17 — plan paused at Task 2 checkpoint*
