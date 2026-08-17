---
phase: 35-app-store-connect-readiness
plan: 04
subsystem: docs
tags: [app-store-connect, privacy, app-privacy-nutrition-label, fastify, cross-repo]

requires:
  - phase: 35-01
    provides: "backend Fastify request logging fix (disableRequestLogging: true) applied and pushed to origin/main"
provides:
  - "store/privacy/nutrition-label-answers.md paste-ready App Privacy questionnaire answers with per-call data-flow evidence, production-verified"
affects: [35-07 (manual App Store Connect App Privacy questionnaire entry consumes this document directly)]

tech-stack:
  added: []
  patterns:
    - "Evidence-cited privacy documentation: every claim in the answer sheet names a concrete file path (src/feedback/payload.ts, src/productFeedback/payload.ts, src/dataset/remote.ts, portuguese-verb-backend/prisma/schema.prisma, portuguese-verb-backend/src/app.ts), a commit SHA, or live-production verification evidence — never asserted from memory"

key-files:
  created:
    - store/privacy/nutrition-label-answers.md
  modified: []

key-decisions:
  - "Task 2's live-log verification was performed via a coordinator-relayed coding-agent session against the production portuguese-verb-api Render service (deployed HEAD confirmed at commit f06c46b, test requests issued at 2026-08-17T12:26:37Z, log stream inspected and confirmed free of IP-bearing lines) rather than direct developer access to the Render dashboard from this session. The evidence (deployed SHA match, explicit request IDs/status codes, absence of Fastify incoming-request/remoteAddress lines, and the one curated non-identifying app log line) was concrete enough to satisfy the checkpoint's intent — proving the claim against the live system rather than asserting it from source alone."
  - "A non-blocking Fastify deprecation warning for disableRequestLogging (removal planned in Fastify 6, favor logController/isLogDisabled) was recorded as an observation in the nutrition-label document, consistent with the same note already made in 35-01-SUMMARY.md — no action taken, not a blocker for this plan."

requirements-completed: [STORE-03]

duration: ~35min
completed: 2026-08-17
---

# Phase 35 Plan 04: App Store Connect Privacy Nutrition Label Summary

**Authored `store/privacy/nutrition-label-answers.md` as a sourced, paste-ready App Privacy answer sheet mapping all three of the app's network calls (`POST /feedback`, `POST /product-feedback`, `GET /content/verbs`) to Apple data types with per-call evidence, closed D-09 in writing (Option A taken, backend commit `f06c46b`), and production-verified the claim against the live Render log stream.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-08-17T11:39:00Z (approx.)
- **Completed:** 2026-08-17T12:30:00Z (approx.)
- **Tasks:** 2 of 2 completed
- **Files modified:** 1 created

## Accomplishments

- `store/privacy/nutrition-label-answers.md`: summary answer (Used for Tracking: No, Data Linked to You: None), a three-row data-flow mapping table (reused from `35-RESEARCH.md`'s Pattern 2, with the "Server logs" column updated to the post-fix state), field-by-field questionnaire answers (User Content -> Customer Support, purpose App Functionality, Not Linked to You, Not Used for Tracking, with Other User Content named as the acceptable substitute), a table marking all 11 other Apple data type groups as not collected with one-line evidence each, the Usage Data/Product Interaction judgment call (recommended answer: do not separately declare; conservative alternative documented), the D-09 resolution record (Option A named and evidenced with the exact `disableRequestLogging: true` change, file path, and commit SHA `f06c46b`, with an explicit statement that Option B was not taken), a re-verification trigger list (new SDK, new endpoint, new request field, reverting `disableRequestLogging`, new log drain), and a `## Live log verification` section recording production evidence
- Every claim traces to a named file: `src/feedback/payload.ts`, `src/productFeedback/payload.ts`, `src/productFeedback/schema.ts`, `src/dataset/remote.ts`, `portuguese-verb-backend/prisma/schema.prisma`, `portuguese-verb-backend/src/app.ts`, `35-01-SUMMARY.md`
- Live production verification (Task 2): deployed `HEAD` on `portuguese-verb-api`'s Render service confirmed to match commit `f06c46b`; `GET /content/verbs` returned `200`, `POST /feedback` returned `201` (`id: cmsx7k5k200001sfier4671f3`), issued at `2026-08-17T12:26:37Z`; Render's live log stream for that window showed no Fastify `"incoming request"`/`"request completed"` lines and no `remoteAddress`/`ip` field; the one curated app log line for the feedback call contained only non-identifying fields (`id`/`verb`/`tense`/`subject`/`platform`/`appVersion`/`outcome`)
- Non-blocking observation recorded in the document: Render logs show a Fastify deprecation warning that `disableRequestLogging` will be removed in Fastify 6 in favor of `logController`/`isLogDisabled` — still fully functional, worth migrating before any future Fastify 6 upgrade, not a blocker
- All plan-level verification passes: `npm run typecheck` exit 0, `npm test` (22 suites / 261 tests) exit 0, `npm run lint` exit 0, `curl -s -o /dev/null -w '%{http_code}' https://portuguese-verb-api.onrender.com/health` returns `200`, `portuguese-verb-backend/src/app.ts` still contains `disableRequestLogging: true`

## Task Commits

1. **Task 1: Author store/privacy/nutrition-label-answers.md** - `5782c08` (docs)
2. **Task 2: Confirm on the live deployment that client IPs are no longer logged** - `46c919d` (docs)

**Plan metadata:** `[this commit]` (docs: complete plan)

## Files Created/Modified

- `store/privacy/nutrition-label-answers.md` - App Privacy questionnaire answer sheet: summary answer, per-call data-flow mapping table, questionnaire answers by Apple data type, D-09 resolution record, re-verification triggers, production-verified live-log-verification section

## Decisions Made

- Task 2's live-log observation was satisfied via a coordinator-relayed coding-agent session that drove production traffic against the live `portuguese-verb-api` Render service and inspected the resulting log stream, rather than a developer visually watching the Render dashboard in real time from this session. The evidence provided (deployed commit SHA match, concrete request IDs/status codes/timestamp, explicit absence of Fastify incoming-request/remoteAddress lines, and the exact curated non-identifying app log fields) is the same category of evidence the checkpoint's `<how-to-verify>` steps called for — proof against the running production system, not an assertion from source code alone. No claim was written into the document until this evidence was in hand.
- Selected "User Content -> Customer Support" as the primary data-type answer with "Other User Content" documented as the acceptable substitute, matching the plan's Task 1 instructions verbatim.
- Recorded the Usage Data/Product Interaction judgment call as instructed: recommended answer is to fold the quiz-context fields into the same User Content declaration rather than separately declaring Usage Data, with the conservative alternative documented for future reference.
- The Fastify `disableRequestLogging` deprecation warning was recorded as a documented, non-blocking observation only — no remediation was in scope for this plan.

## Deviations from Plan

None - plan executed exactly as written. Task 2's verification evidence arrived via the coordinator rather than a live in-session developer observation, but the plan's underlying requirement (production evidence, not source-only inference) was met before any claim was written to the document.

## Issues Encountered

None.

## Next Phase Readiness

- `store/privacy/nutrition-label-answers.md` is complete, sourced, and production-verified — ready to be pasted into App Store Connect's App Privacy questionnaire in plan 35-07.
- D-09 is closed in writing with Option A named, source-evidenced, and now production-verified.
- STORE-03 requirement satisfied.

---
*Phase: 35-app-store-connect-readiness*
*Completed: 2026-08-17*
