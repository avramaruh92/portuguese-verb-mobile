# Pitfalls Research

**Domain:** Adding async content-fetching + fallback, persistence/caching, exit-quiz flow, and retroactive SafeAreaProvider wiring to an existing offline-first Expo/React Native quiz app (Zustand + Expo Router)
**Researched:** 2026-07-13
**Confidence:** MEDIUM-HIGH (grounded in direct reading of this repo's actual source — `src/store/useQuizStore.ts`, `src/quiz/engine.ts`, `app/quiz.tsx`, `app/_layout.tsx`, `package.json` — plus verified web sources for RN/Expo-specific gotchas)

## Critical Pitfalls

### Pitfall 1: The quiz engine hardcodes the local dataset — fetched data has nowhere to go

**What goes wrong:**
`src/quiz/engine.ts`'s `generate()` imports `verbs` directly from `../dataset/verbs` (`import { verbs } from "../dataset/verbs"`) rather than receiving a verb list as a parameter. `app/quiz.tsx` also imports `verbs` directly (line 7, `const currentVerb = verbs.find(...)`) to look up the translation for display. If v0.1 fetches a backend-served verb list, there is currently no seam for that data to reach `generate()` or the Quiz screen — a naive implementation either (a) mutates/monkey-patches the imported `verbs` array (fragile, breaks module purity and test isolation), or (b) forks `generate()` into two versions (local vs. remote), silently reintroducing the exact kind of drift this codebase has been careful to avoid (see the `TENSES`/`SUBJECTS` single-source-of-truth pattern already used in `src/feedback/schema.ts`).

**Why it happens:**
v0.0 had exactly one dataset source, so parameterizing felt like unnecessary abstraction at the time. Adding a second source (backend) without first refactoring the seam is the path of least resistance under time pressure, and the pure/deterministic engine tests (which currently only exercise the bundled 50-verb set) won't catch it since they never inject an alternate verb list.

**How to avoid:**
Before wiring any fetch logic, refactor `generate(options, random)` to `generate(options, verbPool, random)` (or thread the verb pool through `GenerateOptions`), with the bundled `verbs` import becoming the *default fallback value* passed explicitly at the call site (in the store, not the engine). Do this refactor as its own commit/phase step with the existing 122 tests as the safety net — if they still pass unchanged (just adding an explicit default argument at call sites), the seam is non-breaking. Also thread the same pool into whatever resolves `currentVerb` in `app/quiz.tsx` — it must use the same fetched-or-fallback list the quiz was generated from, not a re-import of the static bundle, or a fetched-only verb (not in the bundle) will show a blank translation.

**Warning signs:**
Two different code paths both claiming to "generate a quiz"; any file other than the store importing `verbs` directly once fetch exists; a test that only ever exercises the bundled dataset even after "online content" ships.

**Phase to address:**
The engine/data-seam refactor should be its own first step in the "online quiz content" phase, landed and tested *before* any network code is written.

---

### Pitfall 2: Race between in-flight fetch and user tapping "Start Quiz"

**What goes wrong:**
`startQuiz()` in `useQuizStore` is currently fully synchronous — it calls `generate()` and `set()`s in the same tick, with no `await` anywhere in the store. Once fetch is introduced (e.g., fetch verb content on app load or on Setup-screen mount), there's a window where the fetch is in flight and the user taps Start before it resolves. Naive handling either (a) blocks the Start button until fetch settles (bad UX — v0.0's core value is "open the app, start a quiz" with zero latency), or (b) lets `startQuiz` run against a `null`/empty pool mid-fetch, throwing `InsufficientVerbsError` even though a full dataset would shortly be available, surfacing a false "not enough verbs" error to the user.

**Why it happens:**
Zustand's synchronous `set`/`get` pattern doesn't naturally force you to think about "what state are we in *while* async work is outstanding" the way a suspense boundary or loading-state machine would — it's easy to bolt an `async fetchContent()` action onto the store without adding a first-class loading/ready state that `startQuiz` actually checks against.

