# Phase 2: Dataset & Domain Vocabulary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 2-Dataset & Domain Vocabulary
**Areas discussed:** Verb selection mix, Internal vocabulary vs backend literals, Conjugation accuracy source, Irregular-verb flag criteria

---

## Verb Selection Mix

**Question 1: Regular/irregular ratio**

| Option | Description | Selected |
|--------|-------------|----------|
| Mostly regular, few irregular | ~35-40 regular + ~10-15 common irregulars, matches A1-A2 level | ✓ |
| Even split (~25/25) | Roughly half regular, half irregular | |
| I'll give you the list | User provides a specific 50-verb list | |

**User's choice:** Mostly regular, few irregular (Recommended for A1-A2)

**Question 2: -ar/-er/-ir weighting among regulars**

| Option | Description | Selected |
|--------|-------------|----------|
| Roughly proportional to real usage | ~50% -ar, ~30% -er, ~20% -ir | ✓ |
| Even thirds | Split regulars evenly across the three classes | |

**User's choice:** Roughly proportional to real usage (Recommended)

**Notes:** Near-certain core irregulars named as examples during discussion (ser, estar, ter, ir,
fazer, poder, querer, dizer, ver, dar, vir, saber, pôr) — not a final exhaustive list. Full list
drafted by Claude, reviewed by user before shipping (see PROJECT.md constraint).

---

## Internal Vocabulary vs Backend Literals

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror backend literals exactly | Tense/Subject types use the exact backend enum strings everywhere; zero mapping needed in Phase 5 for these fields; display labels are a separate lookup table | ✓ |
| App-internal naming + explicit mapping | Friendlier internal names now, dedicated mapping function built in Phase 5 | |

**User's choice:** Mirror backend literals exactly (Recommended)

**Notes:** This closes off a design question that would otherwise resurface in Phase 5 — the
mapping-layer work described in `.planning/research/ARCHITECTURE.md` for `src/api/feedbackClient.ts`
still applies to display-label→literal conversion, but the Tense/Subject *type values* themselves
need no conversion since they already equal the backend literals.

---

## Conjugation Accuracy Source

| Option | Description | Selected |
|--------|-------------|----------|
| Draft from your own knowledge, I'll review | Claude drafts the dataset, user does a verb-by-verb read-through before shipping | ✓ |
| I'll name a specific reference | User cites a specific grammar/conjugator source of truth | |

**User's choice:** Draft from your own knowledge, I'll review (Recommended)

**Notes:** Consistent with the existing ROADMAP Phase 6 plan ("dataset accuracy read-through vs
authoritative EP source, live cold-start test, edge cases") — planner has discretion on whether the
read-through happens at the end of Phase 2 or is deferred to the dedicated Phase 6 pass.

---

## Irregular-Verb Flag Criteria

| Option | Description | Selected |
|--------|-------------|----------|
| Irregular in the present indicative | Traditional EP A1-A2 teaching definition | ✓ |
| Irregular in any of the 4 quizzed tenses | Broader net, catches verbs irregular only in preterite/imperfect/future | |

**User's choice:** Irregular in the present indicative (Recommended)

---

## Claude's Discretion

- Exact dataset file structure (single `verbs.ts` vs split files)
- Zod schema shape and validation test structure (per STACK.md's existing recommendation)
- Whether `validateDataset()` runs at runtime in `__DEV__` in addition to test-time
- The specific 35-40 regular verbs and remaining ~2-5 irregular verbs beyond the 13 named examples

## Deferred Ideas

- Tense/Subject → display-label mapping table (e.g., "nós", "ele/ela" with accents/slashes) — raised
  during the vocabulary-strategy discussion, explicitly deferred to Phase 4 (setup/quiz UI), not
  built in this phase.
