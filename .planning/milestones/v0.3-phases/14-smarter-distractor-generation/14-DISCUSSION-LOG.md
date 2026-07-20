# Phase 14: Smarter Distractor Generation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 14-Smarter Distractor Generation
**Areas discussed:** Wrong-tense pick, Conjugation class, Tier fill order

---

## Wrong-tense pick (tier 2 priority when question tense isn't preterite/imperfect)

| Option | Description | Selected |
|--------|-------------|----------|
| Preterite/imperfect first, always | Regardless of question tense, prefer that pair as the single most confusable one; fall back to other tense only if unavailable | |
| Any other tense, no special-case | Preterite/imperfect preference only applies when the question tense itself IS preterite or imperfect; otherwise pick from whichever other same-verb tense is available, no special ordering | ✓ |
| Fixed tense priority order | One fixed priority order across all 4 tenses, always walk it skipping the question's own tense | |

**User's choice:** Any other tense, no special-case
**Notes:** Preterite/imperfect prioritization (D-01) only kicks in when the question's own tense is preterite or imperfect. For present_indicative/future questions, tier 2 has no special ordering (D-02) — shuffled among whatever other same-verb tense forms exist.

---

## Conjugation class (tier 3 cross-verb fallback preference)

| Option | Description | Selected |
|--------|-------------|----------|
| Derive from infinitive ending (-ar/-er/-ir) | Compute class as the verb's last two letters at selection time, no schema change; prefer same-class verbs before any verb | ✓ |
| Skip class-matching, keep current fallback | Treat "same conjugation class where available" as out of scope for this phase | |

**User's choice:** Derive from infinitive ending (-ar/-er/-ir)
**Notes:** Confirmed via `src/dataset/verbs.ts` scan that all verbs are plain infinitives ending in ar/er/ir — no dataset/schema change needed.

---

## Tier fill order

| Option | Description | Selected |
|--------|-------------|----------|
| Strict fill-then-fallback | Fill tier 1 to exhaustion, then tier 2 for remaining slots, then tier 3 for whatever's left — matches current code structure, just adds the missing middle tier | ✓ |
| Guarantee at least one wrong-tense distractor when available | Reserve at least 1 slot for a wrong-tense distractor even if tier 1 alone could fill all 3 | |

**User's choice:** Strict fill-then-fallback (Recommended)
**Notes:** No slot-reservation/mixing across tiers.

---

## Claude's Discretion

- Exact internal helper function names/shapes for the new tier-2 logic.
- Shuffle/randomization mechanics within tier 2 (reuses the existing injectable `random` parameter pattern unchanged).

## Deferred Ideas

None — discussion stayed within phase scope.