**How to avoid:**
Add an explicit `contentStatus: "loading" | "ready" | "fallback"` (or similar) field to the store, set once at app start (fetch → `ready` with remote data, or on failure/timeout → `fallback` with the bundled dataset — never left in `"loading"` indefinitely). `startQuiz()` should read whichever pool is *currently resolved* (remote or local fallback), never block on an in-flight promise. If the fetch hasn't resolved by the time the user reaches Setup, start against the local bundle immediately and swap silently for next time — never make the user wait on a spinner before they can pick tenses, since that regresses the "open the app, start a quiz" core value explicitly called out in `PROJECT.md`.

**Warning signs:**
Any `await` inside `startQuiz` or inside a component's press handler for the Start button; a loading spinner gating the Setup screen; `InsufficientVerbsError` appearing in manual testing only on cold app starts (a strong signal the fetch hadn't resolved yet).

**Phase to address:**
Design the store's async content-loading state machine explicitly as part of the fetch-and-fallback phase, before touching the Setup screen's Start button wiring.

---

### Pitfall 3: Stale-closure bugs in Zustand async actions

**What goes wrong:**
A common Zustand mistake when adding an async action is capturing `get()`'s snapshot once at the *start* of the async function and using it after the `await`, rather than re-calling `get()` after each await point. Example failure mode here: an async `fetchContent()` action that reads `get().status` before the fetch, awaits the network call, and then unconditionally `set()`s the result — even if the user has since started and finished a quiz using the fallback dataset in the meantime. This can silently overwrite in-progress quiz state or flip `contentStatus` back to `"loading"`→`"ready"` mid-session in a way that has nothing to do with the active quiz, but shares the same store and could trigger unwanted re-renders or reset assumptions if fields aren't carefully scoped.

**Why it happens:**
Zustand's ergonomic single-store pattern (already the reason it was chosen for this project) makes it easy to add unrelated concerns (content-loading state) into the same store as quiz-session state without namespacing them, so an async action's `set()` call touches more of the store's shape than it should, or reads it stale.

**How to avoid:**
Keep content-fetch state (`contentStatus`, `verbPool`, `lastFetchedAt`) in a separate store (or a clearly namespaced slice) from quiz-session state (`session`, `currentIndex`, `answers`, `filters`), so an async content refresh can never accidentally clobber an in-progress quiz. Inside any async action, always call `get()` fresh immediately before each `set()` rather than trusting a variable captured before the `await`. Add a unit test that starts a quiz, then resolves a slow-pending fetch, and asserts the in-progress quiz session is untouched.

**Warning signs:**
A single `set()` call inside an async function that spans multiple unrelated concerns (e.g., updates both `contentStatus` and `session` in one call); tests for the async action that never simulate "another action fired while this one was pending."

**Phase to address:**
Store-architecture phase for content fetching — decide the slice boundary explicitly before writing `fetchContent()`.

---

### Pitfall 4: Mock-to-real-backend swap silently changes shape — no runtime validation at the seam

**What goes wrong:**
This is the read-side mirror of the `POST /feedback` payload risk already documented in this project's own history (`CLAUDE.md`'s cross-repo contract warning, and `PROJECT.md`'s note that `feedbackPayloadSchema` is *not* runtime-`.parse()`'d before dispatch — an explicitly flagged piece of debt). For the new content-fetching endpoint, the real backend doesn't exist yet; this milestone builds against a local mock/stub. If the mock is typed only at compile time (a hand-written TS interface, no runtime schema) and the eventual real endpoint returns a shape that's subtly different (different field names, different tense/subject enum casing, missing conjugation cells, extra wrapper object), TypeScript provides zero protection at runtime — the app will crash or silently show broken/undefined conjugations in production, with no error surfaced until a user hits it, potentially far after the swap ships.

**Why it happens:**
When the backend doesn't exist yet, the natural inclination is to treat the mock as "obviously correct" since you wrote both sides — but the entire value of a validation boundary is protecting against the OTHER side changing later, by another repo/team, on its own timeline.

