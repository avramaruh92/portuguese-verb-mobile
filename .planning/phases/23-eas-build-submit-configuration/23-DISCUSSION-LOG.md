# Phase 23: EAS Build/Submit Configuration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 23-eas-build-submit-configuration
**Areas discussed:** ascAppId placeholder value, eas.json explicitness

---

## Area selection

Presented three options for what to discuss, given how narrow and mostly-already-satisfied this phase's scope turned out to be (EASCFG-01/03 largely done by Phase 20's `eas build:configure` bootstrap):

| Option | Description | Selected |
|--------|-------------|----------|
| ascAppId placeholder value | Real ASC app record vs. literal placeholder | ✓ |
| eas.json explicitness | Spell out implicit EAS defaults or leave as-is | ✓ |
| Nothing — just apply as scoped | Skip discussion entirely | |

**User's choice:** Both substantive options selected (multiSelect).

---

## ascAppId placeholder value

| Option | Description | Selected |
|--------|-------------|----------|
| Use a placeholder | No ASC app record exists yet — write a clearly-marked placeholder to fill in during Phase 24 | ✓ |
| I have a real ASC App ID | Provide the real numeric ascAppId now | |

**User's choice:** Use a placeholder (recommended option).
**Notes:** No App Store Connect app record exists yet for Lafa. Captured as D-01.

---

## eas.json explicitness

| Option | Description | Selected |
|--------|-------------|----------|
| Leave implicit | Trust EAS CLI's generated defaults (credentialsSource, distribution), matches Phase 20 pattern | ✓ |
| Make explicit | Spell out credentialsSource: "remote" and distribution: "store" explicitly | |

**User's choice:** Leave implicit (recommended option).
**Notes:** Success criteria only requires the 3 specific fields already named in the roadmap — not a fully spelled-out profile. Captured as D-02.

---

## Wrap-up

Asked if anything else needed discussion. User confirmed ready for context — no further areas explored.

## Claude's Discretion

- Exact placeholder string text for `ascAppId` (e.g. `"REPLACE_WITH_ASC_APP_ID"`), as long as it's unambiguous it needs replacing before Phase 24's real submit.
- Where to document that the placeholder needs filling in, given `eas.json` is strict JSON with no comment support (likely a PLAN.md task note instead).

## Deferred Ideas

- Real `eas build`/`eas submit` verification — deferred to Phase 24 (already the roadmap's designated phase for this).
- Durable Node-version pin (`.nvmrc` or equivalent), flagged by Phase 20 as a Phase 23/24 candidate — not folded in here since no EASCFG-01–03 requirement covers it; left open for Phase 24 if relevant.
