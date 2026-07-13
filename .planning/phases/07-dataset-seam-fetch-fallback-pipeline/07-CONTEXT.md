# Phase 7: Dataset Seam & Fetch/Fallback Pipeline - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

The app can source its verb dataset from the live backend (`GET /content/verbs`)
with automatic, validated, silent fallback to the bundled local dataset, and
the quiz engine no longer hardcodes which dataset it uses (`generate()`
accepts an injected verb list instead of importing `src/dataset/verbs.ts` at
module scope). Covers FETCH-01, FETCH-02, FETCH-03 only — async wiring into
`startQuiz()` and the per-session snapshot invariant belong to Phase 8, not
this phase.

</domain>

<decisions>
## Implementation Decisions

### Backend endpoint — no mock needed
- **D-01:** The real `GET /content/verbs` endpoint (portuguese-verb-api v0.1)
  is already live at `https://portuguese-verb-api.onrender.com/content/verbs`
  — build directly against it. Do NOT build a throwaway local mock/stub; the
  ROADMAP.md phase goal's "mocked/stubbed this milestone" wording is stale
  from before the backend shipped. Response shape:
  `{ verbs: [{ verb, translation, isIrregular, conjugations }] }`, sorted
  alphabetically, no auth, fails closed to `{ error: "InternalServerError" }`
  HTTP 500 on any malformed row or DB failure (never a partial/degraded 200).

### Dataset reconciliation
- **D-02:** `querer.isIrregular` in the local fallback dataset
  (`src/dataset/verbs.ts`) must be updated from `false` to `true` to match
  the now-authoritative remote dataset. This is a superseding decision over
  the earlier v0.0/v0.1 choice to keep it `false` — see
  `portuguese-verb-memory` shared/mobile decisions for full history. This
  edit is in scope for this phase (part of reconciling the local fallback
  with the real remote contract), not a separate task.

### Fetch timing & trigger
- **D-03:** Prefetch on app load (e.g. root layout mount) — kick off the
  fetch as soon as the app opens. `startQuiz()` (Phase 8) never waits on
  network; it uses whatever the resolver currently holds (remote if the
  prefetch already resolved, local otherwise). No fetch-at-quiz-start
  blocking behavior.

### Timeout & cold-start tolerance
- **D-04:** Long, cold-start-tolerant timeout — reuse the same ~90s
  `AbortController` pattern already established in `src/feedback/submit.ts`
  (manual `setTimeout` + `AbortController.abort()`, NOT `AbortSignal.timeout`
  which is unimplemented on Hermes — this is a settled v0.0 finding, do not
  rediscover it). Since the fetch is non-blocking (prefetch on load, per
  D-03), there is no UX cost to a long timeout — it only affects how long the
  background attempt keeps trying before the session commits to the local
  fallback.

### Per-session caching
- **D-05:** Fetch once per app session, reuse the resolved result (remote or
  local-fallback) for every `startQuiz()` call until the app is relaunched.
  No polling, no re-fetch on every quiz start — matches REQUIREMENTS.md's
  explicit "fetch once per app session" scope and the Out-of-Scope line
  ruling out continuous polling/websocket updates. In-memory only — no
  `AsyncStorage`/disk persistence (that's explicitly out of scope per
  REQUIREMENTS.md, a different decision from this fetch-once behavior).

### Validation
- **D-06:** Reuse the existing `VerbSchema`/`validateDataset()` from
  `src/dataset/validate.ts` to validate the fetched payload before accepting
  it — do not write a parallel schema. Since backend already fails closed
  (never returns a partial/malformed 200), mobile's validation is a defense-
  in-depth check, not the primary safety net; a schema mismatch is treated
  identically to a network failure or timeout (silent fallback, no user-
  facing error, per FETCH-03).

### Claude's Discretion
- Exact module structure (e.g. `src/dataset/remote.ts` for fetch mechanics
  vs `src/dataset/source.ts` for the fallback-resolution policy, as
  suggested in `.planning/research/ARCHITECTURE.md`) is an implementation
  detail — Claude decides file boundaries during planning.
