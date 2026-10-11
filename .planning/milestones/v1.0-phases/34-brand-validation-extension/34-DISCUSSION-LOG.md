# Phase 34: Brand Validation Extension - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 34-Brand Validation Extension
**Areas discussed:** Canonical-source check depth, Homepage lockup check scope, Scope of "new pipeline outputs", Failure/output format

---

## Canonical-source check depth

| Option | Description | Selected |
|--------|-------------|----------|
| Keep string-match only | Leave `checkGeneratorSource()` as-is (path string present in generator). Phase 31 already covers id-based extraction correctness. | ✓ |
| Also assert the ids exist in lafa-icon.svg | Add a new check reading `assets/brand/lafa-icon.svg` to confirm `mark-depth`/`mark-fill`/`mark-highlight` ids are present. | |

**User's choice:** Keep string-match only (Recommended)
**Notes:** None.

---

## Homepage lockup check scope

| Option | Description | Selected |
|--------|-------------|----------|
| Dimensions only | Add `checkPngDimensions(...)` for the lockup PNG (3200x1040), mirroring the existing pattern. | ✓ |
| Dimensions + generator source reference | Also add a `checkGeneratorSource`-style check confirming the generator references the lockup SVG. | |

**User's choice:** Dimensions only (Recommended)
**Notes:** None.

---

## Scope of "new pipeline outputs"

| Option | Description | Selected |
|--------|-------------|----------|
| No — stick to the 4 listed criteria | Don't add an ids-in-SVG check; stay within source-canonical, dimensions, no-alpha, lockup-present. | ✓ |
| Yes — add it as a 5th check | Broaden scope to assert stable ids exist in the SVG for stronger drift protection. | |

**User's choice:** No — stick to the 4 listed criteria (Recommended)
**Notes:** Consistent with the canonical-source-depth decision above.

---

## Failure/output format

| Option | Description | Selected |
|--------|-------------|----------|
| Identical pattern | New check(s) join the same `results` array, same PASS/FAIL loop, same summary line, same exit(1) behavior. | ✓ |
| Group lockup checks separately | Add a distinct section header/grouping for lockup-related checks. | |

**User's choice:** Yes — identical pattern (Recommended)
**Notes:** None.

---

## Claude's Discretion

Whether VALID-01/02/03 require any code changes at all, or are already
satisfied by existing checks in `scripts/validate-brand.ts` — to be
confirmed during planning/research.

## Deferred Ideas

None — discussion stayed within phase scope.
