# Phase 9: End-Quiz-Early Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 9-End-Quiz-Early Flow
**Areas discussed:** Header vs in-content exit control, Confirmation dialog mechanism, Exit control label/icon, Confirmation dialog exact copy

---

## Header vs in-content exit control

| Option | Description | Selected |
|--------|-------------|----------|
| Native Stack header (Quiz screen only) | Override headerShown: false just for app/quiz.tsx, add a headerLeft button. | ✓ |
| In-content top control | Add a top-left Pressable inside quiz.tsx's existing ScrollView content, matching the Report button pattern. | |

**User's choice:** Native Stack header (Quiz screen only)
**Notes:** Accepted as a deliberate, temporary inconsistency with Setup/Results (which stay headerless); Phase 10 may unify header treatment later.

---

## Confirmation dialog mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Native Alert.alert | RN core Alert.alert(title, message, buttons) — zero new dependency, real iOS system dialog look. | ✓ |
| Custom Modal component | Build a new modal matching ReportFeedbackModal's existing custom-styled pattern. | |

**User's choice:** Native Alert.alert
**Notes:** Must be triggered from both the header button's onPress and the beforeRemove listener's interception — one shared handler.

---

## Exit control label/icon

| Option | Description | Selected |
|--------|-------------|----------|
| "X" icon only | iOS modal-dismiss convention. | |
| Text label ("Cancel") | Follows native iOS modal cancel-button convention. | |
| Text label ("Exit") | More explicit about the action's consequence than "Cancel". | ✓ |

**User's choice:** Text label ("Exit")
**Notes:** None.

---

## Confirmation dialog exact copy

| Option | Description | Selected |
|--------|-------------|----------|
| Lock it now | Title "Quit Quiz?", message "Your progress will be lost.", buttons "Quit Quiz" / "Keep Practicing". | |
| Claude's discretion | Claude picks reasonable copy during planning/execution, following the roadmap's intent. | ✓ |

**User's choice:** Claude's discretion
**Notes:** Follow roadmap's example intent (distinct, unambiguous labels, no generic OK/Cancel) — not locked verbatim.

---

## Claude's Discretion

- Exact confirmation dialog copy (title/message/button text) — follow roadmap intent, not locked verbatim.
- Whether the Quiz-only header override lives inline in app/quiz.tsx or via route-level options export.
- Whether the shared exit-confirmation handler is a local function or an extracted hook.

## Deferred Ideas

None — discussion stayed within phase scope.
