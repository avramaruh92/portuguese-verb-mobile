# Phase 18: Explanation Compatibility Upgrade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 18-explanation-compatibility-upgrade
**Areas discussed:** Tie-break resolution for selected labels, Notes/hints append format, Notes/hints append scope, Generic-fallback label handling

---

## Tie-break resolution (agreeing tied matches)

| Option | Description | Selected |
|--------|-------------|----------|
| First match wins | Use matches[0]'s tense/subject for interpolation — simplest, deterministic by array order, matches how classify() already picks categories[0] as the tiebreak reference | ✓ |
| Only interpolate if all matches agree exactly | If matches agree on category but differ in tense/subject, omit selectedTenseLabel/selectedSubjectLabel from context rather than guessing | |

**User's choice:** First match wins
**Notes:** None

---

## Notes/hints append format

| Option | Description | Selected |
|--------|-------------|----------|
| Newline-separated, tenseNotes then subjectHints | explanation + '\n' + tenseNotes + '\n' + subjectHints, only appending the ones that exist | ✓ |
| Space-separated, single paragraph | explanation + ' ' + tenseNotes + ' ' + subjectHints, all on one line | |

**User's choice:** Newline-separated, tenseNotes then subjectHints
**Notes:** None

---

## Notes/hints append scope

| Option | Description | Selected |
|--------|-------------|----------|
| Always append when present | Regardless of category — wrongTense, wrongSubject, wrongTenseAndSubject, or generic — append notes/hints whenever backend content has them | ✓ |
| Only for the matching category | Only append tenseNotes for wrongTense/wrongTenseAndSubject, only subjectHints for wrongSubject/wrongTenseAndSubject, skip both for generic | |

**User's choice:** Always append when present (recommended option)
**Notes:** None

---

## Generic-fallback label handling (disagreeing tied matches)

| Option | Description | Selected |
|--------|-------------|----------|
| Omit selected labels entirely | generic template doesn't use these placeholders anyway — no behavior difference, but conceptually cleaner since EXPL-06 ties label resolution to "the same selected match that drove the mismatch category," which doesn't exist on a disagreement fallback | ✓ |
| Still compute from first match | Always populate selectedTenseLabel/selectedSubjectLabel from matches[0] regardless of category, in case a future generic template variant wants them | |

**User's choice:** Omit selected labels entirely (recommended option)
**Notes:** None

---

## Claude's Discretion

- Exact placement of the label-resolution/appending logic within
  `explain.ts` (helper function vs. inline in `selectExplanation`) — no
  structural preference expressed.

## Deferred Ideas

None — discussion stayed within phase scope.
