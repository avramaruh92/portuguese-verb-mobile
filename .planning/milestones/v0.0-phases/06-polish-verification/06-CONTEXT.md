# Phase 6: Polish & Verification - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-cutting verification that the shipped v0.0 experience holds up under
real-world conditions automated tests structurally cannot cover — no new
capabilities, no new requirements. Three things must end up TRUE:

1. The full 50-verb dataset has been read through against an authoritative
   European Portuguese source (or Claude's own re-verified grammar knowledge,
   per D-01 below) with no outstanding discrepancies.
2. A manual test against a genuinely cold live Render backend confirms the
   feedback flow degrades gracefully (loading state, no crash, no lost quiz
   progress).
3. Three edge cases (insufficient eligible verbs for a filter combination,
   share-sheet cancellation, irregular-toggle state during an active quiz)
   are confirmed handled without crashes or dead ends.

Any bugs/discrepancies found get fixed in this same phase (D-04) — this is
the last phase before v0.0 ships, so there is no separate bug-fix pass.

</domain>

<decisions>
## Implementation Decisions

### Dataset Accuracy Read-Through
- **D-01:** Claude cross-checks first: re-verify all 50 verbs × 4 tenses × 6
  subjects (1,200 cells) in `src/dataset/verbs.ts` against its own European
  Portuguese grammar knowledge, specifically re-deriving each conjugation
  independently rather than just re-reading what's already there (to catch
  self-consistent-but-wrong patterns). Flag anything uncertain, any
  irregular-pattern edge cases, or discrepancies from the re-derivation.
  Produce a concrete discrepancy list (verb/tense/subject/current value/
  suspected correct value) for the user to spot-check and confirm — not a
  claim of "all verified," a list the user reviews before sign-off.
- Per Phase 2 D-04: no specific external source citation is required; this
  was always scoped as an assistant-drafts/user-reviews accuracy pass, not a
  cited-source audit.

### Cold-Start Backend Test
- **D-02:** Let the Render free-tier backend go genuinely idle (no calls for
  15+ minutes — Render's free-tier sleep threshold) before testing, then run
  the app on-device (`npx expo start --ios`) and submit real feedback through
  the actual Report a problem flow. This is a stronger test than Phase 5's
  live round-trip, which likely hit an already-warm instance. Confirm: the
  in-flight spinner shows during the cold-start delay, the ~90s
  `AbortController` timeout (already built in Phase 5) is not hit under a
  normal cold start, the Quiz screen underneath stays fully interactive and
  loses no progress, and either success or a graceful Retry-able error
  results — never a stuck/frozen modal.

### Edge Case Verification
- **D-03:** Manual on-device confirmation only for all three edge cases — no
  new automated tests needed for a verification-only phase. Existing
  code-level handling should already be correct (see Code Context below); the
  goal is confirming it holds up when actually exercised on a device, not
  building new defensive code from scratch.
  - Insufficient eligible verbs: on the Setup screen, pick a narrow filter
    combination that yields fewer than 10 eligible (verb × tense × subject)
    triples and confirm the existing `InsufficientVerbsError` friendly message
    shows, with no crash and a clear path to adjust filters and retry.
  - Share-sheet cancellation: from the Results screen, open the share sheet
    and cancel/dismiss it without sharing; confirm the Results screen stays
    interactive and no error surfaces (existing `try/catch` already swallows
    this silently).
  - Irregular-toggle mid-session: confirm that toggling "Include irregular
    verbs" on the Setup screen after a quiz has already started (e.g.
    navigating back to Setup mid-quiz, or backgrounding/returning) has no
    effect on the already-in-progress session — the running quiz's `filters`
    were snapshotted at `startQuiz()` time and only a fresh `startQuiz()` call
    picks up a changed toggle.

### Bug/Discrepancy Handling
- **D-04:** Fix inline within this phase. Any conjugation error, crash, or
  dead-end found during the dataset cross-check, cold-start test, or edge
  case verification gets corrected as part of Phase 6 — this is the final
  phase before v0.0 ships, so there's no separate bug-fix phase to defer to.

