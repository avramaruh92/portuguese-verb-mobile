# Phase 7: Dataset Seam & Fetch/Fallback Pipeline - Research

**Researched:** 2026-07-13
**Domain:** Expo/React Native (Hermes) data-fetch seam refactor — parameterizing a pure quiz-generation function and adding a fetch-with-silent-fallback resolver, without touching the store or screens
**Confidence:** HIGH (all findings grounded in direct reads of this repo's actual shipped source and tests; one open network-reachability item flagged LOW/environment-limited)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The real `GET /content/verbs` endpoint (portuguese-verb-api v0.1) is already live at `https://portuguese-verb-api.onrender.com/content/verbs` — build directly against it. Do NOT build a throwaway local mock/stub; the ROADMAP.md phase goal's "mocked/stubbed this milestone" wording is stale from before the backend shipped. Response shape: `{ verbs: [{ verb, translation, isIrregular, conjugations }] }`, sorted alphabetically, no auth, fails closed to `{ error: "InternalServerError" }` HTTP 500 on any malformed row or DB failure (never a partial/degraded 200).
- **D-02:** `querer.isIrregular` in the local fallback dataset (`src/dataset/verbs.ts`) must be updated from `false` to `true` to match the now-authoritative remote dataset. This is a superseding decision over the earlier v0.0/v0.1 choice to keep it `false`. This edit is in scope for this phase (part of reconciling the local fallback with the real remote contract), not a separate task.
- **D-03:** Prefetch on app load (e.g. root layout mount) — kick off the fetch as soon as the app opens. `startQuiz()` (Phase 8) never waits on network; it uses whatever the resolver currently holds (remote if the prefetch already resolved, local otherwise). No fetch-at-quiz-start blocking behavior.
- **D-04:** Long, cold-start-tolerant timeout — reuse the same ~90s `AbortController` pattern already established in `src/feedback/submit.ts` (manual `setTimeout` + `AbortController.abort()`, NOT `AbortSignal.timeout` which is unimplemented on Hermes — settled v0.0 finding). Since the fetch is non-blocking (prefetch on load, per D-03), there is no UX cost to a long timeout.
- **D-05:** Fetch once per app session, reuse the resolved result (remote or local-fallback) for every `startQuiz()` call until the app is relaunched. No polling, no re-fetch on every quiz start. In-memory only — no `AsyncStorage`/disk persistence.
- **D-06:** Reuse the existing `VerbSchema`/`validateDataset()` from `src/dataset/validate.ts` to validate the fetched payload before accepting it — do not write a parallel schema. A schema mismatch is treated identically to a network failure or timeout (silent fallback, no user-facing error, per FETCH-03).

### Claude's Discretion

- Exact module structure (e.g. `src/dataset/remote.ts` for fetch mechanics vs `src/dataset/source.ts` for the fallback-resolution policy, as suggested in `.planning/research/ARCHITECTURE.md`) is an implementation detail — Claude decides file boundaries during planning.
- Whether the resolver exposes a synchronous "currently resolved dataset" getter plus a fire-and-forget `prefetch()` trigger, or a single async function memoized after first resolution, is also Claude's call — must satisfy D-03 (non-blocking `startQuiz()`) and D-05 (fetch-once-per-session) regardless of the exact API shape chosen.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

### Explicit Phase Boundary (from CONTEXT.md)

- This phase covers FETCH-01, FETCH-02, FETCH-03 only.
- Async wiring into `startQuiz()` and the per-session dataset-snapshot invariant (FETCH-04) belong to **Phase 8**, not this phase.
- This phase must **NOT** modify `src/store/useQuizStore.ts` or any `app/*.tsx` screen.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FETCH-01 | App fetches the verb dataset from a backend content endpoint on app load (real, live `GET /content/verbs`, per D-01/D-03) | See "Fetch mechanics" pattern and Code Examples below — mirrors `src/feedback/submit.ts`'s proven `AbortController` pattern, adapted for GET and a 90s timeout |
| FETCH-02 | Any fetched payload is validated against the existing dataset Zod schema before acceptance; malformed/invalid payloads are rejected | Reuse `VerbSchema`/`validateDataset()` from `src/dataset/validate.ts` unchanged — see "Validation seam" below |
| FETCH-03 | On any fetch failure (unreachable, slow/timeout, malformed response), the app falls back silently to the bundled local dataset with zero user-facing blocking or error | See "Fallback orchestration" pattern — `resolveVerbs()`/`source.ts` catches all failure modes uniformly |

</phase_requirements>

## Summary

This phase is a small, mechanical, high-leverage refactor plus one new fetch module — not a UI or state-machine change. Two things must happen: (1) `generate()` in `src/quiz/engine.ts` must stop hard-importing `src/dataset/verbs.ts` at module scope and instead accept an injected verb list, and (2) a new `src/dataset/remote.ts` + `src/dataset/source.ts` pair must fetch `GET https://portuguese-verb-api.onrender.com/content/verbs`, validate it with the existing `VerbSchema`, and silently fall back to the local bundled dataset on any failure.

The single most important finding of this research is a **hidden conflict between two of this phase's own constraints** that the planner must resolve explicitly: CONTEXT.md's canonical reference (`ARCHITECTURE.md`) recommends the signature `generate(verbs, options, random)` — `verbs` as a new **first**, required parameter — but CONTEXT.md also locks that this phase must **not** modify `src/store/useQuizStore.ts`, whose existing call site is `generate(options)` (a single positional argument, `random` defaulting to `Math.random`). A required-first-parameter signature change would not compile against that unmodified call site, and would also break every existing `quiz-engine.test.ts` call (`generate({...}, Math.random)`) and the `useQuizStore.test.ts` spy on `engine.generate`. The full 122-test suite must stay green (explicit Success Criterion 1) — so the only signature shape that satisfies **all** of D-01–D-06, the "don't touch the store" boundary, and the "tests stay green" criterion simultaneously is to add `verbs` as a **new, optional, trailing parameter with a default value equal to the local bundled dataset** (e.g. `generate(options, random = Math.random, verbs = localVerbs)`), not a required leading parameter. This preserves every existing call site byte-for-byte while giving Phase 8 (and this phase's own new tests) a real injection seam. Planning should treat this as the concrete task, not re-derive `ARCHITECTURE.md`'s suggested signature literally.

The fetch/fallback module itself is low-risk and precedented: `src/feedback/submit.ts` already establishes the manual `setTimeout` + `AbortController` + `fetch` pattern this phase should mirror almost verbatim (GET instead of POST, no body, same 90s timeout per D-04, same "catch-all → return a sentinel, never throw past the module boundary" shape). The existing `VerbSchema`/`validateDataset()` in `src/dataset/validate.ts` validates a `verbs: unknown[]` array and is directly reusable against the unwrapped `verbs` array inside the `{ verbs: [...] }` response envelope — no schema changes needed.

**Primary recommendation:** Add `src/dataset/remote.ts` (`fetchRemoteVerbs(): Promise<Verb[]>` — throws/rejects on any network, timeout, non-2xx, JSON-parse, or `validateDataset()` failure) and `src/dataset/source.ts` (`resolveVerbs()` / a prefetch-plus-sync-getter pair — never rejects, always resolves to `{ verbs, source: "remote" | "local" }`). Change `generate()`'s signature by adding `verbs` as a new optional trailing parameter defaulting to the local bundled array, preserving 100% of existing call sites unchanged, and add new tests that explicitly pass an injected non-bundled verb list to prove the seam works.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch verb content from live backend | API client (mobile-side network module, `src/dataset/remote.ts`) | — | Single outbound GET to an external API; no server-side code in this repo owns this — the mobile app is a pure client of the already-shipped `portuguese-verb-api` |
| Validate fetched payload shape | API client (mobile-side, `src/dataset/validate.ts` reused) | — | Defense-in-depth check on the client; the backend already fails closed (HTTP 500) so this is a belt-and-suspenders check, not the primary safety net |
| Fallback-decision policy (remote vs. local) | API client / data layer (`src/dataset/source.ts`) | — | Pure orchestration logic, no UI or store coupling; this is explicitly "the only new module that knows about remote vs. local" per ARCHITECTURE.md |
| Quiz generation from a verb pool | Domain/business logic (`src/quiz/engine.ts`, pure function) | — | Must remain synchronous/deterministic-under-injected-RNG; receives data, never fetches it |
| Local bundled dataset (fallback source of truth) | Data / static asset (`src/dataset/verbs.ts`) | — | Ships with the app bundle; the one guaranteed-always-available source, unchanged in structure this phase (only `querer.isIrregular` content edit per D-02) |
| Prefetch trigger on app load | App bootstrap (root layout, `app/_layout.tsx`) — **wiring only, if any, is out of scope this phase** | — | CONTEXT.md explicitly forbids modifying `app/*.tsx` this phase; the resolver must expose a callable prefetch entry point that a *future* phase (or a follow-up wiring step within this phase's own module, not the screen) can invoke. See Open Questions. |

## Standard Stack

### Core

No new runtime dependency is required for this phase. Confirmed via direct `package.json` read (see `.planning/research/STACK.md`, corroborated by this session's own read of `package.json`).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` (Hermes/RN 0.86) | bundled, no package | Perform the `GET /content/verbs` request | Already the project's established pattern (`src/feedback/submit.ts`); no interceptor/retry complexity needed for one GET call — `[VERIFIED: this repo's package.json + src/feedback/submit.ts]` |
| `AbortController` (global, Hermes) | bundled, no package | Manual timeout enforcement | `AbortSignal.timeout()` is unimplemented on Hermes — a settled v0.0 finding already encoded in `src/feedback/submit.ts` — `[CITED: .planning/research/STACK.md, v0.0 section]` |
| `zod` | `^4.4.3` (installed) | Runtime-validate the fetched payload via the existing `VerbSchema` | Already the single source of truth for dataset shape validation (`src/dataset/validate.ts`); D-06 explicitly forbids a parallel schema — `[VERIFIED: package.json]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new | — | — | This phase is scoped to reuse-only; no install step is required. `npx expo install` is not needed here. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `fetch` + manual `AbortController` | `axios` | Adds a dependency and bundle size for a single unauthenticated GET with no interceptor need — already rejected in `.planning/research/STACK.md` for the same reason it was rejected for `POST /feedback` |
| Reusing `VerbSchema`/`validateDataset()` as-is | Writing a new schema keyed to the `{ verbs: [...] }` response envelope | Not needed — the envelope is trivially unwrapped (`response.verbs`) before handing the inner array to the existing `validateDataset()`, so no schema duplication is justified per D-06 |

**Installation:** None required — no `npm install`/`npx expo install` step for this phase.

**Version verification:** `zod@4.4.3` and native `fetch`/`AbortController` (Hermes-bundled, RN `0.86.0`) confirmed present via direct `package.json` read this session — `[VERIFIED: package.json, direct file read]`.

## Package Legitimacy Audit

**Not applicable this phase.** No new external packages are being installed — this phase reuses only already-installed dependencies (`zod`, native `fetch`, `AbortController`) and adds no `npm`/`npx expo install` step. The Package Legitimacy Gate protocol is skipped per its own trigger condition ("every phase that installs external packages").

## Architecture Patterns

### System Architecture Diagram

```
[App process starts]
        │
        ▼
(Phase 7 scope ends here — prefetch *trigger* wiring into app/_layout.tsx
 is explicitly NOT this phase's job; the resolver just needs to be callable)
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ src/dataset/source.ts — resolveVerbs() / prefetch()        │
│                                                             │
│   try:                                                     │
│     ┌─────────────────────────────────────────────┐        │
│     │ src/dataset/remote.ts — fetchRemoteVerbs()   │        │
│     │  1. fetch(GET .../content/verbs)             │        │
│     │     with AbortController + 90s setTimeout    │        │
│     │  2. non-2xx or network error → reject        │        │
│     │  3. res.json() parse failure → reject         │        │
│     │  4. unwrap payload.verbs                      │        │
│     │  5. validateDataset(payload.verbs)             │        │
│     │     (reused from src/dataset/validate.ts)      │        │
│     │  6. invalid → reject; valid → resolve Verb[]   │        │
│     └─────────────────────────────────────────────┘        │
│   catch (ANY failure above):                                │
│     → resolve with local bundled `verbs` (src/dataset/verbs.ts) │
│                                                             │
│   → always resolves to { verbs: Verb[], source: "remote"|"local" } │
│     never rejects past this module's boundary               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
(Phase 8 scope begins here — useQuizStore.startQuiz() will consume
 resolveVerbs()'s output and pass verbs into generate(); NOT this phase)
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ src/quiz/engine.ts — generate(options, random, verbs?)      │
│   verbs defaults to local bundled array if omitted           │
│   (preserves every existing call site unchanged)             │
│   — pure, synchronous, deterministic-under-injected-RNG,     │
│     UNCHANGED body otherwise                                 │
└───────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── dataset/
│   ├── types.ts             # UNCHANGED
│   ├── verbs.ts              # EDIT: querer.isIrregular false → true (D-02) — no structural change
│   ├── validate.ts           # UNCHANGED — VerbSchema/validateDataset() reused as-is
│   ├── remote.ts             # NEW — fetchRemoteVerbs(): Promise<Verb[]>
│   └── source.ts             # NEW — resolveVerbs() (or prefetch()+getter pair, Claude's discretion)
├── quiz/
│   ├── engine.ts              # MODIFIED — generate() gains an optional trailing `verbs` parameter
│   │                          #   defaulting to the local bundled dataset; body otherwise untouched
│   ├── types.ts               # UNCHANGED
│   └── ...                    # UNCHANGED (scoring.ts, labels.ts, random.ts)
├── store/                     # NOT TOUCHED THIS PHASE (Phase 8 scope)
└── feedback/                  # NOT TOUCHED THIS PHASE (unrelated, zero coupling)

__tests__/
├── quiz-engine.test.ts        # UNCHANGED existing tests + NEW test(s) asserting an injected
│                               #   verbs param overrides the default bundled dataset
├── useQuizStore.test.ts       # UNCHANGED — must still pass unmodified since store/engine call
│                               #   site (`generate(options)`) is untouched
├── dataset.test.ts             # existing dataset-shape test — verify it still passes after the
│                               #   querer.isIrregular edit (D-02); it validates SHAPE not content,
│                               #   so no failure expected, but confirm
├── dataset-remote.test.ts      # NEW — unit tests for fetchRemoteVerbs() (mock global.fetch)
└── dataset-source.test.ts      # NEW — unit tests for resolveVerbs() fallback orchestration
```

### Structure Rationale

- **`remote.ts` vs `source.ts` split** mirrors the existing separation already used between `src/feedback/submit.ts` (network mechanics) and the payload/schema modules — keeps the network wrapper unit-testable in isolation (mock `global.fetch`, assert timeout/parse/validation behavior) separately from the fallback *policy* (mock `fetchRemoteVerbs` itself, assert "any rejection → local fallback").
- **`generate()`'s new parameter must be optional and trailing, not a required leading parameter.** See Summary above for the full rationale — this is the one place this research materially diverges from `ARCHITECTURE.md`'s illustrative code sample (`generate(verbs, options, random)`), because that sample assumed the store would be updated in the same phase, which CONTEXT.md's phase boundary explicitly forbids. Confirmed by direct inspection of `src/store/useQuizStore.ts:40` (`generate(options)`) and every call in `__tests__/quiz-engine.test.ts` (`generate({...}, Math.random)`), plus `__tests__/useQuizStore.test.ts`'s `jest.spyOn(engine, "generate")` (which spies on the export, not a specific arity, so it tolerates the new optional param without changes).
- **`src/dataset/verbs.ts` stays structurally unchanged** — only the `querer.isIrregular` field value changes per D-02. It remains both the engine's default fallback value and the source `source.ts` falls back to on any remote failure; these are the same static import, not two copies.

### Pattern 1: Fetch mechanics with manual AbortController timeout (mirrors `src/feedback/submit.ts`)

**What:** A dedicated function performs the network call, enforces the timeout, and either resolves with validated data or rejects — it never itself decides "fall back," that's `source.ts`'s job.

**When to use:** Any outbound fetch in this codebase, per the established v0.0 precedent.

**Example:**
```typescript
// Source: src/feedback/submit.ts (existing, HIGH confidence — proven pattern in this repo)
const CONTENT_ENDPOINT = "https://portuguese-verb-api.onrender.com/content/verbs";
const TIMEOUT_MS = 90_000; // D-04: cold-start-tolerant, non-blocking (prefetch, D-03)

export async function fetchRemoteVerbs(): Promise<Verb[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CONTENT_ENDPOINT, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`content fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    const { valid, errors } = validateDataset(payload.verbs);
    if (!valid) {
      throw new Error(`invalid remote dataset shape: ${errors.join("; ")}`);
    }
    return payload.verbs as Verb[];
  } finally {
    clearTimeout(timeoutId);
  }
}
```
Note: unlike `submitFeedback`, this function **throws/rejects** on failure rather than returning a status-tagged result object — `source.ts` is the layer responsible for catching and converting to a silent fallback (FETCH-03's "zero user-facing error" requirement lives in `source.ts`, not here). Keeping `remote.ts` throw-based keeps it a simple, single-responsibility, directly-unit-testable function.

### Pattern 2: Fallback orchestration — always resolves, never rejects

**What:** `resolveVerbs()` (or equivalent) wraps `fetchRemoteVerbs()` in a try/catch that treats every failure mode identically — network error, timeout/abort, non-2xx, JSON parse failure, and schema validation failure all fall through to the same `catch` and resolve with the local bundled dataset.

**When to use:** Exactly FETCH-03's requirement.

**Example:**
```typescript
// Source: pattern adapted from .planning/research/ARCHITECTURE.md Pattern 2 (this repo's own research)
import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";

export async function resolveVerbs(): Promise<{ verbs: Verb[]; source: "remote" | "local" }> {
  try {
    const remote = await fetchRemoteVerbs();
    return { verbs: remote, source: "remote" };
  } catch {
    return { verbs: localVerbs, source: "local" };
  }
}
```

### Pattern 3: Non-breaking parameter injection into an existing pure function

**What:** Add the new data-source parameter as optional/trailing with a default equal to the current hardcoded behavior, so every existing call site keeps compiling and passing without modification.

**When to use:** Whenever a phase boundary forbids touching the call sites that would need updating under a "clean" required-parameter refactor (exactly this phase's situation, per the store/screens boundary).

**Example:**
```typescript
// Source: this repo's src/quiz/engine.ts, adapted (the change this phase must make)
import { verbs as localVerbs } from "../dataset/verbs";
// ... existing imports unchanged

export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
  verbs: Verb[] = localVerbs,          // NEW — optional, trailing, defaults to current behavior
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
  // ...unchanged body below (identical to today, just reading the parameter instead of the
  // module-scope binding directly — note the import above changes from `verbs` to `localVerbs`
  // as the identifier name, to avoid shadowing the new parameter)
}
```
Every existing call — `generate({...}, Math.random)` in tests, `generate(options)` in the store — continues to resolve `verbs` to the local bundled array exactly as before, byte-for-byte identical runtime behavior. A **new** test can now call `generate(options, Math.random, customVerbs)` to prove the injection seam works, satisfying the phase's "no longer hardcodes which dataset it uses" requirement without touching a single existing call site.

### Anti-Patterns to Avoid

- **Making `generate()` itself async or fetch-aware:** Destroys the pure/sync/deterministic-under-injected-RNG contract every existing engine test depends on. Resolve the `Verb[]` data source *before* calling `generate`, one layer up (Phase 8's `startQuiz`, not this phase's concern) — `[CITED: .planning/research/PITFALLS.md, Pitfall 1; .planning/research/ARCHITECTURE.md, Anti-Pattern 1]`.
- **Making `verbs` a required leading parameter this phase:** Breaks the store call site and every existing test call, violating both the "don't touch the store" boundary and the "122 tests stay green" success criterion — see Summary above. This is the literal illustrative signature in `ARCHITECTURE.md`'s code sample, which this research explicitly recommends NOT following as-is for this phase.
- **Writing a second/parallel Zod schema for the fetched payload:** D-06 explicitly forbids this; reuse `VerbSchema`/`validateDataset()` unchanged.
- **Building a mock/stub backend for local development:** D-01 explicitly forbids this — the real endpoint is live; build directly against it.
- **Letting `remote.ts` itself decide to fall back:** Keep `remote.ts` throw-on-failure and single-purpose; push the "catch everything, fall back silently" policy into `source.ts` so the fallback decision has exactly one home, testable in isolation from network mechanics.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fetch timeout on Hermes | A custom `Promise.race`/polyfill for `AbortSignal.timeout` | Manual `setTimeout` + `AbortController.abort()` | Already proven working in `src/feedback/submit.ts`; `AbortSignal.timeout()` is confirmed unimplemented on Hermes — re-deriving this is wasted effort, it's a settled v0.0 finding |
| Verb-payload shape validation | A new Zod schema, hand-written type guards, or `as Verb[]` type-assertion with no runtime check | Existing `VerbSchema`/`validateDataset()` from `src/dataset/validate.ts` | D-06 requirement; also this project has already flagged (in `PITFALLS.md`, Pitfall 4, and its own `PROJECT.md` tech-debt note re: `feedbackPayloadSchema`) that skipping runtime validation on an inter-repo contract is a repeat of a debt class already paid down once on the write side (`POST /feedback`) — don't reintroduce it on the read side |
| Fallback decision logic | Ad hoc `try { fetch } catch { ...scattered fallback checks... }` inlined wherever data is needed | A single `resolveVerbs()`/`source.ts` orchestrator, one home for "remote vs. local" | Keeps the policy in one testable place; prevents drift where some call sites fall back and others don't (mirrors the existing `TENSES`/`SUBJECTS` single-source-of-truth convention already used elsewhere in this codebase) |

**Key insight:** Every piece of infrastructure this phase needs (timeout handling, schema validation, fallback-on-failure) has already been built once in this exact codebase for a different endpoint (`POST /feedback`) or a different data path (bundled dataset validation). This phase is fundamentally about **reusing** those two precedents for a new GET endpoint, not inventing new patterns.

## Common Pitfalls

### Pitfall 1: Signature-refactor breaks the store or test suite because `verbs` is added as a required/leading parameter

**What goes wrong:** Following `ARCHITECTURE.md`'s illustrative `generate(verbs, options, random)` signature literally would fail to compile against `src/store/useQuizStore.ts:40`'s unmodified `generate(options)` call, and would require updating every call in `__tests__/quiz-engine.test.ts` — both of which this phase's own CONTEXT.md forbids (or, for the tests, unnecessarily risks the "122 tests stay green" criterion for no functional benefit).

**Why it happens:** The canonical architecture reference document was written before the phase boundary (store/screens off-limits) was locked in CONTEXT.md's discussion — the two documents describe an ideal end-state, not this specific phase's constrained slice of it.

**How to avoid:** Add `verbs` as a new, optional, trailing parameter defaulting to the local bundled array (see Pattern 3 above). Verify by running the full existing test suite unchanged before writing any new tests — if anything needs to change in `quiz-engine.test.ts` or `useQuizStore.test.ts` beyond additive new test cases, the signature choice was wrong.

**Warning signs:** A TypeScript compile error in `src/store/useQuizStore.ts` or `__tests__/quiz-engine.test.ts` after the engine change; any diff touching those two files as part of this phase's plan.

### Pitfall 2: `remote.ts` swallows failures internally instead of rejecting, defeating `source.ts`'s single fallback point

**What goes wrong:** If `fetchRemoteVerbs()` itself catches errors and returns `null`/`undefined` instead of rejecting, `source.ts`'s `try/catch` around it becomes a no-op, and the fallback logic has to duplicate null-checks instead of relying on a clean throw/catch boundary — increasing the chance one failure mode (e.g. JSON parse error) is missed.

**How to avoid:** Keep `fetchRemoteVerbs()` strictly throw-on-any-failure (network error, timeout/abort, non-2xx, JSON parse failure, schema validation failure — all five paths reject). Let `source.ts` be the only place a `catch` swallows an error into a fallback value. Write a unit test per failure mode asserting `fetchRemoteVerbs()` rejects (not resolves with a falsy value).

### Pitfall 3: Mock-to-real contract drift is no longer a risk to build against, but response-envelope unwrapping still is

**What goes wrong:** Since D-01 confirms the real endpoint is live with shape `{ verbs: [...] }`, the residual risk is narrower than `PITFALLS.md`'s original Pitfall 4 (which assumed a hand-built mock) — but it's still possible to forget to unwrap the `verbs` envelope key before handing the array to `validateDataset(verbs: unknown[])`, which expects a bare array, not `{ verbs: [...] }`. Passing the whole envelope object to `validateDataset` would silently produce a `.forEach is not a function` runtime error (not caught by `.safeParse`, since it never gets that far) unless the resolver's catch-all is broad enough to catch it too.

**How to avoid:** Explicitly unwrap `payload.verbs` before calling `validateDataset(payload.verbs)`, and add a unit test that mocks `global.fetch` to return the full `{ verbs: [...] }` envelope (not a bare array) to catch this exact mistake. Also add a test where the mocked response's `verbs` key is missing/malformed entirely (e.g. `{}` or `{ verbs: "not-an-array" }`) to prove the catch-all in `source.ts` handles a thrown/rejected error from that case too, not just a `validateDataset` failure on well-shaped-but-invalid entries.

### Pitfall 4: Reachability of the live endpoint could not be verified from this research session's sandboxed network environment

**What goes wrong:** This research session's environment has no outbound network access (`curl` to `https://portuguese-verb-api.onrender.com/content/verbs` returned no response/exit code `000`), so the endpoint's actual current shape, status, and behavior could not be directly re-verified here — this research relies on CONTEXT.md's D-01 claim (already a locked decision from `/gsd:discuss-phase`, presumably verified by the user or a prior session with network access).

**How to avoid:** Treat D-01's response-shape claim as `[ASSUMED — inherited from CONTEXT.md, not independently re-verified this session]` until the implementing session (which will have real device/simulator network access) makes the first live request and confirms the shape matches `{ verbs: [{ verb, translation, isIrregular, conjugations }] }` exactly, including that `isIrregular` and nested `conjugations` keys use the same casing/naming as `src/dataset/types.ts`. If the live response differs even slightly (e.g. camelCase vs snake_case field names), `validateDataset()` will correctly reject it and the app will silently fall back — which is safe by design (FETCH-03) but would mean FETCH-01's "fetches from a backend" value is never actually exercised, so this is worth an explicit smoke-test task, not just an implicit "well, it fails safe."

## Code Examples

Verified/adapted patterns from this repo's own source (all `[VERIFIED: direct file read this session]`):

### Timeout-bounded GET (adapted from the existing feedback POST pattern)

```typescript
// Source: src/feedback/submit.ts (existing repo code, read directly this session)
// Adaptation for src/dataset/remote.ts: GET instead of POST, no body/Content-Type header,
// throws instead of returning a status-tagged result (see Pattern 1/2 above for rationale)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  const response = await fetch(URL, { signal: controller.signal });
  // ...
} catch {
  // network error OR abort — both land here in the existing submitFeedback pattern
} finally {
  clearTimeout(timeoutId);
}
```

### Reusable dataset validation (unchanged, reuse as-is)

```typescript
// Source: src/dataset/validate.ts (existing repo code, read directly this session — UNCHANGED)
export function validateDataset(verbs: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  verbs.forEach((v, i) => {
    const result = VerbSchema.safeParse(v);
    if (!result.success) {
      errors.push(`verbs[${i}]: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
  });
  return { valid: errors.length === 0, errors };
}
```

### Jest fetch mocking (no new dependency needed)

```typescript
// Pattern for __tests__/dataset-remote.test.ts — standard jest.spyOn(global, 'fetch') stubbing,
// consistent with .planning/research/STACK.md's explicit recommendation against MSW for a
// single-endpoint case
describe("fetchRemoteVerbs", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects on non-2xx response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "InternalServerError" }),
    } as Response);
    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects on invalid dataset shape even with a 200", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [{ verb: "falar" /* missing required fields */ }] }),
    } as Response);
    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("resolves with validated verbs on a well-shaped 200", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [/* one schema-valid Verb */] }),
    } as Response);
    await expect(fetchRemoteVerbs()).resolves.toEqual(expect.any(Array));
  });
});
```

Note on `AbortController` in tests: since `fetchRemoteVerbs()`'s timeout is 90 seconds, do **not** let a real timer run in unit tests — use `jest.useFakeTimers()` only for a dedicated "timeout fires and aborts" test case (advance timers past 90s and assert the fetch call's `signal.aborted` becomes true / the promise rejects), and mock `global.fetch` to resolve/reject immediately in all other test cases so the real 90s delay is never actually waited on. `jest-expo`'s preset does not require any special AbortController polyfill — it's natively available in the Hermes/RN 0.86 runtime this project already targets.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| No content-fetching in the app (bundled dataset was the only source, v0.0) | App fetches from a live, already-shipped backend endpoint with silent fallback | This phase (v0.1, Phase 7) | First-ever network dependency for quiz *content* (distinct from the existing feedback-submission network call) |
| ROADMAP.md's phase-goal wording ("mocked/stubbed this milestone") | D-01 supersedes this — build directly against the real live endpoint, no mock | Locked in `/gsd:discuss-phase` for Phase 7, per CONTEXT.md | Simpler implementation (no throwaway mock server/fixture to build or later discard); slightly higher near-term risk if the real endpoint's actual shape has any undocumented drift from D-01's stated contract (see Pitfall 4) |

**Deprecated/outdated:** The `ARCHITECTURE.md`/`STACK.md`/`PITFALLS.md` research files' framing of "build against a local mock/stub URL" (written 2026-07-13, before the real backend's v0.1 ship was confirmed) is superseded by D-01 for this specific phase — those files' *code structure* recommendations (the `remote.ts`/`source.ts` split, the fallback pattern) remain valid; only the "mock it" instruction is stale.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The live endpoint `GET https://portuguese-verb-api.onrender.com/content/verbs` currently returns exactly `{ verbs: [{ verb, translation, isIrregular, conjugations }] }` with field names/casing matching `src/dataset/types.ts`'s `Verb` shape | D-01 (inherited from CONTEXT.md), Pitfall 4 | If field names differ (e.g. `is_irregular` vs `isIrregular`), `validateDataset()` will correctly reject every real response and the app will always silently use the local fallback — safe by design, but FETCH-01's "fetches from a backend" behavior would never be observably exercised until the mismatch is caught by an explicit live smoke test |
| A2 | `useQuizStore.test.ts`'s `jest.spyOn(engine, "generate")` (arity-agnostic spy) will continue to pass unmodified once `generate()` gains a third optional parameter | Architecture Patterns > Pattern 3 | Low risk — `jest.spyOn` on a module export doesn't check arity, and the test only asserts throw-and-rethrow behavior, not argument count. Verify empirically once the change lands, but no code change to this test file is anticipated |
| A3 | The backend's HTTP 500 fail-closed behavior (per D-01) means the mobile-side `validateDataset()` check is effectively "belt and suspenders" rather than the primary safety net in practice | D-06, Architectural Responsibility Map | If the backend's fail-closed guarantee has any gap (e.g. a future backend change reintroduces partial-200 responses), the mobile-side validation becomes the *only* safety net — this phase's validation must be implemented as a hard requirement regardless of how strong D-01's guarantee is, not skipped as "belt and suspenders that isn't really needed" |

