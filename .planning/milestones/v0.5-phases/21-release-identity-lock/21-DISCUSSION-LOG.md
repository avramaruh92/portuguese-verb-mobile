# Phase 21: Release Identity Lock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 21-release-identity-lock
**Areas discussed:** EAS project reconciliation, Build verification scope

---

## EAS project reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Keep same projectId, verify it still resolves | Change slug/scheme, keep `extra.eas.projectId` as-is, then run a read-only EAS check to confirm the project reference still resolves under the new slug. | ✓ |
| Force fresh registration | Delete `extra.eas.projectId` and let a future build/init register a brand-new project under the new slug. | |
| Let Claude decide after investigating | No strong preference — research/planning picks the lower-risk option. | |

**User's choice:** Keep same projectId, verify it still resolves.
**Notes:** EAS projects are keyed by UUID, not slug — re-registering would orphan Phase 20's finished proof build and require re-provisioning credentials for no benefit.

---

## Build verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| Config-only, defer build verification | Edit `app.json`, reconcile projectId via read-only checks, no new build. Phase 24 is the designated first post-identity-lock build. | ✓ |
| Run a throwaway build here too | Kick a real `eas build --profile production` after identity changes land, same as Phase 20. | |

**User's choice:** Config-only, defer build verification.
**Notes:** Matches the roadmap's phase split; avoids burning another EAS build credit in this phase.

---

## Claude's Discretion

- Exact command(s) used for the read-only EAS project verification.
- Order of the three `app.json` edits (slug, scheme, buildNumber).

## Deferred Ideas

- Real `eas build`/submit verification of the new identity — deferred to Phase 24.
- Durable Node-version pin (`.nvmrc`) — flagged by Phase 20 for Phase 23/24, not re-raised here.
