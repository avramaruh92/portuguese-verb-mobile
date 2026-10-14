---
phase: 39
slug: v1-0-tech-debt-cleanup
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-14
---

# Phase 39 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| none new (39-01) | Dev-only Node script (`scripts/validate-brand.ts`) reading repo-local files; no network, no user input. Only shipped change is moving the lockup crop constants from `app/index.tsx` into `src/theme/lockup.ts` (values unchanged) | Repo-local PNG pixels and JSON/TS source — non-sensitive |
| none (39-02) | Documentation-only edits; no code, config, network or input surface | Public build numbers, Node versions, ascAppId already committed in `eas.json` — non-sensitive |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-39-01 | Tampering | `scripts/validate-brand.ts` path handling | mitigate | `ROOT = resolve(import.meta.dirname, "..")` (line 9); all reads go through `abs(rel) => resolve(ROOT, rel)` (line 10) with paths that are constants or come from repo-local `app.json` / generator source; no `process.argv` / `process.env` usage in the file | closed |
| T-39-02 | Tampering | negative-run temp artifacts | mitigate | Post-phase `git status --short assets src app scripts` is clean; no untracked files; no `assets/` changes in `a51c1f5..HEAD` — negative-run mutations were restored and never committed | closed |
| T-39-03 | Denial of service | bbox scan over 3.3M px | accept | Bounded single pass over a repo-local 3200×1040 PNG; full validator runs well under 1s | closed |
| T-39-SC | Tampering | package installs | accept | No packages installed or changed in this phase | closed |
| T-39-04 | Information disclosure | doc edits (39-02) | accept | Only public build numbers, Node versions and the already-committed ascAppId; no secrets added | closed |
| T-39-05 | Repudiation | archived 30-02 / 35-06 SUMMARYs | mitigate | Insert-only dated `> Correction (…, Phase 39)` blocks; `git diff a51c1f5..HEAD` on both files shows 0 removed lines | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-39-01 | T-39-03 | Dev-only script over a fixed-size repo-local image; no attacker-controlled input, negligible runtime | Plan-time disposition (39-01-PLAN threat model) | 2026-10-14 |
| AR-39-02 | T-39-SC | No dependency changes, so no supply-chain surface introduced | Plan-time disposition (39-01-PLAN threat model) | 2026-10-14 |
| AR-39-03 | T-39-04 | All disclosed values are already public or already committed | Plan-time disposition (39-02-PLAN threat model) | 2026-10-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-14 | 6 | 6 | 0 | secure-phase orchestrator (plan-time register; short-circuit, no auditor spawn needed) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-14
