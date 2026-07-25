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

## Milestone: v0.3 — Learning Quality Upgrade

**Shipped:** 2026-07-21
**Phases:** 4 (13, 14, 15, 16) | **Plans:** 8 | **Sessions:** ~1 (planning + execution + audit + completion, spread over parts of two calendar days)

### What Was Built
- A 3-way `VerbMode` union (`regular_only`/`mixed`/`irregular_only`) replacing the boolean `includeIrregular` toggle outright — filters both the quiz-question pool and the distractor pool from a single source of truth
- A 3-tier pedagogical distractor strategy (same-verb wrong-subject → same-verb wrong-tense with Completed-past/Imperfect-past priority → cross-verb same-conjugation-class fallback), still guaranteeing exactly 4 unique choices / 1 correct answer
- A new `src/learning/` domain module: Zod-validated parsing of the backend's optional `learning`/`formIndex` content, plus a pure `selectExplanation` function resolving a wrong answer's exact `{tense, subject}` slot to a backend-authored template string
- A new `ExplanationPanel` component wired into the Quiz screen between the answer choices and the Next button, fail-closed (no panel, no crash) whenever content is unavailable
- Two pre-existing wiring bugs found and fixed along the way (not part of the original scope): `useQuizStore` was silently discarding `resolveVerbs()`'s `learning` field, and `quiz.tsx`'s `currentVerb` lookup read from the bundled local dataset instead of the session's resolved/fetched snapshot — meaning `formIndex` was never available even on a successful remote fetch until Phase 16 fixed both

