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

- [x] **Phase 7: Dataset Seam & Fetch/Fallback Pipeline** - Quiz engine accepts an injected verb list, and the app can resolve a backend-fetched dataset with a silently-validated local fallback (completed 2026-07-13)
- [x] **Phase 8: Async Quiz Start & Dataset Snapshot** - Starting a quiz reliably resolves and snapshots whichever dataset (remote or local) is active, with no race conditions or blocked Start button (completed 2026-07-14)
- [x] **Phase 9: End-Quiz-Early Flow** - A learner can cleanly abandon an in-progress quiz via header control or back gesture, with a confirmation and no partial results (completed 2026-07-14)
- [x] **Phase 10: Safe-Area & Visual Polish** - The app renders correctly under the iOS status bar/notch and presents a consistent, styled visual treatment across all 3 screens, including fetch loading/error states (completed 2026-07-14)

## Phase Details

### Phase 7: Dataset Seam & Fetch/Fallback Pipeline

**Goal**: The app can source its verb dataset from the live backend `GET /content/verbs` payload with automatic, validated, silent fallback to the bundled local dataset — and the quiz engine no longer hardcodes which dataset it uses.
**Depends on**: Nothing (first phase of v0.1; builds on v0.0's shipped engine/dataset code)
**Requirements**: FETCH-01, FETCH-02, FETCH-03
**Success Criteria** (what must be TRUE):

  1. The existing full test suite passes unchanged after `generate()` is refactored to accept an injected `verbs` list instead of importing the bundled dataset at module scope.
  2. A resolver function returns the remote dataset when the live backend endpoint responds with a valid payload.
  3. The same resolver returns the bundled local dataset when the endpoint is unreachable, slow/timed out, or returns invalid data — covering all failure modes with tests.
  4. Any fetched payload that fails the existing Zod dataset schema is treated identically to a network failure (rejected, silent fallback), never accepted on type-annotation trust alone.

**Plans**: 3 plans
Plans:

- [x] 07-01-PLAN.md — Remote fetch wrapper + silent-fallback resolver with fetch-once memoization (FETCH-01/02/03)
- [x] 07-02-PLAN.md — Engine injection seam (optional trailing verbs param) + querer.isIrregular reconciliation + full regression
- [x] 07-03-PLAN.md — Live endpoint contract smoke check (human-verify)

### Phase 8: Async Quiz Start & Dataset Snapshot

**Goal**: Starting a quiz always uses whichever dataset (remote-fetched or local-fallback) is currently resolved, snapshotted at the moment of start so a background refresh can never swap questions mid-session, and the Start button never hangs waiting on network.
**Depends on**: Phase 7
**Requirements**: FETCH-04
**Success Criteria** (what must be TRUE):

  1. Tapping "Start Quiz" always produces a playable 10-question quiz, whether or not the backend was reachable.
  2. A learner can complete an in-progress quiz normally even if a background dataset refresh finishes mid-session — the active quiz's questions never change.
  3. The Setup screen's Start control is never stuck disabled or hung waiting on a network call that isn't required to begin the quiz.
  4. Both the Setup screen's start flow and the Results screen's "Try Again" flow correctly await the now-async quiz-start action before reading quiz status — no stale-status race condition.

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 08-01-PLAN.md — Async startQuiz snapshot: await resolveVerbs, feed snapshot to generate, prove background-refresh isolation (FETCH-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-02-PLAN.md — App wiring: root-layout prefetch + await async start on Setup Start & Results Try Again with loading flags (FETCH-04)

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

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Header Exit control + shared Alert.alert confirmation + beforeRemove gesture guard in app/quiz.tsx, plus full-state-equality reset test (QUIZ-05/06/07/08)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 09-02-PLAN.md — On-device human-verify of all exit paths: swipe-back, hardware back, header button, decline-resumes, confirm-discards (QUIZ-05/06/07/08)
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

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 10-01-PLAN.md — Foundation: shared tokens module + SafeAreaProvider/native-header root wiring (UI-01/UI-02)

**Wave 2** *(blocked on Wave 1; 10-02 and 10-03 run in parallel — no file overlap)*

- [x] 10-02-PLAN.md — Setup + Results polish: headers, tokens, bottom insets, ActivityIndicator loading, styled error text (UI-01/UI-02/UI-03)
- [x] 10-03-PLAN.md — Quiz polish: tokens + bottom safe-area inset (header/Exit preserved) (UI-01/UI-02)

**Wave 3** *(blocked on Wave 2)*

- [x] 10-04-PLAN.md — On-device human-verify of safe-area, consistent visuals, loading + error states across all 3 screens (UI-01/UI-02/UI-03)
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
| 7. Dataset Seam & Fetch/Fallback Pipeline | v0.1 | 3/3 | Complete   | 2026-07-13 |
| 8. Async Quiz Start & Dataset Snapshot | v0.1 | 2/2 | Complete   | 2026-07-14 |
| 9. End-Quiz-Early Flow | v0.1 | 2/2 | Complete   | 2026-07-14 |
| 10. Safe-Area & Visual Polish | v0.1 | 4/4 | Complete   | 2026-07-14 |

---

*Next: run `/gsd:execute-phase 10` to implement Phase 10.*
