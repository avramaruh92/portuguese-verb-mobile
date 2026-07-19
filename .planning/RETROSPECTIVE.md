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

## Milestone: v0.1 — Online Quiz, Exit Flow & UI Polish

**Shipped:** 2026-07-17
**Phases:** 5 (7, 8, 9, 10, and inserted 10.1) | **Plans:** 13

### What Was Built
- Live backend content fetch (`GET /content/verbs`) with Zod validation and fully silent fallback to the bundled local dataset on any failure — zero user-facing blocking or error, confirmed live against the real endpoint, not just a mock
- Async, race-safe quiz start: dataset source (remote or local) is resolved and snapshotted at the moment `startQuiz()` is called, so a background refresh completing mid-quiz can never swap an in-progress session's questions
- Clean end-quiz-early flow: a single shared confirmation routes both the header Exit control and the native swipe-back/hardware-back gesture, with no bypass path and a full-state reset on confirm
- App-wide visual polish: a shared design-tokens module (`src/theme/tokens.ts`) driving consistent spacing/typography/color across Setup/Quiz/Results, safe-area-correct layout verified on a real notched device
- A milestone-audit-driven gap closure (Phase 10.1, inserted): pulled the deferred FETCH-05 requirement forward to add a small, non-blocking "Using saved content" indicator, giving the local-fallback signal a real, visible surface without reopening the fetch step's silent-failure contract — human-verified on a physical iPhone under a genuine Airplane Mode network failure

