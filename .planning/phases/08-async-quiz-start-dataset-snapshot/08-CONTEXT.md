# Phase 8: Async Quiz Start & Dataset Snapshot - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Starting a quiz always uses whichever dataset (remote-fetched or local-fallback)
is currently resolved by Phase 7's `resolveVerbs()`, snapshotted at the moment
of start so a background refresh can never swap questions mid-session, and the
Start button never hangs waiting on network it doesn't need. Covers FETCH-04
only. This phase wires `useQuizStore.startQuiz()` to the Phase 7 resolver and
makes both call sites (Setup's Start, Results' Try Again) async-aware — it does
NOT touch exit-flow (Phase 9) or visual polish/loading-state styling (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Snapshot resolution strategy
- **D-01:** `startQuiz()` awaits the existing `resolveVerbs()` promise from
  `src/dataset/source.ts` (built in Phase 7) rather than adding a new
  synchronous "give me whatever's ready now" getter. In practice this resolves
  near-instantly after the first app load, since `prefetch()` (D-04 below)
  kicks the fetch off well before a user finishes picking tenses on Setup.
  Accepted trade-off: on a genuinely slow cold start, `startQuiz()` could wait
  up to the 90s timeout already established in Phase 7 (D-04 there) — mitigated
  by the button-level loading state in D-02, not a blocking modal or separate
  screen.

### Start button UX during resolution
- **D-02:** The Setup screen's Start button (and Results' Try Again button)
  shows a brief disabled/loading state (e.g. a "Starting…" label swap) for the
  duration of the `await`, then navigates once the session is built. This is
  the state-machine behavior only — Phase 10 owns the final visual treatment
  (spinner styling, colors, etc.), this phase just needs the button to be
  inert and give some feedback while awaiting, never a silent unresponsive tap.

### Store status enum
- **D-03:** Keep the existing 4-value `QuizStatus` (`idle | error | in-progress
  | completed`) unchanged — do NOT add a 5th "starting"/"resolving" status.
  The transient UI during snapshot resolution is owned locally by each screen's
  own loading flag (per D-02), not by the shared store's status. `status` only
  flips to `in-progress` once the session is actually built (mirrors today's
  synchronous behavior, just after an await). Keeps Phase 9's exit-flow state
  machine work simpler — no new status value for it to account for.

### Prefetch trigger location
- **D-04:** Call `prefetch()` (from `src/dataset/source.ts`, built in Phase 7)
  once in `app/_layout.tsx` — the root layout, the earliest point every screen
  mounts through. Matches Phase 7's own D-03 suggestion ("prefetch on app
  load, e.g. root layout mount") exactly. No new file needed; this phase adds
  the actual call site Phase 7 deliberately left unwired.

### Claude's Discretion
- Exact mechanism for the button-level loading flag (local `useState` in each
  screen vs. a shared hook) is an implementation detail — Claude decides during
  planning, as long as both `app/index.tsx`'s Start and `app/results.tsx`'s
  Try Again show equivalent inert/loading behavior during the await.
- Whether `prefetch()` is called via a root-layout `useEffect` or a module-level
  side effect in `app/_layout.tsx` is Claude's call, provided it fires once,
  as early as possible, and doesn't block the initial render.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 7 (dependency — read first)
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-CONTEXT.md` —
  D-03 (prefetch-on-load intent this phase fulfills), D-04 (90s timeout
  behavior `startQuiz()` inherits by awaiting `resolveVerbs()`), D-05
  (fetch-once memoization — `resolveVerbs()` is safe to call from multiple
  `startQuiz()` invocations, always returns the same cached result)
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-01-SUMMARY.md` —
  `resolveVerbs()`/`prefetch()` exact behavior as built
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-02-SUMMARY.md` —
  `generate()`'s widened signature (`verbs` param) this phase's snapshot feeds into
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-PATTERNS.md` —
  file/pattern conventions established in Phase 7, follow for consistency

### Research (v0.1 milestone)
- `.planning/research/ARCHITECTURE.md` — integration points and build-order
  rationale for the fetch/snapshot pipeline across Phases 7-8
- `.planning/research/PITFALLS.md` — Pitfall 1 (engine data-seam refactor,
  already resolved in Phase 7) and any async-race pitfalls relevant to Phase 8

### Requirements
- `.planning/REQUIREMENTS.md` — FETCH-04 (this phase's sole requirement)
- `.planning/ROADMAP.md` §"Phase 8: Async Quiz Start & Dataset Snapshot" — the
  4 success criteria (playable quiz regardless of backend reachability,
  in-progress quiz never changes on background refresh, Start never hangs
  unnecessarily, both Setup and Results await the async start correctly)

### Existing code (read before touching)
- `src/store/useQuizStore.ts` — `startQuiz()` (currently synchronous, calls
  `generate(options)` directly) — the exact function to make async
- `app/index.tsx` — `handleStartQuiz()` (currently sync: calls `startQuiz()`
  then immediately reads `useQuizStore.getState().status` synchronously —
  this read-after-call pattern breaks once `startQuiz` is async and MUST be
  awaited)
- `app/results.tsx` — `handleTryAgain()` — identical sync pattern, same fix needed
- `app/_layout.tsx` — root layout, currently just renders `<Stack>` with no
  side effects — where `prefetch()` gets added (D-04)
- `src/dataset/source.ts` — `resolveVerbs()`/`prefetch()` from Phase 7, used
  as-is, no changes needed to this file
- `src/quiz/engine.ts` — `generate(options, random, verbs)` from Phase 7 —
  this phase's resolved snapshot becomes the `verbs` argument

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/dataset/source.ts`'s `resolveVerbs()` — already fetch-once memoized
  (Phase 7, D-05) and never rejects (Phase 7, D-06's catch-all) — safe to
  `await` directly in `startQuiz()` with no new error handling for the
  network path itself.
- `src/quiz/engine.ts`'s `generate(options, random, verbs)` — the injection
  seam Phase 7 built; this phase's snapshot maps directly onto the `verbs`
  parameter.

### Established Patterns
- `InsufficientVerbsError` handling in `useQuizStore.startQuiz()`'s try/catch
  — this pattern stays, just moves inside the now-async function; unaffected
  by which dataset source was used.
- Both `app/index.tsx` and `app/results.tsx` currently call `startQuiz(...)`
  then synchronously call `useQuizStore.getState().status` on the next line
  to decide navigation — this exact two-line pattern is duplicated in both
  files and both need the same fix (await, then check status).

### Integration Points
- `app/_layout.tsx` is the single mount point for `prefetch()` — it wraps
  every screen via `<Stack>`, so a `useEffect(() => prefetch(), [])` there
  fires once per app session, before any screen-level `startQuiz()` call
  could plausibly happen.

</code_context>

<specifics>
## Specific Ideas

No new user-visible surface beyond the Start/Try Again buttons' brief loading
state (state machine only, not final visuals — Phase 10 owns styling). No UI
mockups needed; behavior is fully specified by D-01 through D-04.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 8-Async Quiz Start & Dataset Snapshot*
*Context gathered: 2026-07-14*
