# Project Research Summary

**Project:** Portuguese Verb Conjugation App — Mobile (`portuguese-verb-mobile`)
**Domain:** iOS-first Expo React Native offline conjugation-quiz app, single external REST touchpoint (`POST /feedback`)
**Researched:** 2026-07-12
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a single-user, offline, no-accounts European Portuguese verb-conjugation quiz app for iOS, built on Expo SDK 57 + Expo Router + TypeScript + Zustand, with a hand-authored local dataset (50 verbs × 4 tenses × 6 subjects) and exactly one external I/O path: an unauthenticated `POST /feedback` call to an already-shipped backend. Competitor research confirms the chosen feature set (tense/irregular filters, multiple-choice questions with translation scaffolding, immediate feedback, fixed 10-question sessions, score screen, native share) matches table-stakes patterns across the conjugation-drill category, while explicitly and correctly deferring account-gated differentiators (streaks, spaced repetition, mastery tracking) that don't fit the locked no-persistence, no-accounts scope. The genuine differentiator is European-Portuguese-specific content in a market otherwise dominated by Spanish/French/English drills.

The recommended architecture separates pure, side-effect-free domain logic (`dataset/`, `quiz-engine/`) from a thin Zustand orchestration layer and thin Expo Router screens, with a single isolated API boundary (`api/feedbackClient.ts`) responsible for mapping internal vocabulary to the backend's locked enum literals. This structure directly serves the project's required unit-test surface (dataset validation, quiz generation, scoring, payload mapping) without needing React Native Testing Library for core logic.

The two dominant risks are: (1) the cross-repo enum-literal contract between this app's internal `Tense`/`Subject` vocabulary and the backend's pre-existing Zod schema, which is a best-guess on the backend side and must be reconciled early and tested exhaustively, not retrofitted after dataset authoring; and (2) linguistic accuracy of the hand-authored EP dataset, where automated tests can only verify shape/completeness, not correctness — irregular verbs, "tu" forms, and diacritics need a dedicated human-review pass against an authoritative EP source (Ciberdúvidas/Infopédia/Priberam), not just visual scanning. A secondary but real risk is Render's free-tier cold-start latency (up to ~1 minute) corrupting the "feedback must never block the quiz" requirement if the client is implemented as a naive blocking `await`.

## Key Findings

### Recommended Stack

Expo SDK 57 (bundling React Native 0.86) with Expo Router 6.x and TypeScript 5.x (not yet TS7 — Expo/Metro toolchain compatibility with the new Go-native compiler is unverified) forms the core. Zustand 5.x is the single state store for in-progress quiz session data (no persistence across app restarts by design). Zod 4.x validates both the local dataset's shape and the outbound feedback payload against a single schema mirroring the backend's contract. Native `fetch` (not axios) handles the one external call, and React Native's core `Share` API (not `expo-sharing`) handles the plain-text score share — both are the leaner, correct-fit choices given the single-call, single-share-type scope. `jest-expo` is the required Jest preset; most required tests (dataset validation, quiz generation, scoring, payload mapping) are pure-function tests needing no RN rendering, so `@testing-library/react-native` should only be added if a later phase needs component-interaction testing.

**Core technologies:**
- Expo SDK 57 + Expo Router 6.x: managed RN toolchain and file-based navigation — already locked, current stable
- TypeScript 5.x (strict mode): type safety, especially for enum-literal correctness — stay off TS7 for now
- Zustand 5.x: quiz session state (index, answers, score) with zero logic embedded — already locked
- Zod 4.x: single source of truth for dataset shape and feedback payload validation
- Native `fetch` + RN core `Share`: minimal-dependency choices matching the single-call, single-share-type scope

### Expected Features

Competitor analysis (Conjuguemos, Kwiziq, Spanish Verb Conjugator, Irregular Verbs Quiz Game, Bonjour Verbs) confirms the already-locked v0 scope matches category table stakes and correctly defers everything requiring persistence/accounts.

**Must have (table stakes) — all already in scope:**
- Quiz setup filters (tense multi-select + irregular-verb toggle), independent axes
- Question context: verb, translation, tense, subject shown together (beginner scaffolding)
- Multiple-choice answers (4 options) — correctly avoids EU-Portuguese accent-matching complexity of typed input
- Immediate right/wrong feedback with correct answer shown on mistakes
- Fixed 10-question, untimed session; randomized order without immediate repeats
- Score/results screen

**Should have (differentiators) — already in scope:**
- European Portuguese-specific content (the actual market gap vs. Spanish/French/English-dominated competitors)
- Native share sheet from results (non-blocking, additive only)
- Structured in-app feedback tied to exact question context (verb/tense/subject/answers) — unusually rigorous vs. competitors who have no feedback mechanism or only app-store reviews

