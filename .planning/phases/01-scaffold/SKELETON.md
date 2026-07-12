# Walking Skeleton — Portuguese Verb Conjugation App (Mobile)

**Phase:** 1
**Generated:** 2026-07-12

## Capability Proven End-to-End

> One sentence: the smallest user-visible capability that exercises the full stack.

Expo Router boots to a real (empty) placeholder screen on the iOS Simulator, backed by a real (trivial) in-memory Zustand store, with a green `jest-expo` test suite and TypeScript strict mode compiling with zero errors — proving the entire toolchain works end-to-end before any domain logic (dataset, quiz engine, UI, feedback) is built in Phases 2-5.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 57 (`expo@57.0.4`) + React Native 0.86 (SDK-managed) | Locked project-wide per STACK.md; scaffolded via `create-expo-app@latest --template default@sdk-57`, iOS-first |
| Routing | Expo Router 6.x (`expo-router@57.0.4`), file-based, single `app/index.tsx` route | Locked per CLAUDE.md; `app/` is routes-only per D-02; single index route only per D-04 (no stub setup/quiz/results routes yet) |
| Data layer | N/A — no database, offline-only app. In-memory Zustand store (`zustand@5.0.14`) is the closest analog | CLAUDE.md locks "no Supabase, no backend writes, no persistence beyond a single quiz session"; the only future backend call is `POST /feedback` (Phase 5) |
| State management | Zustand 5.x, single store at `src/store/useQuizStore.ts` (scaffold only, no quiz logic this phase) | Locked per PROJECT.md; selector-based re-render isolation without Provider boilerplate |
| Type safety | TypeScript 5.x (template default), `strict: true` + `noUncheckedIndexedAccess: true` on `expo/tsconfig.base` | Do NOT bump to `typescript@7.x` — Expo/Metro toolchain not yet validated against the Go-native rewrite for SDK 57 (STACK.md, locked) |
| Test runner | Jest 30.x via `jest-expo@57.0.1` preset, config in `package.json` `"jest"` key | Official Expo preset handles RN/Expo transforms; single-run `"test": "jest"` (never `--watchAll` — hangs in scripted verification) |
| Deployment target | iOS Simulator via `npx expo start` (local dev). No hosted deployment in v0 scope | Offline mobile app — "deployment" is a local simulator boot, verified manually via `checkpoint:human-verify` (no automated visual-inspection tooling in this environment) |
| Directory layout | `app/` routes-only; all domain logic in sibling `src/` tree (`src/store/`, later `src/dataset/`, `src/quiz-engine/`, `src/api/`); tests in flat `__tests__/` at repo root | Per D-02 pure-domain-core pattern; empty placeholder folders NOT pre-created — each later phase creates its own subfolder when it has real content |

## Stack Touched in Phase 1

- [x] Project scaffold (Expo framework, Metro build, `eslint-config-expo` lint, `jest-expo` test runner)
- [x] Routing — one real route (`app/index.tsx` rendering the placeholder screen via `app/_layout.tsx` Stack)
- [x] Local state — Zustand store scaffold importable with a real (trivial) state read (`useQuizStore.getState().status === 'idle'`) — this project's analog for the template's "DB read/write" checkbox (no DB exists)
- [x] UI — one rendered screen (`View` + `Text` "Portuguese Verb Quiz" placeholder), no interactivity this phase
- [x] Deployment — documented local full-stack run command (`npx expo start` → iOS Simulator boot, confirmed via checkpoint)

## Out of Scope (Deferred to Later Slices)

> Explicit so future phases do not re-litigate Phase 1's minimalism.

- Verb dataset, `src/dataset/` folder, dataset validation (Phase 2)
- Internal `Tense`/`Subject` vocabulary + reconciliation against backend enum literals (Phase 2)
- Quiz generation/scoring logic, `src/quiz-engine/` folder (Phase 3)
- Setup/quiz/results screens and their route files, reusable component library, icon library, branded palette/typeface (Phase 4)
- Feedback submission, `src/api/feedbackClient.ts`, `POST /feedback` wiring, network error handling (Phase 5)
- Any persistence (`@react-native-async-storage/async-storage`), `axios`, `expo-sharing` — explicitly NOT installed (STACK.md "What NOT to Use")
- Real branded design system — Phase 1 uses neutral system-default tokens only (01-UI-SPEC.md)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Typed, validated local verb dataset with backend-aligned `Tense`/`Subject` vocabulary (`src/dataset/`)
- Phase 3: Tested pure-function quiz generation + scoring logic (`src/quiz-engine/`)
- Phase 4: Full learner loop — setup → quiz → results screens wired to the engine + Zustand store, native iOS share sheet
- Phase 5: In-app feedback submission to the live `POST /feedback` backend, graceful success/error/cold-start handling (`src/api/`)
- Phase 6: Cross-cutting verification — dataset accuracy against authoritative sources, real cold-start UX, edge cases