**If this table is empty:** N/A — see rows above; all three are worth planner/execution-time confirmation but none block starting the plan.

## Open Questions (RESOLVED)

1. **Where does the prefetch actually get *triggered* from, given `app/_layout.tsx` is off-limits this phase?**
   - **RESOLVED:** Plan 07-01 builds `prefetch()`/`resolveVerbs()` as a callable, independently-testable entry point but does not wire a call site — `app/_layout.tsx` remains untouched this phase. Actual boot-time invocation is deferred to Phase 8, which already owns `useQuizStore.ts`/the async state machine.
   - What we know: D-03 requires "prefetch on app load," and the resolver module this phase builds must expose *something* callable for that purpose (a `prefetch()` function or equivalent).
   - What's unclear: CONTEXT.md's phase boundary says this phase must not modify `app/*.tsx` screens, but doesn't explicitly say whether `app/_layout.tsx` (the root layout, not a "screen" per se, and where `SafeAreaProvider` wiring is *also* scoped to a later phase per `ARCHITECTURE.md`) may be touched to actually *invoke* the new `prefetch()`/`resolveVerbs()` function on mount — or whether this phase should only build the resolver module and leave the trigger-wiring for Phase 8 to invoke inside `startQuiz`'s async sequencing.
   - Recommendation: Treat this phase's deliverable as "the resolver module exists, exports a callable entry point, and is independently unit-testable" — and treat the actual *trigger* wiring (whether that's `app/_layout.tsx` on mount, or Phase 8's `startQuiz` calling it lazily on first invocation) as Phase 8's responsibility, since Phase 8 already owns `useQuizStore.ts`/the async state machine and D-03 doesn't strictly require the trigger to fire before the store exists to receive the result. If the planner decides Phase 7 should include a minimal `app/_layout.tsx` one-line `prefetch()` call for "prefetch on app load" to be genuinely true in-app before Phase 8 ships, that's a discretionary call to flag explicitly in the plan (a small, clearly-scoped exception to the "don't touch app/*.tsx" boundary) rather than silently deciding it either way.

