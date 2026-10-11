---
phase: 20
slug: native-build-risk-front-loading
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-23
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — CLI-driven configuration/build-verification phase, not a unit/integration test suite. Exit-code and JSON-output checks stand in for tests. |
| **Config file** | n/a |
| **Quick run command** | `npx expo-doctor` (seconds) |
| **Full suite command** | `npx eas-cli build --platform ios --profile production --clear-cache` (10-20+ min cloud build) followed by `npx eas-cli build:list --platform ios --status finished --limit 1 --json` |
| **Estimated runtime** | ~5s (expo-doctor) / ~15-20 min (throwaway EAS build) |

---

## Sampling Rate

- **After every task commit:** Run `npx expo-doctor` (fast — run after every dependency-fixing task)
- **After every plan wave:** Run `npx expo install --check`, and once per phase the throwaway `eas build`
- **Before `/gsd:verify-work`:** `expo-doctor` must report 0 issues AND a `finished`-status build must be confirmed via `eas build:list --json`
- **Max feedback latency:** ~5s for expo-doctor; the EAS build itself is the one long-latency step in this phase, explicitly expected and budgeted for

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | BUILD-01 | — | `expo-doctor` reports zero issues | cli-exit-code | `npx expo-doctor` (exits 0 when "0 checks failed") | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | BUILD-01 | — | `expo install --check` reports no version mismatches | cli-exit-code | `npx expo install --check` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 2 | BUILD-02 | — | Final `ios.bundleIdentifier` set before `eas build:configure` runs | source-assertion | `grep '"bundleIdentifier"' app.json` shows `com.avram.aruh.lafa` | ✅ | ⬜ pending |
| 20-02-02 | 02 | 2 | BUILD-02 | — | `eas.json` bootstrapped via `eas build:configure` with a `production` profile | file-exists + source-assertion | `test -f eas.json && grep -q production eas.json` | ✅ | ⬜ pending |
| 20-02-03 | 02 | 2 | BUILD-02 | — | Throwaway iOS build succeeds on EAS cloud infra | cli-driven build + status query | `npx eas-cli build --platform ios --profile production --clear-cache` then `npx eas-cli build:list --platform ios --status finished --limit 1 --json` reports `"status": "finished"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing tooling (`expo-doctor`, `expo install --check`, `eas-cli`) fully covers this phase's verification needs — no test files, fixtures, or new test framework need to be created.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| First-ever Apple distribution credential provisioning during `eas build` | BUILD-02 | `eas build:configure` and the first real `eas build` present interactive credential prompts (distribution cert / provisioning profile) that cannot be fully scripted for a first-time EAS-managed-credentials setup | Run `eas build --platform ios --profile production --clear-cache` in an interactive terminal session, follow prompts (select "Let EAS manage credentials"), confirm no manual `.p12`/profile upload is required |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (CLI exit-code / source-assertion / JSON-status commands above)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references — n/a, no Wave 0 gaps
- [ ] No watch-mode flags
- [ ] Feedback latency < 20 min (EAS build is the single long-latency step, explicitly budgeted)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
