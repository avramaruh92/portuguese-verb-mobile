---
phase: 08
phase_name: "async-quiz-start-dataset-snapshot"
project: "Portuguese Verb Conjugation App — Mobile"
generated: "2026-07-14"
counts:
  decisions: 4
  lessons: 3
  patterns: 3
  surprises: 2
missing_artifacts:
  - "08-UAT.md"
---

# Phase 8 Learnings: Async Quiz Start & Dataset Snapshot

## Decisions

### startQuiz awaits the existing resolveVerbs() rather than adding a synchronous getter
`useQuizStore.startQuiz()` was made `async` specifically to `await` Phase 7's memoized `resolveVerbs()` promise, instead of adding a new synchronous "give me whatever's ready now" accessor.

**Rationale:** `prefetch()` (fired at root-layout mount) kicks the fetch off well before a user finishes picking tenses on Setup, so the await resolves near-instantly in practice. The accepted trade-off — a genuinely slow cold start could wait up to Phase 7's 90s timeout — is mitigated at the UI layer (button loading state), not by adding a second dataset-access code path.
**Source:** 08-CONTEXT.md (D-01), 08-01-PLAN.md, 08-01-SUMMARY.md

### No new QuizStatus value added for the transient "starting" state
The existing 4-value `QuizStatus` enum (`idle | error | in-progress | completed`) was kept unchanged. The loading/disabled UI during snapshot resolution is owned locally by each screen's own boolean flag, not by the shared store.

**Rationale:** Keeps Phase 9's exit-flow state machine work simpler — it has one fewer status value to account for. `status` only flips to `in-progress` once the session is actually built, mirroring the pre-existing synchronous behavior just after an await.
**Source:** 08-CONTEXT.md (D-03), 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-VERIFICATION.md

### prefetch() called fire-and-forget in root layout, not awaited
`app/_layout.tsx` fires `prefetch()` via `useEffect(() => { prefetch(); }, [])` — no await, no loading gate on initial render.

**Rationale:** Matches Phase 7's own suggested intent (prefetch on app load) and ensures the root layout mount is never blocked by network. `resolveVerbs()`'s internal fetch-once memoization (Phase 7 D-05) means this is the single trigger point for dataset resolution across the whole app session.
**Source:** 08-CONTEXT.md (D-04), 08-02-SUMMARY.md, 08-VERIFICATION.md

### Dataset snapshot passed as an explicit 3rd argument to a pure generate() function
Rather than having `generate()` re-read a live/mutable dataset reference, `startQuiz()` resolves `resolveVerbs()` once and passes the resulting array directly into `generate(options, undefined, verbs)`.

**Rationale:** This is what makes the snapshot immune to a background dataset refresh completing mid-quiz — `generate()` is a pure function operating on a value it was handed, not a reference it could re-read later. Verified by two dedicated snapshot-isolation tests.
**Source:** 08-01-PLAN.md, 08-01-SUMMARY.md, 08-VERIFICATION.md

---

## Lessons

### GSD's decision-coverage gate requires literal `D-NN` citations in must_haves/truths/objective — not just in task action prose
The plan-checker's decision-coverage gate initially failed even though the plan-checker agent itself had confirmed all 4 CONTEXT.md decisions (D-01–D-04) were correctly implemented. The gate only scans YAML `must_haves`/`truths` blocks and markdown body sections under specific headings (`must_haves`, `truths`, `tasks`, `objective`) — citations placed inside `<action>` prose in XML-style task blocks are invisible to it.