2. **Does `resolveVerbs()` need to be called once and memoized, or is a fresh call idempotent enough to call multiple times safely?**
   - **RESOLVED:** Plan 07-01 builds fetch-once memoization directly into `source.ts` via a module-level cached-result guard, regardless of trigger wiring.
   - What we know: D-05 requires "fetch once per app session." CONTEXT.md's Claude's Discretion section explicitly defers the exact API shape (sync getter + fire-and-forget prefetch vs. single memoized async function) to planning.
   - What's unclear: Whether the memoization needs to survive being called from multiple places (e.g. if Phase 8's `startQuiz` calls it on every invocation, does the module need an internal "already resolved, return cached promise" guard, or is it acceptable for Phase 7 to build a naive "always re-fetches" version and let Phase 8 add memoization when it actually wires multiple call sites)?
   - Recommendation: Build the memoization into `source.ts` in this phase regardless of exactly how it's triggered — a module-level `let cachedResult: Promise<{...}> | null` guard is cheap, self-contained, testable in isolation now, and avoids Phase 8 needing to modify this phase's module just to add caching later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Native `fetch` (Hermes/RN 0.86) | `src/dataset/remote.ts` | ✓ | RN `0.86.0` (bundled) | — |
| `AbortController` (Hermes global) | Timeout enforcement | ✓ | Hermes-bundled | — |
| `zod` | Reused `VerbSchema`/`validateDataset()` | ✓ | `^4.4.3` (package.json) | — |
| `jest-expo` / `jest` | Unit tests for new modules | ✓ | `jest-expo@~57.0.1` (package.json) | — |
| Live network reachability to `portuguese-verb-api.onrender.com` | Confirming D-01's response shape empirically | ✗ (not verifiable from this research sandbox — `curl` returned no response) | — | Treat D-01 as `[ASSUMED]` per Pitfall 4/Assumption A1 until confirmed with real device/simulator network access at implementation time |

