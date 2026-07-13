# Project Research Summary

**Project:** Portuguese Verb Conjugation App — Mobile
**Domain:** iOS-first Expo React Native offline-first quiz app, v0.1 milestone (online content fetch + offline fallback/caching, end-quiz-early flow, safe-area/UI polish)
**Researched:** 2026-07-13
**Confidence:** HIGH (all four research files are grounded in direct reads of the actual shipped v0.0 codebase — `src/store/useQuizStore.ts`, `src/quiz/engine.ts`, `app/*.tsx`, `package.json` — not generic ecosystem patterns, with supporting library/version claims verified against npm and official Expo/RN/TS docs)

## Executive Summary

This is a small, already-shipped (v0.0) offline-first Expo/React Native quiz app entering its second milestone (v0.1), which adds three loosely-related capabilities: fetching quiz content from a not-yet-built backend endpoint with a bulletproof offline fallback, letting users exit a quiz mid-session with a confirmation, and fixing a known safe-area/visual-polish gap. All four research streams converge on the same architectural thesis: the existing v0.0 design (a pure/synchronous quiz engine, a single Zustand store acting as a state machine, Zod schemas already used for the feedback payload and dataset validation) is sound and should be extended, not replaced. The single highest-leverage move for the whole milestone is a small, mechanical refactor — making `generate()` accept a `Verb[]` parameter instead of importing the static dataset at module scope — because every other v0.1 feature (fetch-with-fallback, dataset snapshotting, exit-flow correctness) depends on that seam existing first.

The recommended approach: keep the engine 100% synchronous and pure (resolve remote-vs-local data *above* it, in the store), reuse the existing Zod validation infrastructure for the fetched payload exactly as it's used for the bundled dataset (never trust fetched JSON on TypeScript types alone), reuse the existing `reset()` primitive for quiz abandonment rather than inventing new store state, and fix the safe-area bug by wrapping `SafeAreaProvider` once at the Expo Router root (`app/_layout.tsx`) plus auditing each screen's existing hardcoded padding for double-padding regressions. Stack-wise, only one genuinely new dependency is needed (`@react-native-async-storage/async-storage`, for caching fetched content across app restarts) — everything else (native `fetch` + `AbortController`, existing Zod schemas, RN core `Alert.alert`, already-installed `react-native-safe-area-context`) is either already in the project or needs zero new install.

The key risks are almost all "looks done but isn't" correctness gaps rather than unknowns: (1) skipping runtime `.parse()` validation on fetched content, repeating a debt this project has already flagged once for the feedback payload; (2) a three-tier fallback (fresh fetch → cache → bundled dataset) that's missing the "no cache AND fetch failed" branch, breaking first-launch-no-network — the single worst possible first impression; (3) relying on `gestureEnabled: false` alone to block iOS swipe-back on the Quiz screen, which multiple open Expo/RN GitHub issues confirm is unreliable — a `beforeRemove` navigation listener is required instead; and (4) Zustand async-action stale-closure/race bugs between an in-flight content fetch and a user tapping "Start Quiz," which must never block or falsely error the Start button (the core "open the app, start a quiz" value must not regress).

## Key Findings

### Recommended Stack

The v0.0 stack (Expo SDK 57 / RN 0.86, Expo Router 6, TypeScript 5.x — explicitly not 7.x yet, Zustand 5, Zod 4, `jest-expo`, native `fetch`, RN core `Share`) is locked and unchanged. v0.1 adds exactly one new dependency and reuses everything else already installed or already in code.

**Core technologies:**
- `@react-native-async-storage/async-storage` (via `npx expo install`, never a raw npm pin): persist the last-known-good fetched dataset across app restarts, so there's something to fall back to before the next network attempt — a genuinely new requirement (v0.0's "no persistence" scope was about quiz-session state, not content caching).
- `react-native-safe-area-context` (already installed, `~5.7.0`): fixes the safe-area bug — this is a wiring gap (`SafeAreaProvider` never mounted at root), not a missing package.
- Native `fetch` + manual `AbortController` (same pattern as existing `src/feedback/submit.ts`, but a much shorter 2-5s timeout since this fetch is on the critical path to quiz start, unlike the fire-and-forget feedback call).
- Existing Zod dataset schema (`src/dataset/validate.ts`): reused as-is to validate any fetched payload — do not write a second parallel schema.
- RN core `Alert.alert()` for the exit-quiz confirmation — a system dialog is the right tool for a plain two-button destructive confirmation; no need for a custom modal.

Explicitly avoid: MSW (over-engineered for one GET endpoint), a standalone mock server process, `react-native-mmkv` (no throughput need at this scale), and a custom `Modal` for exit confirmation (over-scoped for text + two buttons).

### Expected Features