**Context:** Two rounds of editing were needed: first adding "(D-01)"/"(D-02)" citations inline in task `<action>` text (didn't register), then moving them into the frontmatter `must_haves.truths` array (passed immediately). Future plans should cite `D-NN` directly in the `must_haves` YAML block from the start, not just in prose.
**Source:** plan-phase session transcript (decision-coverage-plan gate output), 08-01-PLAN.md, 08-02-PLAN.md

### A code-review pass surfaced real error-handling gaps outside the phase's declared scope
CONTEXT.md scoped Phase 8 to state-machine wiring only (no visual/error-UI work), but the code reviewer found that `handleStartQuiz`/`handleTryAgain`'s `try { } finally { }` blocks (no `catch`) meant any unexpected (non-`InsufficientVerbsError`) `startQuiz` rejection would become a silent unhandled promise rejection, and `Results` would render a blank dead-end screen if `session` were falsy.

**Context:** These weren't decisions CONTEXT.md considered — they were latent bugs the plan's `try/finally` pattern introduced by omission. A dedicated code-review + fix pass (`/gsd:code-review 08 --fix`) caught and resolved them post-verification, since VERIFICATION.md's must_haves didn't test for unexpected-error paths (only the already-handled `InsufficientVerbsError` case).
**Source:** 08-REVIEW.md (CR-01, CR-02), 08-REVIEW-FIX.md

### Skipping RESEARCH.md/VALIDATION.md is viable when CONTEXT.md is already fully detailed
Research and Nyquist validation-strategy generation were both explicitly skipped for this phase (user decision) because CONTEXT.md already named exact files, functions, and behavior (D-01–D-04) with no open technical unknowns. The plan-checker still passed with no research artifacts, confirming the skip didn't degrade plan quality here.

**Context:** This works when the phase is narrowly scoped, wiring-only, and CONTEXT.md was produced with full read-before-touching file citations (as Phase 7's summaries fed directly into Phase 8's CONTEXT.md). It would likely not hold for phases with open architectural unknowns.
**Source:** plan-phase session transcript, 08-CONTEXT.md

---

## Patterns

### Dataset snapshot pattern: resolve-once, pass-as-argument, never re-read
Resolve an external async source exactly once per call site, then pass the resolved value as an explicit argument to a pure function rather than letting that function re-read a live/mutable reference later.

**When to use:** Any time a background-refreshable data source (a fetch-with-fallback resolver, a cache, a subscription) feeds a one-shot operation (like building a quiz session) that must remain stable for its own lifetime even if the source changes afterward.
**Source:** 08-01-SUMMARY.md

### Async button handler with local loading flag, mirrored from an existing analog
Guard re-entry (`if (!canStart || starting) return`), `setStarting(true)`, `await` the async call inside `try`, read resulting state only after the `await` resolves, and reset the flag in a `finally` block regardless of outcome. The concrete shape (disabled Pressable + label swap to "Starting…") was copied from `src/feedback/ReportFeedbackModal.tsx`, the only existing async-handler-with-loading-button pattern in the codebase.

**When to use:** Any button that triggers an async action where the UI must stay responsive (never silently hang) and must not allow a second concurrent trigger while the first is in flight — reuse an existing in-codebase instance of this pattern via the pattern-mapper agent rather than inventing a new shape.
**Source:** 08-02-SUMMARY.md, 08-PATTERNS.md

### Pattern-mapper agent finds a codebase-wide async+loading analog even without RESEARCH.md
With no RESEARCH.md for the phase, the `gsd-pattern-mapper` agent was still able to scan CONTEXT.md's named files and locate `ReportFeedbackModal.tsx` as the correct existing analog for the async+loading-flag button pattern, producing concrete file/line citations the planner then referenced directly.

**When to use:** For narrowly-scoped, wiring-style phases where research was skipped, the pattern-mapper step is still worth running — it substitutes for research's "existing patterns" role using only CONTEXT.md and a codebase scan.
**Source:** 08-PATTERNS.md, plan-phase session transcript

---

## Surprises

### A start-token race-condition guard wasn't in the original plan or CONTEXT.md, but the code reviewer flagged it as real
`startQuiz` had no cancellation/request-token guard against concurrent or out-of-order invocations — the only protection was the UI-level `starting` React state, which isn't guaranteed to prevent a race where an older call's resolution overwrites a newer one's state. This wasn't anticipated in discuss-phase (D-01–D-04) or caught by the phase verifier (whose must_haves didn't test concurrent-call ordering).

**Impact:** Required a follow-up fix (`WR-02`, commit `1ab3f1b`) adding a module-level `startToken` counter after the phase had already passed verification and been marked complete — a class of race-condition bug that automated must_haves-style verification doesn't naturally probe for without an explicit concurrent-invocation test.
**Source:** 08-REVIEW.md (WR-02), 08-REVIEW-FIX.md

### The `InsufficientVerbsError` branch silently left stale quiz state (currentIndex/answers/lockedChoice/filters) from a prior session
Neither the plan nor CONTEXT.md mentioned that failing to build a new session should also reset the leftover state from whatever session came before it — this was found only by the code reviewer as WR-01.

**Impact:** A user hitting "insufficient verbs" after a completed quiz would have kept stale `answers`/`currentIndex` in the store even though `session` itself was cleared — a latent inconsistency that wouldn't surface until Phase 9's exit-flow or a future feature read those stale fields directly.
**Source:** 08-REVIEW.md (WR-01), 08-REVIEW-FIX.md
