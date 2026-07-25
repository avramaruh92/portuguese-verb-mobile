---
phase: 22
slug: icon-splash-asset-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-23
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (`jest-expo` preset) — not directly applicable; this phase produces binary image assets and a config-file change, not testable app logic |
| **Config file** | `package.json`'s `jest` block (existing, unchanged) |
| **Quick run command** | N/A for this phase's deliverables — see Per-Task Verification Map for the real filesystem/config checks |
| **Full suite command** | `npm test` (existing suite; must still pass with 0 regressions — this phase touches no `src/`/`app/` code) |
| **Estimated runtime** | ~10s (`npm test`, existing suite) |

---

## Sampling Rate

- **After every task commit:** Run the `sips`/`git diff`/`jq` check relevant to whichever criterion the task just changed (see map below)
- **After every plan wave:** Run all four ICON-01..04 checks together, plus `npm test` to confirm zero regressions in the existing app test suite
- **Before `/gsd:verify-work`:** All four checks green, plus a real-device/simulator visual confirmation of both the home-screen icon and the launch splash screen (Plan 22-03 checkpoint)
- **Max feedback latency:** ~10 seconds (filesystem/CLI checks + `npm test`)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | ICON-04 | T-22-01 | `assets/brand/lafa-logo-v2.svg` and `lafa-logo-v2-concept.png` committed; `@resvg/resvg-js` [OK]-audited devDependency installed | scripted | `git status --short assets/brand/` (expect empty) | N/A | ⬜ pending |
| 22-01-02 | 01 | 1 | ICON-01, ICON-03 | — | Generation script reads SVG read-only; never writes back to `assets/brand/` | scripted | `grep -q 'lafa-logo-v2.svg' scripts/generate-brand-assets.ts && ! grep -q 'writeFileSync.*assets/brand' scripts/generate-brand-assets.ts` | N/A | ⬜ pending |
| 22-01-03 | 01 | 1 | ICON-01 | T-22-02 | `assets/images/icon.png` is 1024x1024, alpha-free, shows isolated "a" mark bled edge-to-edge on `#FCE4DA` | scripted | `sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png` (expect 1024/1024/no) | N/A | ⬜ pending |
| 22-01-03 | 01 | 1 | ICON-03 | — | `splash-icon.png` shows white monochrome Lafa "a" silhouette (no accent dot), ~228px wide, transparent background | scripted + manual visual QA (Plan 03) | `sips -g pixelWidth -g pixelHeight assets/images/splash-icon.png` (~228 wide) | N/A | ⬜ pending |
| 22-01-03 | 01 | 1 | ICON-04 | T-22-02 | `assets/brand/lafa-logo-v2.svg` byte-for-byte unchanged after generation script runs | scripted | `git diff --exit-code assets/brand/lafa-logo-v2.svg` | N/A | ⬜ pending |
| 22-02-01 | 02 | 1 | ICON-02 | T-22-03 | `assets/expo.icon/` and `app.json`'s `ios.icon` key removed; flat `expo.icon` PNG is sole source | scripted | `test ! -d assets/expo.icon && jq -e '.expo.ios.icon == null' app.json` | N/A | ⬜ pending |
| 22-03-01 | 03 | 2 | ICON-01, ICON-03 | — | Home-screen icon + launch splash visually confirmed correct in a simulator/dev build | manual visual QA | `npx expo run:ios` / simulator launch + human confirmation | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Threat refs: T-22-01 (supply chain, devDependency), T-22-02 (build-input integrity, brand SVG), T-22-03 (app.json identity keys) — defined in each plan's `<threat_model>`.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — this
phase needs a new asset-generation script (`scripts/generate-brand-assets.ts`) with an
in-script self-check block (asserting the rendered icon is 1024x1024 via the rasterizer
library's own `width`/`height` output), not a Jest test file. Do not create Jest tests for this
phase; it would test a build script's output, not app behavior, and the project's Jest
convention (`__tests__/`, one file per `src/` module) doesn't apply to a one-off
asset-generation script.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App icon looks correct on an actual home screen (bleed, color, mark legibility at small sizes) | ICON-01 | Visual quality judgment — dimension/alpha checks can't confirm the mark "looks right" | Plan 22-03 checkpoint: run the app in a simulator/dev build; inspect the home-screen icon at actual size |
| Splash screen mark reads clearly against the blue background at launch | ICON-03 | Visual quality judgment — dimension checks can't confirm contrast/legibility | Plan 22-03 checkpoint: launch the app in a simulator/dev build; observe the splash screen before the app mounts |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** finalized during planning (task IDs mapped to plans 22-01/02/03)
