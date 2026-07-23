# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- ✅ **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10.1 (shipped 2026-07-17)
- ✅ **v0.2 Lafa Design System + Tense Label Refresh** — Phases 11-12 (shipped 2026-07-19)
- ✅ **v0.3 Learning Quality Upgrade** — Phases 13-16 (shipped 2026-07-21)
- ✅ **v0.4 Backend v0.4 Contract Sync + Product Feedback** — Phases 17-19 (shipped 2026-07-22)
- 🚧 **v0.5 iOS TestFlight Readiness** — Phases 20-24 (in progress)

## Overview (v0.5 iOS TestFlight Readiness)

This milestone takes Lafa from "no `eas.json`, no bundle identifier, never
built natively" to a signed build sitting in TestFlight in front of internal
testers. It is a release-engineering milestone, not a product milestone — no
screens, no domain logic, no backend changes. The five phases sequence
strictly: prove the native build pipeline works at all before investing in
polish (Phase 20), lock release identity while it's still cheap to change
(Phase 21), bake in the Lafa icon before the binary that ships to testers is
built (Phase 22), declare build/submit profiles once identity is final
(Phase 23), then run quality gates, a live-backend preflight, and the first
real build+submit+tester-invite cycle last (Phase 24). Phase numbering
continues from v0.4's final phase (19), so this milestone runs Phase 20
through Phase 24.

## Phases

<details>
<summary>✅ v0.0 Offline Quiz MVP (Phases 1-6) — SHIPPED 2026-07-13</summary>

- [x] Phase 1: Scaffold (2/2 plans) — completed 2026-07-12
- [x] Phase 2: Dataset & Domain Vocabulary (3/3 plans) — completed 2026-07-12
- [x] Phase 3: Quiz Engine (3/3 plans) — completed 2026-07-12
- [x] Phase 4: Quiz Experience (Setup → Quiz → Results) (2/2 plans) — completed 2026-07-12
- [x] Phase 5: Feedback Integration (4/4 plans) — completed 2026-07-13
- [x] Phase 6: Polish & Verification (4/4 plans) — completed 2026-07-13

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.0-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.1 Online Quiz, Exit Flow & UI Polish (Phases 7-10.1) — SHIPPED 2026-07-17</summary>

- [x] Phase 7: Dataset Seam & Fetch/Fallback Pipeline (3/3 plans) — completed 2026-07-13
- [x] Phase 8: Async Quiz Start & Dataset Snapshot (2/2 plans) — completed 2026-07-14
- [x] Phase 9: End-Quiz-Early Flow (2/2 plans) — completed 2026-07-14
- [x] Phase 10: Safe-Area & Visual Polish (4/4 plans) — completed 2026-07-14
- [x] Phase 10.1: Close gap: UI-03 — Offline Content Indicator (INSERTED) (2/2 plans) — completed 2026-07-17

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.1-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.2 Lafa Design System + Tense Label Refresh (Phases 11-12) — SHIPPED 2026-07-19</summary>

- [x] Phase 11: Lafa Design Tokens & Brand Identity (3/3 plans) — completed 2026-07-19
- [x] Phase 12: Tense Label Refresh (1/1 plan) — completed 2026-07-19

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.2-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.3 Learning Quality Upgrade (Phases 13-16) — SHIPPED 2026-07-21</summary>

- [x] Phase 13: Verb Mode Selection (2/2 plans) — completed 2026-07-20
- [x] Phase 14: Smarter Distractor Generation (1/1 plan) — completed 2026-07-20
- [x] Phase 15: Learning Content & Explanation Engine (3/3 plans) — completed 2026-07-20
- [x] Phase 16: Explanation Panel UI (2/2 plans) — completed 2026-07-20

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.3-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.4 Backend v0.4 Contract Sync + Product Feedback (Phases 17-19) — SHIPPED 2026-07-22</summary>

