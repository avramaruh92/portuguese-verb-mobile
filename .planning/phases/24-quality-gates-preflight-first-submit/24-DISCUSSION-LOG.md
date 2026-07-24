# Phase 24: Quality Gates, Preflight & First Submit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-24
**Phase:** 24-quality-gates-preflight-first-submit
**Areas discussed:** Preflight script design, Cold-instance test execution, Lint fix approach, Build/submit execution ownership, TestFlight testers

---

## Preflight script design

| Option | Description | Selected |
|--------|-------------|----------|
| Checked-in script | A small scripts/preflight.ts (following scripts/generate-brand-assets.ts precedent) that hits all 4 endpoints and prints pass/fail. Reusable for future releases. | ✓ |
| One-off curl/manual check | Run curl commands once, paste results into SUMMARY, don't keep the script. | |

**User's choice:** Checked-in script.

---

## Preflight depth

| Option | Description | Selected |
|--------|-------------|----------|
| Status code only | Simple pass/fail per endpoint (200/201). Fast, low-maintenance, matches narrow SHIP-02/03 scope. | ✓ |
| Status + body shape validation | Also reuse existing Zod schemas to validate response bodies. | |

**User's choice:** Status code only.

---

## Cold-instance test execution

| Option | Description | Selected |
|--------|-------------|----------|
| Human-executed checkpoint | Plan includes a non-autonomous task: user lets Render idle 15+ min, runs preflight themselves, reports result. | ✓ |
| Agent waits inline | A plan task literally sleeps 15+ min then runs preflight itself, fully automated. | |

**User's choice:** Human-executed checkpoint.

---

## Lint fix approach

| Option | Description | Selected |
|--------|-------------|----------|
| Implementer's discretion | Executor picks the cleanest React-idiomatic fix as long as behavior is unchanged. | ✓ |
| Specific pattern: key-based remount | Force a fix using a changing key prop to remount and reset state. | |

**User's choice:** Implementer's discretion.

---

## Build/submit execution ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Human-executed checkpoint | Plan produces exact commands + pre-flight checklist; user runs eas build/submit themselves and reports back status. | ✓ |
| Agent runs it directly | A plan task runs eas build/submit itself via Bash, pausing only on unresolvable interactive prompts. | |

**User's choice:** Human-executed checkpoint.

---

## TestFlight testers

| Option | Description | Selected |
|--------|-------------|----------|
| Human-executed checkpoint | Plan documents the steps as a checklist; user adds testers and confirms install themselves, reports back. | ✓ |
| Specify testers now | User provides specific team member emails/names now for the plan to reference directly. | |

**User's choice:** Human-executed checkpoint.

---

## Claude's Discretion

- Exact preflight script filename/location (e.g. `scripts/preflight.ts`), as long as invoked via an `npm run` entry.
- Exact dummy payload values used to hit `POST /feedback` and `POST /product-feedback` during preflight (schema-valid, content arbitrary).
- Internal structure/ordering of the human-executed checkpoint tasks, as long as SHIP-03/04/05's manual-execution constraints are respected.

## Deferred Ideas

- `.eas/workflows/` CI automation — out of scope per REQUIREMENTS.md.
- Fastlane / manually-managed `.p12` credentials — out of scope.
- Push notification capability/entitlement setup — out of scope, no push functionality exists.
- Zod body-shape validation in the preflight script — considered and declined; could be revisited in a future phase.
