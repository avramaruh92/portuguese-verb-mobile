# Milestones

## v0.0 Offline Quiz MVP (Shipped: 2026-07-13)

**Phases completed:** 6 phases, 18 plans, 25 tasks

**Key accomplishments:**

- Expo Router + strict TypeScript + Zustand + jest-expo walking-skeleton app booting from a single root route, with a green two-test suite.
- Human-confirmed the Expo Router scaffold boots cleanly on the iOS Simulator via Expo Go — closing out ROADMAP Phase 1 SC-1's visual confirmation
- Typed Tense/Subject/Verb contracts, an exhaustive Zod validation harness (no z.record), and a 4-verb seed (falar/comer/partir/ser) with a green 5-case test suite proving completeness and backend enum reconciliation.
- Scaled the seeded 4-verb dataset to the full 50-verb European Portuguese target (37 regular / 13 irregular), applying the D-01/D-02 verb-selection mix and D-05 present-indicative irregularity criterion, with the count test tightened to exactly 50 and all validation green.
- User-verified 50-verb European Portuguese dataset for conjugation accuracy, one isIrregular flag corrected (querer)
- Established the Question/QuizSession/GenerateOptions type contracts and a deterministic, injectable-RNG Fisher-Yates shuffle utility that Wave 2's engine and scoring plans build against.
- Implemented `generate()` and its pure helpers (`sampleTriples`, `buildQuestion`, `pickDistractors`) that filter the dataset by tense/irregular toggle, sample 10 unique triples, and build fully-shuffled 4-choice questions — all deterministic under an injected RNG, proven by a 9-test TDD suite.
- Pure `score(session, answers)` function counting positional matches against `Question.correctAnswer`, returning `{ correct, total }` with `total` always equal to session length.
- Zustand quiz store state machine (idle/error/in-progress/completed) plus exhaustive Subject/Tense display labels and a pure D-10 share-message builder, all covered by plain Jest unit tests.
- Full setup-to-quiz-to-results user flow implemented as three Expo Router screens, each a thin renderer over the Plan 01 Zustand store and label/share helpers.
- Zod schema mirroring the locked backend `POST /feedback` contract, plus a pure `buildFeedbackPayload()` mapper — enum literals reused from `src/dataset/types.ts` with zero retyping risk.
- `submitFeedback(payload)` — the app's first outbound network call, POSTing to the live `POST /feedback` backend with a manual 90s `setTimeout` + `AbortController` timeout (not `AbortSignal.timeout`, unimplemented on Hermes) and status-branching into a `SubmitResult` discriminated union.
- The user-facing feedback vertical slice: a `ReportFeedbackModal` wired into the Quiz screen, letting a learner who has locked in an answer report a problem — reason picker, optional free text, inline spinner, success auto-dismiss, conditional Retry — entirely in modal-local state with zero `useQuizStore` coupling.
- Independently re-verified the live `POST /feedback` round-trip and on-device non-interruption behavior — fresh HTTP 201 against the real deployed backend, confirmed the quiz never freezes or loses progress during an in-flight submission.
- Independently re-derived all 1,200 conjugation cells (50 verbs × 4 tenses × 6 subjects) in `src/dataset/verbs.ts` from European Portuguese grammar rules and found zero discrepancies — a clean verification pass, with one classification observation flagged for user awareness.
- User confirmed zero discrepancies in the 50-verb dataset — no corrections applied, verbs.ts unchanged
- Confirmed the feedback flow degrades gracefully against a genuinely cold Render backend — 45-50s cold start, spinner held throughout, quiz stayed interactive, resolved to success
- Confirmed all three research-flagged edge cases (insufficient verbs, share-sheet cancellation, irregular-toggle mid-session) are handled cleanly — no code changes needed

---
