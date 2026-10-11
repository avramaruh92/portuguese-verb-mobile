---
phase: 21
slug: release-identity-lock
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-23
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (`jest-expo` preset) — existing, unchanged this phase |
| **Config file** | `package.json` (`"jest": { "preset": "jest-expo" }`) |
| **Quick run command** | `npm run typecheck` (this phase touches only `app.json`, no `src/`/`app/` code) |
| **Full suite command** | `npm test` (~251 tests as of Phase 20) |
| **Estimated runtime** | ~10-15 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant `node -e` config assertion (single-field JSON edits) plus `npm run typecheck`
- **After every plan wave:** Run `npm test` full suite (should be unaffected) + `npx expo-doctor` (repeat Phase 20's zero-issues baseline)
- **Before `/gsd:verify-work`:** All four config assertions pass, `eas project:info` output logged and compared to `slug`, full Jest suite still green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | IDENT-01 | — | `ios.bundleIdentifier` reads `com.avram.aruh.lafa` | config-assertion | `node -e "if(require('./app.json').expo.ios.bundleIdentifier!=='com.avram.aruh.lafa')process.exit(1)"` | ✅ | ⬜ pending |
| 21-01-02 | 01 | 1 | IDENT-02 | — | `slug` and `scheme` both read `lafa` | config-assertion | `node -e "const e=require('./app.json').expo; if(e.slug!=='lafa'\|\|e.scheme!=='lafa')process.exit(1)"` | ✅ | ⬜ pending |
| 21-01-03 | 01 | 1 | IDENT-03 | — | `ios.buildNumber` is `"1"`, `version` unchanged `"1.0.0"` | config-assertion | `node -e "const e=require('./app.json').expo; if(e.ios.buildNumber!=='1'\|\|e.version!=='1.0.0')process.exit(1)"` | ✅ | ⬜ pending |
| 21-01-04 | 01 | 1 | IDENT-04 | — | `extra.eas.projectId` checked via `eas project:info`, fullName vs. local slug compared and logged | manual/CLI-output | `npx eas-cli project:info --json --non-interactive` (compare output to local slug, log finding) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase makes no `src/`/`app/` code changes; no new test framework or fixtures needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard project-rename check | IDENT-04 | No CLI/API mutation exists to rename an EAS project's server-side slug; only the expo.dev web dashboard can (per research, unconfirmed exact UI path). Requires human login + UI navigation. | Log into expo.dev, open the project (id `88aa092c-033c-4bcc-bf53-450c721977e8`), check project settings for a rename/slug-change option. If found, rename to `lafa` and re-run `eas project:info` to confirm `fullName` now matches. If not found, log "no rename option available" as the closing evidence for IDENT-04 and flag for Phase 24 to inherit the known mismatch. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies (IDENT-04 is CLI-output + manual checkpoint, documented above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
