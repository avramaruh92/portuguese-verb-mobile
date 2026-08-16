---
phase: 25
slug: brand-asset-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-13
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (`jest-expo` preset) — not applicable to this script historically; no Jest test file exists for `scripts/generate-brand-assets.ts` |
| **Config file** | `package.json` `"jest": { "preset": "jest-expo" }` |
| **Quick run command** | `npm run generate-assets && sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png assets/images/favicon.png assets/images/splash-icon.png assets/images/android-icon-foreground.png assets/images/android-icon-monochrome.png` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint` (unaffected app-level gates — no `src/`/`app/` runtime code changes expected) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run generate-assets` and `sips`-check output dimensions/alpha per BRAND-03's exact spec
- **After every plan wave:** Re-run generator, `git status` diff for unexpected changes, confirm `npm test`, `npm run typecheck`, `npm run lint` still pass
- **Before `/gsd:verify-work`:** Full suite green + `grep -rln "lafa-logo" --include="*.ts" --include="*.json" . | grep -v .planning | grep -v node_modules` returns empty (BRAND-02)
- **Max feedback latency:** ~15 seconds (asset generation + `sips` inspection is fast; no watch mode needed)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-* | 01 | 1 | BRAND-01 | — / N/A | Script's `SOURCE_SVG_PATH` points only at `assets/brand/lafa-icon.svg` | grep-verifiable | `grep -n "SOURCE_SVG_PATH" scripts/generate-brand-assets.ts` | ✅ | ⬜ pending |
| 25-01-* | 01 | 1 | BRAND-03 | — / N/A | All 5 PNGs produced with correct dimensions/alpha | manual/visual (image inspection) | `npm run generate-assets && sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/*.png` | ✅ | ⬜ pending |
| 25-01-* | 01 | 1 | BRAND-02 | — / N/A | Old asset files deleted, zero live-code references remain | grep-verifiable | `git status` (deletion) + `grep -rln "lafa-logo" --include="*.ts" --include="*.json" . \| grep -v .planning \| grep -v node_modules` (expect empty) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Exact task IDs are assigned by the planner; this table's requirement→command mapping is the binding contract regardless of final task numbering.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase produces binary image outputs via a build-time Node script, not testable application logic — no Jest test file gap exists to fill. (A future Phase 29 "Brand Validation" may add automated PNG dimension/alpha assertions per VALID-01 in REQUIREMENTS.md, but that is out of this phase's scope.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual correctness of rendered mark (centering, no clipping, correct color) across all 5 outputs | BRAND-03 | `sips` confirms dimensions/alpha only, not visual correctness of the rendered mark | Open each generated PNG in Preview/Finder after `npm run generate-assets`; confirm mark is centered, uncropped, and correct color (`#F2643E` for icon/splash/foreground, solid white for monochrome) |

---

## Validation Sign-Off

- [x] All tasks have automated verify (grep/`sips`-based) — no watch-mode flags used
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (single-plan phase, all 3 requirements grep/`sips`-verifiable)
- [x] Wave 0 covers all MISSING references — none exist (no gap)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