### Claude's Discretion
- Exact format of the dataset discrepancy list (inline PR-style comments vs a
  standalone findings doc) — whatever makes the user's spot-check pass
  fastest.
- Whether to force-simulate "insufficient verbs" via a very narrow filter
  combination that's naturally rare in the real dataset, vs a temporary
  test-only override — planner/implementer's call, as long as the real
  `InsufficientVerbsError` code path is what's exercised (not a mocked
  stand-in).
- Whether any actual bugs are found is unknown until the cross-check and
  on-device passes run; if none are found, this phase closes as a clean
  verification pass with no code diffs beyond docs/summaries.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Contract
- `.planning/PROJECT.md` — core value loop this phase protects; no new
  requirements introduced by Phase 6 (cross-cutting verification of
  already-shipped requirements)
- `.planning/ROADMAP.md` §Phase 6 — the three success criteria this phase
  must satisfy (dataset accuracy, cold-start grace, edge cases)
- `.planning/REQUIREMENTS.md` — all 16 v1 requirements already marked
  Complete; this phase verifies them under real-world conditions, doesn't add
  new ones
- `.planning/STATE.md` — "Blockers/Concerns" section: Phase 2's dataset
  accuracy note and Phase 5's cold-start deferral note, both resolved by this
  phase

### Prior Phases
- `.planning/phases/02-dataset-domain-vocabulary/02-CONTEXT.md` D-04 — the
  dataset accuracy read-through was explicitly deferred here from Phase 2;
  D-01/D-02/D-05 define the verb-selection mix and `isIrregular` criteria this
  cross-check must respect (not second-guess)
- `.planning/phases/05-feedback-integration/05-CONTEXT.md` — D-09 (~90s
  client timeout), D-05 through D-08 (success/error/retry UI) already built;
  this phase's cold-start test exercises that existing UI against a
  genuinely-idle backend rather than building anything new
- `.planning/phases/04-quiz-experience-setup-quiz-results/04-CONTEXT.md` —
  Setup/Quiz/Results screen structure this phase's edge-case checks walk
  through without modifying

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/dataset/verbs.ts` — the full 50-verb dataset (1,954 lines) to be
  cross-checked cell-by-cell against D-01.
- `src/quiz/engine.ts` — `sampleTriples()` already throws
  `InsufficientVerbsError` when the eligible-triple pool is smaller than the
  10-question session size; `useQuizStore.startQuiz()` already catches this
  and sets a friendly `errorMessage`.
- `app/results.tsx` — `handleShare()` already wraps `Share.share()` in a
  try/catch that silently swallows errors/cancellation, keeping the screen
  interactive.
- `app/index.tsx` — Setup screen owns the irregular-verbs toggle; the running
  quiz's filters live only in `useQuizStore.filters`, snapshotted at
  `startQuiz()` time, so a later toggle change can't retroactively affect an
  in-progress session — this is existing behavior via the store's design, not
  new code.

### Established Patterns
- `app/` routes-only, `src/<domain>/` for logic — carries through unchanged.
- Strict TypeScript, `jest-expo` test suite (11 suites / 122 tests as of
  Phase 5 completion) — any inline fixes from D-04 should keep the suite
  green.

### Integration Points
- No new modules expected. Any code touched will be existing files
  (`src/dataset/verbs.ts` for conjugation corrections, or existing screens/
  store if an edge case reveals an actual bug rather than confirming correct
  behavior).

</code_context>

<specifics>
## Specific Ideas

- Dataset cross-check should re-derive conjugations independently rather than
  just proofreading what's there, to catch confidently-wrong patterns Claude
  might repeat if just re-reading (D-01).
- Cold-start test must be a real 15+ minute idle wait, not a simulated delay
  — the whole point is exercising Render's actual free-tier sleep behavior
  (D-02).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (No pending todos matched this
phase per `todo.match-phase`.)

</deferred>

---

*Phase: 6-Polish & Verification*
*Context gathered: 2026-07-13*