**Must have (table stakes) for v0.1:**
- Local bundled dataset always works even if fetch never happens — non-negotiable, this is the app's core value.
- Cached/local content shown immediately with zero blocking spinner before Setup/Quiz is usable (stale-while-revalidate, not a network gate).
- Silent, non-blocking fallback on any fetch failure (unreachable, slow/timeout, malformed JSON) — treated identically, validated via the existing Zod schema.
- Header exit ("X") control on the Quiz screen, with a confirmation dialog before discarding progress, that also intercepts swipe-back/hardware-back (not just the button).
- Exiting fully discards progress and returns to Setup with no partial results shown (explicit product decision, already recorded).
- Safe-area-correct layout; legible baseline typography/spacing and clear right/wrong feedback color.

**Should have (cheap differentiators, add if time allows within v0.1):**
- Question-progress indicator ("Question X of 10") — derives directly from existing store state, no new logic.
- Distinct exit-dialog button labels ("Quit Quiz"/"Keep Practicing") instead of generic OK/Cancel — free.
- Subtle answer-selection feedback animation via RN's built-in `Animated`/`LayoutAnimation` (not Reanimated/Lottie).

**Defer (v0.2+):**
- Full local sync/database layer (SQLite/WatermelonDB) — massive overkill for a ~50-row dataset.
- Persisting the remote dataset merge/conflict-resolution logic — precedence rule only (remote-if-valid-this-session, else local), no merging.
- Resume-in-progress / partial-results on abandonment — explicitly excluded by product decision.
- Theming/dark mode, heavy animation libraries — no signal requested, disproportionate effort.

### Architecture Approach

