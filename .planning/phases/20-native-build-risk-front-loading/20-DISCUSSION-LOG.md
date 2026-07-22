# Phase 20: Native Build Risk Front-Loading - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 20-native-build-risk-front-loading
**Areas discussed:** Bundle identifier for throwaway build, eas.json bootstrap strategy, expo-doctor/install --check failure handling, eas-cli install method

---

## Bundle identifier for the throwaway build

| Option | Description | Selected |
|--------|-------------|----------|
| Use final id now | Set com.avram.aruh.lafa in app.json during Phase 20 itself — idempotent, Phase 21 just confirms it | ✓ |
| Scratch placeholder id | Use a disposable id like com.avram.aruh.lafa.throwaway, keep app.json's real identity untouched until Phase 21 | |

**User's choice:** Use final id now (Recommended)
**Notes:** None — recommended option accepted directly.

---

## eas.json bootstrap strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate via eas build:configure | Interactive command writes a standard eas.json (dev/preview/production profiles) and registers EAS project id; Phase 23 edits it in place | ✓ |
| Hand-write a minimal placeholder | Bare production build profile written by hand, explicitly temporary, fully replaced by Phase 23 | |

**User's choice:** Auto-generate via eas build:configure (Recommended)
**Notes:** None — recommended option accepted directly.

---

## expo-doctor / expo install --check failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix immediately in this phase | BUILD-01 requires zero expo-doctor issues; later phases assume a clean baseline | ✓ |
| Log and defer to a todo | Note findings but don't block Phase 20 on fixing them | |

**User's choice:** Fix immediately in this phase (Recommended)
**Notes:** None — recommended option accepted directly.

---

## eas-cli install method

| Option | Description | Selected |
|--------|-------------|----------|
| Pin as devDependency | Add eas-cli ^21.0.3 to package.json devDependencies — reproducible, matches project convention | ✓ |
| Always invoke via npx | No package.json footprint, but less reproducible and nags on every invocation | |

**User's choice:** Pin as devDependency (Recommended)
**Notes:** None — recommended option accepted directly.

---

## Claude's Discretion

- Exact sequencing of expo-doctor/install-check fixes vs. bundle-identifier/eas.json setup within the phase plan — order left to the planner as long as both land before the throwaway `eas build` runs.

## Deferred Ideas

None — discussion stayed fully within Phase 20's scope. Icon-path decisions (assets/expo.icon/ vs expo.icon PNG) belong to Phase 22; eas.json submit profile and export-compliance flag belong to Phase 23 — both were explicitly excluded from this phase's decisions.