- Whether the resolver exposes a synchronous "currently resolved dataset"
  getter plus a fire-and-forget `prefetch()` trigger, or a single async
  function memoized after first resolution, is also Claude's call — must
  satisfy D-03 (non-blocking `startQuiz()`) and D-05 (fetch-once-per-session)
  regardless of the exact API shape chosen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (this milestone, v0.1)
- `.planning/research/ARCHITECTURE.md` — exact integration points with real
  file/function names: `generate()`'s current module-scope `verbs` import,
  suggested `src/dataset/remote.ts`/`src/dataset/source.ts` split, and the
  build-order rationale (this phase is the hard prerequisite for Phases 8-10)
- `.planning/research/STACK.md` — confirms no new dependency needed; reuse
  the `submitFeedback`-style manual `AbortController` fetch pattern; mocking
  approach note is now moot since the real endpoint exists (see D-01)
- `.planning/research/PITFALLS.md` — Pitfall 1 (engine data-seam refactor is
  a hard prerequisite), Pitfall 4 (mock/schema contract-drift risk — now
  largely resolved since we're building against the real endpoint directly,
  but the Zod-validation defense-in-depth from D-06 still applies)
- `.planning/research/SUMMARY.md` — overall v0.1 synthesis and phase-build-order
  rationale

### Cross-repo contract (shared memory, portuguese-verb-memory MCP)
- Shared decision: "GET /content/verbs is live — mobile can swap from mock to
  the real endpoint" — full response shape, enum literals, and fail-closed
  behavior. Reference this via `mcp__portuguese-verb-memory__get_decisions`
  (scope: "shared") rather than re-deriving the contract from the backend
  repo's source.
- Mobile decision: "querer.isIrregular resolved to true, matching backend's
  authoritative remote dataset" — the D-02 rationale in full.

### Existing code (v0.0, shipped — read before touching)
- `src/quiz/engine.ts` — `generate()`'s current signature and module-scope
  `verbs` import (the exact seam to refactor)
- `src/dataset/types.ts` — `Verb`, `Tense`, `Subject`, `TENSES`, `SUBJECTS`
- `src/dataset/validate.ts` — `VerbSchema`, `validateDataset()` (reuse per D-06)
- `src/dataset/verbs.ts` — the local fallback dataset (edit `querer` per D-02)
- `src/feedback/submit.ts` — the manual `AbortController` timeout pattern to
  mirror (per D-04)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/dataset/validate.ts`'s `VerbSchema`/`validateDataset()` — validates
  the exact same `Verb` shape the fetch response returns per verb entry; no
  new schema needed.
- `src/feedback/submit.ts`'s manual `setTimeout` + `AbortController` pattern
  — the established, tested way to do a timeout-bounded fetch in this
  codebase without `AbortSignal.timeout` (unimplemented on Hermes).

### Established Patterns
- `generate(options, random)` in `src/quiz/engine.ts` currently imports
  `verbs` from `../dataset/verbs` at module scope — this is the exact seam
  D-01/D-03 of research (ARCHITECTURE.md) identifies as needing a parameter
  (`generate(verbs, options, random)`), so callers (this phase's resolver,
  eventually Phase 8's store) control which dataset is used.
- Full test suite (122 tests, 11 suites) must stay green after the
  `generate()` signature change — Success Criterion 1 in ROADMAP.md's Phase
  7 section is explicit about this.

### Integration Points
- The resolver this phase builds will be consumed by Phase 8's async
  `startQuiz()` — this phase should expose whatever API shape (see Claude's
  Discretion) makes that integration clean, but must NOT itself modify
  `useQuizStore.ts` or any `app/*.tsx` screen — those are Phase 8/9/10 scope.

</code_context>

<specifics>
## Specific Ideas

No specific UI/visual references — this is a data/state-layer phase with no
new user-visible surface. The three locked behavioral decisions (D-03, D-04,
D-05) fully specify the resolver's runtime behavior.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-Dataset Seam & Fetch/Fallback Pipeline*
*Context gathered: 2026-07-13*
