---
phase: 35
slug: app-store-connect-readiness
status: draft
nyquist_compliant: true
wave_0_complete: true
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

| Task ID | Plan | Wave | Requirement | Type | Secure/Correct Behavior | Automated Command | Status |
|---------|------|------|-------------|------|--------------------------|--------------------|--------|
| 35-01-01 | 01 | 1 | STORE-05, STORE-07 | auto | `supportsTablet: false`, export compliance unchanged, typecheck/test green | `grep -q '"supportsTablet": false' app.json && grep -q '"ITSAppUsesNonExemptEncryption": false' app.json && npm run typecheck && npm test` | ⬜ pending |
| 35-01-02 | 01 | 1 | STORE-03 (D-13) | auto | Sibling backend `disableRequestLogging: true` set, backend build/test/lint green, committed | `grep -q "disableRequestLogging: true" ../portuguese-verb-backend/src/app.ts && (cd ../portuguese-verb-backend && npm run build && npm test && npm run lint)` | ⬜ pending |
| 35-02-01 | 02 | 1 | STORE-02 | auto | `docs/index.html`, `support.html`, `privacy.html` exist, contact + 3-endpoint disclosure present, no external scripts | `test -f docs/support.html && grep -q 'mailto:aruhicen@gmail.com' docs/support.html && grep -q '/product-feedback' docs/privacy.html` | ⬜ pending |
| 35-02-02 | 02 | 1 | STORE-02 | checkpoint:human-verify | GitHub Pages enabled and live | `curl` 200 on both `github.io` URLs + `gh api .../pages` status `built` | ⬜ pending |
| 35-03-01 | 03 | 1 | STORE-01 | auto | Subtitle ≤30 chars, keywords ≤100 chars comma-free, description covers free/no-account/European Portuguese | `test "$(tr -d '\n' < store/metadata/subtitle.txt | wc -m)" -le 30 && grep -qi 'European Portuguese' store/metadata/description.md` | ⬜ pending |
| 35-03-02 | 03 | 1 | STORE-01 | auto | Review notes cover all 3 endpoints + contact, no TestFlight mention | `grep -q '/content/verbs' store/metadata/review-notes.md && grep -q '/product-feedback' store/metadata/review-notes.md` | ⬜ pending |
| 35-04-01 | 04 | 2 | STORE-03 | auto | Nutrition-label doc covers all 3 endpoints, cites D-13/Option A, Prisma schema evidence | `grep -q '/product-feedback' store/privacy/nutrition-label-answers.md && grep -q 'disableRequestLogging' store/privacy/nutrition-label-answers.md` | ⬜ pending |
| 35-04-02 | 04 | 2 | STORE-03 | checkpoint:human-verify | Deployed backend confirmed no longer logging `req.ip` | `grep -q "Live log verification" store/privacy/nutrition-label-answers.md && grep -q "disableRequestLogging" ../portuguese-verb-backend/src/app.ts` | ⬜ pending |
| 35-05-01 | 05 | 1 | STORE-06 | auto | Screenshot capture instructions documented (dimensions, alpha check, filenames) | `grep -q '1320' store/screenshots/README.md && grep -q '2868' store/screenshots/README.md` | ⬜ pending |
| 35-05-02 | 05 | 1 | STORE-06 | checkpoint:human-verify | 3 PNGs captured at 1320×2868, brand-valid | `sips -g pixelWidth/pixelHeight` on each PNG + `npm run validate-brand` | ⬜ pending |
| 35-05-03 | 05 | 1 | STORE-06 | auto | All 3 PNGs alpha-free at correct dimensions | `sips -g hasAlpha` == "no" for each PNG | ⬜ pending |
| 35-06-01 | 06 | 2 | STORE-08 | auto | All local gates green (typecheck/test/lint/validate-brand/expo-doctor), `supportsTablet`/export-compliance locked | `npm run typecheck && npm test && npm run lint && npm run validate-brand && npx expo-doctor` | ⬜ pending |
| 35-06-02 | 06 | 2 | STORE-08, STORE-09 | checkpoint:human-verify | Production EAS build finishes, icon alpha-free on real build | `eas build:list --platform ios --limit 1 --json` shows `status: FINISHED` | ⬜ pending |
| 35-06-03 | 06 | 2 | STORE-08 | checkpoint:human-verify | Build submitted to App Store Connect, recorded in SUMMARY | `grep -qi "submission" 35-06-SUMMARY.md && grep -qi "build number" 35-06-SUMMARY.md` | ⬜ pending |
| 35-07-01 | 07 | 3 | STORE-01, STORE-02, STORE-06, STORE-07 | checkpoint:human-verify | Listing copy/URLs/screenshots entered in App Store Connect matching `store/` | `curl` 200 on both URLs + subtitle/keywords length checks + submission-log entries | ⬜ pending |
| 35-07-02 | 07 | 3 | STORE-03, STORE-04, STORE-07 | checkpoint:human-verify | Nutrition label, age rating, export compliance answered live and logged | `grep -q '## App Privacy' store/submission-log.md && grep -q '## Age Rating' store/submission-log.md` | ⬜ pending |
| 35-07-03 | 07 | 3 | STORE-01..09 | checkpoint:human-verify | "Submit for Review" clicked, version 1.0.0 in review | `grep -q '## Submitted for Review' store/submission-log.md && grep -qi 'in review' store/submission-log.md` | ⬜ pending |

All 17 tasks across the 7 plans carry a concrete `<automated>` verify command (even `checkpoint:human-verify` tasks resolve to a scripted post-condition check) — no task relies on subjective/unverifiable language.

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies, or are explicitly marked manual-only per the table above
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (where automation is possible)
- [x] Wave 0 covers all MISSING references — N/A, no Wave 0 needed
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-17 (via gsd-plan-checker, 0 blockers)
