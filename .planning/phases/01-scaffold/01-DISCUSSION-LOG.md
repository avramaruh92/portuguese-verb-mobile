# Phase 1: Scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 1-Scaffold
**Areas discussed:** Package manager, Source folder structure, iOS simulator target, Root screen placeholder

---

## Package Manager

| Option | Description | Selected |
|--------|-------------|----------|
| npm | Default for Expo docs/templates and all research commands already written assume npm/npx — zero friction, works everywhere | ✓ |
| pnpm | Faster installs, stricter dependency resolution — occasionally needs extra config for RN's hoisting expectations | |
| yarn | Common in RN community, classic or berry — works fine but no specific advantage here | |
| bun | Fastest, newest — RN/Expo native-module compatibility is less battle-tested | |

**User's choice:** npm
**Notes:** None.

---

## Source Folder Structure

| Option | Description | Selected |
|--------|-------------|----------|
| src/ sibling tree | app/ stays routes-only (Expo convention); src/dataset, src/quiz-engine, src/store, src/api hold all domain logic — matches architecture research's pure-domain-core recommendation | ✓ |
| Top-level folders, no src/ | dataset/, quiz-engine/, store/, api/ live at repo root alongside app/ — slightly shorter import paths, less common Expo convention | |
| Colocated inside app/ | Domain logic lives in non-route files inside app/ — not recommended, blurs the thin-screen boundary research flagged as important | |

**User's choice:** src/ sibling tree
**Notes:** None.

---

## iOS Simulator Target

| Option | Description | Selected |
|--------|-------------|----------|
| Latest iPhone, latest iOS | Whatever ships as Xcode's current default simulator — no need to pin an older device for a fresh v0 app with no legacy support requirement | ✓ |
| Specific device/version | User has a specific iPhone model or minimum iOS version in mind | |

**User's choice:** Latest iPhone, latest iOS
**Notes:** None.

---

## Root Screen Placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Single index route only | Phase 1 stays minimal infra — one root route proving Expo Router boots cleanly; Phase 4 creates setup/quiz/results routes when it actually builds them | ✓ |
| Stub all 3 routes now | Create empty setup/quiz/results route files in Phase 1 so navigation structure exists early, even though blank until Phase 4 | |

**User's choice:** Single index route only
**Notes:** None.

---

## Claude's Discretion

- Exact `tsconfig.json` strict-mode flags beyond `"strict": true`
- Exact content/wording of the trivial smoke test
- ESLint config beyond `eslint-config-expo` default

## Deferred Ideas

None — discussion stayed within phase scope.
