# Requirements: Portuguese Verb Conjugation App — Mobile

**Defined:** 2026-07-13
**Core Value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.

## v0.1 Requirements

Requirements for the v0.1 milestone. Each maps to roadmap phases. Continues
numbering from v0.0's REQ-IDs (SETUP/DATA/QUIZ/RSLT/FDBK).

### Online Content Fetch

- [ ] **FETCH-01**: App fetches the verb dataset from a backend content endpoint on app load and/or at quiz-start (backend endpoint does not exist yet — built against a local mock/stub for this milestone, swappable to the real URL later)
- [ ] **FETCH-02**: Any fetched payload is validated against the existing dataset Zod schema before acceptance; malformed/invalid payloads are rejected
- [ ] **FETCH-03**: On any fetch failure (unreachable, slow/timeout, malformed response), the app falls back silently to the bundled local dataset with zero user-facing blocking or error
- [ ] **FETCH-04**: The dataset source (local or successfully-fetched-remote) active at the moment `startQuiz()` is called is snapshotted for that session — a background refresh completing mid-quiz never changes an in-progress session's questions

### Exit Quiz

- [ ] **QUIZ-05**: User can exit an in-progress quiz via a visible header exit control
- [ ] **QUIZ-06**: Exiting shows a confirmation dialog with distinct action labels (e.g. "Quit Quiz" / "Keep Practicing") before discarding progress
- [ ] **QUIZ-07**: The same confirmation triggers on swipe-back/hardware-back gesture, not just the header exit button — no bypass path
- [ ] **QUIZ-08**: Confirming exit discards progress and returns to the Setup screen with no partial results shown

### UI Polish

- [ ] **UI-01**: App content never renders under the iOS status bar/notch on any of the 3 screens (Setup, Quiz, Results)
- [ ] **UI-02**: Setup, Quiz, and Results screens share consistent spacing/typography/color treatment (shared style tokens, not ad hoc per-screen styling)
- [ ] **UI-03**: The new online-fetch step has styled loading and error states (no default/unstyled spinners or bare error text)

## v2 Requirements (Deferred)

Deferred to future release. Tracked but not in current roadmap.

### Content & Progression

- **PROG-01**: Typed-answer quiz mode with diacritic normalization
- **PROG-02**: On-device (no-account) progress or streak tracking
- **PROG-03**: Spaced repetition scheduling

### Fetch/UI Enhancements (identified during v0.1 research, deferred as P2/P3)

- **FETCH-05**: Small "offline/using saved content" indicator when running on the local fallback
- **FETCH-06**: Dataset staleness/version metadata driving smarter background-refresh decisions — depends on what the real backend ships, premature to build against a mock
- **QUIZ-09**: Question-progress indicator ("Question X of 10") during an active quiz
- **UI-04**: Subtle answer-selection feedback animation (color/scale transition on tap)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login / accounts / sessions | No persistence beyond a single quiz session — locked v0 product scope, unchanged in v0.1 |
| Backend endpoint design/implementation | Owned by the sibling `portuguese-verb-api` repo, planned separately — this milestone covers mobile-side work only, against an assumed/mocked contract |
| Persistent on-disk caching of the fetched dataset across app restarts | Would reopen the "no persistence beyond a single quiz session" scope decision as an implementation-detail side effect rather than an explicit choice — the local bundled dataset remains the durable fallback; the fetched dataset is in-memory only for the current app session |
| Resume-in-progress / save-and-continue-later on quiz exit | Contradicts the no-persistence-beyond-session scope; exiting always fully discards progress |
| Partial-results screen on early exit | Explicitly excluded — muddies score semantics (share sheet, feedback flow assume a finished 10-question quiz); no results shown on early exit |
| Full theming engine / dark mode toggle | Disproportionate for a single-milestone visual pass on 3 screens; one consistent light theme with a shared style/token file is the target |
| Heavy animation libraries (Reanimated screen transitions, Lottie) | Not requested, adds native-module complexity this milestone doesn't need; built-in `Animated`/`LayoutAnimation` covers the deferred animation enhancement if pursued later |
| Continuous polling / websocket live content updates | Verb conjugation data changes rarely; fetch-once-per-session is sufficient, no user-visible value from real-time sync |
| Merge/conflict-resolution logic between local and remote datasets | Backend becomes source of truth wholesale, not a merge — simple precedence rule (remote-if-fetched-else-local) is sufficient |
| Android release work | Platform enum stays compatible (`ios | android`) but no Android build/release effort in this milestone |
| Direct Supabase access or credentials in the mobile app | All persistence goes through backend endpoints only — locked cross-repo constraint, unchanged |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FETCH-01 | Phase 7 | Pending |
| FETCH-02 | Phase 7 | Pending |
| FETCH-03 | Phase 7 | Pending |
| FETCH-04 | Phase 8 | Pending |
| QUIZ-05 | Phase 9 | Pending |
| QUIZ-06 | Phase 9 | Pending |
| QUIZ-07 | Phase 9 | Pending |
| QUIZ-08 | Phase 9 | Pending |
| UI-01 | Phase 10 | Pending |
| UI-02 | Phase 10 | Pending |
| UI-03 | Phase 10 | Pending |

**Coverage:**
- v0.1 requirements: 11 total
- Mapped to phases: 11/11 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after v0.1 ROADMAP.md creation (Phases 7-10)*
