# Phase 4: Quiz Experience (Setup → Quiz → Results) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 4-Quiz Experience (Setup → Quiz → Results)
**Areas discussed:** Setup screen & insufficient-pool handling, Quiz screen feedback & advance flow, Progress indicator during quiz, Results screen & share message

---

## Setup screen & insufficient-pool handling

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select chips/checkboxes, all 4 shown | Present indicative, preterite, imperfect, future all visible and toggleable at once | |
| Multi-select with 'All tenses' shortcut | Same as above plus a top-level 'All' toggle | ✓ |
| You decide | Claude picks a reasonable default | |

**User's choice:** Multi-select with 'All tenses' shortcut

| Option | Description | Selected |
|--------|-------------|----------|
| Disable the Start button until ≥1 tense is selected | Prevents the invalid state entirely, no error path needed | ✓ |
| Allow tapping, show inline validation message | Button stays enabled; tapping with zero tenses shows a message | |

**User's choice:** Disable the Start button until ≥1 tense is selected

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error message, stay on setup screen | Catch error before navigating, show short message on setup screen | ✓ |
| Navigate to quiz screen, show error state there | Let quiz screen catch and render error/empty state | |

**User's choice:** Inline error message, stay on setup screen

| Option | Description | Selected |
|--------|-------------|----------|
| Label only, no extra copy | Just the toggle with its label text | ✓ |
| Label + short helper text | Add a one-line explanation under the toggle | |

**User's choice:** Label only, no extra copy

**Notes:** None provided beyond selections.

---

## Quiz screen feedback & advance flow

| Option | Description | Selected |
|--------|-------------|----------|
| Color the tapped choice green/red + reveal correct one | Tapped choice colored; if wrong, correct choice also highlighted green | ✓ |
| Color the tapped choice only, no reveal | Simpler, but wrong answer doesn't show the right one | |
| You decide | Claude picks a reasonable default | |

**User's choice:** Color the tapped choice green/red + reveal correct one

| Option | Description | Selected |
|--------|-------------|----------|
| Manual 'Next' button after feedback shows | User controls pacing | ✓ |
| Auto-advance after a short delay (~1-1.5s) | Faster pacing, risk of missed feedback | |

**User's choice:** Manual 'Next' button after feedback shows

| Option | Description | Selected |
|--------|-------------|----------|
| Locked — first tap is final | All choices disabled after first tap | ✓ |
| Changeable until 'Next' is tapped | User can tap a different choice before confirming | |

**User's choice:** Locked — first tap is final

**Notes:** None provided beyond selections.

---

## Progress indicator during quiz

| Option | Description | Selected |
|--------|-------------|----------|
| Text counter only (e.g. '3 / 10') | Simple text label | |
| Progress bar only | Visual bar, no exact number | |
| Both counter and progress bar | Text counter plus visual bar | ✓ |
| You decide | Claude picks a reasonable default | |

**User's choice:** Both counter and progress bar

**Notes:** None provided beyond selection.

---

## Results screen & share message

| Option | Description | Selected |
|--------|-------------|----------|
| Large number treatment ('7/10') | Big, prominent 'X/10' as visual centerpiece | ✓ |
| Plain text sentence | e.g. 'You scored 7 out of 10' as regular body text | |
| You decide | Claude picks a reasonable default | |

**User's choice:** Large number treatment ('7/10')

| Option | Description | Selected |
|--------|-------------|----------|
| "I scored X/10 on Portuguese Verb Quiz!" | Score-first, casual/celebratory tone | ✓ |
| You decide | Claude drafts exact wording | |

**User's choice:** "I scored X/10 on Portuguese Verb Quiz!"

| Option | Description | Selected |
|--------|-------------|----------|
| Share + 'Try Again' (same filters) + back to Setup | Three actions: share, restart with same filters, change filters | ✓ |
| Share + 'Back to Setup' only | Two actions: share and back to setup | |
| You decide | Claude picks a reasonable default | |

**User's choice:** Share + 'Try Again' (same filters) + back to Setup

**Notes:** None provided beyond selections.

---

## Claude's Discretion

- Exact visual layout/styling details (spacing, typography, colors beyond
  green/red feedback semantics, iconography)
- Whether tense multi-select renders as chips, checkboxes, or another control
  (functional multi-select + "All tenses" shortcut semantics locked, visual
  treatment open)
- Exact Zustand store shape for `useQuizStore` beyond required session/index/
  answers/filters data
- Navigation/routing file structure under `app/`

## Deferred Ideas

None — discussion stayed within phase scope. Feedback submission (success/error/
cold-start handling) is explicitly Phase 5 and was not raised as scope creep.
