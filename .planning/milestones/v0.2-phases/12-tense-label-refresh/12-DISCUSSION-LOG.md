# Phase 12: Tense Label Refresh - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 12-Tense Label Refresh
**Areas discussed:** Portuguese grammar names placement, primary label scope, secondary-text format, secondary-text tense coverage

---

## Portuguese grammar names — whether to add them

| Option | Description | Selected |
|--------|-------------|----------|
| Don't add them | Only change the two primary labels; LABEL-02 satisfied by omission, no new secondary-text UI | |
| Add on Quiz screen meta row | Append Portuguese term in secondary text next to tense label in `app/quiz.tsx`'s meta row | ✓ |
| Add on Setup screen chips | Show Portuguese term as a second line inside each tense-selection chip in `app/index.tsx` | |

**User's choice:** Add on Quiz screen meta row.
**Notes:** LABEL-02 only *permits* Portuguese names as secondary text; it doesn't mandate them. User chose to actively add them on the Quiz screen rather than leave the requirement satisfied passively.

---

## Scope of primary label changes

| Option | Description | Selected |
|--------|-------------|----------|
| Only preterite/imperfect change | "Present"/"Future" stay exactly as-is | ✓ |
| Also reconsider Present/Future wording | Open up whether those two also get friendlier labels | |

**User's choice:** Only preterite/imperfect change.
**Notes:** Matches ROADMAP success criteria #1 literally — no scope creep into relabeling unambiguous tenses.

---

## Portuguese name display format

| Option | Description | Selected |
|--------|-------------|----------|
| Inline, same line, parenthesized | e.g. "correr · Completed past (Pretérito perfeito) · eles/elas" | ✓ |
| New second line below, caption-sized | Meta row unchanged; new line below shows just the Portuguese term in caption+textSecondary | |

**User's choice:** Inline, same line, parenthesized.
**Notes:** Keeps the meta row as one line; styling (whether the parenthetical uses `textSecondary`) left to implementer discretion.

---

## Which tenses get the Portuguese parenthetical

| Option | Description | Selected |
|--------|-------------|----------|
| Only preterite/imperfect | Present/Future stay plain, no parenthetical | ✓ |
| All four tenses | Every tense shows its Portuguese grammar name for consistency | |

**User's choice:** Only preterite/imperfect.
**Notes:** Present/Future have no ambiguity to disambiguate and weren't part of this phase's requirements — avoids clutter.

---

## Claude's Discretion

- Exact color/emphasis treatment of the parenthetical Portuguese term (reuse `colors.text` inline vs. nest a `colors.textSecondary` `<Text>`).
- Naming/shape of the new Portuguese-grammar-name lookup structure in `src/quiz/labels.ts`.
- Whether the Portuguese-grammar-name rendering gets its own test coverage beyond what TEST-01 strictly requires for the primary labels.

## Deferred Ideas

None — discussion stayed within phase scope.
