# Phase 8: Async Quiz Start & Dataset Snapshot - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 8-Async Quiz Start & Dataset Snapshot
**Areas discussed:** Snapshot resolution strategy, Start button UX, Store status enum, Prefetch trigger location

---

## Snapshot Resolution Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Await resolveVerbs(), it's fast in practice | startQuiz() awaits the existing resolveVerbs() promise; resolves near-instantly after first app load since prefetch already kicked off. Small residual risk of a long wait on a genuine cold start, mitigated by button-level loading state. | ✓ |
| Never await network — synchronous snapshot only | Add a synchronous "whatever's resolved right now" getter; startQuiz() never waits, even briefly, but risks serving local on the very first quiz even on a fast connection. | |

**User's choice:** Await resolveVerbs(), it's fast in practice (recommended option).
**Notes:** None — user accepted the recommendation directly.

---

## Start Button UX

| Option | Description | Selected |
|--------|-------------|----------|
| Disable + spinner label during resolution | Start button shows a brief disabled/loading state ("Starting…") for the duration of the await, then navigates. State machine only, Phase 10 owns final visuals. | ✓ |
| No visual change — instant in practice | Skip loading UI entirely this phase; risks looking unresponsive on a slow cold-start edge case. | |

**User's choice:** Disable + spinner label during resolution (recommended option).
**Notes:** None.

---

## Store Status Enum

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the 4 existing states | No new status value; button-level loading flag handles transient UI locally. Simpler state machine for Phase 9 to build on. | ✓ |
| Add a 5th "starting" status | More explicit/inspectable, but adds a state every future consumer of `status` (including Phase 9's exit-flow) must handle. | |

**User's choice:** Keep the 4 existing states (recommended option).
**Notes:** None.

---

## Prefetch Trigger Location

| Option | Description | Selected |
|--------|-------------|----------|
| Root layout mount, app/_layout.tsx | Call prefetch() once in app/_layout.tsx — earliest point every screen mounts through, matches Phase 7's own D-03 suggestion exactly. | ✓ |
| Inside useQuizStore itself (module init) | Fetch kicks off as soon as the store module is first imported; more implicit/hidden, decouples trigger from a specific screen. | |

**User's choice:** Root layout mount, app/_layout.tsx (recommended option).
**Notes:** None.

---

## Claude's Discretion

- Exact mechanism for the button-level loading flag (local `useState` per screen vs. a shared hook).
- Whether `prefetch()` fires via a root-layout `useEffect` or a module-level side effect in `app/_layout.tsx`.

## Deferred Ideas

None — discussion stayed within phase scope.
