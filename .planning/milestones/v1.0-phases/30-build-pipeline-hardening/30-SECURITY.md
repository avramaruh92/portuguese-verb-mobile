---
phase: 30
slug: build-pipeline-hardening
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-11
---

# Phase 30 - Security

> Retroactive STRIDE register (no plan-time threat_model). Scope: .nvmrc, package.json engines.node, eas.json build.production.node, package-lock.json regenerated under Node 22.23.2 / npm 10.9.8 (commits 4c73523, 353068d).

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry -> build | `npm ci` fetches third-party packages | Package tarballs (code executed at build) |
| EAS cloud builder -> Node runtime | EAS installs pinned Node from its internal cache | Node binary |

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation / Evidence | Status |
|-----------|----------|-----------|-------------|-----------------------|--------|
| T-30-01 | Tampering | package-lock.json (dependency integrity) | mitigate | All lock entries (1149) carry `integrity`; every `resolved` URL is https://registry.npmjs.org/ (script scan of 353068d lockfile: 0 non-registry, 0 missing integrity) | closed |
| T-30-02 | Tampering / Elevation | Lockfile regen introducing unexpected deps or install scripts | mitigate | Root package entry diff 353068d^..353068d changes only `engines`; no direct dep changes. New entries are 10 nested Meta `hermes-parser`/`hermes-estree`/`babel-plugin-syntax-hermes-parser` copies already in the tree. 0 packages newly gaining `hasInstallScript` | closed |
| T-30-03 | Tampering | Node runtime pin (.nvmrc, engines, eas.json) | mitigate | Exact patch `22.23.2` in all three (not a range); UAT test 3: build #6 log "Installing node v22.23.2" from EAS internal cache, `npm ci --include=dev` succeeded | closed |
| T-30-04 | Repudiation / Tampering | Build reproducibility (`npm ci`) | mitigate | Lockfile consistent with package.json; `npm ci` succeeded on EAS (UAT 3) | closed |
| T-30-05 | Information Disclosure | Secrets in eas.json / package.json | mitigate | grep for token/secret/password/key in both files: none. eas.json contains only `ascAppId` (public App Store Connect app ID, not a credential) | closed |
| T-30-06 | Denial of Service | Strict `engines.node` exact pin blocking installs on other Node versions | accept | Low impact; npm only warns unless engine-strict set; intentional trade-off for reproducibility | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-30-01 | T-30-06 | Exact-pin may warn/fail on non-22.23.2 dev machines; reproducibility prioritized | Phase owner (via audit) | 2026-10-11 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-11 | 6 | 6 | 0 | gsd-security-auditor |

Unregistered flags: none. Note: large version bumps in the lockfile (e.g. @expo/config 55->57) are the consequence of re-resolving to the already-declared SDK 57 ranges; no manifest dependency changed.

## Sign-Off

- [x] All threats have a disposition
- [x] Accepted risks documented
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set

**Approval:** verified 2026-10-11