**How to avoid:**
Define the fetched-content Zod schema now, as the single source of truth, exactly the way `src/dataset/validate.ts` presumably already does for the bundled dataset (verify this) — reuse or extend that same schema for the fetched payload rather than inventing a parallel shape. Actually `.safeParse()` every fetch response at runtime (not just at compile time), and treat a validation failure exactly like a network failure: fall back to the local bundled dataset and log/report it, never crash and never render partially-parsed data. Keep the mock's response literally generated *from* the Zod schema (e.g., `schema.parse(mockFixture)` in a test, or construct the mock fixture as a schema-conformant object) so drift between mock and schema is caught immediately in tests, not just at integration time with the real backend later. When the real backend ships, the swap should be "point the fetch URL at the live host" — if it requires any code changes beyond the URL/env var, the seam wasn't built cleanly.

**Warning signs:**
A `fetch(...).then(res => res.json())` with only a TypeScript type annotation (`as VerbContentResponse`) and no `.parse()`/`.safeParse()` call; the mock fixture hand-written separately from the schema instead of validated against it; no test that intentionally malforms the mock response and asserts fallback-to-local behavior.

**Phase to address:**
Should be a named acceptance criterion of the fetch-and-fallback phase itself (not deferred) — this project has already paid down exactly this class of debt once (feedback payload) and flagged it explicitly as "revisit"; don't reintroduce the same gap on the read side.

---

### Pitfall 5: First-ever persistence layer — cache silently masks a working (or newly-fixed) backend

