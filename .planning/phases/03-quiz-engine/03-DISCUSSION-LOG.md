# Phase 3: Quiz Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 3-Quiz Engine
**Areas discussed:** Answer choices/distractors, Question identity & no-immediate-repeats, Small filtered-pool fallback, Randomization & testability

---

## Answer Choices — Is Distractor Generation In Scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Engine generates all 4 choices | generate() returns each question with a choices array (1 correct + 3 distractors) plus correctAnswer | ✓ |
| Engine returns only verb+tense+subject+correctAnswer | Distractor/choice-building deferred to Phase 4 | |

**User's choice:** Engine generates all 4 choices.

| Option | Description | Selected |
|--------|-------------|----------|
| Other subjects, same verb+tense | Pull 3 conjugated forms from other subjects of the same verb+tense | ✓ |
| Same subject+tense, other random verbs | Pull 3 correct forms from other verbs for the same subject+tense | |
| Mixed pool | Blend both sources | |

**User's choice:** Other subjects, same verb+tense.

| Option | Description | Selected |
|--------|-------------|----------|
| Dedup to unique strings, backfill from other verbs | Guarantees exactly 3 distinct wrong answers every time | ✓ |
| Dedup to unique strings, allow fewer than 3 choices | Question may have fewer than 4 total choices for some verbs | |
| Don't dedup — allow duplicate-looking choices | Simplest logic, worst UX | |

**User's choice:** Dedup to unique strings, backfill from other verbs.

| Option | Description | Selected |
|--------|-------------|----------|
| Fully randomized position | Shuffle all 4 choices into random order each time | ✓ |
| You decide | Claude picks the standard approach | |

**User's choice:** Fully randomized position.

---

## Question Identity & 'No Immediate Repeats'

| Option | Description | Selected |
|--------|-------------|----------|
| (verb, tense, subject) triple | Two questions are duplicates only if all three match | ✓ |
| Verb only | Any two questions using the same infinitive are duplicates | |

**User's choice:** (verb, tense, subject) triple.

| Option | Description | Selected |
|--------|-------------|----------|
| No duplicate triple anywhere in the session | Stronger guarantee — all 10 questions are unique triples | ✓ |
| No two consecutive questions share a triple | Weaker guarantee — same triple could reappear non-adjacently | |

**User's choice:** No duplicate triple anywhere in the session.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, same verb can repeat with different tense/subject | Only the full triple must be unique, not the verb alone | ✓ |
| No, each verb appears at most once per session | Stronger variety guarantee at the verb level | |

**User's choice:** Yes, same verb can repeat with different tense/subject.

---

## Small Filtered-Pool Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Throw a descriptive error | generate() throws e.g. InsufficientVerbsError with eligible count | ✓ |
| Return a shorter session | Return as many unique questions as the pool allows | |
| Allow repeats to reach exactly 10 | Fill remaining slots with duplicate triples | |

**User's choice:** Throw a descriptive error.

---

## Randomization & Testability

| Option | Description | Selected |
|--------|-------------|----------|
| Injectable RNG function | generate() accepts an optional random parameter for deterministic tests | ✓ |
| Statistical assertions over many runs | Tests call generate() hundreds of times and assert properties hold | |

**User's choice:** Injectable RNG function.

| Option | Description | Selected |
|--------|-------------|----------|
| score(session, answers) → { correct, total } | Pure function, simple correct/total count object | ✓ |
| You decide | Claude picks a reasonable shape | |

**User's choice:** score(session, answers) → { correct, total }.

---

## Claude's Discretion

- Exact TypeScript type/parameter names beyond what's specified (GenerateOptions, QuizSession, Question, etc.)
- Internal sampling algorithm for selecting 10 unique triples under filters
- Exact module location under `src/` (following the established `src/<domain>/` convention)

## Deferred Ideas

None — discussion stayed within phase scope.
