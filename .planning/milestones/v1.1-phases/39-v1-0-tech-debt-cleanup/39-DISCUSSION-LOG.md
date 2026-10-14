# Phase 39: v1.0 Tech-Debt Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-14
**Phase:** 39-v1-0-tech-debt-cleanup
**Areas discussed:** Colour check strictness, Logo crop gate, Build-number note, Doc fixes & delivery

---

## Colour check strictness

| Question | Options | Selected |
|---|---|---|
| How strict? | Sample key pixels (±8/channel) · Dominant colour · Exact fingerprint | Sample key pixels ✓ |
| Which PNGs? | All 6 · Store-facing only · You decide | All 6 ✓ |
| Colour source? | Shared with generator · Hard-code in validate-brand | Shared with generator ✓ |

## Logo crop gate

| Question | Options | Selected |
|---|---|---|
| Where constants live? | Move to shared file · Parse app/index.tsx | Shared file ✓ |
| Compare against? | Measure the PNG · Pinned values | Measure the PNG ✓ |
| Tolerance? | ±2 px · Exact ±0.5 px · You decide | ±2 px ✓ |

## Build-number note

| Question | Options | Selected |
|---|---|---|
| buildNumber field? | Document, keep · Remove | Document, keep ✓ |
| Where? | CLAUDE.md + STACK.md · Release docs only · All three | CLAUDE.md + STACK.md ✓ |

## Doc fixes & delivery

| Question | Options | Selected |
|---|---|---|
| Archived summaries? | Dated correction note · Edit in place | Dated correction note ✓ |
| Plan split? | Two plans · One plan · You decide | Two plans ✓ |
| Proof? | Negative runs · Plus Jest tests | Negative runs ✓ |

## Claude's Discretion

- Exact sample coordinates per PNG; bounding-box threshold; shared colour module name.

## Deferred Ideas

- Content re-fetch on app foreground (backend v0.6.1 check option b).
- Removing `ios.buildNumber` from app.json.
