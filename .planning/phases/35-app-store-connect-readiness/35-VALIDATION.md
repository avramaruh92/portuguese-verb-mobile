---
phase: 35
slug: app-store-connect-readiness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-17
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest-expo (existing) — no new test files expected this phase |
| **Config file** | `package.json` (`"jest": { "preset": "jest-expo" }`) |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm test && npm run lint && npm run typecheck && npm run validate-brand` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit that touches code (`app.json`, scripts):** Run `npm run typecheck`
- **After every plan wave:** Run the full suite command
- **Before `/gsd:verify-work`:** Full suite must be green, plus manual verifications below confirmed
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-01-0X | 01 | 1 | STORE-05 | — | `app.json` `ios.supportsTablet` is explicitly `false` | source assertion | `grep '"supportsTablet": false' app.json` | ✅ | ⬜ pending |
| 35-0X-0X | TBD | TBD | STORE-06 | — | Sibling backend no longer logs `req.ip` on request | source assertion | `grep disableRequestLogging ../portuguese-verb-backend/src/app.ts` | ✅ | ⬜ pending |
| 35-0X-0X | TBD | TBD | STORE-01..09 | — | Brand regression gate stays green before production build | automated | `npm run validate-brand` | ✅ | ⬜ pending |

*Full per-task mapping to be finalized by the planner once tasks are broken out — most of this phase's verification is manual (see below), not automated test coverage.*

---

## Wave 0 Requirements

*None — existing test/lint/typecheck/validate-brand infrastructure covers all automatable behaviors in this phase. No new test files or fixtures are needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Support URL is live and reachable | STORE-02 | Requires a real deployed GitHub Pages URL, not testable in CI | Enable GitHub Pages, visit the published `github.io` URL in a browser, confirm 200 + readable content |
| Privacy Policy URL is live and reachable | STORE-02 | Same as above | Visit the Privacy Policy `github.io` URL, confirm 200 + readable content |
| App Privacy nutrition label answers entered correctly | STORE-03 | Lives entirely inside App Store Connect's UI, no API/CLI surface | Walk the nutrition label questionnaire in App Store Connect, enter D-07/D-08 classifications, screenshot the saved state |
| Age rating questionnaire completed | STORE-04 | 2026 questionnaire structure/wording only exists live in App Store Connect | Walk the questionnaire live, confirm resulting rating matches the expected 4+ (or documents why it differs) |
| Screenshots are alpha-free, correct dimensions, correct content | STORE-05 | Requires visual inspection of exported PNGs from the Simulator | Capture 3 screenshots via `xcrun simctl io screenshot` on a 6.9" simulator, verify 1320×2868 dimensions and no alpha channel (reuse `checkPngDimensions`/`scripts/validate-brand.ts` pattern if applicable), visually confirm Setup/Quiz/Results coverage |
| Export compliance answer unchanged | STORE-07 | App Store Connect UI field, no local artifact | Confirm `ITSAppUsesNonExemptEncryption: false` in `app.json` still matches the App Store Connect export compliance answer |
| Production `eas build` + `eas submit` succeeds with incremented build number | STORE-08 | Real cloud build/submit against Apple's servers, not reproducible locally | Run `eas build --platform ios --profile production`, confirm success + build number increment, then `eas submit` |
| `icon.png` alpha-free on the real production EAS build | STORE-09 (BRAND-04 deferred half) | Must be checked on the actual submitted build artifact, not just the source PNG | Download/inspect the built `.ipa` (or use App Store Connect's build preview) to confirm the icon renders without alpha/transparency |
| "Submit for Review" clicked in App Store Connect | STORE-08 | Manual, one-time, irreversible action with no CLI equivalent | Click "Submit for Review" in App Store Connect after all metadata/build/screenshots are in place |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies, or are explicitly marked manual-only per the table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (where automation is possible)
- [ ] Wave 0 covers all MISSING references — N/A, no Wave 0 needed
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter once planner finalizes the per-task map

**Approval:** pending
