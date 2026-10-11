---
phase: 35
slug: app-store-connect-readiness
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-11
---

# Phase 35 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| mobile client -> backend HTTP API | `POST /feedback`, `POST /product-feedback` (untrusted input); `GET /content/verbs` read-only | Feedback text, quiz context, app version, platform (no identifiers) |
| backend process -> Render log stream | Request metadata reaching third-party logs | Formerly client IP (`remoteAddress`); now curated fields only |
| `app.json` -> EAS native build | Config becomes immutable binary properties | Export-compliance flag, bundle identity |
| repo -> public `gh-pages` | Published support/privacy pages | Public HTML only |
| published page -> visitor browser | External assets would leak visitor IPs | None (no external assets) |
| authored copy / answers -> Apple App Review and public listing | Listing text, review notes, privacy label, age rating | Legal-weight declarations |
| simulator screen -> public listing | Screenshots | Anything visible on screen |
| local tree -> EAS cloud build -> App Store Connect | Source becomes reviewed binary; build numbers are consumed permanently | Source, build #6 |
| developer machine -> Apple ID auth | Interactive credentials during `eas submit` | Apple ID credentials / 2FA |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-35-01 | Information Disclosure | Backend Fastify request logger emitting client IP | mitigate | Backend `src/app.ts:29` `disableRequestLogging: true`; curated `req.log.info` calls carry no IP fields | closed |
| T-35-02 | Repudiation | Loss of framework request-log audit trail | accept | See Accepted Risks Log AR-35-01 | closed |
| T-35-03 | Tampering | Unrelated dirty files committed with the backend fix | mitigate | Backend commit `f06c46b` touches only `src/app.ts` | closed |
| T-35-04 | Information Disclosure | Inaccurate export-compliance declaration | mitigate | No crypto/encryption usage in `src`/`app`; `app.json` `ITSAppUsesNonExemptEncryption: false` | closed |
| T-35-05 | Information Disclosure | Wrong files published to `gh-pages` | mitigate | `gh-pages` / `origin/gh-pages` contain only `.nojekyll`, `index.html`, `privacy.html`, `support.html` | closed |
| T-35-06 | Information Disclosure | Privacy page loading third-party assets | mitigate | `docs/*.html` contain no `<script>`, `<link>` or external `http(s)` asset refs | closed |
| T-35-07 | Repudiation | Published pages drifting from `docs/` source | mitigate | `gh-pages` HTML byte-identical to `docs/*.html` (both branches at `e3a92f2`) | closed |
| T-35-08 | Spoofing | Personal contact email published | accept | See Accepted Risks Log AR-35-02 | closed |
| T-35-09 | Repudiation | Listing claims features the app lacks | mitigate | `store/metadata/*` has no progress/audio/iPad claims; `app.json` `supportsTablet: false` | closed |
| T-35-10 | Information Disclosure | Review notes leaking internal/roadmap details | mitigate | Current `store/metadata/review-notes.md` (post-`73c5205`) has no TestFlight/internal/roadmap/phase references | closed |
| T-35-11 | Repudiation | Review notes under-counting network calls | mitigate | `review-notes.md` lists all three endpoints and states "exactly three outbound calls" | closed |
| T-35-12 | Repudiation | Privacy answers without evidence | mitigate | `store/privacy/nutrition-label-answers.md` §2 cites file paths, §4 cites backend `f06c46b` | closed |
| T-35-13 | Information Disclosure | Logging fix not actually live while label claims it | mitigate | Live log check of deployed `f06c46b` recorded 2026-08-17 (nutrition sheet §6, `35-04-SUMMARY.md`) | closed |
| T-35-14 | Information Disclosure | Users typing personal data into free-text feedback | accept | See Accepted Risks Log AR-35-03 | closed |
| T-35-15 | Tampering | Future backend change silently invalidating the label | mitigate | Nutrition sheet §5 "Re-verification triggers" (6 items) | closed |
| T-35-16 | Information Disclosure | Screenshot showing dev overlay or machine-identifying content | mitigate | Checklist in `store/screenshots/README.md:93-94`; `02-quiz-locked.png` inspected clean; explicit human-check record missing — see AR-35-04 | closed |
| T-35-17 | Tampering | Screenshots of a stale/regressed brand state | mitigate | `validate-brand` 21/21 before capture (`35-05-SUMMARY.md`, screenshots README) | closed |
| T-35-18 | Denial of Service | Upload rejection from alpha/dimensions | mitigate | `sips`: all three PNGs 1320x2868, `hasAlpha: no` | closed |
| T-35-19 | Tampering | Building from a dirty/unreviewed tree | mitigate | Source commit `d927681` and unchanged `eas.json`/`app.json` recorded; `git status --porcelain` result not recorded — see AR-35-05 | closed |
| T-35-20 | Spoofing | Apple ID credentials entered into a non-Apple prompt | mitigate | Official `eas build` / `eas submit` flow with pinned eas-cli 21.2.0; no `eas-cli@latest` | closed |
| T-35-21 | Information Disclosure | ASC API key / Apple credentials committed | mitigate | `eas.json` has only `ascAppId`; no `.p8`/AuthKey/secret files tracked | closed |
| T-35-22 | Denial of Service | Non-incremented build number | mitigate | Build 5 -> 6 (`35-06-SUMMARY.md:105-107`) | closed |
| T-35-23 | Tampering | Icon alpha regression in shipped binary | mitigate | Both `AppIcon*.png` in the real .ipa `hasAlpha: no` (`35-06-SUMMARY.md:120-141`) | closed |
| T-35-24 | Tampering | Live listing drifting from `store/` | mitigate | Submission log records no divergence; `store/metadata` clean | closed |
| T-35-25 | Repudiation | Privacy label answered from memory | mitigate | Submission log App Privacy section records entered types, purposes, Not Linked, No tracking; UAT test 2 passed 2026-10-11 | closed |
| T-35-26 | Repudiation | Age rating answered from outdated model | mitigate | Submission log records 4+ outcome; UAT test 3 passed 2026-10-11. Weakness: per-category answers not enumerated | closed |
| T-35-27 | Information Disclosure | Support/Privacy URL later 404s | mitigate | 200 recorded at entry; re-checked 200 on 2026-10-11 | closed |
| T-35-28 | Tampering | Wrong build attached | mitigate | Build #6 attached, matching `35-06` | closed |
| T-35-SC | Tampering | Package installs | mitigate | No new packages. Deviation: commit `b2979b9` patch-bumped existing Expo SDK deps (`expo`, `expo-constants`, `expo-router`, `expo-splash-screen`) for an expo-doctor gate; approved and documented in `35-06-SUMMARY.md` | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-35-01 | T-35-02 | Curated per-route logs keep `id`/`outcome` for both write endpoints; no monitoring depends on framework lines; privacy-label accuracy outweighs transient access-log value for a no-auth, no-PII API | developer (plan 35-01) | 2026-08-17 |
| AR-35-02 | T-35-08 | Existing personal mailbox chosen over new infrastructure (D-02/D-03); spam risk acknowledged | developer (plan 35-02) | 2026-08-17 |
| AR-35-03 | T-35-14 | Free-text field is required for feedback to be useful; disclosed on the privacy page, which warns users not to include personal information | developer (plan 35-04) | 2026-08-17 |
| AR-35-04 | T-35-16 | Documentation gap only: no recorded human check for dev overlays. Screenshot 02 inspected clean by auditor; Apple approved the listing and developer confirmed it in UAT (2026-10-11) | developer | 2026-10-11 |
| AR-35-05 | T-35-19 | Documentation gap only: clean-tree result not recorded and cannot be reconstructed. Source commit `d927681` and unchanged build config are recorded | developer | 2026-10-11 |

*Accepted risks do not resurface in future audit runs.*

**Follow-up (informational):** Fastify's `disableRequestLogging` is deprecated in Fastify 6. A backend Fastify upgrade must preserve the no-IP logging behavior; nutrition sheet §5 trigger list already covers reverting the option.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-11 | 29 | 27 verified + 2 accepted (doc gaps) | 0 | gsd-security-auditor + developer |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-11
