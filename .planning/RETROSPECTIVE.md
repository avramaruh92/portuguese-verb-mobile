# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.0 — Offline Quiz MVP

**Shipped:** 2026-07-13
**Phases:** 6 | **Plans:** 18 | **Sessions:** ~2 (bootstrap/planning + execution/audit)

### What Was Built
- Expo Router + strict TypeScript + Zustand + jest-expo walking-skeleton, human-confirmed on the iOS Simulator
- Full 50-verb European Portuguese dataset (37 regular / 13 irregular), typed, Zod-validated, human-reviewed once in Phase 2 and independently re-derived cell-by-cell again in Phase 6 (two full accuracy passes, zero discrepancies at the end)
- Pure, deterministic, fully unit-tested quiz generation + scoring engine (filtering, unique-triple sampling, distractor building, scoring)
- Complete Setup → Quiz → Results user flow across three Expo Router screens over a single Zustand store
- In-app "Report a problem" feedback flow wired to the live `POST /feedback` backend, cold-start-tolerant (manual `AbortController`, 90s timeout, not `AbortSignal.timeout` which is unimplemented on Hermes), verified never to block the quiz
- A dedicated verification-only phase (Phase 6) that re-derived the entire dataset from grammar rules, ran a real cold-start test against a genuinely idle backend, and walked three research-flagged edge cases on-device — shipped zero code changes because everything already held

### What Worked
- **Bottom-up dependency ordering** (scaffold → dataset → engine → UI → feedback → verification) meant later phases never had to backtrack on earlier foundations — Phase 4's UI wired directly into Phase 3's pure functions with zero type drift, confirmed by the integration checker at milestone close.
- **Two independent dataset-accuracy passes** (human review in Phase 2, independent AI re-derivation in Phase 6) at different points in the project caught different things — the human catch (Phase 2) fixed `querer`'s conjugation-adjacent detail early; the later independent re-derivation (Phase 6) found zero further conjugation errors but surfaced a classification-boundary question that only became visible after the app's `includeIrregular` filter existed to reveal it as functionally significant.
- **Verification-only phases pay for themselves.** Phase 6 shipped zero code changes but converted "the SUMMARY says it works" into "an independent verifier ran the tests, re-read the code, and re-derived the numbers." This caught a self-correction opportunity mid-session: an early framing that `isIrregular` was "cosmetic" was wrong and got corrected before the user made an uninformed choice — worth flagging as a lesson below.
- **Human-verify checkpoints for physically-unreachable conditions** (Render cold start, iOS share-sheet cancellation, app backgrounding) were the right call — no amount of automated testing can exercise a genuinely idle free-tier backend or a real touch gesture, and the checkpoints surfaced a genuinely useful finding (there's no in-app navigation path back to Setup during an active quiz, which reinforces rather than undermines an invariant).
- **Milestone audit before completion** (gsd-verifier for the one phase missing a VERIFICATION.md, plus a fresh gsd-integration-checker pass across all 6 phases) caught that Phase 6 had never been through the standard verify step and closed that gap before the milestone was marked shipped, rather than discovering it later.

### What Was Inefficient
- Phase 6's VERIFICATION.md was missing entirely until the milestone audit step — it should have been generated at the end of Phase 6's execution, not retroactively during `/gsd:audit-milestone`. Costed one extra background-agent round trip.
- Two SUMMARY.md one-liner extractions (Phase 5, plans 01 and 04) were mis-parsed by the automated `summary-extract` tool (it picked up an unrelated heading/list line instead of the actual bold one-liner) and had to be manually corrected in MILESTONES.md after archival. Worth checking `summary-extract` output against the source file when a one-liner looks suspiciously like a checklist item or numbered list.
- The `portuguese-verb-memory` MCP's `currentFocus`/`nextTasks` state had drifted significantly stale (last updated after Phase 3) by the time Phase 6 finished — completions for Phases 4-6 had to be backfilled in a single catch-up pass rather than being recorded incrementally as each phase closed. Save-completion calls should happen at the same cadence as CLAUDE.md's stated lifecycle (after each phase), not batched at the end.

### Patterns Established
- **Classification flags with runtime behavior implications** (like `isIrregular` gating a filter) deserve explicit "is this cosmetic or functional?" verification before presenting a choice to the user — don't assume a dataset metadata field is inert without grepping its usages first.
- **Verification-only polish phases** are a reusable pattern for any app with hand-authored content or environment-dependent behavior (cold starts, native share sheets): dedicate a final phase to independently re-deriving content and manually exercising physically-unreachable conditions, budgeting for zero code changes as the expected happy path.
- **querer stays isIrregular: false** — documented as a deliberate, discussed decision (not an oversight) in both PROJECT.md's Key Decisions and the `portuguese-verb-memory` MCP, specifically because a future session re-reading only the dataset might otherwise "fix" it.

### Key Lessons
1. Before asking the user to decide on a dataset/schema flag change, grep its actual usages in the codebase first — "is this field load-bearing?" is answerable in seconds and prevents presenting a decision with an inaccurate premise (this happened once in Phase 6 and was self-corrected before the user acted on wrong information).
2. Generate each phase's VERIFICATION.md at the end of that phase's own execution, not retroactively at milestone audit time — it's cheaper to verify once inline than to spawn a dedicated backfill agent later.
3. Update the cross-repo memory MCP's current-focus/next-tasks/completions at the same cadence phases actually close, not in a single end-of-milestone catch-up — staleness compounds silently otherwise.
4. When extracting one-liners from SUMMARY.md files programmatically, spot-check outputs that look like list items or headings rather than prose — the extraction can silently grab the wrong section.

### Cost Observations
- Model mix: not tracked at per-call granularity this milestone; execution used a mix of direct orchestrator work and spawned `gsd-executor`/`gsd-verifier`/`gsd-integration-checker` subagents (worktree-isolated where parallel).
- Sessions: ~2 (an initial bootstrap/planning session, then a longer execution + audit + completion session for Phases 4-6 and milestone close)
- Notable: Phase 6 (4 plans, verification-only) shipped zero code diffs — its entire cost was verification labor (re-deriving 1,200 dataset cells, live cold-start test, 3 edge-case walkthroughs), which is exactly the kind of work automated tests structurally cannot replace but that a dedicated phase makes tractable to budget for.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v0.0 | ~2 | 6 | First milestone — bottom-up dependency-ordered roadmap (foundation phases before vertical slices), closed with a dedicated verification-only polish phase |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v0.0 | 122 | Not measured via coverage tool this milestone | 0 (native `fetch`/`Share` used instead of axios/expo-sharing/react-native-share by design) |

### Top Lessons (Verified Across Milestones)

1. Grep before asking — verify whether a field/flag is functionally load-bearing before presenting a user-facing decision about it.
2. Verification-only phases at milestone end are worth budgeting for when the app has hand-authored content or environment-dependent behavior automated tests can't reach.