**Defer (v1.x / v2+):**
- Typed-answer mode with diacritic normalization (v1.x, once multiple choice is validated)
- On-device (no-account) progress/streak tracking, spaced repetition, backend-served dataset updates — all explicitly deferred; would require a deliberate scope change (persistence design, possibly accounts) not an incremental add
- Accounts/login, ads/monetization, multiplayer — not planned, contradicts locked product scope

### Architecture Approach

The recommended structure is a 4-layer separation: `dataset/` (typed static verb data + shape validation, zero React imports) → `quiz-engine/` (pure functions: filter, generate session, score — no React/Zustand imports, independently unit-testable) → `store/` (thin Zustand orchestration that calls engine functions and stores results, no logic of its own) → `app/` (Expo Router screens, thin presentational wiring only). A separate, isolated `api/feedbackClient.ts` is the sole module allowed to know backend enum literals and perform network I/O, decoupled entirely from quiz session state so feedback submission can never block or corrupt the quiz loop.

**Major components:**
1. `dataset/` — typed verb data (50 verbs × 4 tenses × 6 subjects) + `validate.ts` completeness checks
2. `quiz-engine/` — `generate.ts` (filter + randomize into a session) and `score.ts` (grading), pure and seedable for deterministic tests
3. `store/useQuizStore.ts` — Zustand store holding session state and thin actions (`startQuiz`, `answerQuestion`, `resetQuiz`)
4. `app/` (Expo Router screens) — setup, quiz, results; read/write store only, never contain filtering/scoring logic inline
5. `api/feedbackClient.ts` — single enum-mapping + fetch boundary, normalizes 201/400/500/network outcomes into a typed result, fully decoupled from quiz state

### Critical Pitfalls

1. **Feedback enum-literal mismatch causing silent 400s** — the backend's `tense`/`subject`/`platform` literals (e.g. `ele_ela`, `nos`) were designed pre-app and don't map 1:1 to natural Portuguese pronouns (e.g. "você" conjugates as `ele_ela`). Avoid by centralizing all UI→backend mapping in one exhaustively-typed function, unit-tested against literals copied verbatim from CLAUDE.md, plus one live round-trip check against the deployed API.
2. **Feedback cold-start/network handling blocking or corrupting the quiz loop** — Render free tier can take up to ~1 minute to wake from idle. Avoid by making feedback submission fire-and-forget from the UI's perspective (optimistic dismiss/toast), never gating navigation or quiz state on the request, and explicitly testing against a genuinely cold live instance before shipping.
3. **Hand-authored EP dataset has silent linguistic errors that shape/completeness tests can't catch** — diacritic errors, EU/BP drift (LLM training skews Brazilian), regularized irregulars, "tu"-form weak spots, and mixed pre/post orthographic-reform spelling. Avoid via tense-by-tense reviewable dataset structure, an irregular-verb-specific human review pass against Ciberdúvidas/Infopédia/Priberam, and explicit "tu" spot-checking — never treat passing unit tests as proof of linguistic correctness.
4. **Share sheet mishandling** — treating `Share.dismissedAction` as an error, or letting results-screen state mutate underneath a presented share sheet. Snapshot score/text at invocation time; treat cancellation as a normal no-op.
5. **Irregular-toggle mid-quiz confusion** — changing the question pool filter mid-session without resetting confuses learners. Disable/hide the toggle once a session is active; only apply at setup.

## Implications for Roadmap

Based on research, suggested phase structure (this closely validates the implied phase order already anticipated in project docs):

### Phase 1: Scaffold
**Rationale:** Nothing else can proceed without a working Expo Router + TypeScript + Zustand + Jest-expo project skeleton; this phase carries zero domain risk and should be fast.
**Delivers:** Empty routes, empty Zustand store, `jest-expo` preset wired, CI green on a trivial test, strict TypeScript config.
**Addresses:** No FEATURES.md items directly — infrastructure only.
**Avoids:** N/A (no domain pitfalls apply yet).

