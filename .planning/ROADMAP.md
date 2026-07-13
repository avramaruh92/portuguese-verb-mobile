# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- 🚧 **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10 (in progress)

## Phases

<details>
<summary>✅ v0.0 Offline Quiz MVP (Phases 1-6) — SHIPPED 2026-07-13</summary>

- [x] Phase 1: Scaffold (2/2 plans) — completed 2026-07-12
- [x] Phase 2: Dataset & Domain Vocabulary (3/3 plans) — completed 2026-07-12
- [x] Phase 3: Quiz Engine (3/3 plans) — completed 2026-07-12
- [x] Phase 4: Quiz Experience (Setup → Quiz → Results) (2/2 plans) — completed 2026-07-12
- [x] Phase 5: Feedback Integration (4/4 plans) — completed 2026-07-13
- [x] Phase 6: Polish & Verification (4/4 plans) — completed 2026-07-13

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.0-ROADMAP.md`.

</details>

### v0.1 Online Quiz, Exit Flow & UI Polish (Phases 7-10)

- [ ] **Phase 7: Dataset Seam & Fetch/Fallback Pipeline** - Quiz engine accepts an injected verb list, and the app can resolve a backend-fetched dataset with a silently-validated local fallback
- [ ] **Phase 8: Async Quiz Start & Dataset Snapshot** - Starting a quiz reliably resolves and snapshots whichever dataset (remote or local) is active, with no race conditions or blocked Start button
- [ ] **Phase 9: End-Quiz-Early Flow** - A learner can cleanly abandon an in-progress quiz via header control or back gesture, with a confirmation and no partial results
- [ ] **Phase 10: Safe-Area & Visual Polish** - The app renders correctly under the iOS status bar/notch and presents a consistent, styled visual treatment across all 3 screens, including fetch loading/error states

## Phase Details

### Phase 7: Dataset Seam & Fetch/Fallback Pipeline
**Goal**: The app can source its verb dataset from a fetched backend payload (mocked/stubbed this milestone) with automatic, validated, silent fallback to the bundled local dataset — and the quiz engine no longer hardcodes which dataset it uses.
**Depends on**: Nothing (first phase of v0.1; builds on v0.0's shipped engine/dataset code)
**Requirements**: FETCH-01, FETCH-02, FETCH-03
**Success Criteria** (what must be TRUE):
  1. The existing full test suite passes unchanged after `generate()` is refactored to accept an injected `verbs` list instead of importing the bundled dataset at module scope.
  2. A resolver function returns the mocked remote dataset when the stub backend endpoint responds with a valid payload.
  3. The same resolver returns the bundled local dataset when the stub endpoint is unreachable, slow/timed out, or returns invalid data — covering all three failure modes with tests.
  4. Any fetched payload that fails the existing Zod dataset schema is treated identically to a network failure (rejected, silent fallback), never accepted on type-annotation trust alone.
**Plans**: TBD

### Phase 8: Async Quiz Start & Dataset Snapshot
**Goal**: Starting a quiz always uses whichever dataset (remote-fetched or local-fallback) is currently resolved, snapshotted at the moment of start so a background refresh can never swap questions mid-session, and the Start button never hangs waiting on network.
**Depends on**: Phase 7
**Requirements**: FETCH-04
**Success Criteria** (what must be TRUE):
  1. Tapping "Start Quiz" always produces a playable 10-question quiz, whether or not the backend was reachable.
  2. A learner can complete an in-progress quiz normally even if a background dataset refresh finishes mid-session — the active quiz's questions never change.
  3. The Setup screen's Start control is never stuck disabled or hung waiting on a network call that isn't required to begin the quiz.
  4. Both the Setup screen's start flow and the Results screen's "Try Again" flow correctly await the now-async quiz-start action before reading quiz status — no stale-status race condition.
**Plans**: TBD

### Phase 9: End-Quiz-Early Flow
**Goal**: A learner can cleanly exit an in-progress quiz at any time — via a visible control or a back gesture — with a clear confirmation, discarding progress with no partial results shown.
**Depends on**: Phase 8
**Requirements**: QUIZ-05, QUIZ-06, QUIZ-07, QUIZ-08
**Success Criteria** (what must be TRUE):
  1. An in-progress quiz shows a visible exit control in the header.
  2. Tapping the exit control shows a confirmation dialog with distinct action labels (e.g. "Quit Quiz" / "Keep Practicing"), not generic OK/Cancel.
  3. Swiping back or pressing hardware back during an in-progress quiz triggers the same confirmation dialog — there is no path off the quiz screen that bypasses it.
  4. Confirming exit returns the learner to the Setup screen with progress discarded and no partial score or results shown.
  5. Declining the exit prompt ("Keep Practicing") returns the learner to the exact in-progress question they were on, with no state lost.
**Plans**: TBD
**UI hint**: yes

### Phase 10: Safe-Area & Visual Polish
**Goal**: The app looks and feels like a coherent, finished product — no safe-area rendering bugs, consistent visual treatment across all three screens, and properly styled states for the new online-fetch step.
**Depends on**: Phase 9
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. On Setup, Quiz, and Results screens, no content renders under the iOS status bar, notch, or home indicator.
  2. Setup, Quiz, and Results share a consistent visual language (spacing, typography, color) drawn from shared style tokens, not one-off per-screen values.
  3. While the app resolves remote content, the learner sees a styled loading indicator, not a bare default spinner.
  4. Any user-visible error/fallback state from the fetch step renders with the app's own styling, not raw or unstyled text.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|-----------------|--------|-----------|
| 1. Scaffold | v0.0 | 2/2 | Complete | 2026-07-12 |
| 2. Dataset & Domain Vocabulary | v0.0 | 3/3 | Complete | 2026-07-12 |
| 3. Quiz Engine | v0.0 | 3/3 | Complete | 2026-07-12 |
| 4. Quiz Experience (Setup → Quiz → Results) | v0.0 | 2/2 | Complete | 2026-07-12 |
| 5. Feedback Integration | v0.0 | 4/4 | Complete | 2026-07-13 |
| 6. Polish & Verification | v0.0 | 4/4 | Complete | 2026-07-13 |
| 7. Dataset Seam & Fetch/Fallback Pipeline | v0.1 | 0/? | Not started | - |
| 8. Async Quiz Start & Dataset Snapshot | v0.1 | 0/? | Not started | - |
| 9. End-Quiz-Early Flow | v0.1 | 0/? | Not started | - |
| 10. Safe-Area & Visual Polish | v0.1 | 0/? | Not started | - |

---

*Next: run `/gsd:plan-phase 7` to break Phase 7 into executable plans.*
