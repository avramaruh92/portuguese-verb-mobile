# Phase 6: Polish & Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 6-Polish & Verification
**Areas discussed:** Dataset review, Cold-start test, Edge cases, Bug handling

---

## Dataset review

| Option | Description | Selected |
|--------|-------------|----------|
| Claude cross-checks first, then you spot-check | Claude re-verifies all 50 verbs × 4 tenses × 6 subjects against its own knowledge, flags anything uncertain, produces a discrepancy list for user spot-check | ✓ |
| You do the full manual read-through | User personally reads every cell against Ciberdúvidas/Infopédia/Priberam | |
| Spot-check only | Skip a full pass; sample irregular verbs only as higher-risk | |

**User's choice:** Claude cross-checks first, then you spot-check
**Notes:** Recommended option chosen without modification.

---

## Cold-start test

| Option | Description | Selected |
|--------|-------------|----------|
| Wait for natural idle, then test on-device | Let the Render backend idle 15+ min, then submit real feedback through the app | ✓ |
| Just verify the code path, skip waiting for real idle | Trust the existing ~90s timeout + error/retry UI as sufficient | |

**User's choice:** Wait for natural idle, then test on-device
**Notes:** Recommended option chosen without modification.

---

## Edge cases

| Option | Description | Selected |
|--------|-------------|----------|
| Manual on-device confirmation only | Click through each of the 3 scenarios on-device; no new automated tests | ✓ |
| Add automated regression tests too | Also add Jest tests locking in InsufficientVerbsError message and share-sheet error-swallowing | |

**User's choice:** Manual on-device confirmation only
**Notes:** Recommended option chosen without modification.

---

## Bug handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix inline within this phase | Any discrepancy/bug found gets fixed immediately as part of Phase 6 | ✓ |
| Log as a punch list, fix separately | Phase 6 produces a findings report only; fixes happen in a follow-up pass | |

**User's choice:** Fix inline within this phase
**Notes:** Recommended option chosen without modification — this is the last phase before v0.0 ships.

---

## Claude's Discretion

- Exact format of the dataset discrepancy list (inline vs standalone doc).
- Whether to simulate "insufficient verbs" via a naturally narrow filter combination vs a test-only override, as long as the real `InsufficientVerbsError` path is exercised.
- Whether any bugs are found at all is unknown until the passes run.

## Deferred Ideas

None — discussion stayed within phase scope.
