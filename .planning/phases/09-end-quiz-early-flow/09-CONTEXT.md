# Phase 9: End-Quiz-Early Flow - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

A learner can cleanly abandon an in-progress quiz at any time — via a visible
header exit control or a swipe-back/hardware-back gesture — with a
confirmation dialog offering distinct action labels, discarding progress and
returning to Setup with no partial results shown if confirmed, and no state
lost if declined. Covers QUIZ-05, QUIZ-06, QUIZ-07, QUIZ-08 only. Does NOT
touch the fetch/snapshot pipeline (Phases 7-8, already shipped) or the
screens' final visual/safe-area treatment (Phase 10) — the exit control and
dialog built here are functional-first; Phase 10 may restyle their
appearance, not their behavior.

</domain>

<decisions>
## Implementation Decisions

### Exit control placement
- **D-01:** Enable Expo Router's native Stack header for the Quiz screen only
  (override the app-wide `headerShown: false` set in `app/_layout.tsx`,
  scoped via `Stack.Screen`'s own `options` inside `app/quiz.tsx` or a
  per-route options export), with a `headerLeft` button. Setup and Results
  stay headerless for now — this is a deliberate, temporary inconsistency;
  Phase 10's visual pass may unify header treatment across all 3 screens
  later, but that's out of this phase's scope.

### Confirmation dialog mechanism
- **D-02:** Use RN core `Alert.alert(title, message, buttons)` for the
  confirmation — no new dependency, native iOS system dialog look, and
  distinct button labels are trivial (`buttons: [{ text: "Keep Practicing",
  style: "cancel" }, { text: "Quit Quiz", style: "destructive", onPress: ...
  }]`). This same `Alert.alert` call must be triggered from both paths: the
  header exit button's `onPress`, and the `beforeRemove` listener's
  interception of swipe-back/hardware-back (per
  `.planning/research/PITFALLS.md` Pitfall 8) — one shared handler function,
  not two separate dialog implementations.

### Exit control label
- **D-03:** Header-left button reads **"Exit"** (plain text, not an icon,
  not "Cancel"). Chosen over "Cancel" because "Cancel" reads as ambiguous
  (cancel what?) mid-quiz, and over an icon-only "X" for clarity — this is a
  temporary, functional-first choice; Phase 10 may restyle appearance
  (icon, color, weight) but should not change the semantic action.

### Confirmation dialog copy
- **D-04:** Exact wording is Claude's discretion during planning/execution —
  follow the roadmap's own example intent (distinct, unambiguous action
  labels, no generic OK/Cancel), e.g. something in the spirit of "Quit
  Quiz?" / "Your progress will be lost." / "Quit Quiz" / "Keep Practicing".
  Not locked verbatim — reasonable equivalent phrasing is acceptable.

### Claude's Discretion
- Exact confirmation dialog copy (title/message/button text) — per D-04,
  follow the roadmap's intent, not locked verbatim.
- Whether the `Stack.Screen options` override for the Quiz-only header lives
  inline in `app/quiz.tsx` or as route-level `export const unstable_settings`
  / `options` — Claude decides during planning, whichever is the cleaner
  Expo Router v6 pattern.
- Whether the shared exit-confirmation handler lives as a local function in
  `app/quiz.tsx` or a small extracted hook — implementation detail, no
  user-visible difference either way.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (v0.1 milestone) — read before implementing the gesture guard
- `.planning/research/PITFALLS.md` Pitfall 8 ("iOS swipe-back gesture
  bypasses the in-app exit confirmation entirely") — the `beforeRemove`
  listener pattern is REQUIRED, `gestureEnabled: false` alone is confirmed
  unreliable on iOS per multiple open Expo/RN GitHub issues. Exact pattern:
  `navigation.addListener('beforeRemove', (e) => { if (status ===
  'in-progress') { e.preventDefault(); /* show confirm dialog */ } })`.
- `.planning/research/PITFALLS.md` — "Looks Done But Isn't" checklist:
  verify exit confirmation fires on an actual iOS swipe-back gesture (not
  just the in-app button), and verify full-state-equality between a fresh
  `reset()` and post-exit state (not just the `status` field).
- `.planning/research/PITFALLS.md` — Prioritization Matrix row: gate
  exit-control visibility strictly on `status === "in-progress"`, matching
  the existing `lockedChoice === null` conditional-visibility convention
  already in `app/quiz.tsx`, to avoid a double-dialog risk right after
  auto-completion on the last question.
- `.planning/research/ARCHITECTURE.md` — overall v0.1 integration points and
  build-order rationale (Phase 9 depends on Phase 8, already shipped).

### Requirements
- `.planning/REQUIREMENTS.md` — QUIZ-05, QUIZ-06, QUIZ-07, QUIZ-08 (this
  phase's requirements)
- `.planning/ROADMAP.md` §"Phase 9: End-Quiz-Early Flow" — the 5 success
  criteria (visible header exit control, confirmation with distinct labels,
  swipe/hardware-back triggers the same confirmation with no bypass,
  confirming discards progress and returns to Setup, declining resumes the
  exact in-progress question with no state lost)

### Existing code (read before touching)
- `app/_layout.tsx` — root `<Stack screenOptions={{ headerShown: false }}>`;
  this phase overrides header visibility for the Quiz route only, without
  changing this app-wide default for Setup/Results
- `app/quiz.tsx` — the screen this phase modifies; note the existing
  conditional-visibility convention (`lockedChoice === null` hides
  Next/Report buttons) to mirror for exit-control gating; also note
  `handleAdvance()`'s existing `router.replace("/results")` pattern for how
  navigation-on-status-change is currently done
- `src/store/useQuizStore.ts` — `reset()` already exists and fully restores
  `initialState` (status/filters/session/currentIndex/answers/lockedChoice/
  errorMessage) — reuse this directly on confirmed exit, do not hand-roll a
  partial reset
- `app/index.tsx` — Setup screen, the navigation target after a confirmed
  exit (`router.replace("/")` or equivalent)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useQuizStore.ts`'s `reset()` — already resets every store field to
  `initialState` in one call; the confirmed-exit path should call this
  directly, then navigate to Setup.
- The existing `lockedChoice === null` conditional-visibility pattern in
  `app/quiz.tsx` (used for the Next/Report buttons) — reuse this same
  gating idiom (`status === "in-progress"`) for exit-control visibility, per
  PITFALLS.md's double-dialog warning.

### Established Patterns
- `app/quiz.tsx`'s `handleAdvance()` shows the existing pattern for reacting
  to a store status change post-action (call the store action, then read
  `useQuizStore.getState().status`, then navigate) — the exit-confirm flow
  should follow the same shape: on confirm, call `reset()`, then
  `router.replace("/")`.
- `app/_layout.tsx`'s single root `<Stack>` — per-screen header overrides go
  through that route's own `options`/`Stack.Screen`, not by editing the root
  layout's global `screenOptions`.

### Integration Points
- `app/quiz.tsx` is the sole integration point — the `beforeRemove` listener
  attaches via `useNavigation()` inside this screen, the header exit button
  lives in this route's header options, and both call the same shared
  confirm-then-reset-then-navigate handler.

</code_context>

<specifics>
## Specific Ideas

No specific UI/visual references beyond D-01/D-02/D-03 above — Phase 10 owns
final visual polish. The four decisions in this document fully specify
functional behavior: where the control lives (native header), how the
dialog is shown (Alert.alert), what the button says ("Exit"), and that
exact dialog copy is Claude's call within the roadmap's stated intent.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-End-Quiz-Early Flow*
*Context gathered: 2026-07-14*