The existing codebase already separates concerns cleanly (`src/dataset/` for data, `src/quiz/engine.ts` for pure quiz generation, `src/store/useQuizStore.ts` as the sole state machine, `src/feedback/` fully decoupled). v0.1 extends this without restructuring: two new files, `src/dataset/remote.ts` (network mechanics, mirrors `submit.ts`'s fetch+AbortController pattern) and `src/dataset/source.ts` (the fallback-decision orchestrator, `resolveVerbs()` that always resolves, never rejects). The engine gains one parameter (`verbs: Verb[]`) instead of a module-scope import, preserving its pure/sync/deterministic-under-injected-RNG contract untouched — no test becomes async. The store gains exactly one new status (`"loading"`) and an `abandonQuiz` action that's semantically a thin alias for the existing `reset()`. Screens become thin consumers: `index.tsx`/`results.tsx` need an `await` fix on `startQuiz` (currently racing a synchronous status read against what will become an async call), and `quiz.tsx` must read the resolved verb list from the store (`datasetVerbs`) rather than re-importing the static dataset, or lookups silently diverge once the active session was generated from remote data.

**Major components:**
1. `src/dataset/source.ts` — orchestrates remote-fetch-then-local-fallback, the only module that knows "remote vs. local" exists.
2. `src/store/useQuizStore.ts` — owns the entire async fetch → generate → in-progress state machine; screens never orchestrate this themselves.
3. `src/quiz/engine.ts` — stays pure/sync, now receives `verbs` as an explicit argument rather than importing it.
4. `app/_layout.tsx` — single root `SafeAreaProvider` wrap; screens consume `useSafeAreaInsets()` individually.

### Critical Pitfalls

1. **Engine hardcodes the local dataset, no seam for fetched data** — refactor `generate()` to take `verbs` as a parameter *before* writing any fetch code; run the full existing test suite as the safety net for this being additive-only.
2. **Race between in-flight fetch and "Start Quiz" tap** — never block the Start button on network; add an explicit resolved-pool state the store reads synchronously, never await inside `startQuiz`'s trigger path in a way that risks a false `InsufficientVerbsError` on cold start.
3. **Mock-to-real-backend contract drift with no runtime validation** — this project already paid down this exact debt once for `POST /feedback`; `.safeParse()` every fetched response against the existing Zod schema and treat validation failure identically to a network failure, never just TypeScript-type-annotate the response.
4. **Cache masks a working backend / breaks on first launch with no cache and no network** — implement the three-tier fallback (fresh fetch → cache → bundled dataset) as an explicit truth table, and explicitly test the "no cache AND fetch throws" branch, not just the happy paths.
5. **iOS swipe-back gesture bypasses the exit confirmation** — `gestureEnabled: false` is confirmed unreliable on iOS per multiple open Expo/RN GitHub issues; use React Navigation's `beforeRemove` listener and verify with an actual device/simulator swipe, not just an in-app button tap.

## Implications for Roadmap

Based on combined research, the dependency chain across the three feature areas strongly suggests this phase order:

### Phase 1: Dataset seam refactor + fetch/fallback pipeline
**Rationale:** Nothing else in v0.1 can proceed meaningfully until the engine accepts an injected verb pool; this is the prerequisite for both content-fetching and safe testing of fallback behavior. Fully unit-testable in isolation (mock `fetch`, assert fallback-on-failure) with zero external dependents yet.
**Delivers:** `generate(verbs, options, random)` parameterized; `src/dataset/remote.ts` + `src/dataset/source.ts`; runtime Zod validation of any fetched payload; a mocked/stubbed swappable backend endpoint per PROJECT.md's explicit scoping.
**Addresses:** "Local dataset always works" table stakes, "silent non-blocking fallback" table stakes.
**Avoids:** Pitfall 1 (engine hardcoding), Pitfall 4 (mock-to-real drift with no validation).

### Phase 2: Store integration (async startQuiz, loading state, dataset snapshot)
**Rationale:** Depends on Phase 1's resolved-verbs seam; this is where the race-condition and stale-closure risks live, so it needs its own careful design pass before touching screens.
**Delivers:** New `"loading"` status; async `startQuiz()` sequencing `resolveVerbs()` → `generate()`; `datasetVerbs` held in store; dataset-source snapshot at `startQuiz()` time (preserving the existing filters-snapshot invariant).
**Uses:** Zustand 5 (already locked); existing `InsufficientVerbsError` handling extended, not replaced.
**Implements:** Pattern 1 (data-source injection into a pure engine) and Pattern 2 (fetch-with-fallback via single orchestrator) from ARCHITECTURE.md.
**Avoids:** Pitfall 2 (race between in-flight fetch and Start tap), Pitfall 3 (stale-closure bugs in async Zustand actions).

### Phase 3: Persistence/caching layer
**Rationale:** Only makes sense once the fetch/fallback pipeline (Phase 1-2) exists to cache the output of. Introduces the project's first-ever persistence dependency, so its own Jest-mocking setup must land before any caching business logic is written.
**Delivers:** `@react-native-async-storage/async-storage` wired via `npx expo install`; three-tier fallback (fresh fetch → cache → bundled dataset); explicit Jest mock (`jest/async-storage-mock`) with assertions on actual call arguments, not just downstream branching.
**Uses:** AsyncStorage (new dependency, STACK.md).
**Avoids:** Pitfall 5 (cache masks stale/broken backend, or fails on empty-cache+no-network), Pitfall 6 (AsyncStorage untested/under-mocked in Jest).

### Phase 4: End-quiz-early flow
**Rationale:** Independent of the fetch/caching work (only lightly touches the same screens), but should follow Phase 2's store changes since the exit action needs to interoperate cleanly with the new `"loading"` status (e.g., can you exit while content is still loading?).
**Delivers:** Header "X" exit control on Quiz screen; `Alert.alert` confirmation with distinct button labels; `abandonQuiz` action reusing the existing `reset()` primitive; `beforeRemove` navigation listener intercepting swipe-back/hardware-back; exit-control visibility gated strictly on `status === "in-progress"`.
**Implements:** Pattern 3 (abandon-quiz as reuse of `reset()`) from ARCHITECTURE.md.
**Avoids:** Pitfall 7 (partial reset corrupting next `startQuiz()`), Pitfall 8 (swipe-back bypass).

### Phase 5: Safe-area fix + baseline visual polish
**Rationale:** Cheapest to land alongside the screen edits already happening in Phase 4 (same files touched), and should follow the SafeAreaProvider wiring specifically before broader spacing/typography work to avoid rework once real insets are applied — per FEATURES.md's explicit dependency note.
**Delivers:** `SafeAreaProvider` wrapped once at `app/_layout.tsx` root; per-screen audit removing now-redundant hardcoded padding (e.g., `results.tsx`'s `paddingTop: 64`); consistent spacing/typography/color tokens across Setup/Quiz/Results; styled loading/error states for the new fetch step; optional progress indicator and answer-feedback animation if time allows.
**Avoids:** Pitfall 9 (SafeAreaProvider wired at wrong layer, or double-padding from leftover manual margins).

### Phase Ordering Rationale

- The engine/data seam (Phase 1) is a hard prerequisite for everything else touching data flow — landing it first with the existing 122-test suite as a regression guard is the single most de-risking move available.
- Caching (Phase 3) is scoped as an explicit, separate decision from fetch/fallback (Phase 1-2) because it reopens a previously-closed scope line ("no persistence beyond a single quiz session") — FEATURES.md flags this should not be smuggled in as an implementation detail.
- End-quiz-early (Phase 4) and safe-area polish (Phase 5) are architecturally independent of the data-fetching work but share the same three screen files, so sequencing them together (rather than as 4 separate screen-touching passes) minimizes redundant edits — this is ARCHITECTURE.md's explicit "Suggested Build Order" recommendation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Store integration):** the exact current Expo Router/React Navigation API surface for `beforeRemove`/gesture interception should be re-verified against the SDK-57-bundled version at implementation time — FEATURES.md flags this as an "important finding to verify in codebase," not settled by ecosystem research alone.
- **Phase 3 (Persistence/caching):** AsyncStorage's Jest mocking wiring and any SDK-57-specific Android/Gradle caveats (irrelevant to iOS-only scope now, but worth a quick sanity check) warrant a focused look before writing caching logic.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Dataset seam refactor):** well-documented, standard "parameterize a pure function" refactor with existing tests as the safety net — HIGH confidence, no ecosystem uncertainty.
- **Phase 4 (End-quiz-early):** the `Alert.alert()` + `reset()` reuse pattern is fully specified in ARCHITECTURE.md with working code examples; the one open question (exact `beforeRemove` API name) is a quick verification, not a research task.
- **Phase 5 (Safe-area/visual polish):** root cause and fix are already directly confirmed via codebase reads (installed-but-unwired dependency); this is an implementation task, not a research one.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core versions verified against npm `latest` dist-tags and official Expo changelogs; the one new dependency (AsyncStorage) has a flagged MEDIUM-confidence Android-only caveat that's explicitly irrelevant to this iOS-first milestone. |
| Features | MEDIUM | Feature landscape and prioritization are well-established (NN/g sources, Duolingo pattern analysis), but two specifics — the exact Expo Router gesture-guard API name and the true safe-area root cause — are flagged as needing codebase-level verification, not just ecosystem research (this was subsequently done directly in ARCHITECTURE.md/PITFALLS.md by reading the actual files). |
| Architecture | HIGH | Every finding is grounded in direct reads of the actual shipped v0.0 code, not generic patterns — includes concrete before/after code diffs for each proposed change. |
| Pitfalls | MEDIUM-HIGH | Grounded in direct repo inspection plus verified GitHub issues (gesture-disable unreliability) and official AsyncStorage/Jest docs; a small number of claims (e.g. `beforeRemove` pattern generality) rely on general React Navigation ecosystem knowledge rather than a freshly re-fetched source this session. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact Expo Router/React Navigation gesture-interception API name and behavior** for the SDK-57-bundled Router version — confirm at Phase 4 implementation time rather than trusting older tutorials (both FEATURES.md and PITFALLS.md flag this).
- **Safe-area root-cause confirmation** — research suggests Expo Router may auto-wire `SafeAreaProvider` for its own routes in some versions, which would mean the real bug is missing per-screen inset consumption rather than a missing root provider; ARCHITECTURE.md's direct codebase read confirms no provider is wired at all in this project, so this gap is effectively resolved, but worth a final visual-device check during Phase 5.
- **Real backend content-endpoint shape** does not exist yet; all Phase 1 fetch work is built against a local mock/stub swappable via a one-line URL change. The actual contract-drift risk (mirroring the `POST /feedback` enum-literal cross-repo risk already documented in CLAUDE.md) can only be fully closed once the sibling `portuguese-verb-api` repo ships the real endpoint — track this as an open cross-repo risk, not a gap in this research.

## Sources

### Primary (HIGH confidence)
- Direct reads of the shipped codebase: `src/store/useQuizStore.ts`, `src/quiz/engine.ts`, `src/quiz/types.ts`, `src/dataset/verbs.ts`, `src/dataset/types.ts`, `src/dataset/validate.ts`, `src/feedback/submit.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `package.json`, `.planning/PROJECT.md`
- npm registry `latest` dist-tags (expo, expo-router, zustand, jest-expo, jest, zod, typescript, react-native, expo-sharing, @react-native-async-storage/async-storage)
- https://docs.expo.dev/versions/latest/sdk/safe-area-context/ and https://docs.expo.dev/develop/user-interface/safe-areas/ — official Expo docs

### Secondary (MEDIUM confidence)
- https://www.nngroup.com/articles/confirmation-dialog/ and /cancel-vs-close/ — Nielsen Norman Group UX guidance
- GitHub `expo/expo` issues #31614 and #28052 — iOS swipe-gesture disable unreliability
- react-native-async-storage.github.io Jest integration docs — explicit mock wiring requirement
- Duolingo lesson-exit pattern and stale-while-revalidate offline-first pattern — WebSearch synthesis, cross-source consistent

### Tertiary (LOW confidence)
- General React Navigation `beforeRemove` ecosystem knowledge — not freshly re-fetched this session, standard/well-established pattern but flagged for re-verification against the exact SDK-57-bundled API surface at implementation time.

---
*Research completed: 2026-07-13*
*Ready for roadmap: yes*
