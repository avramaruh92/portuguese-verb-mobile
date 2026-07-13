# Feature Research

**Domain:** Mobile learning/quiz app — v0.1 additions (online content fetch + offline fallback, end-quiz-early, UI polish)
**Researched:** 2026-07-13
**Confidence:** MEDIUM (patterns are well-established and cross-verified across multiple sources; some specifics — e.g. exact Expo Router `beforeRemove`/`preventRemove` API surface for this SDK, and the true root cause of the safe-area bug — need a codebase-level check, not just ecosystem research)

> Note: this file replaces the v0.0-era FEATURES.md (conjugation-drill competitor landscape) with
> research scoped to the three v0.1 milestone areas only: online content fetch w/ offline fallback,
> end-quiz-early, and UI polish. The v0.0 competitor findings (multiple choice vs typed answer,
> fixed-length sessions, etc.) remain valid and shipped; they are not re-litigated here.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Local dataset always works, even if fetch never happens | Core Value in PROJECT.md is "complete a quiz entirely offline" — this is non-negotiable, not new for v0.1 | LOW (already shipped) | The fetch layer must be strictly additive. If the fetch call is slow, absent, or wrong, the existing v0.0 offline loop must be provably unaffected. |
| Cached/local content shown immediately, no blocking spinner gate before Setup/Quiz can be used | Standard mobile pattern: don't make users wait on network for content you already have on-device (stale-while-revalidate). Blocking here directly contradicts the "must never block the quiz" principle already established for feedback in v0.0 | MEDIUM | Show local dataset instantly; if/when a remote fetch succeeds, swap in for *future* `startQuiz` calls, never for a session already in progress (see Dependencies below). |
| Silent, non-blocking fallback on fetch failure (timeout, backend down, malformed response) | Users should never see a hard error for a feature they don't know exists yet; equivalent to how v0.0 treats feedback-submission failures as non-blocking | LOW-MEDIUM | Treat all three failure modes (unreachable, slow/timeout, malformed JSON) identically for v0.1: catch, log/ignore, keep using local dataset. Malformed-JSON handling should reuse the existing Zod dataset schema — validate the fetched payload with the same schema used for the bundled dataset before accepting it. |
| Exit control on the Quiz screen, visible without hunting (header "X"/close button) | Verified real-world convention — Duolingo's in-lesson exit is exactly a header X button, not a buried menu item | LOW | Standard `Stack.Screen` header-left custom button in Expo Router, or a small pressable in a custom header row if headers are hidden. |
| Confirmation dialog before discarding an in-progress quiz | NN/g guidance: confirmation dialogs are justified precisely when the action is destructive and hard to undo — losing 10 unrepeatable quiz answers qualifies | LOW | Use a native `Alert.alert` (two buttons) for v0.1 — no need for a custom modal component for a single confirm/cancel action. |
| Exiting fully discards progress, returns to Setup, shows no partial results | Explicit product decision already recorded in PROJECT.md ("no partial results shown") | LOW | Reset is conceptually the same store action shape as quiz completion — see Dependencies. |
| Safe-area-correct layout (content never renders under the iOS status bar/notch) | Table-stakes visual bug — a misaligned status bar reads as "broken app," not "unstyled" | LOW-MEDIUM | See important finding under "Important Findings to Verify" below — the fix may be simpler than the v0.0 tech-debt note implies. |
| Legible, consistent typography/spacing and clear right/wrong color feedback | Baseline for "feels like a real app" vs. "feels like a wireframe" — this is the user's own stated complaint (UI "effectively non-existent") | LOW-MEDIUM | Mostly `StyleSheet` and design-token work, not new logic. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Small "offline"/"using saved content" indicator when running on the local fallback | Builds trust that the app is working as intended, not silently broken — common pattern in offline-first apps, but genuinely optional here since the app already works fully offline by design | LOW | Only worth it if it's a one-line badge/text; do not build a persistent banner system. |
| Question-progress indicator during quiz ("Question 3 of 10" / progress bar) | Cited across quiz/learning UX as a key differentiator between "MVP" and "polished" — also gives the exit-confirmation more context ("you're on question 3 of 10") | LOW | Cheap: derive directly from existing quiz-session index in the Zustand store, no new state needed. |
| Subtle answer-selection feedback animation (color transition/scale on tap) | Common differentiator cited for quiz apps (Duolingo-style delight) vs. instant hard color swap | LOW-MEDIUM | Use RN's built-in `Animated` API (or `LayoutAnimation`) — do not reach for Reanimated/Lottie for this scale of interaction. |
| Distinct labeled exit-dialog buttons ("Quit Quiz" / "Keep Practicing") instead of generic "OK"/"Cancel" | UX-writing best practice (NN/g, UX Planet): action-specific labels reduce accidental confirmation and read as more polished | LOW | Free — just copy, no extra logic. |
| Dataset "version"/timestamp metadata from the fetch response, used to decide whether a background refresh is worth doing | Lets the app avoid unnecessary refetches later; genuinely useful if the backend ships this cheaply | LOW-MEDIUM | Optional for v0.1 given the backend endpoint doesn't exist yet — only pursue if it's free to stub into the mock contract; don't block v0.1 on it. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|----------------|------------------|-------------|
| Full local sync/database layer (SQLite, WatermelonDB, Realm) for the fetched dataset | "Offline-first apps use a local database" is a common generalization from larger apps | Massive overkill for a ~50-row, infrequently-changing JSON blob; adds a real dependency and migration surface for a dataset this small | A single fetched-and-validated JSON object held in memory (Zustand state), re-fetched once per app session; fall back to the bundled JSON import if it fails |
| Persisting the fetched remote dataset to disk (AsyncStorage) across app restarts | Feels like "proper caching" | Reopens the "no persistence beyond a single quiz session" scope decision the project deliberately made (v0.0 Key Decisions/Out of Scope) for no clearly requested benefit at this stage; also reintroduces the AsyncStorage dependency the STACK research explicitly deferred | Re-fetch (with short timeout) once per app cold start / on demand at quiz-start; local bundled dataset is always the durable "cache" |
| Continuous polling / websocket live-updates for quiz content | "Online content" suggests real-time sync to some | Verb conjugation data changes rarely if ever; polling adds battery/network cost and complexity with zero user-visible value | Fetch once per app session (on load) and optionally again at "start quiz," nothing more |
| Merge/conflict-resolution logic between local and remote datasets | Sounds like correct "sync" behavior | PROJECT.md frames this as backend becomes source-of-truth wholesale, not a merge — building reconciliation logic solves a problem that doesn't exist here | Simple precedence rule: use remote dataset if a valid fetch succeeded this session, otherwise use local bundled dataset — no merging |
| Resume-in-progress / save-and-continue-later on quiz exit | Feels user-friendly, common in longer surveys/tests | Explicitly out of scope per PROJECT.md ("discarding progress... no partial results shown"); would require persisting mid-quiz state, contradicting the no-persistence-beyond-session scope | Full discard + return to Setup, exactly as scoped |
| Partial-results screen on early exit ("You got 4/7 before quitting") | Seems more informative than nothing | Explicitly excluded by product decision; also implies the abandoned session was "completed," muddying score semantics (share sheet, feedback flow) that assume a finished 10-question quiz | No results shown on early exit; user simply returns to Setup |
| Full theming engine / dark mode toggle / multiple color themes | "Polish" often gets over-scoped into a design system | Disproportionate effort for a single-milestone visual pass on 3 screens in a small personal-scale app | One consistent light theme with a small shared style/token file (colors, spacing, type scale) |
| Heavy animation libraries (Reanimated-driven screen transitions, Lottie mascot animations) | Seen in big-name apps (Duolingo's owl) and assumed to be "what polish looks like" | High implementation/maintenance cost relative to a 3-screen quiz app; not requested, and risks introducing new native-module complexity this milestone doesn't need | Built-in `Animated`/`LayoutAnimation` for the couple of interaction points that benefit (answer feedback, maybe progress bar fill) |

## Feature Dependencies

```
[Local bundled dataset (v0.0, shipped)]
    └──required-fallback-for──> [Online quiz content fetch]
                                     └──feeds──> [startQuiz() dataset selection]
                                                     └──must-preserve──> [Filters-snapshot-at-startQuiz invariant, v0.0 Phase 6]

[Zustand quiz-session store (v0.0, shipped)]
    └──extended-by──> [End-quiz-early action (discard/reset)]
                           └──requires──> [Navigation guard on Quiz screen: header X button AND
                                            interception of swipe-back/hardware-back gesture]

[SafeAreaProvider / insets]
    └──must-precede──> [General visual/spacing pass on Setup/Quiz/Results]
                            └──enhances──> [Answer-selection feedback animation]
                            └──enhances──> [Question-progress indicator]

[End-quiz-early confirmation dialog] ──conflicts──> [Partial-results screen]
[Persistent disk cache of fetched dataset] ──conflicts──> [No-persistence-beyond-session scope decision]
```

### Dependency Notes

- **Online quiz content fetch requires the local bundled dataset as fallback:** this isn't a new build — it's a reordering/wrapping of what already exists. The fetch layer sits *in front of* the existing dataset import, not alongside it.
- **`startQuiz()` dataset selection must preserve the filters-snapshot invariant (v0.0 Phase 6):** today, `startQuiz` snapshots the active tense/irregular filters so an in-progress quiz session is immune to filter changes made after it starts. The same discipline must extend to *dataset source*: whichever dataset (local or successfully-fetched-remote) is active at the moment `startQuiz()` is called should be snapshotted for that session. A background refresh completing mid-quiz must not swap questions/answers under the user's feet.
- **End-quiz-early requires a navigation guard, not just a button:** Expo Router (React Navigation underneath) exposes a `beforeRemove`/`preventRemove`-style hook for exactly this "confirm before leaving a screen with unsaved state" case. A header X button alone is necessary but not sufficient — the swipe-back gesture (and, if ever built for Android, the hardware back button) must trigger the same confirmation, or a user can accidentally discard a quiz with no confirmation at all via the native back gesture. Verify the exact current Expo Router API name/behavior at implementation time (React Navigation has renamed this API across versions — confirm against the SDK-57-bundled Router version rather than trusting older tutorials).
- **SafeAreaProvider must precede the visual pass:** doing spacing/typography work before the safe-area fix risks rework once real insets are applied. Important finding to verify in-codebase (see below) — do this first in sequencing regardless of which specific fix it turns out to need.
- **End-quiz-early confirmation conflicts with (replaces) a partial-results screen:** these are two different products of "how do you handle abandonment" — the project has already chosen the discard-only path, so a partial-results feature should not be built alongside it.
- **A persistent on-disk cache for the fetched dataset conflicts with the existing "no persistence beyond a single quiz session" scope line:** if a future milestone wants offline persistence of a previously-fetched remote dataset across cold starts, that decision should be made explicitly (like the online-fetch reversal was), not smuggled in as an implementation detail of this feature.

## MVP Definition

### Launch With (v0.1)

- [ ] Fetch verb dataset from a (mocked/stubbed, swappable) backend endpoint on app load and/or at quiz-start — essential to validate the fetch/fallback architecture the milestone exists to build
- [ ] Validate any fetched payload against the existing Zod dataset schema before accepting it; reject and fall back silently on any shape mismatch — essential, this is the "malformed data" failure mode and reuses existing infrastructure
- [ ] Fall back to the bundled local dataset on any fetch failure (unreachable, slow/timeout, malformed) with zero user-facing blocking — essential, this is the core value guarantee that must not regress
- [ ] Snapshot the active dataset source at `startQuiz()`, same discipline as the existing filters-snapshot invariant — essential correctness requirement, not optional
- [ ] Header exit ("X") control on the Quiz screen — essential, this is the feature
- [ ] Confirmation dialog ("progress will be lost") using native `Alert.alert` — essential, matches scoped requirement
- [ ] Swipe-back/hardware-back gesture also triggers the same confirmation (navigation guard, not just the button) — essential; without it the button is a false sense of protection
- [ ] Discard on confirm, return to Setup screen, no partial results — essential, matches explicit product decision
- [ ] Safe-area fix so content never renders under the status bar/notch — essential, table-stakes bug fix
- [ ] Baseline visual pass: consistent spacing/typography/color tokens across Setup/Quiz/Results, styled loading/error states for the new fetch step — essential, this is the milestone's stated goal

### Add After Validation (v0.1.x / same milestone if cheap)

- [ ] Question-progress indicator ("Question X of 10") — cheap, high perceived-polish value, add if time allows within this milestone
- [ ] Distinct exit-dialog button labels ("Quit Quiz"/"Keep Practicing") — free, add alongside the confirmation dialog itself
- [ ] Subtle answer-selection feedback animation — add once the base visual pass is stable, don't let it block the safe-area/layout fixes
- [ ] Small "offline/cached content" indicator — only if genuinely low-cost given the mocked backend; otherwise defer

### Future Consideration (v0.2+)

- [ ] Real dataset-version/staleness metadata driving smarter background-refresh decisions — depends on what the real `portuguese-verb-api` backend team ships; premature to build against a mock
- [ ] Persistent on-disk caching of the fetched dataset across cold starts — deliberately deferred; revisit only as an explicit scope decision, same way the online-fetch reversal was made explicit
- [ ] Resume-in-progress on abandoned quiz — explicitly deferred, contradicts current no-persistence-beyond-session scope
- [ ] Theming/dark-mode — no signal this is wanted; defer indefinitely until requested

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|-------------|----------------------|----------|
| Fetch + validate + fallback dataset pipeline | HIGH | MEDIUM | P1 |
| Dataset-source snapshot at startQuiz (invariant preservation) | HIGH (correctness) | LOW | P1 |
| Exit button + confirmation dialog | HIGH | LOW | P1 |
| Navigation-guard interception of swipe-back/hardware-back | HIGH (closes a real gap) | LOW-MEDIUM | P1 |
| Safe-area fix | HIGH | LOW-MEDIUM | P1 |
| Baseline visual/spacing/typography pass | HIGH | MEDIUM | P1 |
| Question-progress indicator | MEDIUM | LOW | P2 |
| Exit-dialog specific button labels | LOW-MEDIUM | LOW | P2 |
| Answer-selection feedback animation | MEDIUM | LOW-MEDIUM | P2 |
| Offline/cached-content indicator | LOW-MEDIUM | LOW | P3 |
| Dataset staleness metadata / smart refresh | LOW (no real backend yet) | MEDIUM | P3 |
| Persistent on-disk dataset cache | LOW (scope conflict) | MEDIUM | P3 (defer, needs explicit decision) |

## Competitor / Reference-Pattern Analysis

| Concern | Duolingo (reference) | General survey/quiz apps (Typeform, Google Forms mobile, etc.) | Our Approach |
|---------|------------------------|--------------------------------------------------------------|--------------|
| Exit-in-progress control | Header "X" during a lesson, forfeits progress, guarded by a confirmation dialog | Usually an explicit "Exit"/"X" in the header or a back-gesture confirmation; abandonment overwhelmingly discards rather than autosaves for short quizzes | Header X + `Alert.alert` confirmation + swipe-back guard, full discard — matches the dominant pattern for short (~10 question) sessions |
| Offline/first-load content | Duolingo primarily assumes connectivity but shows a branded loading screen; not a close analog for true offline-first | Most form/quiz tools are online-only, not a strong reference for the fallback behavior | Closer to general mobile "stale-while-revalidate" pattern: show local content instantly, refresh in background, fall back silently — this app's local-first design is actually stronger than most quiz-tool competitors |
| Visual polish signals | Mascot-driven loading screens, animated feedback, progress bars — high production value | Minimal, functional, form-first UI | Adopt the cheap wins (progress indicator, feedback color/animation, consistent type/spacing) without adopting the expensive ones (mascot animations, branded loading screens) — right-sized for a small offline-first learning app, not a venture-scale product |

## Important Findings to Verify in Codebase (not just ecosystem research)

- **Safe-area root cause:** Expo's official docs state Expo Router wires a `SafeAreaProvider` automatically for its routes ("This setup is not needed at the root level when using Expo Router" — https://docs.expo.dev/versions/latest/sdk/safe-area-context/). If that's accurate for this project's Router version, the v0.0 tech-debt note ("no SafeAreaProvider wired") may be describing the wrong root cause — the actual bug is more likely that individual screens aren't consuming `useSafeAreaInsets()`/`SafeAreaView` in their layout code, not a missing top-level provider. Worth a quick codebase check before writing the phase plan, since the fix differs (add a provider vs. add insets usage per-screen).
- **Expo Router exit-guard API name:** the "confirm before navigating away from unsaved state" hook has been named differently across React Navigation versions (`beforeRemove`, `usePreventRemove`, etc.). Confirm the exact current API against the SDK-57-bundled Expo Router version at implementation time rather than trusting a specific tutorial.

## Sources

- https://docs.expo.dev/versions/latest/sdk/safe-area-context/ — official Expo docs, HIGH confidence on the "Expo Router wires SafeAreaProvider automatically" claim
- https://docs.expo.dev/develop/user-interface/safe-areas/ — official Expo docs, HIGH confidence, confirms `SafeAreaView` vs `useSafeAreaInsets` as the two supported approaches
- https://www.nngroup.com/articles/confirmation-dialog/ — Nielsen Norman Group, HIGH confidence, "when to use confirmation dialogs" and "don't overuse them" guidance
- https://www.nngroup.com/articles/cancel-vs-close/ — Nielsen Norman Group, HIGH confidence, exit-vs-cancel UX distinctions
- Duolingo lesson-exit pattern (header X + confirmation dialog forfeiting progress) — MEDIUM confidence, WebSearch-sourced synthesis of multiple UX-writing articles describing this specific real-world example, not independently re-verified by hands-on testing of the live app
- Stale-while-revalidate / cache-then-network pattern for React Native offline-first apps — MEDIUM confidence, consistent across multiple independent WebSearch sources (Medium/DEV.to write-ups); this is standard, widely-agreed ecosystem practice, not a single-source claim
- Loading-state guidance (skeleton vs. spinner, when to use each) — MEDIUM confidence, WebSearch synthesis, directionally consistent with general mobile UX consensus but not from a single canonical source
- Internal: `.planning/PROJECT.md` — HIGH confidence, authoritative for this project's existing v0.0 architecture, invariants (filters-snapshot-at-startQuiz), and explicit scope decisions (no partial results, no persistence beyond a session)

---
*Feature research for: Portuguese Verb Conjugation App — Mobile, v0.1 milestone*
*Researched: 2026-07-13*
