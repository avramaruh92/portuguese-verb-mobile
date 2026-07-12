# Phase 5: Feedback Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 5-Feedback Integration
**Areas discussed:** Entry point, Submit UX, Report form, Button timing, Preset reasons, Error recovery, Success UX, 400 handling, Timeout

---

## Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| Report button on the Quiz screen itself | A small 'Report a problem' affordance appears once an answer is locked — feedback is about the question the learner is looking at right now. | ✓ |
| Report action from the Results screen, per-question review | Results screen would need to list all 10 questions/answers so the user can pick which one to report — more UI work, not currently in the Results screen. | |
| Both — quick report on Quiz screen, plus a general feedback link on Results | Covers per-question reports during the quiz and a catch-all path afterward; more scope than a single entry point. | |

**User's choice:** Report button on the Quiz screen itself.

---

## Submit UX

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/sheet with inline spinner, blocks further input until it resolves | Simple to reason about; user explicitly waits for success/error before doing anything else in the feedback UI. Quiz itself is untouched/still interactive underneath per FDBK-03. | ✓ |
| Fire-and-forget: close the report UI immediately, show a toast when it resolves | Matches STATE.md's Phase 5 blocker note most literally — user isn't stuck waiting through a cold start at all. | |

**User's choice:** Modal/sheet with inline spinner, blocks further input until it resolves.

---

## Report Form

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text message only | Single text input — matches the backend contract's single `message` field, simplest for an A1-A2 audience. | |
| Free-text message + a short preset reason picker | e.g. 'Wrong answer' / 'Typo' / 'Confusing' / 'Other' + optional text — more structured feedback but adds UI not required by the backend contract. | ✓ |

**User's choice:** Free-text message + a short preset reason picker.

---

## Button Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Only after the answer is locked (selectedAnswer exists) | Matches the backend contract needing `selectedAnswer` — button is hidden/disabled until the learner has actually answered the current question. | ✓ |
| Always visible, but selectedAnswer is optional/null until answered | Learner could report a problem before answering; selectedAnswer would need to be nullable, conflicting with the locked backend contract requiring it as required. | |

**User's choice:** Only after the answer is locked.

---

## Preset Reasons

| Option | Description | Selected |
|--------|-------------|----------|
| Wrong answer / Typo or spelling / Confusing wording / Other | Covers the most likely real issues for a hand-authored EU Portuguese dataset plus a catch-all. | ✓ |
| Just let the user type freely, drop the preset picker | Simpler, but conflicts with the earlier "message + preset picker" choice. | |

**User's choice:** Wrong answer / Typo or spelling / Confusing wording / Other.

---

## Error Recovery (500 / network / timeout)

| Option | Description | Selected |
|--------|-------------|----------|
| Show generic error message + a Retry button, modal stays open | User can retry without re-typing their message/reason — the modal keeps their input intact. | ✓ |
| Show generic error message + Dismiss only, feedback is lost | Simpler to implement, but a slow/cold backend (up to ~1 min) risks losing genuine feedback to a timeout that isn't a permanent failure. | |

**User's choice:** Show generic error message + a Retry button, modal stays open.
**Notes:** Applied identically to both 500 and network/timeout cases (D-07/D-08 in CONTEXT.md).

---

## Success UX

| Option | Description | Selected |
|--------|-------------|----------|
| Show a brief success message/checkmark, auto-dismiss after ~1.5s | Learner gets confirmation without needing to tap anything else, then returns straight to the quiz. | ✓ |
| Show success message with a manual 'Done' button to dismiss | Learner explicitly confirms and closes — no timers, more predictable but one extra tap. | |

**User's choice:** Show a brief success message/checkmark, auto-dismiss after ~1.5s.

---

## 400 Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Generic 'Something went wrong, try again' message, don't parse `fields` | Simplest — a 400 here would almost always indicate an app bug rather than a user-fixable input problem. | ✓ |
| Surface the specific field(s) that failed validation from the `fields` object | More informative, but requires extra work for an error case that should never actually happen for a properly-typed client. | |

**User's choice:** Generic 'Something went wrong, try again' message, don't parse `fields`.

---

## Timeout

| Option | Description | Selected |
|--------|-------------|----------|
| ~90 seconds (comfortably covers a full cold start, then treat as network/timeout error) | Matches the ~1 min cold-start figure from STATE.md's Phase 5 blocker note with headroom. | ✓ |
| ~30 seconds (fail faster, accept some false-timeout risk on cold starts) | Better perceived responsiveness for the common case, but risks timing out a legitimately-succeeding cold-start request. | |

**User's choice:** ~90 seconds.

---

## Claude's Discretion

- Exact visual layout of the report modal/sheet (native `Modal` vs custom overlay, spacing, typography, colors).
- Exact string composition combining preset reason + free-text message into the single backend `message` field.
- File-tree location for feedback-submission logic (e.g. `src/feedback/`).
- `appVersion` sourcing (`expo-constants` preferred over `expo-application`).
- `platform` field derivation via `Platform.OS` rather than hardcoding `"ios"`.

## Deferred Ideas

None — discussion stayed within phase scope. No pending todos matched this phase.
