# Portuguese Verb Conjugation App — Mobile

This is `apps/mobile`, the companion mobile client to the backend API in
the sibling repo `portuguese-verb-api` (`avramaruh92/portuguese-verb-backend`).
It's an Expo React Native app, iOS-first, for beginner (A1-A2) learners of
European Portuguese practicing verb conjugation via quizzes.

**This document is a starter skeleton.** Sections marked `[TBD]` are not
yet confirmed and should be filled in via `/gsd:new-project`'s context
gathering, not assumed. Do not treat `[TBD]` sections as settled fact.

## Tech Stack

- Expo (React Native), iOS-first
- TypeScript
- Expo Router (navigation) — confirmed via `portuguese-verb-memory` MCP state
- [TBD] State management approach
- Local, typed verb dataset for offline quiz play — format/storage details [TBD]

## Commands

```bash
# [TBD] — populate once the Expo project is scaffolded (npx create-expo-app or similar)
```

## Key Domain Facts (confirmed, cross-repo binding)

These are locked by the backend's already-shipped v0.0 milestone
(`portuguese-verb-api`) — the mobile app must match them, not redefine them:

- The mobile app holds a **local, offline verb dataset** for quiz play —
  it does not fetch quiz content from any backend. There is currently no
  content-serving API.
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
- [TBD] Testing conventions — populate once the stack is chosen.

## File/Folder Structure

```
.planning/            # planning docs (version-controlled — GSD phase history, ROADMAP, STATE)
[TBD — populate once Expo project is scaffolded]
```

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
