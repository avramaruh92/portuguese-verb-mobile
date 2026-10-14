---
phase: 38
slug: app-store-release-oregon-gate-hand-back
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-14
---

# Phase 38 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Retroactive audit run 2026-10-14, after the phase completed on 2026-10-13. The register comes from the plan-time `<threat_model>` blocks in 38-01/02/03-PLAN.md.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| developer → submission log | Values the developer read from App Store Connect, written into a version-controlled file that is pushed | ASC statuses, dates, build number (public / non-sensitive) |
| repo store copy → Apple App Review | Review notes and What's New text, read by the reviewer and the public | Public URLs and release copy |
| Apple / developer → submission log | Apple messages and human-reported statuses recorded word for word | Review correspondence (none was received) |
| mobile workflow → sibling backend repo | Cross-repo write into the append-only `docs/mobile-handoff.md`, which authorizes a production deletion | Public version/build, EAS build id, dates, deletion rule |
| Resolution Center reply → Apple | Reviewer-facing text drafted by Claude | None sent (no rejection) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-38-01 | Information disclosure | `store/submission-log.md` v1.0.1 section | mitigate | The v1.0.1 section (line 139 onward) has 0 `@` matches. The only email in the file is the intentional App Review contact on line 33, inside the v1.0.0 section, which Phase 38 did not add (38-REVIEW IN-01) | closed |
| T-38-02 | Tampering | `store/submission-log.md` 1.0.0 history | mitigate | Restructure commit `75bf931` removes exactly 1 line (the title line), so the 1.0.0 audit trail is preserved | closed |
| T-38-03 | Denial of service | ASC version settings | mitigate | The submission log records build 8, EAS id `c5c481e4-…`, "Automatically release this version", and phased release OFF (re-checked ~2026-10-11T19:10Z). "Pending Developer Release" never occurred | closed |
| T-38-04 | Spoofing / stale config | review notes URLs | mitigate | `store/metadata/review-notes.md`: 0 Oregon-host matches, 4 Frankfurt matches | closed |
| T-38-05 | Tampering | git staging in mobile repo | mitigate | Every `(38-0x)` commit touches only intended files: `store/*`, the phase SUMMARYs, and STATE/ROADMAP/REQUIREMENTS. No stray files | closed |
| T-38-06 | Information disclosure | submission log Apple messages / replies | mitigate | v1.0.1 section has 0 `@` matches. No Apple messages were received and no replies were sent ("No Apple messages during review") | closed |
| T-38-07 | Denial of service (premature Oregon deletion) | D-08 interim line | mitigate | Conditional control, never triggered: 1.0.1 went live 2026-10-12, before the 2026-10-27 trigger (38-02-SUMMARY: "D-08 not triggered … backend repo untouched"). No interim line was written, so there was nothing that could prematurely authorize deletion | closed |
| T-38-08 | Tampering | `../portuguese-verb-backend` working tree (38-02) | mitigate | 38-02 did not touch the backend repo (D-08 not triggered) | closed |
| T-38-09 | Repudiation | review history | mitigate | The status history table records each status word for word, with UTC and local timestamps. The one unobserved transition ("In Review") is logged as "not observed", with bounding times | closed |
| T-38-10 | Spoofing (shipping a defective binary) | D-06 rejection path | mitigate | Conditional control, never triggered: no rejection, Ready for Distribution 2026-10-12T15:08Z | closed |
| T-38-11 | Denial of service (Oregon deleted before 1.0.1 live) | HAND-02 precondition | mitigate | The Ready for Distribution row and Live date were committed in `92c7e3f` (38-02) before the HAND-02 commit `364353a` / backend `91c9b51` (38-03). The HAND-02 line keeps the "once 1.0.1 is live AND (~48h … OR 2026-10-30)" wording | closed |
| T-38-12 | Tampering | `../portuguese-verb-backend` working tree (38-03) | mitigate | Backend `91c9b51` is a single-file commit (`docs/mobile-handoff.md`, 3 insertions). Its only removed line is `last_updated`. It was not pushed during the phase; the developer pushed it afterwards, as the v1.1 audit recommended | closed |
| T-38-13 | Repudiation / integrity | append-only log rule | mitigate | Only a dated "**Status 2026-10-13 (mobile):**" paragraph was appended. Build 8, EAS id `c5c481e4-4ebe-49ea-a32a-7ef76ca87563` and the live date match 37-EVIDENCE.md and the submission log | closed |
| T-38-14 | Information disclosure | status line and log | accept | Contains only the public version/build, EAS build id, dates and the deletion rule. No credentials, Apple ID, emails or UDIDs | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-38-01 | T-38-14 | The handoff status line and log contain only public release identifiers and the deletion rule. Nothing sensitive crosses the boundary | Plan-time disposition (38-03-PLAN threat model) | 2026-10-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-14 | 14 | 14 | 0 | secure-phase orchestrator (plan-time register; evidence from git history, store/ files and backend repo; no auditor spawn needed) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-14
