---
phase: 37
slug: 1-0-1-build-testflight-device-verification
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-11
---

# Phase 37 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| repo → EAS cloud build | Whatever is committed becomes the shipped binary | Source + config (public) |
| preflight script → live Frankfurt API | Gate writes two labelled test rows to production tables | Dummy feedback rows (no PII) |
| local CLI → EAS / Apple | Signing credentials and the Apple session live in EAS/ASC, never in the repo | Credentials (high) — never cross into repo |
| developer → evidence doc | Human-reported values written into a version-controlled file | Timestamps, row ids, device model (low) |
| device → Frankfurt API | Unauthenticated feedback POSTs from a real install | Fixed test feedback text (low) |
| developer → Supabase / Render dashboards | Privileged consoles; only derived values copied into repo | Row ids, timestamps (low) |
| mobile workflow → sibling backend repo | Cross-repo write into an append-only contract log | Public version/build metadata (low) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-37-01 | Tampering | app.json / shipped config | mitigate | `git diff --numstat 915eb58 HEAD` shows app.json 1/1 only; package.json, package-lock.json, eas.json unchanged; Oregon-host grep gate passed pre-build (37-EVIDENCE.md, Pre-build gates) | closed |
| T-37-02 | Information disclosure | 37-EVIDENCE.md | mitigate | Preamble forbids Apple ID/email/UDID/credentials/keys; grep for `@`, `udid`, password/secret/api-key, connection strings, JWTs returned no matches | closed |
| T-37-03 | Tampering | production feedback tables (preflight rows) | accept | See AR-37-01 | closed |
| T-37-04 | Spoofing / Elevation | Apple ID / EAS credentials | transfer | Auth handled by `eas whoami`/`eas submit` interactive prompts in the developer's own terminal; Claude never requested, echoed or stored credentials | closed |
| T-37-05 | Tampering | build provenance | mitigate | EAS build c5c481e4… gitCommitHash caa9aa8; `git diff 1d5fdd1 caa9aa8 -- . ':!.planning'` empty; submit used `--id`; device shows 1.0.1 (8) = REL-01 build number (37-EVIDENCE.md REL-01/REL-02) | closed |
| T-37-06 | Information disclosure | 37-EVIDENCE.md (REL sections) | mitigate | Only device model + iOS version recorded; `@`/`udid` grep clean | closed |
| T-37-07 | Information disclosure | 37-EVIDENCE.md (row data) | mitigate | Only row id, createdAt, appVersion and fixed test text recorded; no connection strings, IPs or screenshots committed | closed |
| T-37-08 | Information disclosure | DB credentials | mitigate | Claude never queried Supabase; developer ran read-only SELECTs in the Supabase editor and pasted derived values | closed |
| T-37-09 | Tampering | production feedback tables (test rows) | accept | See AR-37-02 | closed |
| T-37-10 | Tampering | ../portuguese-verb-backend working tree | mitigate | Backend commit eada0fb touches exactly one file (`docs/mobile-handoff.md`, 3+/1-); backend tree clean afterwards | closed |
| T-37-11 | Repudiation / integrity | handoff log (append-only rule) | mitigate | Only removed line is `last_updated`; one dated "(mobile)" paragraph appended inside the 2026-10-09 entry; values match 37-EVIDENCE.md; written only after all 4 E2E verdicts PASS | closed |
| T-37-12 | Denial of service | status line wording (premature Oregon deletion) | mitigate | Status line states App Store 1.0.0 installs still call the old URL until 1.0.1 is App Store live and that a second status line follows (HAND-02, Phase 38) | closed |
| T-37-13 | Information disclosure | status line | accept | See AR-37-03 | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-37-01 | T-37-03 | Preflight writes two rows labelled "preflight smoke test — ignore" to production feedback tables; no PII, low volume, same practice accepted in Phase 36 | Phase 37 plan (developer-approved plan) | 2026-10-11 |
| AR-37-02 | T-37-09 | Two device-test rows labelled "Phase 37 … device test - ignore" (ids cmv41h59s…, cmv41gegh…); no PII, low volume | Phase 37 plan (developer-approved plan) | 2026-10-11 |
| AR-37-03 | T-37-13 | Backend status line contains only public version, build number, EAS build id and dates — no credentials or PII | Phase 37 plan (developer-approved plan) | 2026-10-11 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-11 | 13 | 13 | 0 | /gsd:secure-phase orchestrator (artifact verification; plan-time register, no auditor spawn needed) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-11