### Phase 2: Domain model + dataset
**Rationale:** `quiz-engine`'s function signatures and the feedback-mapping layer both depend on the internal `Tense`/`Subject` vocabulary being settled first — this vocabulary must be designed with the backend's locked enum literals in mind from the outset, not retrofitted later. This is also where the dataset's linguistic-accuracy risk is highest-leverage to address, since fixing it before 1,200 conjugated forms and UI copy are built around wrong labels is far cheaper than retrofitting.
**Delivers:** `dataset/types.ts`, `dataset/verbs.ts` (fully or partially seeded), `dataset/validate.ts` with shape/completeness tests; internal `Tense`/`Subject` unions reviewed once against CLAUDE.md's exact backend literals before finalizing.
**Addresses:** Local verb dataset (P1 feature), foundational to every other quiz feature.
**Avoids:** Pitfall 1 (enum mismatch — design vocabulary correctly here) and Pitfall 3 (dataset accuracy — build tense-by-tense reviewable structure and do the irregular-verb-specific review pass here, not deferred to polish).

### Phase 3: Quiz engine
**Rationale:** The highest-value phase to isolate for testing per the explicit unit-test requirement; de-risks the trickiest logic (filtering, no-repeat randomization, distractor generation, scoring) entirely before any UI exists to obscure bugs.
**Delivers:** `quiz-engine/generate.ts` and `score.ts`, fully unit-tested against the Phase 2 dataset, no UI involved.
**Uses:** Pure-function domain core pattern (Architecture Pattern 1); Zod for any runtime dataset assertions.
**Implements:** `quiz-engine/` component from the architecture.

### Phase 4: UI (setup → quiz → results)
**Rationale:** Comparatively low-risk once Phases 2–3 are solid, since screens are designed to be thin by construction; wiring the Zustand store to an already-tested engine is mechanical.
**Delivers:** Setup screen (filters), quiz screen (question/choices/feedback), results screen (score + share entry point); Zustand store actions (`startQuiz`, `answerQuestion`, `resetQuiz`).
**Addresses:** Quiz setup filters, multiple-choice presentation, immediate feedback, results screen, native share sheet (all P1 features).
**Avoids:** Anti-Pattern 1 (logic inlined in screens); Pitfall 5 (irregular-toggle mid-quiz confusion — disable/hide once session is active); Share sheet dismissed-action mishandling.

### Phase 5: Feedback API integration
**Rationale:** Can start in parallel with Phase 4 on the client/mapping-function side (needs no UI), but the FeedbackForm naturally attaches once results/quiz screens exist. This is the phase most exposed to the two most severe pitfalls in the research and should be treated with extra care, not as an afterthought.
**Delivers:** `api/feedbackClient.ts` + `feedbackMapping.ts` (exhaustively-typed enum mapping, unit-tested against literals copied verbatim from CLAUDE.md), fire-and-forget submission wrapper with typed 201/400/500/network-error handling, FeedbackForm UI.
**Addresses:** In-app feedback submission (P1 feature).
**Avoids:** Pitfall 1 (enum mismatch — do the live round-trip check here) and Pitfall 2 (cold-start blocking — build fire-and-forget from the start, never `await` in the critical navigation path).

### Phase 6: Polish/QA
**Rationale:** Final cross-cutting pass once all functional pieces exist; several pitfalls (cold-start, dataset correctness, share-sheet cancellation) can only be truly verified end-to-end against real conditions (a genuinely cold Render instance, a full read-through against an authoritative EP reference), not unit tests alone.
**Delivers:** Share sheet wording polish, error-state polish, accessibility pass, edge-case handling (e.g., fewer than 10 eligible verbs for a filter combination), final dataset read-through against Ciberdúvidas/Infopédia/Priberam, explicit cold-start manual test against the live Render URL.
**Addresses:** Cross-cutting quality bar for all P1 features.
**Avoids:** All three critical pitfalls get their final verification pass here — this phase should not be treated as optional polish but as the last line of defense for the two highest-severity risks (enum mismatch, dataset accuracy) plus the cold-start UX risk.

### Phase Ordering Rationale

