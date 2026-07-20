# Phase 13: Verb Mode Selection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 13-Verb Mode Selection
**Areas discussed:** Selector UI style, Option labels & order, Type/field naming, Insufficient-pool error copy

---

## Selector UI style

| Option | Description | Selected |
|--------|-------------|----------|
| 3-chip row | Matches existing tense-selection chip row, single-select instead of multi-select | ✓ |
| Segmented control | iOS-native segmented control look, new visual pattern | |
| Vertical radio list | Three stacked rows with radio indicator, more vertical space | |

**User's choice:** 3-chip row.
**Notes:** Followed up with placement/labeling: verb-mode row sits below the tense row (same spot the Switch occupies today), and it gets its own "Verb mode" section label (matching the "Select tenses" pattern). Single-select/radio behavior confirmed as an implementation consequence of the 3-way data model, not treated as a real open question.

| Follow-up question | Options | Selected |
|---|---|---|
| Placement relative to tense row | Below tenses / Above tenses | Below tenses |
| Section label | Yes, "Verb mode" / No label | Yes, "Verb mode" |

---

## Option labels & order

| Option | Description | Selected |
|--------|-------------|----------|
| Regular → Mixed → Irregular | Matches ROADMAP.md's success-criteria order; difficulty progression; default is leftmost | ✓ |
| Mixed → Regular → Irregular | "Most content" option first, but default isn't leftmost | |

**User's choice:** Regular → Mixed → Irregular order.

| Follow-up question | Options | Selected |
|---|---|---|
| Chip label copy | Verbatim "Regular only"/"Mixed"/"Irregular only" / Different wording | Verbatim from ROADMAP.md |

**Notes:** Both order and copy locked verbatim to ROADMAP.md's success-criteria language — no ambiguity remained.

---

## Type/field naming

| Option | Description | Selected |
|--------|-------------|----------|
| `verbMode: VerbMode` | New union type, mirrors Tense/Subject conventions | ✓ |
| Different naming | User-specified alternative | |

**User's choice:** `verbMode: VerbMode`.

| Follow-up question | Options | Selected |
|---|---|---|
| Type location | `src/quiz/types.ts` / `src/dataset/types.ts` | `src/quiz/types.ts` |

**Notes:** `VerbMode` treated as a quiz-generation concept (pool filter), not a dataset shape — kept alongside `GenerateOptions` rather than grouped with `Tense`/`Subject`.

---

## Insufficient-pool error copy

| Option | Description | Selected |
|--------|-------------|----------|
| Update wording | Replace "...including irregulars" reference to the removed toggle | ✓ |
| Keep exact same text | Leave message unchanged, risking a stale UI reference | |

**User's choice:** Update wording.

| Follow-up question | Options | Selected |
|---|---|---|
| Exact replacement text | "...try selecting more tenses or a different verb mode." / Different wording | Recommended text adopted verbatim |

---

## Claude's Discretion

- Exact local `useState` variable/setter naming inside `app/index.tsx` beyond the `verbMode` field itself, as long as camelCase conventions are followed.

## Deferred Ideas

None — discussion stayed entirely within Phase 13's scope.
