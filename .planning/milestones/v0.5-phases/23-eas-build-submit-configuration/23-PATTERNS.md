# Phase 23: EAS Build/Submit Configuration - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 2 (both modified in place, no new files)
**Analogs found:** 2 / 2 (both files are their own best analog — this is an in-place edit of prior-phase-authored config, not new-file creation)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `eas.json` (repo root, modified) | config | batch (static declarative config consumed by EAS CLI at build/submit time) | `eas.json` itself, prior state committed in `04bcaf5` (feat(20-02): bootstrap eas.json via eas build:configure) | exact — same file, same section (`submit.production`), continuing an established edit-in-place pattern |
| `app.json` (repo root, confirm-only, no edit expected) | config | batch (static declarative config read by Expo/EAS tooling) | `app.json` itself, prior edits in `915a3ea` (export compliance) and `447a405` (release identity lock) | exact — same file; this phase only verifies `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` still present, per D-02/EASCFG-03 |

No cross-domain code (`src/`, `app/*.tsx`) is in scope for this phase — CONTEXT.md explicitly states "No `src/`/`app/` product code is in scope." Standard role/data-flow classifications for controllers/components/services do not apply here; this phase is pure release-config editing.

## Pattern Assignments

### `eas.json` (config, batch/declarative)

**Analog:** `eas.json` (this same file), as bootstrapped by `04bcaf5` and left unmodified since.

**Current full state** (verified 2026-07-23, matches working tree read directly):
```json
{
  "cli": {
    "version": ">= 21.1.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Edit-in-place pattern established by Phase 20/21** (from `git log --oneline -- eas.json app.json`):
- `04bcaf5` — `eas.json` created wholesale by `eas build:configure`, committed verbatim, untouched since ("Scaffold committed as produced by the CLI, unmodified").
- Every subsequent phase edit to these two config files has been a small, surgical, hand-written JSON diff — never a regenerate/rewrite. Commit messages cite the exact requirement ID being satisfied (e.g. "D-02", "IDENT-02", "IDENT-03") and explicitly confirm which sibling fields were left untouched.

**Target edit for this phase (EASCFG-02):** replace the empty `submit.production` object with:
```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "REPLACE_WITH_ASC_APP_ID"
    }
  }
}
```
Only this one key changes. Per D-02, do **not** add explicit `credentialsSource`/`distribution: "store"` to `build.production` — leave EAS-managed iOS credential defaults implicit, matching the established "trust `eas build:configure`'s output as-is" convention.

**Diff-style commit message pattern to follow** (mirrors `04bcaf5`/`915a3ea`/`447a405` style — imperative, cites requirement ID, notes what stayed the same):
```
feat(23-0X): add submit.production.ios.ascAppId placeholder

- submit.production.ios.ascAppId: {} -> { ascAppId: "REPLACE_WITH_ASC_APP_ID" } (EASCFG-02)
- cli.appVersionSource / build.production.autoIncrement confirmed unchanged (EASCFG-01, already satisfied)
```

---

### `app.json` (config, batch/declarative, confirm-only)

**Analog:** `app.json` (this same file), as edited by `915a3ea` (export compliance) and `447a405` (release identity lock).

**Current relevant `ios` block** (verified 2026-07-23, matches working tree read directly):
```json
"ios": {
  "bundleIdentifier": "com.avram.aruh.lafa",
  "buildNumber": "1",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

**Pattern from `915a3ea`** — the exact field this phase must confirm is unchanged (EASCFG-03):
```json
"ios": {
  "icon": "./assets/expo.icon",
  "bundleIdentifier": "com.avram.aruh.lafa",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```
This field was written non-interactively by an `eas build` run in Phase 20, answering Apple's App Store Connect encryption-compliance question. Verified still present in current `app.json` (see full read above) — **no edit action needed for this file in Phase 23**, only a confirm-and-note step. If a plan step touches `app.json` at all, it should be a read-only verification, not a diff.

**Note on prior identity-lock pattern (`447a405`)** for reference/context only (not this phase's scope): each field-level change was called out individually in the commit body with its old→new value and requirement ID, e.g. `slug: "portuguese-verb-mobile" -> "lafa" (IDENT-02)`. If any incidental `app.json` edit becomes necessary, follow this same per-field annotated-diff style in the commit message.

---

## Shared Patterns

### Config-file edit discipline (applies to both `eas.json` and `app.json`)
**Source:** `04bcaf5`, `915a3ea`, `447a405` (Phase 20/21 commit history)
**Apply to:** Both files in this phase.
- Never regenerate/rewrite the whole file — hand-edit only the specific key(s) named by the requirement.
- Every touched field must be traceable to a requirement ID (EASCFG-01/02/03) in the commit message.
- Explicitly state in the commit message which sibling fields were verified unchanged (this project's convention treats "confirmed unchanged" as a first-class part of the diff description, not just an implicit no-op).
- `eas.json` is strict JSON (no comments) — per CONTEXT.md D-note, any human-readable caveat about the `ascAppId` placeholder needing replacement must live in the PLAN.md task note / commit message, not inline in the file.

### Placeholder-value convention
**Source:** D-01 in `23-CONTEXT.md`
**Apply to:** `eas.json` `submit.production.ios.ascAppId`
```json
"ascAppId": "REPLACE_WITH_ASC_APP_ID"
```
All-caps, unambiguous, TODO-style string — no real numeric ASC id exists yet; Phase 24 replaces this value once the App Store Connect record is created.

## No Analog Found

None — both in-scope files already exist with an established, directly-observable prior edit pattern from the same two phases (20 and 21) that immediately precede this one. No external/RESEARCH.md pattern substitution is needed.

## Metadata

**Analog search scope:** repo root (`app.json`, `eas.json`), `git log --oneline --all -- app.json eas.json`
**Files scanned:** 2 config files + 3 prior commits (`04bcaf5`, `915a3ea`, `447a405`)
**Pattern extraction date:** 2026-07-23
