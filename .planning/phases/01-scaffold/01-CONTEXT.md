# Phase 1: Scaffold - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A working Expo Router + TypeScript + Zustand + Jest-expo project skeleton that
runs on the iOS simulator to an empty root screen with no errors, has a green
test suite (trivial smoke test via `jest-expo`), TypeScript strict mode
compiling with zero errors, and a basic Zustand store scaffold that can be
imported without runtime error. No domain logic (dataset, quiz engine, UI,
feedback) is built in this phase — those are Phases 2-5.

</domain>

<decisions>
## Implementation Decisions

### Package Manager
- **D-01:** Use npm (not yarn/pnpm/bun) for all installs and scripts. Matches Expo's default docs/templates and every command already written in research/STACK.md (`npx create-expo-app`, `npx expo install`).

### Source Folder Structure
- **D-02:** Keep `app/` routes-only per Expo Router convention. All domain logic lives in a sibling `src/` tree: `src/dataset/`, `src/quiz-engine/`, `src/store/`, `src/api/`. This matches the architecture research's pure-domain-core recommendation (dataset/engine have zero React/Router imports; Zustand store and Router screens stay thin).

### iOS Simulator Target
- **D-03:** Develop and verify against whatever ships as Xcode's current default simulator (latest iPhone model, latest iOS) — no legacy device/OS pinning needed since this is a fresh v0 app with no backward-compatibility requirement.

### Root Screen Placeholder
- **D-04:** Phase 1 creates a single index route only (`app/index.tsx` or equivalent), proving Expo Router boots cleanly to an empty screen. Do NOT stub out setup/quiz/results route files yet — those are created in Phase 4 when they're actually built, keeping Phase 1 strictly infrastructure.

### Claude's Discretion
- Exact `tsconfig.json` strict-mode flags beyond `"strict": true` (e.g., `noUncheckedIndexedAccess`) — apply reasonable strict defaults per research/STACK.md's `expo/tsconfig.base` recommendation.
- Exact content/wording of the trivial smoke test — any test that proves `jest-expo` preset runs and passes is sufficient.
- ESLint config — keep `eslint-config-expo` default per research/STACK.md; no custom flat config unless a specific rule conflicts with Zustand/Zod patterns later.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Versions
- `.planning/research/STACK.md` — Expo SDK 57, Expo Router 6.x, TypeScript 5.x (not 7.x), Zustand 5.x, Zod 4.x, jest-expo 57.0.1; exact install commands and what NOT to install (axios, expo-sharing, AsyncStorage)

### Architecture
- `.planning/research/ARCHITECTURE.md` — pure-domain-core pattern (`dataset/`, `quiz-engine/` with zero React imports) wrapped by thin Zustand store and thin Expo Router screens; single isolated `api/feedbackClient.ts` boundary

### Project Contract
- `.planning/PROJECT.md` — core value, constraints, locked backend enum literals
- `.planning/ROADMAP.md` §Phase 1 — success criteria this phase must satisfy
- `CLAUDE.md` — backend `POST /feedback` contract (not used until Phase 5, but locked now)

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
None — greenfield repo, no Expo project scaffolded yet.

### Established Patterns
None yet established — this phase establishes the first patterns (folder structure, strict TS config).

### Integration Points
N/A for this phase — no existing system to integrate with.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — open to standard Expo Router + TypeScript + Zustand scaffolding approach per research/STACK.md.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Scaffold*
*Context gathered: 2026-07-12*
