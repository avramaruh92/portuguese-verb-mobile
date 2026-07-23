---
phase: 22
slug: icon-splash-asset-pipeline
status: draft
nyquist_compliant: false
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
- **Before `/gsd:verify-work`:** All four checks green, plus a real-device/simulator visual confirmation of both the home-screen icon and the launch splash screen
- **Max feedback latency:** ~10 seconds (filesystem/CLI checks + `npm test`)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | ICON-04 | — | `assets/brand/lafa-logo-v2.svg` and `lafa-logo-v2-concept.png` committed, byte-for-byte unmodified thereafter | scripted | `git status --short assets/brand/` (expect empty) | N/A | ⬜ pending |
| 22-0N-0N | TBD | TBD | ICON-01 | T-22-01 | `assets/images/icon.png` is 1024x1024, alpha-free, shows isolated "a" mark bled edge-to-edge on `#FCE4DA` | scripted | `sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png` (expect 1024/1024/no) | N/A | ⬜ pending |
| 22-0N-0N | TBD | TBD | ICON-02 | — | `assets/expo.icon/` and `app.json`'s `ios.icon` key removed | scripted | `test ! -d assets/expo.icon && jq -e '.expo.ios.icon == null' app.json` | N/A | ⬜ pending |
| 22-0N-0N | TBD | TBD | ICON-03 | — | `splash-icon.png` shows white monochrome Lafa "a" glyph (no accent dot) on unchanged blue background | scripted + manual visual QA | `sips -g pixelWidth -g pixelHeight assets/images/splash-icon.png` + simulator/device visual confirmation | N/A | ⬜ pending |
| 22-0N-0N | TBD | TBD | ICON-04 | — | `assets/brand/lafa-logo-v2.svg` unchanged after generation script runs | scripted | `git diff --exit-code assets/brand/lafa-logo-v2.svg` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs will be finalized once the planner assigns actual plan/task numbers — this map's requirement→command pairings are locked; renumber during planning.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — this
phase needs a new asset-generation script (e.g. `scripts/generate-brand-assets.ts`) with an
optional self-check block (asserting dimensions/alpha via the rasterizer library's own
`width`/`height` output), not a Jest test file. Do not create Jest tests for this phase; it
would test a build script's output, not app behavior, and the project's Jest convention
(`__tests__/`, one file per `src/` module) doesn't apply to a one-off asset-generation script.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App icon looks correct on an actual home screen (bleed, color, mark legibility at small sizes) | ICON-01 | Visual quality judgment — dimension/alpha checks can't confirm the mark "looks right" | Run the app in Expo Go or a simulator/dev build; inspect the home-screen icon at actual size |
| Splash screen mark reads clearly against the blue background at launch | ICON-03 | Visual quality judgment — dimension checks can't confirm contrast/legibility | Launch the app in a simulator/dev build; observe the splash screen before the app mounts |

---

## Validation Sign-Off

- [ ] All tasks have automated verify commands or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