**Missing dependencies with no fallback:** None — the one unverifiable item (live endpoint reachability) has a safe fallback by design (FETCH-03's silent local fallback), it just means FETCH-01's "actually fetches remote data" path can't be proven working until real network access is available at implementation/testing time.

**Missing dependencies with fallback:** Live endpoint reachability (see above) — falls back to local dataset, which is exactly the intended FETCH-03 behavior; not a blocker for planning or most of implementation, only for the final live-smoke-test verification step.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `jest-expo@~57.0.1` (wraps `jest@30.x`), confirmed via `package.json` `"jest": { "preset": "jest-expo" }` |
| Config file | `package.json`'s `jest` key (no standalone `jest.config.js`) |
| Quick run command | `npx jest __tests__/quiz-engine.test.ts __tests__/dataset-remote.test.ts __tests__/dataset-source.test.ts` |
| Full suite command | `npm test` (runs all 11 existing suites + this phase's new suites) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FETCH-01 | `fetchRemoteVerbs()` performs a GET with a 90s AbortController timeout and resolves with a validated `Verb[]` on success | unit | `npx jest __tests__/dataset-remote.test.ts -x` | ❌ Wave 0 — new file |
| FETCH-01 | `generate()` accepts an optional injected `verbs` parameter that overrides the default bundled dataset | unit | `npx jest __tests__/quiz-engine.test.ts -x` | ✅ existing file — extend with new test case(s) |
| FETCH-02 | A fetched payload that fails `validateDataset()` (even with an HTTP 200) causes `fetchRemoteVerbs()` to reject | unit | `npx jest __tests__/dataset-remote.test.ts -x` | ❌ Wave 0 — new file |
| FETCH-03 | `resolveVerbs()` returns the local bundled dataset (never throws) on network error, timeout, non-2xx, or invalid-shape — covering all four failure modes independently | unit | `npx jest __tests__/dataset-source.test.ts -x` | ❌ Wave 0 — new file |
| FETCH-03 | Full existing 122-test suite (11 suites) still passes unchanged after the `generate()` signature change and the `querer.isIrregular` dataset edit | regression | `npm test` | ✅ existing suites |

### Sampling Rate

- **Per task commit:** `npx jest <changed-test-file> -x`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`, per Success Criterion 1 in ROADMAP.md's Phase 7 section

### Wave 0 Gaps

- [ ] `__tests__/dataset-remote.test.ts` — covers FETCH-01, FETCH-02 (new file, mocks `global.fetch` per Code Examples above)
- [ ] `__tests__/dataset-source.test.ts` — covers FETCH-03 (new file, mocks `fetchRemoteVerbs` itself, not `global.fetch` directly, to isolate the fallback-policy logic from network mechanics)
- [ ] New test case(s) in the existing `__tests__/quiz-engine.test.ts` — asserting `generate(options, random, customVerbs)` uses `customVerbs` instead of the bundled default (no new file, extend existing suite)
- [ ] Verify `__tests__/dataset.test.ts` (existing dataset-shape validation test) still passes after the `querer.isIrregular` content edit — it validates schema shape, not specific field values, so no failure is anticipated, but confirm as part of this phase's own verification, not assumed

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Endpoint is explicitly unauthenticated per D-01 (no auth) — matches the existing `POST /feedback` no-auth model already accepted for this app |
| V3 Session Management | No | No sessions anywhere in this product (locked, cross-repo) |
| V4 Access Control | No | No user-specific data; the content endpoint returns the same public dataset to every client |
| V5 Input Validation | Yes | `zod`'s existing `VerbSchema`/`validateDataset()` — treat every fetched response as untrusted input, exactly as `PITFALLS.md`'s Security Mistakes table already recommends for this milestone |
| V6 Cryptography | No | Plain HTTPS GET to a public, read-only content endpoint; no payload encryption/signing requirement stated or implied by D-01 |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/unexpected response shape (accidental drift, not necessarily malicious) causing a crash or `undefined` rendering downstream | Tampering (data integrity) | `validateDataset()` runtime check before acceptance (FETCH-02); reject and silently fall back rather than trust-and-render (FETCH-03) |
| Indefinite hang on a slow/unresponsive backend blocking the app's perceived responsiveness | Denial of Service (client-side) | `AbortController` + `setTimeout` bounds the wait (D-04); since the fetch is non-blocking/prefetch-only (D-03), even a full 90s hang never blocks the UI thread's usable path |
| Trusting fetched string fields (verb, translation, conjugation forms) directly into `<Text>` rendering without type/shape checks | Tampering / injection-adjacent (low severity here — plain-text rendering, no HTML/script execution context) | Same `validateDataset()` check covers type/shape (all fields required to be non-empty strings or the correct object shape) before any fetched field reaches a screen — though note screens are out of scope this phase, this is a forward-looking mitigation the resolver's validation already provides for Phase 8 to inherit |

## Sources

### Primary (HIGH confidence)
- Direct reads of this repo's shipped source (this session): `src/quiz/engine.ts`, `src/dataset/types.ts`, `src/dataset/validate.ts`, `src/dataset/verbs.ts`, `src/feedback/submit.ts`, `src/store/useQuizStore.ts`, `app/quiz.tsx`, `package.json`, `__tests__/quiz-engine.test.ts`, `__tests__/useQuizStore.test.ts`
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-CONTEXT.md` — locked phase decisions (D-01 through D-06), phase boundary, canonical references
- `.planning/REQUIREMENTS.md` — FETCH-01/02/03 exact wording and Out-of-Scope table
- `.planning/config.json` — direct read confirming `nyquist_validation: true`, `security_enforcement: true`, `security_asvs_level: 1`

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md`, `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md` — prior-session research, largely still valid; this phase's research explicitly supersedes their "mock/stub the backend" framing (per D-01) and their illustrative `generate(verbs, options, random)` signature sample (per the store/screens phase-boundary conflict identified above)

### Tertiary (LOW confidence)
- Live endpoint reachability/shape (`https://portuguese-verb-api.onrender.com/content/verbs`) — could not be independently re-verified from this research session's network-sandboxed environment (`curl` returned no response); relies entirely on CONTEXT.md's D-01 claim, flagged in Assumptions Log (A1) and Pitfall 4

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; every library involved is already installed and verified via direct `package.json` read
- Architecture: HIGH — every structural recommendation is grounded in direct reads of the actual current source and its exact call sites/tests, including the identification of a real conflict between two of this phase's own source documents (canonical `ARCHITECTURE.md` vs. the CONTEXT.md phase boundary) and its concrete resolution
- Pitfalls: HIGH for the signature-conflict and envelope-unwrapping pitfalls (directly derived from this session's own code reads); LOW-MEDIUM for the live-endpoint-shape assumption (network-sandboxed, could not independently verify)

**Research date:** 2026-07-13
**Valid until:** 30 days (stable domain — no fast-moving ecosystem dependency introduced this phase), but the live-endpoint-shape assumption (A1) should be re-verified at the start of implementation regardless of elapsed time, since it was never independently confirmed in this session

---
*Research for: Phase 7 - Dataset Seam & Fetch/Fallback Pipeline*
*Researched: 2026-07-13*