**What goes wrong:**
This app has had zero persistence through all of v0.0 (`PROJECT.md`'s Out of Scope section is explicit: "no persistence beyond a single quiz session — deliberate product scope"). Introducing AsyncStorage (or similar) for caching fetched verb content is a genuinely new capability, and the most common mistake is caching the fetched response with no invalidation strategy — once cached, the app may keep serving stale content indefinitely even after the backend is fixed/updated, because nothing ever re-checks freshness. A related but opposite failure: the very first launch, with an empty cache AND no network (e.g., airplane mode, first run right after install before any connectivity), must still resolve to the local bundled dataset — if the fallback logic only triggers on a *failed fetch* and not on *"cache empty and fetch also failed,"* the user sees a blank/broken Setup screen on first run with no connectivity, the single worst possible first impression for this app.

**Why it happens:**
Cache-then-fetch logic is usually written for the "happy path" (cache exists → fetch → update cache) and the true first-launch-no-cache-no-network case is easy to skip in manual testing (developers almost always have a warm simulator/device with network).

**How to avoid:**
Treat "resolved content pool" as a three-tier fallback chain, always in this order: (1) fresh fetch succeeds → use it, cache it; (2) fetch fails/times out but a cache exists → use cache, don't re-block on network; (3) fetch fails AND no cache exists (true first launch, no connectivity) → use the bundled local dataset, the one guaranteed-always-available source. Never let (3) be reachable only through a code path that assumes a cache read always returns *something*. Explicitly unit-test the "no cache + fetch throws" case, not just "cache exists + fetch throws." Add a lightweight cache TTL (e.g., re-fetch if cached content is older than N hours/days) rather than caching forever, so a backend fix or content update actually reaches users — but don't over-engineer this for a single-milestone content set that's expected to change rarely.

**Warning signs:**
Fallback logic that only has two branches (fetch succeeded / fetch failed→cache) with no explicit "cache is also empty" branch; no TTL or cache-busting mechanism at all (stale-forever); manual QA never actually tested a cold install with no network.

**Phase to address:**
The caching/persistence phase — write the three-tier fallback as an explicit truth table before implementing, and add it to that phase's test plan.

---

### Pitfall 6: AsyncStorage untested or under-mocked in Jest, silently passing tests that don't exercise real behavior

**What goes wrong:**
`jest-expo` (already the project's preset) does not automatically mock `@react-native-async-storage/async-storage` — it needs its own explicit Jest mock wiring (either the package's own `jest/async-storage-mock` or a manual `__mocks__` directory), and it must also be added to `transformIgnorePatterns` alongside the RN/Expo module list already implicitly handled by the `jest-expo` preset. Skipping this means tests either throw on `NativeModule` access, or worse, get a default auto-mock that silently returns `undefined` for every call, so a `getItem`/`setItem` cache test can pass with an empty implementation and prove nothing.

**Why it happens:**
The project has 122 passing tests today with zero storage-related mocking configured (there was no storage layer to mock). Adding AsyncStorage without also adding its Jest mock is easy to miss because Jest doesn't loudly fail — a bad auto-mock can make assertions pass for the wrong reason (e.g., asserting `cache).toBeNull()` after a "failed write" when actually nothing was ever really invoked).

**How to avoid:**
Wire `jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))` explicitly (in a setup file referenced by `package.json`'s `jest.setupFiles`, or per-test-file), and write at least one test that asserts the mock's `getItem`/`setItem` were actually called with the expected key/value — not just that the surrounding logic branched correctly. Confirm this mock is wired *before* writing the caching logic's tests, as a first step of that phase, so the safety net exists before it's needed. If choosing `expo-sqlite`/`expo-file-system`-based storage instead of AsyncStorage, verify jest-expo's mocking story for whichever module is chosen — don't assume it's automatically covered just because `jest-expo` is the preset.

**Warning signs:**
Storage-related tests that pass without any explicit assertion on the mock's call arguments; no `__mocks__` directory or `jest.mock(...)` call anywhere referencing the storage package; CI green but a real device shows caching isn't actually persisting anything.

**Phase to address:**
First task of the persistence/caching phase, before any caching business logic is written — establish the test harness first.

---

### Pitfall 7: "End quiz early" doesn't fully reset store state, corrupting the next `startQuiz()`

**What goes wrong:**
`useQuizStore` already has a `reset()` action that restores `initialState` wholesale — this is the correct building block for exit-quiz. The pitfall is a new "exit" handler that does a partial reset instead (e.g., only setting `status: "idle"` and navigating back, while leaving stale `session`, `answers`, or `lockedChoice` values in the store). Because `startQuiz()` already unconditionally overwrites `session`/`currentIndex`/`answers`/`lockedChoice` on every call, a subsequent full quiz start is *probably* safe even with stale leftovers — but any UI code added for the exit flow that reads store fields *before* `startQuiz()` runs again (e.g., a Setup-screen "resume?" affordance, or a Results-adjacent screen that peeks at `answers.length`) could read stale data from the abandoned session. Additionally, exiting on the very last question (after `advance()` has already flipped `status` to `"completed"` but before the Results screen has rendered/navigated) is an edge case: the exit control's visibility logic must account for "there is no 'in-progress' quiz to exit anymore, this is now effectively Results" — attempting to fire the exit-confirmation dialog after the quiz already auto-completed is a confusing double-prompt.

**Why it happens:**
`reset()` already exists and is well-tested for the *idle-to-quiz* transition, so it's tempting to assume any "go back to Setup" action can just call `router.replace("/")` without also calling `reset()` — but Expo Router unmounting the Quiz screen does NOT reset the Zustand store (Zustand state is global/module-level, independent of component lifecycle). The last-question edge case is easy to miss because it only reproduces in the narrow timing window between `advance()` completing and the screen's own `router.replace("/results")` call in `handleAdvance()`.

**How to avoid:**
The exit-quiz action should call the *existing* `reset()` (not a new bespoke partial reset) before/as part of navigating back to Setup — reuse the tested primitive rather than duplicating reset logic. Guard the exit control's render condition on `status === "in-progress"` specifically (not just "on the quiz screen"), so it's automatically hidden once `status` flips to `"completed"` — mirroring the same `lockedChoice === null` conditional-visibility pattern already used for the Next/Report buttons in `app/quiz.tsx`. Add a unit test: start a quiz, exit early, then start a new quiz — assert every field matches a freshly-idle store, not just `status`.

**Warning signs:**
A new store action that doesn't call `reset()` but manually lists out fields to clear (drift risk if `initialState` gains new fields later); an exit button that's visually present for one frame on the final question's Results transition; any test asserting only `status` after an exit, not the full state shape.

**Phase to address:**
End-quiz-early phase — implement as "call existing `reset()` + navigate," add the full-state-equality test as an explicit acceptance check.

---

### Pitfall 8: iOS swipe-back gesture bypasses the in-app exit confirmation entirely

**What goes wrong:**
Expo Router's `Stack` (already in use in `app/_layout.tsx` with `headerShown: false`) enables the native iOS interactive swipe-back gesture by default. A user can swipe from the left edge to leave the Quiz screen mid-session without ever triggering the planned in-app "progress will be lost" confirmation dialog — silently abandoning the quiz (and, per Pitfall 7, leaving the store in a stale state if `reset()` isn't also wired to fire on this path). Multiple open Expo/React Navigation issues confirm that `gestureEnabled: false` in `screenOptions` is unreliable for fully suppressing this on iOS in current Expo Router versions — it is not a guaranteed fix.

**Why it happens:**
The confirmation dialog is naturally built as an in-app button's `onPress` handler, which developers assume is the *only* way to leave the screen — the native swipe gesture is a separate, parallel navigation trigger that doesn't route through any in-app JS handler unless explicitly intercepted.

**How to avoid:**
Do not rely solely on `gestureEnabled: false` to solve this (per verified GitHub issues, it may not reliably block the gesture on iOS). Instead, intercept the *result* of any back-navigation on the Quiz screen using Expo Router's `useNavigation` + the underlying React Navigation `beforeRemove` event listener (`navigation.addListener('beforeRemove', (e) => { if (status === 'in-progress') { e.preventDefault(); /* show confirm dialog */ } })`) — this is the standard React Navigation pattern for intercepting *any* removal of a screen (swipe, hardware back, programmatic), not just an in-app button press, and is the documented way to guard against gesture-based bypass. Test this specifically on a physical iOS device or simulator with the swipe gesture, not just by tapping an in-app exit button — the two paths are genuinely different code paths and passing tests for one doesn't imply the other works.

**Warning signs:**
An exit-confirmation implementation that only exists inside a `Pressable`'s `onPress`; manual QA that never actually performed the physical/simulator swipe gesture; `gestureEnabled: false` assumed sufficient without device verification.

**Phase to address:**
End-quiz-early phase — the `beforeRemove` listener should be treated as a required part of "exit confirmation," not an edge case bolted on later.

---

### Pitfall 9: SafeAreaProvider wired at the wrong layer, or double-padding from leftover manual margins

**What goes wrong:**
`react-native-safe-area-context` is already an installed dependency (`~5.7.0` in `package.json`) but per `PROJECT.md`'s own tech-debt note, `SafeAreaProvider` is not actually wired anywhere — this is why content currently renders under the status bar/notch. The two most common mistakes when retrofitting it: (1) wrapping `SafeAreaProvider` too low in the tree (e.g., inside each individual screen component) instead of once at the true root (`app/_layout.tsx`, wrapping the `<Stack>`), which either fails to cover all screens or requires repeating the wrap three times with drift risk; (2) after wiring `SafeAreaView`/`useSafeAreaInsets` on each of the three screens (Setup/Quiz/Results), any pre-existing manual top padding/margin in each screen's `StyleSheet` (e.g., `content: { paddingVertical: 24 }` as seen in `app/quiz.tsx`'s current styles) now stacks on top of the safe-area inset, producing a visibly larger-than-intended gap under the notch — a "double padding" regression that's easy to miss since it looks superficially fine, just slightly off.

**Why it happens:**
`SafeAreaProvider` needs exactly one root-level instance to correctly compute insets for the whole app via React Context — Expo Router's file-based routing structure (`app/_layout.tsx` as the single root layout) makes this an obvious, well-documented single location, but it's easy to reach for `SafeAreaView` component wrapping inside individual screens instead, which is the older/less flexible pattern and doesn't compose as cleanly with Expo Router's Stack. The double-padding issue happens because pre-v0.1 screens already hand-rolled fixed vertical padding as a *substitute* for proper safe-area handling, and that substitute code doesn't get removed just because the "real" mechanism is added alongside it.

**How to avoid:**
Wrap `SafeAreaProvider` exactly once, at the root, in `app/_layout.tsx`, around the `<Stack>` (Expo Router's recommended integration point). Then, on each of the three screens, replace ad-hoc top/bottom padding constants with `useSafeAreaInsets()` (preferred over the `SafeAreaView` component for finer control alongside existing `ScrollView`/`StyleSheet` usage already in this codebase) and explicitly audit every existing screen's `StyleSheet` for hardcoded vertical padding that was compensating for the missing safe-area handling (e.g., `app/quiz.tsx`'s `content: { paddingVertical: 24 }`) — reduce or remove those once insets are wired, rather than layering insets on top of them unchanged. Visually verify on a notched simulator (iPhone 15/16 class) and a non-notched one (SE) since the padding difference is most visible on notched devices.

**Warning signs:**
More than one `<SafeAreaProvider>` in the tree; any screen still hardcoding a top padding value equal to roughly a status-bar height (e.g., ~44-50) alongside a newly-added `insets.top`; content that looks fine on a notched simulator but has an oddly large gap compared to before.

**Phase to address:**
UI/safe-area polish phase — should include an explicit pass auditing all three existing screens' `StyleSheet`s for now-redundant manual spacing, not just adding the provider.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skipping runtime `.parse()`/`.safeParse()` on the fetched content response, relying only on TS types | Faster to ship the fetch/fallback happy path | Repeats the exact debt already flagged for `POST /feedback` payloads; a real backend shape change later fails silently or crashes | Never — this project has already logged this exact category as "revisit" debt once; don't reintroduce it on the read side |
| Caching fetched content with no TTL/invalidation ("cache forever") | Simpler first implementation, no expiry logic to write | Backend content fixes/updates never reach users who cached early; effectively permanent staleness | Acceptable only as an explicit, documented interim step for this single milestone (content is expected to change rarely pre-launch) — but must be called out in the phase's decisions, not silently shipped as "done" |
| `gestureEnabled: false` alone as the full exit-confirmation solution, skipping the `beforeRemove` listener | Looks like it solves the problem, faster to write | Confirmed unreliable on iOS per multiple open Expo/RN issues — real users bypass the confirmation via swipe | Never — verify with an actual device/simulator swipe test before considering this done |
| Wrapping `SafeAreaView` per-screen instead of `SafeAreaProvider` once at root | Slightly simpler mental model per file | Drift risk across 3+ screens, harder to add a 4th screen correctly later, doesn't compose well with Expo Router's single root layout | Only for a true one-off screen with no shared layout; not appropriate here given 3 screens already share a `Stack` root |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Mocked backend content endpoint (no real backend yet) | Treating the hand-written mock as "obviously correct" since both sides are authored together; no schema enforcement | Define the Zod schema first as the single source of truth for the response shape; validate the mock fixture against that schema in a test, and `.safeParse()` every real fetch response at runtime, exactly mirroring the `TENSES`/`SUBJECTS` single-source-of-truth pattern already used for the feedback payload |
| `@react-native-async-storage/async-storage` + `jest-expo` | Assuming `jest-expo`'s preset auto-mocks AsyncStorage the way it mocks other Expo/RN native modules | Explicitly wire the package's own `jest/async-storage-mock` (or a manual `__mocks__` entry) and assert against mock call arguments, not just downstream behavior |
| Expo Router `Stack` + iOS swipe-back | Assuming `screenOptions={{ gestureEnabled: false }}` fully disables the interactive swipe gesture | Use the React Navigation `beforeRemove` event listener via `navigation.addListener` to intercept and confirm any screen removal, verified on a physical/simulator swipe, not just an in-app button tap |
| `react-native-safe-area-context` + Expo Router | Wiring `SafeAreaProvider` per-screen instead of once at the Expo Router root `_layout.tsx` | Wrap `SafeAreaProvider` around the root `<Stack>` exactly once in `app/_layout.tsx` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Re-fetching remote content on every Setup-screen mount (no cache-first check) | Every app foreground/navigation-to-Setup triggers a network round-trip, adding latency and battery/data cost | Check cache freshness (TTL) before firing a new fetch; only fetch once per app session or once per TTL window, not per navigation | Noticeable on repeated backgrounding/foregrounding during a single session, or on flaky connections where each Setup visit re-triggers a visible loading flicker |
| Blocking the Setup screen's initial render on the content fetch promise | App feels slow to open compared to v0.0's instant local-dataset start, directly regressing the "open the app, start a quiz" core value | Render Setup immediately against whatever pool is already resolved (cache or bundled fallback); update in place if/when a fresh fetch later resolves | Any cold start with a slow/no network connection — this is not a "10k users" scale problem, it's a first-launch UX problem that shows up immediately |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting fetched content blindly and injecting raw fields (e.g., verb strings, translations) directly into rendered `<Text>` without validating type/shape | A malformed or malicious response (e.g., an unexpectedly long string, wrong type coerced to a string) could cause rendering issues or, if ever templated into anything more dynamic later, injection-style bugs | Runtime-validate with Zod (Pitfall 4) before any fetched field reaches rendering; treat the fetch response as untrusted input just like `POST /feedback`'s response codes are already treated defensively |
| Caching fetched content indefinitely with no integrity check | A stale or tampered cache entry (e.g., from a compromised or misbehaving CDN edge) could persist far longer than the live backend intends | Cache the *validated* (post-Zod-parse) shape only, never the raw response; apply a TTL so any bad cached entry has a bounded lifetime |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|--------------|-------------------|
| Silent fallback to local dataset with zero user-facing indication when the "backend becomes source of truth" claim quietly isn't true (offline/stale) | User has no way to know whether their quiz reflects the latest backend content or a stale/local snapshot — invisible but real behavior difference | Consider a subtle, non-blocking indicator (even just in a settings/about area, not on the critical quiz path) showing content source/freshness — low priority, but at minimum log it for debugging, don't treat "loaded local fallback" as an unremarkable no-op |
| Exit-quiz confirmation dialog that only guards the in-app button, not the swipe gesture (Pitfall 8) | User accidentally swipes away, loses progress with no warning, exact opposite of the confirmation's purpose | Guard both paths via `beforeRemove`, test the swipe path explicitly |
| Exit control still visible/tappable for a frame after the quiz has already auto-completed on the last question | Confusing double-dialog risk ("are you sure you want to exit" on a quiz that's already done) | Gate exit-control visibility strictly on `status === "in-progress"`, matching the existing `lockedChoice === null` conditional-visibility convention already used in `app/quiz.tsx` |

## "Looks Done But Isn't" Checklist

- [ ] **Fetch-and-fallback:** Often missing the "no cache AND fetch failed" third branch — verify a fresh install + airplane mode still loads a working quiz from the bundled dataset
- [ ] **Fetch-and-fallback:** Often missing runtime schema validation on the response — verify a deliberately malformed mock/fixture triggers fallback-to-local rather than a crash or `undefined` conjugations
- [ ] **Caching:** Often missing an actual assertion on `AsyncStorage.setItem`/`getItem` call arguments in tests — verify tests fail if the mock is removed, not just that they pass with it present
- [ ] **End-quiz-early:** Often missing the `beforeRemove` navigation-listener path — verify exit confirmation fires on an actual iOS swipe-back gesture, not only the in-app exit button
- [ ] **End-quiz-early:** Often missing a full-state-equality check after exit — verify every store field (not just `status`) matches a fresh `reset()` before the next `startQuiz()`
- [ ] **SafeAreaProvider wiring:** Often missing an audit of pre-existing manual padding in each screen's `StyleSheet` — verify no screen double-pads by stacking `insets.top` on top of an old hardcoded top-padding constant

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Engine hardcodes local dataset (Pitfall 1) discovered late | MEDIUM | Refactor `generate()`/`quiz.tsx` to accept an explicit verb pool parameter, defaulting to the bundled dataset at the store call site; re-run the full 122-test suite to confirm no regression, since the refactor should be additive-only |
| No runtime validation on fetched content (Pitfall 4) shipped without it | LOW-MEDIUM | Add a `.safeParse()` call at the single fetch call site (should be centralized if the seam was built cleanly per Pitfall 1); wire fallback-on-failure; low cost if the fetch logic is already isolated in one module |
| Cache with no TTL shipped and later found stale | LOW | Add a `lastFetchedAt` timestamp field to the cached payload and a freshness check on read; does not require changing the fetch/fallback control flow, purely additive |
| Swipe-back bypass discovered in later QA | LOW-MEDIUM | Add the `beforeRemove` listener retroactively; low cost since it's a single hook addition to the Quiz screen, no store changes needed |
| Double-padding from SafeAreaProvider retrofit | LOW | Straightforward visual regression, fix by auditing and removing the specific redundant padding constant per screen; no architectural change needed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Engine hardcodes local dataset (no seam for fetched data) | Phase: engine/data-seam refactor (should precede fetch logic) | Full existing 122-test suite still passes unchanged after refactor; new test injects a non-bundled verb pool and asserts `generate()` uses it |
| Race between in-flight fetch and Start-Quiz tap | Phase: online quiz content (fetch/fallback) | Test: `startQuiz()` called immediately on cold store init (before any fetch resolves) never blocks and never throws `InsufficientVerbsError` due to an empty pool |
| Stale-closure bugs in async Zustand actions | Phase: online quiz content (store architecture) | Test: start a quiz, then resolve a slow-pending content fetch — assert in-progress session fields are untouched |
| Mock-to-real-backend contract drift | Phase: online quiz content (fetch/fallback) | Test: malformed/mismatched mock response triggers local-fallback, not a crash; mock fixture is validated against the same Zod schema used at runtime |
| Cache masks stale/broken backend, or fails on empty-cache+no-network | Phase: persistence/caching | Test: explicit "no cache + fetch throws" case resolves to bundled dataset (not just "cache exists + fetch throws") |
| AsyncStorage untested/under-mocked in Jest | Phase: persistence/caching (first task) | A test asserting a `getItem`/`setItem` mock call's exact arguments, not just downstream branching behavior |
| Exit quiz doesn't fully reset store state | Phase: end-quiz-early | Test: full state-shape equality between a fresh `reset()` and post-exit state, not just `status` field |
| Swipe-back bypasses exit confirmation | Phase: end-quiz-early | Manual/E2E verification on physical device or simulator using the actual swipe gesture, plus a `beforeRemove` listener unit/integration test if feasible |
| SafeAreaProvider wired at wrong layer / double-padding | Phase: UI/safe-area polish | Visual verification on both a notched (iPhone 15/16 class) and non-notched (SE) simulator; explicit per-screen audit of pre-existing padding constants |

## Sources

- Direct repo inspection (HIGH confidence): `src/store/useQuizStore.ts`, `src/quiz/engine.ts`, `app/quiz.tsx`, `app/_layout.tsx`, `package.json` — read directly, 2026-07-13
- `.planning/PROJECT.md` — v0.1 milestone scope, v0.0 known tech debt (unwired `SafeAreaProvider`, un-runtime-validated feedback payload), locked invariants
- GitHub `expo/expo` issue #31614, "Can't disable iOS Gesture Navigation with Expo Router" — MEDIUM confidence (WebSearch synthesis, not directly fetched), confirms `gestureEnabled: false` unreliability on iOS
- GitHub `expo/expo` issue #28052, "Expo Router: Swipe gesture to navigate back... not working" — MEDIUM confidence, corroborates gesture-handling inconsistency
- react-native-async-storage official Jest integration docs (`react-native-async-storage.github.io/async-storage/docs/advanced/jest/`) — MEDIUM-HIGH confidence (WebSearch synthesis of official docs), confirms explicit mock wiring is required, not automatic under `jest-expo`
- React Navigation's documented `beforeRemove` event pattern for intercepting screen removal (standard, well-established pattern across React Navigation / Expo Router ecosystem) — MEDIUM confidence, general ecosystem knowledge, not directly re-fetched this session
- This project's own documented history of the analogous `POST /feedback` payload contract risk (`CLAUDE.md` cross-repo warning, `PROJECT.md` Key Decisions table) — HIGH confidence, used as the direct precedent/analogy for Pitfall 4

---
*Pitfalls research for: Portuguese Verb Conjugation App — Mobile, v0.1 milestone (online quiz content, exit-quiz flow, safe-area/UI polish)*
*Researched: 2026-07-13*
