# Phase 15: Learning Content & Explanation Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 15-Learning Content & Explanation Engine
**Areas discussed:** Tied matches, Cross-verb gap

---

## Tied matches (ambiguous formIndex resolution)

| Option | Description | Selected |
|--------|-------------|----------|
| Fall back to generic template | If tied matches disagree on category, use the backend's `generic` template rather than guessing. | ✓ |
| Use the first match | Deterministically pick `FormMatch[0]`, ignoring the tie. | |
| Treat as no match (no panel) | Any ambiguity means no explanation at all. | |

**User's choice:** Fall back to generic template.
**Notes:** Keeps explanations always correct, never confidently wrong on a legitimately tied form (e.g. "falam" ties `voces`/`eles_elas` in `present_indicative`).

---

## Cross-verb gap (DIST-03 distractors vs per-verb formIndex)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, acceptable | Cross-verb distractors silently get no explanation; confirms EXPL-03's fail-closed rule as designed. | |
| No — note as a gap for later | Record as a known limitation for a future phase; do not fix in Phase 15/16. | ✓ |

**User's choice:** No — note as a gap for later.
**Notes:** Cross-verb distractor forms (Phase 14's DIST-03 fallback tier) won't be found in the current verb's own `formIndex`, so they'll almost always resolve to 0 matches → no explanation panel. User wants this explicitly recorded as a real limitation (not silently accepted as fine), deferred to a possible future phase, out of scope for Phase 15/16.

---

## Claude's Discretion

- Module placement/naming for the new parsing + explanation-selection logic (likely a new `src/learning/` domain folder, mirroring `dataset/`/`quiz/`/`feedback`).
- Whether/how the per-session dataset snapshot (`src/dataset/source.ts`) is extended to also carry `learning`, consistent with the existing quiz-start snapshot guarantee.
- Exact mobile-side TypeScript shapes for `LearningContent`/`FormMatch`, mirrored from the backend's shapes but not required to be byte-identical.

## Deferred Ideas

- Cross-verb `formIndex` resolution (see "Cross-verb gap" above) — candidate for a future phase if explanation coverage feels too sparse in practice once shipped.
