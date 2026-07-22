# Phase 19: General Product Feedback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 19-general-product-feedback
**Areas discussed:** Entry point placement, Quiz two-action row, Feedback modal UX, Component/domain structure

---

## Entry point placement

| Option | Description | Selected |
|--------|-------------|----------|
| Small footer link | Subtle text link below Start Quiz — low visual weight | ✓ (Setup) |
| Header icon/button | Always-visible icon in the header | |
| Settings-style row | Tappable row/card below filters | |

**Setup screen — user's choice:** Small footer link, below Start Quiz button.

| Option | Description | Selected |
|--------|-------------|----------|
| Small footer link below the 3 actions | Same subtle-link treatment as Setup | ✓ |
| Fourth button in the action group | Equal weight to Share/Try Again/Back to Setup | |
| Header icon/button | Independent of the results action group | |

**Results screen — user's choice:** Small footer link below the Share/Try Again/Back to Setup action group.

**Notes:** User confirmed "Next area" without further clarification — entry point placement settled after one round.

---

## Quiz two-action row

| Option | Description | Selected |
|--------|-------------|----------|
| Equal weight, side-by-side | Both buttons same secondary style, half-width row | ✓ |
| Report primary, Improve secondary | Report a problem keeps prominence | |
| Improve primary, Report secondary | Flip emphasis | |

**User's choice:** Equal weight, side-by-side.

| Option | Description | Selected |
|--------|-------------|----------|
| Available immediately | Help us improve shown from question-load, no lockedChoice gating | ✓ |
| Gated on lockedChoice like Report | Both buttons appear together only after locking | |

**User's choice:** Available immediately (pre-lock).

**Conflict surfaced:** ROADMAP.md's Phase 19 success criteria #2 literally reads "after an answer is locked, a two-action row offers 'Report a problem' and 'Help us improve'" — implying both appear together post-lock. This directly conflicted with the user's just-given answer (pre-lock availability for Help us improve). Claude flagged the conflict explicitly and asked the user to resolve it.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it simple: both post-lock | Follow ROADMAP.md literally | |
| Help us improve pre-lock, Report post-lock | Diverges from literal ROADMAP wording, matches user's stated intent | ✓ |

**User's choice:** Help us improve pre-lock, Report a problem post-lock (divergent timing, not one synchronized row). Captured as D-04 in CONTEXT.md with explicit reasoning for downstream agents so this isn't mistaken for scope drift.

**Notes:** This is the most consequential decision in this session — downstream agents should read D-04 carefully since it overrides a literal ROADMAP.md sentence.

---

## Feedback modal UX

| Option | Description | Selected |
|--------|-------------|----------|
| Same pill-list style as Report modal | Reuse ReportFeedbackModal's reason-picker pattern | ✓ |
| Segmented control | Single connected 3-segment control | |

**User's choice:** Same pill-list style as Report modal.

| Option | Description | Selected |
|--------|-------------|----------|
| Submit-time only, no live counter | Matches existing Report modal, no char counter | ✓ |
| Live character counter | "X/2000" counter, more polish, more new UI | |

**User's choice:** Submit-time only, no live counter.

**Notes:** No further clarification requested — user moved to next area after one round.

---

## Component/domain structure

| Option | Description | Selected |
|--------|-------------|----------|
| Full mirror, zero sharing | Separate types/schema/payload/submit/Modal, no code shared with src/feedback/ | ✓ |
| Share the AbortController/timeout submit helper | Extract shared fetch-timeout helper | |

**User's choice:** Full mirror, zero sharing.

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded literal prop per screen | Each screen passes screen="setup"/"quiz"/"results" explicitly | |
| Derived from route/pathname | Modal introspects expo-router route automatically | ✓ |

**User's choice:** Derived from route/pathname. Flagged in CONTEXT.md (D-08) as needing research-phase feasibility verification against `expo-router`'s pathname APIs and typed-routes mode, with a documented fallback (hardcoded literal prop) if it proves unreliable.

**Notes:** This is an implementation-detail decision the user chose deliberately over the more conventional prop-passing pattern already used for `appVersion`/`platform`.

---

## Claude's Discretion

- Exact modal title wording and success/error copy for `ProductFeedbackModal` — follow `ReportFeedbackModal`'s existing tone.
- Footer-link exact styling (font size/color) — informed by `theme/tokens.ts`, not separately discussed.

## Deferred Ideas

None — discussion stayed entirely within Phase 19's scope. No scope-creep suggestions came up.