- [x] Phase 17: Contract Fixture Verification (1/1 plan) — completed 2026-07-21
- [x] Phase 18: Explanation Compatibility Upgrade (1/1 plan) — completed 2026-07-22
- [x] Phase 19: General Product Feedback (5/5 plans) — completed 2026-07-22

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.4-ROADMAP.md`.

</details>

### 🚧 v0.5 iOS TestFlight Readiness (Phases 20-24) — IN PROGRESS

**Phase Numbering:**
- Integer phases (20, 21, 22, 23, 24): Planned milestone work, continuing from v0.4's Phase 19
- Decimal phases (20.1, 20.2, ...): Urgent insertions (marked with INSERTED), if any arise

- [ ] **Phase 20: Native Build Risk Front-Loading** - Prove the app's native dependency graph builds on EAS's cloud infrastructure before any release-config polish
- [ ] **Phase 21: Release Identity Lock** - Lock bundle identifier, slug/scheme, version/build number, and EAS project id in `app.json`
- [ ] **Phase 22: Icon & Splash Asset Pipeline** - Bake the Lafa mark into both iOS icon paths and reconcile splash assets
- [ ] **Phase 23: EAS Build/Submit Configuration** - Author `eas.json` build/submit profiles and set export-compliance config
- [ ] **Phase 24: Quality Gates, Preflight & First Submit** - Fix lint, verify the live backend (warm + cold), and run the first real build+submit+tester-invite cycle

## Phase Details

### Phase 20: Native Build Risk Front-Loading
**Goal**: The app's native dependency graph is proven to build successfully on EAS's cloud infrastructure — this is the app's first-ever real native build, and any drift invisible in Expo Go/dev-client must surface now, before identity/icon/eas.json work is invested.
**Depends on**: Nothing (first phase of v0.5, follows v0.4's Phase 19)
**Requirements**: BUILD-01, BUILD-02
**Success Criteria** (what must be TRUE):
  1. `npx expo-doctor` reports zero issues
  2. `npx expo install --check` reports no version mismatches (or all flagged mismatches are explicitly resolved)
  3. A throwaway `eas build --platform ios --profile production --clear-cache` completes with a successful build status in the EAS dashboard
**Plans**: 2 plans
- [x] 20-01-PLAN.md — Dependency baseline: fix SDK version drift (BUILD-01), pin eas-cli devDependency + eas npm script
- [ ] 20-02-PLAN.md — Native build bootstrap: set final bundleIdentifier, `eas build:configure`, throwaway iOS build (BUILD-02)

### Phase 21: Release Identity Lock
**Goal**: The app's release identity — bundle identifier, slug/scheme, version/build number, and EAS project id — is locked and internally consistent before any "real" (non-throwaway) build or App Store Connect record is created against it.
**Depends on**: Phase 20
**Requirements**: IDENT-01, IDENT-02, IDENT-03, IDENT-04
**Success Criteria** (what must be TRUE):
  1. `app.json` `ios.bundleIdentifier` reads exactly `com.avram.aruh.lafa`
  2. `app.json` `slug` and `scheme` both read `lafa`
  3. `app.json` `ios.buildNumber` is `1` and `version` is confirmed unchanged at `1.0.0`
  4. `extra.eas.projectId` has been checked for a pre-existing value under the old slug and reconciled (no stale/duplicate project id remains)
**Plans**: TBD

### Phase 22: Icon & Splash Asset Pipeline
**Goal**: A Lafa-branded, App-Store-compliant app icon is baked into the binary via both of this project's configured icon paths, with splash assets reconciled and original brand source files untouched.
**Depends on**: Phase 21
**Requirements**: ICON-01, ICON-02, ICON-03, ICON-04
**Success Criteria** (what must be TRUE):
  1. `assets/images/icon.png` is 1024x1024, alpha-free, and shows the Lafa mark (orange mark only, not the full wordmark), generated from `assets/brand/lafa-logo-v2.svg`
  2. The `assets/expo.icon/` Icon Composer bundle and its `app.json` `ios.icon` key no longer exist — the flat `expo.icon` PNG is the sole source of the iOS app icon
  3. `splash-icon.png` shows a Lafa-branded mark if visual QA required a change, or is confirmed intentionally unchanged (existing blue background preserved) otherwise
  4. `assets/brand/lafa-logo-v2.svg` and related original brand source files remain byte-for-byte unmodified by the icon-generation pipeline
**Plans**: TBD

### Phase 23: EAS Build/Submit Configuration
**Goal**: `eas.json` declares reproducible, EAS-managed-credential build and submit profiles, and export-compliance is set proactively, so the first real build/submit cycle in Phase 24 has nothing left to configure.
**Depends on**: Phase 21
**Requirements**: EASCFG-01, EASCFG-02, EASCFG-03
**Success Criteria** (what must be TRUE):
  1. `eas.json` has a `build.production` profile using EAS-managed iOS credentials, with `cli.appVersionSource: "remote"` and `build.production.autoIncrement: true`
  2. `eas.json` has a `submit.production.ios` profile with an `ascAppId` placeholder ready to fill in once the App Store Connect app record exists
  3. `app.json` sets `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`
**Plans**: TBD

### Phase 24: Quality Gates, Preflight & First Submit
**Goal**: A signed, submitted iOS build reaches App Store Connect and internal TestFlight testers, gated by clean lint and a live-backend preflight that explicitly includes a cold-instance check.
**Depends on**: Phase 22, Phase 23
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04, SHIP-05
**Success Criteria** (what must be TRUE):
  1. `npm run lint` passes with zero errors, including the two previously-known `react-hooks/set-state-in-effect` failures in `ReportFeedbackModal.tsx` and `ProductFeedbackModal.tsx`, with no observable change to feedback modal behavior
  2. Live-backend preflight confirms `GET /health`, `GET /content/verbs`, `POST /feedback`, and `POST /product-feedback` all succeed against the deployed Render backend while warm
  3. The same preflight is repeated against a deliberately cold (>15 min idle) Render instance and all 4 endpoints still succeed
  4. `eas build --profile production` followed by `eas submit --profile production` completes and produces a Processing/Ready build in App Store Connect
  5. Internal TestFlight testers (Apple Developer team members only) are added and confirm they can install the build
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|-----------------|--------|-----------|
| 1. Scaffold | v0.0 | 2/2 | Complete | 2026-07-12 |
| 2. Dataset & Domain Vocabulary | v0.0 | 3/3 | Complete | 2026-07-12 |
| 3. Quiz Engine | v0.0 | 3/3 | Complete | 2026-07-12 |
| 4. Quiz Experience (Setup → Quiz → Results) | v0.0 | 2/2 | Complete | 2026-07-12 |
| 5. Feedback Integration | v0.0 | 4/4 | Complete | 2026-07-13 |
| 6. Polish & Verification | v0.0 | 4/4 | Complete | 2026-07-13 |
| 7. Dataset Seam & Fetch/Fallback Pipeline | v0.1 | 3/3 | Complete | 2026-07-13 |
| 8. Async Quiz Start & Dataset Snapshot | v0.1 | 2/2 | Complete | 2026-07-14 |
| 9. End-Quiz-Early Flow | v0.1 | 2/2 | Complete | 2026-07-14 |
| 10. Safe-Area & Visual Polish | v0.1 | 4/4 | Complete | 2026-07-14 |
| 10.1. Close gap: UI-03 — Offline Content Indicator | v0.1 | 2/2 | Complete | 2026-07-17 |
| 11. Lafa Design Tokens & Brand Identity | v0.2 | 3/3 | Complete | 2026-07-19 |
| 12. Tense Label Refresh | v0.2 | 1/1 | Complete | 2026-07-19 |
| 13. Verb Mode Selection | v0.3 | 2/2 | Complete | 2026-07-20 |
| 14. Smarter Distractor Generation | v0.3 | 1/1 | Complete | 2026-07-20 |
| 15. Learning Content & Explanation Engine | v0.3 | 3/3 | Complete | 2026-07-20 |
| 16. Explanation Panel UI | v0.3 | 2/2 | Complete | 2026-07-20 |
| 17. Contract Fixture Verification | v0.4 | 1/1 | Complete | 2026-07-21 |
| 18. Explanation Compatibility Upgrade | v0.4 | 1/1 | Complete | 2026-07-22 |
| 19. General Product Feedback | v0.4 | 5/5 | Complete | 2026-07-22 |
| 20. Native Build Risk Front-Loading | v0.5 | 1/2 | In Progress|  |
| 21. Release Identity Lock | v0.5 | 0/TBD | Not started | - |
| 22. Icon & Splash Asset Pipeline | v0.5 | 0/TBD | Not started | - |
| 23. EAS Build/Submit Configuration | v0.5 | 0/TBD | Not started | - |
| 24. Quality Gates, Preflight & First Submit | v0.5 | 0/TBD | Not started | - |

---

*Milestones v0.0, v0.1, v0.2, v0.3, and v0.4 shipped. v0.5 in progress
(Phases 20-24). Run `/gsd:plan-phase 20` to begin.*
