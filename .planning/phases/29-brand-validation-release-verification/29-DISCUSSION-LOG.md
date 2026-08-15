# Phase 29: Brand Validation & Release Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-15
**Phase:** 29-Brand Validation & Release Verification
**Areas discussed:** Validation script shape, EAS build profile & platforms, Human verification tracking, Milestone close-out scope

---

## Validation script shape

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone script | scripts/validate-brand.ts, mirrors generate-brand-assets.ts's style, run via `npm run validate-brand` | ✓ |
| Jest test file | __tests__/brand-validation.test.ts, runs with `npm test` | |
| Extend scripts/preflight.ts | Add brand checks into existing preflight script | |

**User's choice:** Standalone script (Recommended)
**Notes:** Non-zero exit on failure, usable as a pre-flight gate outside the Jest suite.

| Option | Description | Selected |
|--------|-------------|----------|
| sharp | Already a JS dependency, sharp(path).metadata() for width/height/hasAlpha | ✓ |
| sips shell-out | Matches Phase 25's ad hoc command, macOS-only | |

**User's choice:** sharp (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Independent literals | Validator hardcodes forbidden old hex values directly | ✓ |
| Shared constants module | Extract shared constants file for both scripts | |

**User's choice:** Independent literals (Recommended)
**Notes:** A validator shouldn't trust the generator's own constants — assert against known-bad values independently.

---

## EAS build profile & platforms

| Option | Description | Selected |
|--------|-------------|----------|
| Preview | eas.json's `preview` profile, internal distribution, faster | ✓ |
| Production | eas.json's `production` profile, autoIncrement, closer to real release | |

**User's choice:** Preview (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| iOS only | Matches project's iOS-first convention | ✓ |
| iOS + Android | Build and verify both platforms | |

**User's choice:** iOS only (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Verify via mask preview tool, not a real build | Static adaptive-icon mask previewer against android-icon-foreground.png | ✓ |
| Defer Android to a follow-up, note as a gap | Record as explicitly deferred item |  |
| Build Android too, just later/separately | Lightweight follow-up Android preview build | |

**User's choice:** Verify via mask preview tool, not a real build (Recommended)
**Notes:** Satisfies VALID-03's Android adaptive-icon criterion without a second EAS build.

---

## Human verification tracking

| Option | Description | Selected |
|--------|-------------|----------|
| HUMAN-UAT.md, same pattern | Consistent with Phase 28's checklist doc | ✓ |
| Fold into VERIFICATION.md directly | Skip separate file, capture checklist inside VERIFICATION.md | |

**User's choice:** HUMAN-UAT.md, same pattern (Recommended)

---

## Milestone close-out scope

| Option | Description | Selected |
|--------|-------------|----------|
| Separate /gsd:complete-milestone step | Phase 29's plan only does validation + human-verify + VERIFICATION.md | ✓ |
| Phase 29 also marks the milestone complete | Fold ROADMAP.md/STATE.md updates into this phase | |

**User's choice:** Separate /gsd:complete-milestone step (Recommended)
**Notes:** Matches how v0.5 closed — milestone archiving is a distinct command run after this phase's VERIFICATION.md passes.

---

## Claude's Discretion

- Exact wording/list of HUMAN-UAT.md checklist items (should cover VALID-03's stated criteria).
- Exact console output format of scripts/validate-brand.ts.
- Which specific PNG dimension/alpha assertions to codify beyond BRAND-03/VALID-01's text (pull from Phase 25's constants).

## Deferred Ideas

None raised beyond phase scope.