### What Worked
- **Spawning the plan-checker with a concrete, one-line-fixable blocker** (a YAML `depends_on` ID format mismatch) let the orchestrator patch it directly rather than re-spawning the planner — cheaper than a full revision-loop iteration for a mechanical fix, and the same applied to closing 4 metadata-only warnings (RESEARCH.md heading format, VALIDATION.md/UI-SPEC.md sign-off checkboxes).
- **Reading the actual live backend response directly** (`curl` + a small Node parse script), rather than trusting `learning`/`formIndex` presence from CONTEXT.md's prior-session notes, caught a real problem fast: the deployed Render instance was stale and hadn't picked up the backend repo's own already-shipped v0.3 code. This was diagnosed and confirmed within minutes once the human-verify checkpoint showed no panel appearing, rather than being misdiagnosed as a mobile-side bug.
- **Worktree-isolated executor agents caught their own merge gaps.** Both Phase 16 plans' worktrees had been forked before their dependencies (Phase 15's `src/learning/` module, Plan 16-01's store fields) landed on `main`; each executor detected this via a failing `typecheck`/`test` run and self-corrected by merging `main` into its own worktree branch before continuing — the orchestrator never had to intervene mid-execution.
- **The "not seeing it" debugging loop resolved in two clean diagnostic passes**, not guesswork: first confirming the live backend genuinely lacked `learning`/`formIndex` (a cross-repo deploy gap the user then fixed independently), then — after the user still didn't see it — confirming the wave-2 worktree's code had simply never been merged into the `main` checkout the user was running from. Each diagnosis was made by direct inspection (curl'ing the live endpoint; `git log`/`grep` on the running checkout) rather than assumption.
- **Unrelated native-tooling failures (Expo Go incompatibility, CocoaPods stale-podspec-cache errors, a USB device-pairing red herring) were each diagnosed from their actual error output** rather than treated as blockers requiring a workflow pause — `pod install`'s "changed dependency version" message pointed straight at deleting `ios/Pods`/`Podfile.lock` and reinstalling; `xcrun devicectl` (not the stale `xctrace` listing) confirmed the physical device was actually connected.

### What Was Inefficient
- The physical-device verification path for Phase 16's checkpoint took several back-and-forth turns before landing: Expo Go incompatibility → simulator-only `npm run ios` → USB device offline in `xctrace` (but not in `devicectl`) → CocoaPods stale-podspec-cache failure after switching to `expo run:ios --device`. None of this was specific to the plan's own code, but it consumed real wall-clock time before the actual MODE-01/EXPL-02/03/04 checks could run — this is the same class of "generic Expo/Xcode/device friction" flagged in v0.1's retrospective, still recurring.
- `REQUIREMENTS.md`'s traceability table and checkboxes drifted stale for 6 of 14 requirements (MODE-02/03, TEST-03, EXPL-01, TEST-05, plus MODE-01 legitimately pending) despite their phases' own VERIFICATION.md files marking them SATISFIED — caught only during the milestone audit's 3-source cross-reference, not incrementally as each phase closed. This is the same "requirements doc-sync" gap noted informally in earlier milestones' audits, now confirmed as a recurring pattern rather than a one-off.
- Two SUMMARY.md one-liner extractions during `/gsd:complete-milestone` (Phase 15's two plans, Phase 16's plan 02) returned `null` or a garbled deviations-log fragment instead of the actual one-liner — required manually reading the SUMMARY.md files and writing MILESTONES.md's accomplishments by hand rather than trusting the automated extraction, the same failure mode flagged in v0.0's retrospective.

### Patterns Established
- **When a human-verify checkpoint reports unexpected behavior ("I don't see it"), diagnose by direct inspection before assuming the plan's code is wrong** — check the live external dependency first (curl the actual endpoint), then check whether the code under test is actually the code the user is running (worktree vs. `main`, stale build, wrong branch) before re-opening the plan itself.
- **Worktree-isolated executors that hard-depend on another in-flight plan's output should expect to self-heal via a `main`-merge-into-worktree** when dispatched before the dependency lands — this is now observed twice (Phase 16-01 and 16-02 both did it independently) and should be treated as expected executor behavior, not a deviation to flag as risky.
- **Requirements-doc staleness is now a confirmed recurring pattern, not incidental** — worth treating `REQUIREMENTS.md`'s traceability table as needing an explicit sync check at every phase close, not just at milestone-audit time.

### Key Lessons
1. When on-device verification shows nothing where something is expected, check the live external dependency (API response shape) before assuming the plan's mobile-side code is broken — a `curl` + small parse script is often faster than re-reading the diff.
2. Also confirm the code under test is actually merged into the checkout the human is running — an unmerged worktree branch produces the exact same symptom ("I don't see it") as a genuine code bug, and is easy to rule out first with `git log`/`grep` on the running directory.
3. Physical-device build friction (Expo Go SDK incompatibility, CocoaPods podspec-cache drift, USB pairing/`xctrace` staleness vs. `devicectl`) is now a 3-milestone-recurring cost class (v0.1, and now v0.3) — worth a short standing runbook so future sessions recognize the error signatures immediately rather than re-diagnosing from scratch each time.
4. Requirements-doc sync (checkboxes + traceability table) should be checked at each phase's own close, not deferred entirely to milestone-audit — 6 of 14 v0.3 requirements needed correction in the same audit pass, a pattern also seen (in smaller form) in prior milestones.

### Cost Observations
- Model mix: opus for planning (`gsd-planner`), sonnet for research, pattern-mapping, plan-checking, execution (worktree-isolated), phase verification, integration-checking, and milestone audit.
- Sessions: ~1 continuous session spanning plan-phase 16 → execute-phase 16 → audit-milestone v0.3 → complete-milestone v0.3, with real-world interruptions for on-device debugging (backend redeploy, worktree merge, physical-device build troubleshooting) handled inline rather than requiring separate sessions.
- Notable: this was the fastest milestone from kickoff to ship (~1 day, 2026-07-20 → 2026-07-21) despite being tied for the most phases (4) of any milestone so far — the two debugging detours (backend staleness, unmerged worktree) were resolved in minutes each once diagnosed correctly, not multi-turn investigations.

---

## Milestone: v0.4 — Backend v0.4 Contract Sync + Product Feedback

**Shipped:** 2026-07-22
**Phases:** 3 (17, 18, 19) | **Plans:** 7 | **Sessions:** ~2 (execute-phase 19 → audit-milestone → complete-milestone, following a prior planning session)

### What Was Built
- A byte-for-byte copied backend v0.4 sample fixture (`__tests__/fixtures/content-verbs-v0.4.sample.json`) proving mobile's existing `validateDataset`/`LearningContentSchema`/`fetchRemoteVerbs` all accept the real contract shape, with zero cross-repo coupling at test time
- `selectExplanation` extended to interpolate the selected (wrong) answer's tense/subject labels (`matches[0]`-derived, omitted on tied-disagree) and append backend-authored `tenseNotes`/`subjectHints` as separate lines — zero signature change, fail-closed contract fully preserved
- A new `src/productFeedback/` domain module — a deliberate zero-shared-code structural mirror of `src/feedback/` (schema, categories, payload, submit, `ProductFeedbackModal`) — wired into all 3 screens as a "Help us improve" entry point, structurally independent of the existing quiz-answer "Report a problem" flow
- A real cross-repo contract gap caught live: the backend's `POST /product-feedback` route wasn't deployed yet at the first on-device check (404), diagnosed via direct `curl`, resolved by the user shipping the backend route mid-checkpoint, then re-verified (201) by both the human operator and an independent `gsd-verifier` live-curl check during phase verification

### What Worked
- **Parallel worktree dispatch for independent-file plans (19-03, 19-04) caught its own dependency gap without orchestrator intervention** — both worktrees had forked before Wave 2's `ProductFeedbackModal.tsx` landed on `main`; each executor detected the missing dependency via its own read/typecheck step and self-corrected with a fast-forward merge of `main` before implementing, the same self-healing pattern first seen in v0.3's Phase 16.
- **Diagnosing the Phase 19 human-verify "something went wrong" report by direct `curl` against the live backend**, rather than assuming a mobile-side bug, took one command to produce a conclusive 404 and matched a risk the phase's own threat model (T-19-09) had already flagged in advance — the fastest of any milestone's "unexpected behavior" diagnosis so far, because the threat was pre-registered rather than discovered cold.
- **Independent re-verification of a user-reported fix** (gsd-verifier re-curling `POST /product-feedback` itself during phase verification, rather than trusting the SUMMARY's narrative that the backend now worked) caught nothing new here, but is the right standing practice for any cross-repo claim resolved outside the mobile repo's own test suite.
- **Milestone audit found and fixed a doc-sync gap on the first read**, not via a separate audit-then-fix cycle: CONTRACT-01/02/03 were still `[ ]`/"Pending" in REQUIREMENTS.md despite Phase 17's VERIFICATION.md and SUMMARY.md frontmatter both confirming completion — same class of gap already caught and fixed for PFDBK-01..05/TEST-07 right after Phase 19 executed, now recognized quickly enough to fix inline rather than needing a second pass.

### What Was Inefficient
- The requirements-doc-sync gap (CONTRACT-01/02/03 unchecked despite passed verification) is the fourth consecutive milestone to surface this exact pattern (v0.1's FETCH-05, v0.3's 6-of-14 stale requirements, now v0.4's 3-of-14) — it is caught every time by audit/verification, but never prevented at the phase-close step itself, despite being flagged as a known recurring pattern since v0.3's retrospective.
- Phases 17/18/19's `VALIDATION.md` files were never updated post-execution (all task rows still "⬜ pending", sign-off checklists unchecked) despite each phase's independent VERIFICATION.md confirming all tests passed — this is a new instance of a gap Phase 15 (v0.3) already exhibited once, now confirmed across 3 consecutive phases in the same milestone, suggesting the VALIDATION.md-update step is missing from the executor's own close-out checklist rather than being an isolated oversight.

### Patterns Established
- **A phase's own threat model (STRIDE register) is a legitimate pre-registered hypothesis for human-verify diagnosis** — when a checkpoint reports unexpected behavior, check the phase's own threat register first for a matching entry before diagnosing from scratch; Phase 19's T-19-09 named the exact failure mode that occurred, cutting diagnosis to a single `curl` call.
- **Independent live-endpoint re-verification during milestone/phase audit** (not just trusting a human-reported "it works now") is now a repeatable, cheap check (one `curl` call) worth doing any time a cross-repo blocker was resolved mid-session — confirms the fix rather than the report of the fix.

### Key Lessons
1. When a phase ships with a threat model / STRIDE register, check it first during human-verify diagnosis — a pre-registered risk (like T-19-09's contract-mismatch entry) often names the exact failure mode, turning a diagnosis into a single confirming command instead of an investigation.
2. Requirements-doc staleness (checkboxes/traceability table lagging behind actual VERIFICATION.md/SUMMARY.md completion) has now recurred in 4 of 5 milestones (v0.1, v0.3, v0.4, and implicitly others) — this is a structural gap in the phase-close step, not an occasional slip; a future session should consider adding an explicit REQUIREMENTS.md sync check to the phase-completion tracking-update step itself, not leave it to audit time.
3. `VALIDATION.md` staleness (task rows never flipped from "pending" post-execution) is now observed across 4 phases total (15 in v0.3, 17/18/19 in v0.4) — same root cause as lesson 2: the executor's close-out checklist doesn't currently include a VALIDATION.md sync step.
4. When a cross-repo blocker is resolved mid-session based on a user report ("I pushed the backend, it works now"), have a verifier independently re-check the live system before accepting the report at face value — cheap insurance, and it corroborated rather than merely trusted the fix here.

### Cost Observations
- Model mix: sonnet for all execution/verification/integration-checking this milestone (worktree-isolated parallel dispatch for Wave 3's two independent-file plans).
- Sessions: ~2 (execute-phase 19 through to milestone completion, following an earlier planning session for phases 17-19)
- Notable: Phase 19 (5 plans) was the largest single phase of this milestone and the only one requiring a non-autonomous human-verify checkpoint; it was also the only phase to surface a genuine cross-repo blocker, resolved within the same session rather than deferred — the fastest cross-repo-blocker resolution of any milestone so far (single `curl` diagnosis → user pushes fix → single re-verify), likely because the phase's own threat model had already named the exact risk in advance.

---

## Milestone: v0.5 — iOS TestFlight Readiness

**Shipped:** 2026-07-25
**Phases:** 5 (20, 21, 22, 23, 24) | **Plans:** 11 | **Sessions:** ~3 (execute-phase 24 spanning multiple operator checkpoints → audit-milestone → complete-milestone, following a prior planning session)

### What Was Built
- Native dependency graph proven to build on EAS's cloud infrastructure — the app's first-ever real native build — surfacing and fixing a real npm-version lockfile mismatch (Node 25/npm 11 local vs. Node 22/npm 10 EAS build image) along the way
- Release identity locked (`bundleIdentifier`, `slug`/`scheme`, `buildNumber`) before any real build, deliberately accepting a known EAS project slug/local-slug mismatch (IDENT-04) as carried-forward, documented risk rather than blocking Phase 21 on it
- Lafa-branded 1024x1024 alpha-free app icon and splash mark generated via a reproducible `@resvg/resvg-js`+`sharp` pipeline (`scripts/generate-brand-assets.ts`), with two real rendering bugs found and fixed mid-phase (solid-crescent swoop fill, false-alpha PNG encoding)
- `eas.json` build/submit profiles declared, export-compliance set proactively
- Both known `react-hooks/set-state-in-effect` lint errors fixed via a render-time reset pattern — deviated from the plan's literal `useRef` to `useState` mid-execution because this project's React Compiler (`experiments.reactCompiler: true`) forbids ref reads/writes during render
- A reusable, checked-in live-backend preflight script (`scripts/preflight.ts`) verified all 4 mobile-facing endpoints both warm and genuinely cold (>15 min idle)
- The first real signed production iOS build — surviving two genuine blocking bugs discovered live during the human checkpoint (the IDENT-04 slug mismatch, and the npm-version lockfile drift recurring a second time) — submitted via an App Store Connect API Key (the current `eas-cli` version has no interactive Apple ID/password submit path at all, a version-driven surprise) and confirmed installed/launched by an internal TestFlight tester

### What Worked
- **Executing an entirely human-checkpoint phase (24-03) conversationally, one task at a time, worked well for a release-engineering milestone** — no subagent was appropriate for waiting on a >15min cold-instance window or interactive Apple ID/API-key auth, so the orchestrator walked the operator through each of the 3 tasks directly, catching and fixing 2 real blocking bugs live rather than deferring them to a "known issue."
- **Presenting a two-option AskUserQuestion at each blocking discovery** (revert slug vs. new EAS project; regenerate lockfile; skip vs. proceed with external testers; backfill vs. accept tech debt) kept the operator in control of every consequential, hard-to-reverse decision without slowing down the actual fix — the same pattern used successfully for architecture-adjacent gray-area calls in prior milestones, now proven for release-ops decisions too.
- **A phase's own prior carried-forward finding (IDENT-04, flagged by Phase 21, closed with "no dashboard fix exists" evidence) predicted the exact failure Phase 24 hit** — when the blocker actually occurred, the fix was already partially scoped by that earlier investigation, cutting diagnosis time to near zero.
- **Retroactively backfilling two phases' VERIFICATION.md files during milestone audit, using evidence already gathered in that same audit session, closed a `gaps_found` audit status to `passed` in the same session** rather than deferring to a separate gap-closure phase — appropriate because the underlying evidence (live re-checks, `git log` cross-referencing) was already collected, not fabricated after the fact.

### What Was Inefficient
- **Phase 20 and Phase 22 never had a `gsd-verifier` pass run against them** — a genuine process gap, not caught until milestone audit. Both phases' actual requirements were solid (confirmed independently), but the audit had to spend real effort re-deriving evidence that a contemporaneous verification pass would have produced for free at phase-close time.
- **The npm-version lockfile mismatch (Node 25/npm 11 local vs. Node 22/npm 10 EAS build image) recurred identically in Phase 24 despite being found, fixed, and explicitly flagged as a recurrence risk in Phase 20** ("recommend adding a durable Node-version pin... so this class of drift can't silently recur") — the recommendation was written down but never acted on, and the exact same bug cost another full diagnosis-and-fix cycle 2 phases later.
- **`eas submit`'s actual auth flow (App Store Connect API Key only, no interactive Apple ID path) diverged from what the phase plan assumed (interactive Apple ID login)** — a version-drift surprise discovered live at the worst possible time (mid-submission), not during planning/research.

### Patterns Established
- **Human-checkpoint-only phases (all tasks `checkpoint:human-verify`, `autonomous: false`) are best executed conversationally by the orchestrator itself, not delegated to a subagent** — the orchestrator has the full context needed to interpret unexpected operator-reported output (build errors, CLI auth prompts) and route to a fix inline, whereas a subagent would need to re-derive that context or halt.
- **When a live tool's behavior diverges from what the plan assumed (a missing auth method, a changed CLI flow), treat it as a version-drift finding to resolve in the moment, not a plan defect to blame** — same disposition already established for build-error handling in v0.5's Phase 20 CONTEXT.md, now confirmed at the milestone-audit level too.
- **Retroactive VERIFICATION.md backfill is a legitimate closure path for a `gaps_found` audit** when the underlying evidence is independently re-derivable from live repo state (not just trusting old SUMMARY claims) — mark it `retroactive: true` in frontmatter for honest traceability rather than backdating it to look contemporaneous.

### Key Lessons
1. A tooling-version mismatch found and fixed once (Phase 20's lockfile drift) will recur if the fix isn't made durable (a pinned `.nvmrc`/CI Node-version guard) — "we already diagnosed this" is not the same as "this can't happen again." Carried forward explicitly into v0.5's PROJECT.md Out of Scope as a strong candidate for the next milestone, not left as a passive footnote.
2. Every phase should get a `gsd-verifier` pass at phase-close time, even release-engineering phases with no application code — skipping it (Phase 20, 22) doesn't remove the need for verification, it just moves the cost to milestone-audit time and creates a `gaps_found` status that requires explicit user sign-off to resolve.
3. When a plan assumes a specific external tool's auth/UX flow (interactive Apple ID login, a specific CLI prompt sequence), that assumption is a research artifact with a shelf life — CLI tools change between planning and execution, and the plan's own literal steps should be treated as a starting hypothesis to verify live, not a guaranteed script.
4. Carrying forward a known-but-unresolved finding (IDENT-04) with a clear "handed to Phase X with two concrete resolution options" disposition, rather than either force-resolving it prematurely or silently ignoring it, paid off directly — when the blocker actually materialized, the fix was already half-scoped.

### Cost Observations
- Model mix: sonnet for all execution/verification/integration-checking this milestone (2 parallel worktree-isolated executors for Wave 1, conversational human-checkpoint execution for Wave 2/Phase 24-03).
- Sessions: ~3 (execute-phase 24 spanning the operator's real-world >15min idle wait and interactive EAS auth, then a separate audit-milestone session, then complete-milestone), following an earlier planning session for phases 20-24.
- Notable: this was the first milestone with zero new application/product code — 100% of the diff was release config, two lint-pattern fixes, and two new standalone scripts. Despite that, it required the most real-world/external-system interaction of any milestone so far (EAS cloud builds, Apple ID/API-key auth, App Store Connect UI, TestFlight installs) — a different risk profile than prior product milestones, dominated by tooling/environment drift rather than application logic bugs.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v0.0 | ~2 | 6 | First milestone — bottom-up dependency-ordered roadmap (foundation phases before vertical slices), closed with a dedicated verification-only polish phase |
| v0.1 | ~2 | 5 (incl. 1 inserted gap-closure phase) | First milestone to use an inserted decimal phase (10.1) for milestone-audit-driven gap closure, and the first to require on-device physical-hardware verification with fresh Apple developer signing setup |
| v0.2 | ~3 | 2 | First milestone to deliberately skip research/VALIDATION.md/UI-SPEC.md on well-scoped phases, and first to resolve an open `human_needed` verification item at milestone-audit time rather than mid-phase |
| v0.3 | ~1 | 4 | Fastest milestone yet (~1 day); first to have executor agents self-heal a worktree-vs-main dependency gap independently, and first where a human-verify "not seeing it" report was correctly diagnosed as an external (backend deploy) then internal (unmerged worktree) issue rather than the plan's own code |
| v0.4 | ~2 | 3 | First milestone where a phase's own pre-registered threat model (STRIDE register) directly named the exact human-verify failure mode that occurred, cutting a cross-repo-blocker diagnosis to a single `curl` call; requirements-doc-sync staleness recurred for the 4th consecutive milestone |
| v0.5 | ~3 | 5 | First pure release-engineering milestone (zero new product code); first to have an entire phase (24-03) run conversationally as human-only checkpoints rather than any subagent dispatch; first to retroactively backfill VERIFICATION.md files during milestone audit to close a `gaps_found` status; a tooling-version bug (npm lockfile drift) recurred despite being explicitly flagged as a recurrence risk when first fixed |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v0.0 | 122 | Not measured via coverage tool this milestone | 0 (native `fetch`/`Share` used instead of axios/expo-sharing/react-native-share by design) |
| v0.1 | 150 | Not measured via coverage tool this milestone | 0 (no new npm packages added across all 5 phases, including Phase 10.1) |
| v0.2 | 155 | Not measured via coverage tool this milestone | 1 (eslint/eslint-config-expo — resolves carried-over v0.0 tech debt, auto-scaffolded during milestone audit, confirmed with user before committing) |
| v0.3 | 192 | Not measured via coverage tool this milestone | 0 (new `src/learning/` module built entirely on existing Zod/TypeScript stack, no new npm packages) |
| v0.4 | 251 | Not measured via coverage tool this milestone | 0 (new `src/productFeedback/` module built entirely on existing Zod/TypeScript stack, no new npm packages) |
| v0.5 | 251 | Not measured via coverage tool this milestone | 2 devDependencies (`@resvg/resvg-js`, `sharp` for the icon pipeline) + `eas-cli` pinned as a devDependency (deliberate tradeoff, D-04) — zero application-code dependency changes, release-engineering only |

### Top Lessons (Verified Across Milestones)

1. Grep before asking — verify whether a field/flag is functionally load-bearing before presenting a user-facing decision about it.
2. Verification-only phases at milestone end are worth budgeting for when the app has hand-authored content or environment-dependent behavior automated tests can't reach.
3. On-device network-fallback testing needs a Release/standalone build, not a Debug dev-client — the dev-client's own Metro dependency can make the wrong thing get tested.
4. Milestone-audit-driven gap closure works best as a properly-planned inserted decimal phase (discuss/plan/execute/verify), with the milestone audit re-run afterward rather than trusted stale.
5. Research/VALIDATION.md/UI-SPEC.md are optional, not default, when a phase's CONTEXT.md already locks exact copy/wording/placement — ask explicitly and log the skip as a Key Decision rather than defaulting to always-run or silently skipping.
6. A `human_needed` phase-verification status is a deferred decision, not a blocker — resolve it explicitly at the next milestone-audit checkpoint with the original evidence, and record the resolution in both HUMAN-UAT.md and VERIFICATION.md.
7. When a human-verify checkpoint reports unexpected behavior, diagnose the live external dependency and whether the code under test is actually merged/running before assuming the plan's own code is broken — both are faster to rule out than re-reading the diff. Check the phase's own threat model/STRIDE register first — a pre-registered risk often names the exact failure mode (confirmed in v0.4).
8. Physical-device build friction (Expo Go incompatibility, CocoaPods podspec-cache drift, stale device-pairing tools) is a recurring, generic cost class across milestones (v0.1, v0.3) — worth a standing runbook rather than re-diagnosing each time.
9. Requirements-doc sync (checkboxes + traceability table) drifts stale incrementally across phases, not just at milestone end — now confirmed in 4 of 5 milestones (v0.1, v0.3, v0.4, and smaller instances elsewhere). This is a structural gap in the phase-close step itself, not an occasional slip — worth an explicit fix at the phase-completion tracking-update step, not left to audit/milestone-close time.
10. `VALIDATION.md` task-status staleness (rows never flipped from "pending" post-execution) is a related but distinct recurring gap, now seen across 4 phases (15 in v0.3; 17, 18, 19 in v0.4) — likely missing from the executor's own close-out checklist.
11. Independent re-verification of a user-reported cross-repo fix (e.g., re-`curl`ing a live endpoint during phase/milestone audit rather than trusting "it works now") is cheap insurance worth doing every time, even when it only corroborates rather than catches something new.
12. A tooling/environment bug fixed once but not made durable (e.g., a lockfile-vs-build-image npm version mismatch fixed manually without a pinned `.nvmrc`/CI guard) will recur — writing "recommend adding X for a future phase" in a SUMMARY is not the same as it actually happening; track it as an explicit Out of Scope/backlog item with an owner, not a passive footnote (confirmed in v0.5, where the exact same lockfile bug cost two separate diagnosis-and-fix cycles).
13. Skipping a phase's formal `gsd-verifier` pass at close time (even for release-engineering phases with no application code) doesn't remove the need for verification — it just relocates the cost to milestone-audit time, where a `gaps_found` status requires explicit user sign-off to resolve even when the underlying work is solid (confirmed in v0.5, Phases 20/22).
