# Portuguese Verb Conjugation App — Mobile

This is `apps/mobile`, the companion mobile client to the backend API in
the sibling repo `portuguese-verb-api` (`avramaruh92/portuguese-verb-backend`).
It's an Expo React Native app, iOS-first, for beginner (A1-A2) learners of
European Portuguese practicing verb conjugation via quizzes.

## Tech Stack

- Expo SDK ~57 (React Native 0.86, React 19), iOS-first
- TypeScript (strict mode, `noUncheckedIndexedAccess` enabled)
- Expo Router (file-based navigation — `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `app/_layout.tsx`)
- Zustand (single in-memory quiz session store — `src/store/useQuizStore.ts`)
- Zod (dataset + feedback payload runtime validation)
- Verb dataset: remote-first (`GET /content/verbs`) with a bundled local fallback — see Key Domain Facts below

Full detail: `.planning/codebase/STACK.md` (linked below in Technology Stack).

## Commands

```bash
npm start          # expo start
npm run ios        # expo start --ios
npm run android    # expo start --android
npm run web        # expo start --web
npm run lint       # expo lint
npm test           # jest
npm run typecheck  # tsc --noEmit
```

## Key Domain Facts (confirmed, cross-repo binding)

These are locked by the backend's already-shipped v0.0 milestone
(`portuguese-verb-api`) — the mobile app must match them, not redefine them:

- The mobile app is **remote-first with an offline fallback** for quiz
  content: on startup it fetches the verb dataset from `GET /content/verbs`
  on the live backend (`src/dataset/remote.ts`), validates the response
  against the same schema as the bundled dataset, and falls back to a
  bundled local dataset (`src/dataset/verbs.ts`) on any failure (non-OK
  response, invalid payload, network error, or timeout — see
  `src/dataset/source.ts`). The `OfflinePill` component (`src/components/OfflinePill.tsx`)
  surfaces to the user when the local fallback was used. This supersedes
  the app's original fully-offline design — verify current behavior in
  `src/dataset/` before assuming no content API exists.

- The mobile app **never writes to the database directly** and never
  holds Supabase credentials. The only backend interaction is submitting
  in-app feedback via `POST /feedback` on the live API
  (`https://portuguese-verb-api.onrender.com`).

- `POST /feedback` request contract (Zod-validated, locked by the backend):
  `message`, `verb`, `tense`, `subject`, `correctAnswer`, `selectedAnswer`,
  `appVersion`, `platform`.

  - `tense` enum: `present_indicative | preterite | imperfect | future`
  - `subject` enum: `eu | tu | ele_ela | nos | voces | eles_elas`
  - `platform` enum: `ios | android`
  - A `201` response returns the full persisted row (including generated
    `id` and `createdAt`). A `400` response returns
    `{ error: "ValidationError", fields: {...} }`. A `500` response
    returns only `{ error: "InternalServerError" }` — no internals leaked.

- No login, no user accounts, no sessions anywhere in this product (v0
  scope, both repos).

**IMPORTANT — cross-repo contract risk:** the `tense`/`subject`/`platform`
enum literals above were chosen by the backend team ahead of this app's
existence (best-guess, flagged as needing verification — see
`portuguese-verb-api`'s Phase 3 decisions D-07/D-08). Verify these literals
match whatever this app's actual dataset/quiz UI uses **before** wiring up
feedback submission — a mismatch causes legitimate feedback to `400`.

## Auth Model

None. Matches the backend — no login, no accounts, no sessions.

## Critical Conventions / Gotchas

- Never embed Supabase credentials or connection strings in this app —
  all persistence goes through the backend API's `POST /feedback`, never
  direct database access.

- Jest (`jest-expo` preset) with plain unit tests in `__tests__/` — one file
  per module, no `@testing-library/react-native` (business logic is kept
  framework-free so it's testable without rendering). Full detail:
  `.planning/codebase/TESTING.md`.

## File/Folder Structure

```
app/                   # Expo Router screens (index, quiz, results, _layout)
src/
  dataset/             # verb data, types, validation, local/remote source resolution
  quiz/                 # pure quiz generation/scoring/sharing logic
  feedback/             # feedback payload/schema/submit + ReportFeedbackModal
  components/           # shared UI (OfflinePill)
  theme/                # design tokens
  store/                # Zustand stores
__tests__/             # Jest unit tests, one file per src/ module
.planning/             # planning docs (version-controlled — GSD phase history, ROADMAP, STATE)
.planning/codebase/    # generated codebase maps (STACK, ARCHITECTURE, CONVENTIONS, TESTING, etc.)
```

Full detail: `.planning/codebase/STRUCTURE.md`.

---

## Agent startup (read in this order)

1. `mcp__portuguese-verb-memory__get_current_focus(repo: "portuguese-verb-mobile")` and
   `mcp__portuguese-verb-memory__get_next_tasks(repo: "portuguese-verb-mobile")` — authoritative live
   state

2. `.planning/.continue-here.md` — tactical constraints for the next task (once it exists)
3. Regenerate `.planning/STATE.md` from the MCP tools above before starting work

## On-demand only (do NOT read at every session start)

- `mcp__portuguese-verb-memory__get_repo_summary` — only for full history or blocker list
- `mcp__portuguese-verb-memory__get_decisions(scope: "portuguese-verb-mobile")` — only when questioning
  why something was built a certain way

- `mcp__portuguese-verb-memory__get_cross_repo_warnings` — only for cross-cutting
  architectural decisions (e.g. changes to the `POST /feedback` contract)

- `mcp__portuguese-verb-memory__get_shared_constraints` — only when touching shared types
  or APIs

- `.planning/ROADMAP.md` — only when picking up a new phase or milestone

## Completion lifecycle

- Task start: call `mcp__portuguese-verb-memory__set_next_tasks(repo: "portuguese-verb-mobile", tasks: [...])`
- After each slice: call `mcp__portuguese-verb-memory__save_completion(repo: "portuguese-verb-mobile", summary: "...",
  changedFiles: [...], nextStep: "...")`

- Task done: call `mcp__portuguese-verb-memory__resolve_blocker` if it cleared a blocker
- Architecture decisions: call `mcp__portuguese-verb-memory__save_decision(scope: "portuguese-verb-mobile", decision: "...",
  rationale: "...")`

- Session end: rewrite `.planning/.continue-here.md` with current handoff state

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Portuguese Verb Conjugation App — Mobile**

An iOS-first Expo React Native app (TypeScript, Expo Router) that lets beginner
(A1-A2) learners of European Portuguese practice verb conjugation through short
quizzes, now backend-served with a silent local fallback. It is the companion
mobile client to the already-shipped `portuguese-verb-api` backend, but ships
as its own independent sibling repo, not a monorepo package.

**Shipped in v0.0:** the full core loop — pick tenses + irregular-verb toggle,
complete a 10-question quiz against a hand-verified 50-verb European Portuguese
dataset, see a score, share it, and optionally report a problem with any
question straight to the live backend.

**Shipped in v0.1:** quiz content now fetches from the live backend
(`GET /content/verbs`) with automatic, validated, silent fallback to the
bundled local dataset on any failure — the dataset source is snapshotted at
quiz-start so a background refresh can never swap questions mid-session. A
learner can cleanly exit an in-progress quiz via a header control or native
back gesture, both routed through one shared confirmation with no bypass. All
3 screens (Setup, Quiz, Results) share a consistent, safe-area-aware visual
language via a tokens module, verified on a real notched device. A small
"Using saved content" indicator (pulled forward from v2 to close a milestone
audit gap) makes the local-fallback signal visible to the learner without
reopening the fetch step's zero-blocking guarantee.

**Core Value:** A learner can open the app, pick what to practice, complete a 10-question
conjugation quiz entirely offline, and see an accurate score. Everything else
(sharing, feedback) supports that loop but must never block it.

**Still the right priority after shipping v0.0** — nothing during development
surfaced a different core value; the feedback and share features stayed
firmly secondary to the offline quiz loop throughout, exactly as scoped.

### Constraints

- **Tech stack**: Expo (React Native) + TypeScript + Expo Router — iOS-first — locked by CLAUDE.md and confirmed at project setup
- **State management**: Zustand for quiz session state — chosen over plain React state for nicer ergonomics as quiz logic grows; app remains small so no heavier state library needed
- **Testing**: Jest with the Expo preset — standard for Expo/RN, works out of the box with TypeScript
- **Backend contract**: Mobile only ever calls `POST /feedback` (submit) and `GET /content/verbs` (dataset fetch, with local fallback) on the live backend; never connects to Supabase directly or stores credentials — locked cross-repo constraint
- **Dataset authoring**: Full 50-verb target dataset (4 tenses × 6 subjects each) is significant hand-authored content; drafted by the assistant and reviewed by the user for conjugation accuracy before it ships

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

@.planning/codebase/STACK.md
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

@.planning/codebase/CONVENTIONS.md
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

@.planning/codebase/ARCHITECTURE.md
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