- Dataset and internal vocabulary (Phase 2) must precede the quiz engine (Phase 3) because engine function signatures depend on finalized `Verb`/`Tense`/`Subject` types — and those same types are the vocabulary the feedback-mapping layer will later need to reconcile against backend enums, so this is the cheapest point to get the enum design right.
- Quiz engine (Phase 3) must precede UI (Phase 4) so the highest-risk logic (randomization, filtering, scoring) is proven correct via fast pure-function tests before it's wrapped in screens, per the architecture's core "pure domain core, thin store, thin screens" pattern.
- Feedback integration (Phase 5) is architecturally independent of quiz UI (no shared state, decoupled by design) and can start in parallel with Phase 4, but its two associated pitfalls (enum mismatch, cold-start) are severe enough that it needs dedicated attention rather than being folded into general UI work.
- Polish/QA (Phase 6) exists specifically because two of the three critical pitfalls (dataset accuracy, cold-start behavior) are only observable through real-world conditions that automated tests structurally cannot cover — this phase is not generic buffer time.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Domain model + dataset):** Needs verification against an authoritative EP conjugation reference (Ciberdúvidas/Infopédia/Priberam) — the pitfalls research flagged EP-specific morphology (você/vocês grouping, "tu"-form scarcity in general sources, orthographic reform) as LOW-MEDIUM confidence, domain-expert judgment rather than verified fact.
- **Phase 5 (Feedback API integration):** Needs a live round-trip check against the actual deployed `POST /feedback` endpoint — the backend's enum literals are flagged as a best-guess on the backend side too (CLAUDE.md D-07/D-08), so this cannot be fully resolved from docs alone.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold):** Well-documented Expo/Expo Router/Zustand/jest-expo setup, verified against current official docs — no additional research needed.
- **Phase 3 (Quiz engine):** Standard pure-function/unit-testing patterns, HIGH confidence architecture guidance.
- **Phase 4 (UI):** Standard Expo Router "thin screen" conventions, well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (core versions), MEDIUM (library-choice rationale) | Versions verified against npm registry dist-tags and official Expo/TS release posts; fetch-vs-axios and share-API choices based on WebSearch synthesis, not a single canonical source |
| Features | MEDIUM | WebSearch across multiple competitor apps, cross-checked against locked PROJECT.md scope; no official docs applicable to this product-research domain, so all competitor claims are treated as MEDIUM regardless of cross-checking |
| Architecture | HIGH (Expo Router/Zustand/testing conventions), MEDIUM (quiz-domain-specific module boundaries) | Routing and state-management patterns verified against official Expo docs; the specific dataset/engine/store/API layering is synthesized best practice, not a published "quiz app architecture" spec |
| Pitfalls | MEDIUM (Expo/RN/Render behaviors HIGH via official docs), LOW-MEDIUM (linguistic dataset pitfalls) | Cold-start and Share API behaviors verified against official docs; EP-specific linguistic pitfalls are domain-expert judgment not independently re-verified against a live conjugator during this research pass |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **EP conjugation accuracy is unverified against a live authoritative source** — flagged explicitly in PITFALLS.md as needing a dedicated pass against Ciberdúvidas/Infopédia/Priberam during Phase 2 dataset authoring; this research pass could not independently re-verify specific verb forms.
- **Backend enum literals are a best-guess pre-app design (CLAUDE.md D-07/D-08)** — cannot be fully resolved until a live round-trip test is run against the deployed API during Phase 5; treat the current literal list as authoritative-but-unconfirmed until then.
- **TypeScript 7 (tsgo) compatibility with Expo/Metro tooling** — not yet broadly documented as of SDK 57; low-risk to defer (stay on TS 5.x) but revisit if a later SDK adopts it as default.
- **Feature research has no official-docs backing** (product/UX space, not a library API) — all competitor findings are WebSearch-sourced and should be read as directional, not verified against current live app behavior.

## Sources

### Primary (HIGH confidence)
- npm registry `latest` dist-tags (expo, expo-router, zustand, jest-expo, jest, zod, typescript, react-native, expo-sharing, async-storage) — queried directly, 2026-07-12
- https://docs.expo.dev/router/basics/core-concepts/ — Expo Router file-based routing conventions
- https://docs.expo.dev/versions/latest/sdk/sharing/ and https://reactnative.dev/docs/share — sharing API behavior including `dismissedAction`
- https://render.com/docs/free — free-tier spin-down/cold-start timing
- https://docs.expo.dev/develop/unit-testing/ — jest-expo preset behavior
- Project-internal: CLAUDE.md and .planning/PROJECT.md — authoritative locked cross-repo contract and scope

### Secondary (MEDIUM confidence)
- https://expo.dev/changelog/sdk-57, https://expo.dev/changelog/sdk-54 — SDK/Router version context
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — TS7 announcement, Expo-specific timing inferred
- Competitor app research (Conjuguemos, Kwiziq, Spanish Verb Conjugator, Irregular Verbs Quiz Game, Bonjour Verbs) — WebSearch-sourced, cross-checked across sources where possible
- https://blog.samkiel.dev/your-render-free-tier-is-not-broken-its-just-cold — community corroboration of Render docs

### Tertiary (LOW confidence)
- European Portuguese verb morphology domain knowledge (você/vocês 3rd-person grouping, tu-form scarcity in BP-skewed sources, Acordo Ortográfico spelling) — not independently re-verified against a live conjugator; flagged for verification during Phase 2

---
*Research completed: 2026-07-12*
*Ready for roadmap: yes*
