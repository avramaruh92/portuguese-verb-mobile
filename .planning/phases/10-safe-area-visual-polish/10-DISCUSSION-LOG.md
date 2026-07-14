# Phase 10: Safe-Area & Visual Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 10-Safe-Area & Visual Polish
**Areas discussed:** Header/safe-area strategy, Visual palette & style tokens, Fetch loading indicator, Error/fallback state styling

---

## Header/safe-area strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Headers on all 3 screens | Add a native Stack header to Setup and Results too, matching Quiz. Gives consistent top-safe-area handling for free. | ✓ |
| Headerless + manual insets | Keep Setup/Results headerless, add SafeAreaView/useSafeAreaInsets manually. | |

**User's choice:** Headers on all 3 screens
**Notes:** Follow-up asked what header titles should be.

### Header titles

| Option | Description | Selected |
|--------|-------------|----------|
| App name / screen name | Setup: "Portuguese Verb Quiz", Quiz: untitled, Results: "Results" | |
| All untitled (empty) | Every header stays empty, purely for safe-area/chrome; body content unchanged | ✓ |

**User's choice:** All untitled (empty)

---

## Visual palette & style tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current palette, formalize into tokens | Extract existing colors/spacing/typography into a shared tokens file, no visual change. | ✓ |
| Refresh the look while tokenizing | Also improve visual design while building tokens — more risk/scope for a polish phase. | |

**User's choice:** Keep current palette, formalize into tokens
**Notes:** Chosen as lowest-risk option for a single-milestone polish pass.

---

## Fetch loading indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Just polish the existing button state | Style the existing "Starting…" button state (Setup Start, Results Try Again) — no new indicator. | ✓ |
| Add a visible indicator on Setup while resolving | Add an always-visible status element on Setup during background prefetch. | |

**User's choice:** Just polish the existing button state
**Notes:** Confirmed the roadmap's "styled loading indicator" success criterion is satisfied by this existing button state.

---

## Error/fallback state styling

| Option | Description | Selected |
|--------|-------------|----------|
| Just restyle the existing error text | Keep current behavior (red text on status==='error'), give it proper styling with shared tokens. | ✓ |
| Something else | Free-text alternative. | |

**User's choice:** Just restyle the existing error text
**Notes:** Confirmed fetch failures never reach this state (silently falls back to local dataset per Phase 7); the real trigger is `startQuiz()`'s `InsufficientVerbsError`.

---

## Claude's Discretion

- Exact tokens module location/naming and shape.
- Whether Setup/Results' native headers get a `headerLeft`/back affordance or stay chrome-only (leaning chrome-only since Results already has an in-body "Back to Setup" button).
- Exact activity-indicator treatment for the "Starting…" button state.
- `SafeAreaProvider` mount point (root layout, standard convention).

## Deferred Ideas

None — discussion stayed within phase scope. The "refresh the look" and "new always-visible fetch status indicator" alternatives were considered and explicitly declined, not deferred.