### What Worked
- **Milestone-audit-driven gap closure as an inserted decimal phase** (10.1) worked cleanly end-to-end: the original audit found a genuine cross-phase requirements tension (FETCH-03's silence vs. UI-03's error-state framing), proposed three options, and the user picked the lowest-risk one (pull FETCH-05 forward) rather than reopening a locked contract. The full discuss → plan → execute → verify → re-audit cycle for a single-requirement gap closure took about as long as a normal small phase, not longer.
- **Insisting on a Release build (not the Debug dev-client) for on-device network-fallback testing** was the right call once discovered — a Debug dev-client requires live Metro connectivity at every launch, so testing "Airplane Mode fallback" against it would have actually tested "does the JS bundle fail to load," not the app's own fetch/fallback logic. This is a reusable lesson for any future on-device test involving simulated network loss.
- **Pattern-mapper + plan-checker before execution** caught the exact right integration point (`resolveVerbs()`'s existing memoization) ahead of time, so the executor never had to guess between "add a store field" vs. "read directly" — the plan itself specified the discretion call and its rationale, and the code review confirmed it was followed faithfully.
- **Re-running the milestone audit after a late-inserted gap-closure phase**, rather than trusting the original (now-stale) audit, correctly upgraded the milestone status from `gaps_found` to `tech_debt` and caught a real, separate documentation gap (FETCH-05 was still listed under "v2 Requirements (Deferred)" in REQUIREMENTS.md even after Phase 10.1 shipped it) before archiving.

### What Was Inefficient
- Getting a build onto a physical iPhone for the human-verify checkpoint took far longer than the actual verification: Expo Go's SDK 57 incompatibility (no compatible Expo Go build published yet), an unaccepted Apple Developer Program License Agreement, and a macOS Keychain signing-key authorization prompt (mistaken at first for an Apple ID password rather than the Mac login password) all had to be resolved serially before the first successful on-device build. None of this is specific to this project — it's generic Expo/Xcode/Apple-account friction — but it consumed roughly as much wall-clock time as the rest of Phase 10.1's execution combined.
- The iOS Simulator's Airplane Mode toggle was tried first and doesn't actually cut network for the simulator process (it shares the host Mac's network stack) — this was discovered only after already being deep into simulator-based verification, costing a detour before switching to a physical device.
- `expo run:ios` incidentally modified `app.json` (added a `bundleIdentifier`) and `package.json` (changed `ios`/`android` npm scripts from `expo start --ios/--android` to `expo run:ios/android`) as prebuild side effects of getting a device build working — these had to be manually reverted via `git checkout` before committing the actual verification SUMMARY.md, since they were tooling side effects unrelated to the plan's scope, not deliberate project changes.

### Patterns Established
- **On-device network-fallback verification requires a Release build**, not a Debug dev-client — document this as a standing convention for any future phase whose human-verify checkpoint involves simulating network loss on a physical device.
- **Milestone-audit gap closure as an inserted decimal phase** (e.g., `10.1`) is now a proven pattern for this project: a small, single-requirement fix gets the full discuss/plan/execute/verify treatment rather than being handled as an ad hoc patch, and the milestone audit gets re-run afterward rather than trusting the stale original.
- **REQUIREMENTS.md's deferred/v2 section needs an explicit "pulled forward" edit** whenever a gap-closure phase promotes a previously-deferred requirement — otherwise the traceability table and the deferred-items list silently disagree about a requirement's status (caught this milestone before the audit re-run, but only by manual inspection, not automatically).

### Key Lessons
1. Before attempting on-device human-verify of any network-dependent behavior (fallback, offline mode, timeout handling), confirm upfront whether the test needs a Release/standalone build vs. a Debug dev-client — a dev-client's own Metro dependency can make network-loss testing test the wrong thing.
2. Getting first-time physical-device signing working (Apple PLA acceptance, Keychain authorization, provisioning profiles) is generic cross-project friction, not something to debug from first principles each time — recognize the error classes quickly (PLA update available, keychain access prompt, missing provisioning profile) and route to the standard fix rather than re-deriving it.
3. When a gap-closure phase (or any phase) promotes a requirement across sections of REQUIREMENTS.md (e.g., v2-deferred → active milestone), update both the deferred list and the traceability table in the same edit — a re-audit will catch the mismatch, but it's cheaper to get it right the first time.
4. `expo run:ios`/`expo prebuild` can silently modify `app.json`/`package.json` as a side effect of getting a one-off device build working — check `git status` after any manual device-build detour and revert incidental changes before committing planned work.

### Cost Observations
- Model mix: mix of direct orchestrator work and spawned `gsd-planner`/`gsd-executor`/`gsd-plan-checker`/`gsd-verifier`/`gsd-code-reviewer`/`gsd-integration-checker`/`gsd-pattern-mapper` subagents (opus for planning, sonnet for research/checking/execution/verification).
- Sessions: ~2 (a planning/execution session for Phases 7-10, then a longer session covering Phase 10.1's plan → execute → on-device-verify → code-review → phase-verify → milestone-audit-re-run → complete-milestone chain, interrupted mid-flow by physical-device build troubleshooting)
- Notable: Phase 10.1 was the smallest phase by code diff (5 files, ~160 lines) but had the longest wall-clock time of any single phase in the milestone, entirely due to first-time physical-device build setup — a one-time cost that should not recur for future phases needing device verification on this same machine/account.

---

## Milestone: v0.2 — Lafa Design System + Tense Label Refresh

**Shipped:** 2026-07-19
**Phases:** 2 (11, 12) | **Plans:** 4

### What Was Built
- App-wide rebrand from "Portuguese Verb Quiz" to "Lafa": `src/theme/tokens.ts` rewritten with the Lafa palette (colors, typography, spacing, radius incl. a new `pill` radius), consumed by all 3 screens and both shared components (`OfflinePill`, `ReportFeedbackModal`) with zero hardcoded hex remaining anywhere
- Setup heading, `app.json` `expo.name`, and the native share message all read "Lafa"
- Displayed tense labels refreshed for A1-A2 clarity — `preterite` → "Completed past", `imperfect` → "Imperfect past" — with the exact Portuguese grammar term shown inline-parenthesized on the Quiz screen's meta row only, gated to preterite/imperfect
- Internal enum literals and the `POST /feedback` payload left byte-for-byte unchanged throughout — independently verified via grep that `src/feedback/` has zero references to any label map
- A pending human-verification item (WCAG contrast on the locked palette, flagged by Phase 11's own code review) was resolved via on-device review in Expo Go rather than left open — user accepted the palette as-is

### What Worked
- **User-driven "skip research" calls on small, well-scoped phases paid off cleanly.** Phase 12 skipped research, VALIDATION.md, and UI-SPEC.md entirely — CONTEXT.md already locked exact wording/placement/format from discuss-phase, so research would have mostly restated known decisions. Both the plan-checker and verifier passed clean with zero rework, confirming the judgment call was right-sized to the task.
- **Pattern-mapper flagging a genuinely new sub-pattern early** (Phase 12's `tenseGrammarNames` as a novel partial-map shape with no existing analog in the codebase) let the planner write explicit, unambiguous instructions (D-08: must NOT overload `tenseLabels`) rather than leaving the executor to guess at a shape from a vague "add secondary labels" instruction.
- **Deferring a human-judgment verification item to milestone-audit time, rather than blocking phase completion on it,** kept Phase 11 moving (marked `human_needed`, not blocked) while still surfacing the WCAG contrast question for an explicit accept/reject decision before the milestone shipped — the audit step is exactly the right checkpoint for this kind of design-value call, not phase-verify.
- **Integration checker catching a real but non-blocking wiring nuance** (LABEL-02's grammar-name text not using `colors.textSecondary`/`typography.caption` despite the milestone brief expecting that reuse) surfaced a documentation/expectation mismatch worth logging as tech debt, without incorrectly treating an explicit implementer-discretion decision (D-07 in `12-CONTEXT.md`) as a defect.

### What Was Inefficient
- Running `npm run lint` during the integration-check step auto-scaffolded ESLint config (`eslint`/`eslint-config-expo` + `eslint.config.js`) as an unplanned side effect — this was flagged as carried-over tech debt since v0.0 ("ESLint not installed"), so it was a welcome resolution, but it landed as a surprise mid-audit rather than a deliberate phase task, and needed a separate confirm-and-commit step to avoid silently bundling it into the milestone-audit commit.
- Phase 11's `11-HUMAN-UAT.md` sat in `status: partial` / `result: pending` through phase-verify and into milestone-audit — the human-verification loop for on-device checks isn't yet wired to prompt automatically at a natural checkpoint (e.g., right after the user confirms they've seen the build running), so it required an explicit question during `/gsd:complete-milestone` to close out rather than being resolved earlier in the flow.

### Patterns Established
- **Small, well-scoped display/copy-only phases can legitimately skip research, VALIDATION.md, and UI-SPEC.md** when CONTEXT.md from discuss-phase already locks exact wording, placement, and format — treat this as a deliberate scope call to make explicit (and log in Key Decisions), not silently skip.
- **Milestone audit is the right checkpoint for open human-judgment items from phase verification**, not phase completion itself — a phase can legitimately ship as `human_needed` and get its open item resolved (accept/reject/follow-up) explicitly at the next milestone boundary rather than blocking on it mid-phase.

### Key Lessons
1. When a phase's CONTEXT.md already locks exact copy/wording/placement from discuss-phase, treat research/VALIDATION.md/UI-SPEC.md as optional rather than default — ask explicitly rather than defaulting to always-run, and log the skip decision in Key Decisions so it's traceable later.
2. A `human_needed` VERIFICATION.md status is not a blocker — it's a deferred decision. Surface it explicitly at milestone-audit time with the original evidence (contrast ratios, code-review findings) rather than re-deriving it, and record the resolution in both the phase's HUMAN-UAT.md and VERIFICATION.md so the audit trail is complete.
3. Side effects from diagnostic commands run during an audit (e.g., `npm run lint` auto-scaffolding config) should be surfaced and confirmed with the user before committing, even when they resolve pre-existing tech debt — don't silently fold unplanned dependency/config changes into an audit or archive commit.

### Cost Observations
- Model mix: opus for planning (`gsd-planner`), sonnet for research-skip decisions, pattern-mapping, plan-checking, execution, verification, and integration-checking across both phases.
- Sessions: ~3 (Phase 11 plan+execute, Phase 12 plan+execute as a separate `/gsd:plan-phase`+`/gsd:execute-phase` cycle, then a milestone-audit + complete-milestone session)
- Notable: Phase 12 (1 plan, 3 tasks, 3 files) was the smallest phase of any v0.2/v0.1/v0.0 phase by scope and shipped with zero deviations and zero rework — the smallest phase yet was also one of the cleanest executions, likely because CONTEXT.md's decisions were unusually exhaustive (D-01 through D-10) relative to the phase's actual size.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v0.0 | ~2 | 6 | First milestone — bottom-up dependency-ordered roadmap (foundation phases before vertical slices), closed with a dedicated verification-only polish phase |
| v0.1 | ~2 | 5 (incl. 1 inserted gap-closure phase) | First milestone to use an inserted decimal phase (10.1) for milestone-audit-driven gap closure, and the first to require on-device physical-hardware verification with fresh Apple developer signing setup |
| v0.2 | ~3 | 2 | First milestone to deliberately skip research/VALIDATION.md/UI-SPEC.md on well-scoped phases, and first to resolve an open `human_needed` verification item at milestone-audit time rather than mid-phase |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v0.0 | 122 | Not measured via coverage tool this milestone | 0 (native `fetch`/`Share` used instead of axios/expo-sharing/react-native-share by design) |
| v0.1 | 150 | Not measured via coverage tool this milestone | 0 (no new npm packages added across all 5 phases, including Phase 10.1) |
| v0.2 | 155 | Not measured via coverage tool this milestone | 1 (eslint/eslint-config-expo — resolves carried-over v0.0 tech debt, auto-scaffolded during milestone audit, confirmed with user before committing) |

### Top Lessons (Verified Across Milestones)

1. Grep before asking — verify whether a field/flag is functionally load-bearing before presenting a user-facing decision about it.
2. Verification-only phases at milestone end are worth budgeting for when the app has hand-authored content or environment-dependent behavior automated tests can't reach.
3. On-device network-fallback testing needs a Release/standalone build, not a Debug dev-client — the dev-client's own Metro dependency can make the wrong thing get tested.
4. Milestone-audit-driven gap closure works best as a properly-planned inserted decimal phase (discuss/plan/execute/verify), with the milestone audit re-run afterward rather than trusted stale.
5. Research/VALIDATION.md/UI-SPEC.md are optional, not default, when a phase's CONTEXT.md already locks exact copy/wording/placement — ask explicitly and log the skip as a Key Decision rather than defaulting to always-run or silently skipping.
6. A `human_needed` phase-verification status is a deferred decision, not a blocker — resolve it explicitly at the next milestone-audit checkpoint with the original evidence, and record the resolution in both HUMAN-UAT.md and VERIFICATION.md.
