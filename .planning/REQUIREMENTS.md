# Requirements: Lafa — Portuguese Verb Conjugation App (Mobile)

**Defined:** 2026-07-22
**Core Value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score. Everything else (sharing, feedback) supports that loop but must never block it.

## v0.5 Requirements

Requirements for milestone v0.5 — iOS TestFlight Readiness. Each maps to roadmap phases. This is a release-engineering milestone (no product/UI features); scope and phase ordering are grounded in `.planning/research/SUMMARY.md`.

### Native Build Verification

- [x] **BUILD-01**: `npx expo-doctor` and `npx expo install --check` run clean before any release-config polish work begins
- [ ] **BUILD-02**: A throwaway `eas build --platform ios --profile production --clear-cache` succeeds, proving the native dependency graph builds on EAS's cloud infrastructure (this is the app's first-ever real native build)

### Release Identity

- [ ] **IDENT-01**: `app.json` sets `ios.bundleIdentifier` to `com.avram.aruh.lafa`
- [ ] **IDENT-02**: `app.json` `slug` and `scheme` updated to `lafa`
- [ ] **IDENT-03**: `app.json` sets `ios.buildNumber` to `1`; `version` confirmed unchanged at `1.0.0`
- [ ] **IDENT-04**: `extra.eas.projectId` checked for a pre-existing value under the old slug and reconciled before the first real (non-throwaway) build

### Icon & Splash Assets

- [ ] **ICON-01**: 1024x1024, alpha-free app icon generated from `assets/brand/lafa-logo-v2.svg` (orange mark only, not the full wordmark), replacing `assets/images/icon.png`
- [ ] **ICON-02**: `ios.icon` Icon Composer bundle (`assets/expo.icon/`) and its `app.json` key removed, so the flat `expo.icon` PNG governs the iOS app icon
- [ ] **ICON-03**: `splash-icon.png` updated to a Lafa-branded mark if visual QA requires it, existing blue splash background preserved otherwise
- [ ] **ICON-04**: Original brand source files in `assets/brand` preserved unmodified (not overwritten by the icon-generation pipeline)

### EAS Build/Submit Configuration

- [ ] **EASCFG-01**: `eas.json` created with a `production` build profile using EAS-managed iOS credentials, `cli.appVersionSource: "remote"`, `build.production.autoIncrement: true`
- [ ] **EASCFG-02**: `eas.json` `submit.production.ios` profile added with an `ascAppId` placeholder, to be filled once the operator creates the App Store Connect app record
- [ ] **EASCFG-03**: `app.json` sets `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (standard-HTTPS-only export-compliance exemption)

### Quality Gates, Preflight & First Submit

- [ ] **SHIP-01**: `npm run lint` passes with zero errors — the two known `react-hooks/set-state-in-effect` failures in `ReportFeedbackModal.tsx` and `ProductFeedbackModal.tsx` fixed without changing user-visible feedback behavior
- [ ] **SHIP-02**: Live-backend preflight confirms `GET /health`, `GET /content/verbs`, `POST /feedback`, and `POST /product-feedback` all succeed against the deployed Render backend
- [ ] **SHIP-03**: Preflight explicitly includes a check against a deliberately cold (>15 min idle) Render instance, not only a warm one
- [ ] **SHIP-04**: First real `eas build --profile production` + `eas submit --profile production` cycle completes, producing a processed TestFlight build
- [ ] **SHIP-05**: Internal TestFlight testers (Apple Developer team members only — no external/Beta App Review scope this milestone) added and confirmed able to install the build

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Release Automation

- **RELEASE-01**: `.eas/workflows/` automated build+submit CI pipeline
- **RELEASE-02**: Full public App Store listing (screenshots, description, privacy nutrition label)

### Platform Expansion

- **RELEASE-03**: Android build/Play Console setup

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| External (non-team) TestFlight testers | Triggers Apple's first-time Beta App Review (~24-48h) — explicitly deferred to keep this milestone's timeline predictable; operator chose internal-only for the first build |
| Full public App Store release/listing | TestFlight-only distribution target this milestone, per the source codex plan |
| Android build/release work | iOS-only launch focus, matches existing project-wide "Android release work" out-of-scope decision |
| Backend feature changes | Backend is out of scope; mobile only needs a live-endpoint smoke check (SHIP-02/SHIP-03), not new backend capability |
| `.eas/workflows/` CI automation | One-shot manual build/submit is sufficient for a first TestFlight release; automation is premature before a second release cycle |
| Fastlane / manually-managed `.p12` credentials | EAS-managed (remote) Apple credentials chosen — no existing fastlane/match infrastructure to build on |
| Push notification capability/entitlement setup | Not part of the current app; no push functionality exists to configure |
| Regenerating `assets/expo.icon/` via macOS-only Icon Composer tooling | Operator chose the simpler path: delete the `ios.icon` key and rely solely on the flat `expo.icon` PNG (ICON-02) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 20 | Complete |
| BUILD-02 | Phase 20 | Pending |
| IDENT-01 | Phase 21 | Pending |
| IDENT-02 | Phase 21 | Pending |
| IDENT-03 | Phase 21 | Pending |
| IDENT-04 | Phase 21 | Pending |
| ICON-01 | Phase 22 | Pending |
| ICON-02 | Phase 22 | Pending |
| ICON-03 | Phase 22 | Pending |
| ICON-04 | Phase 22 | Pending |
| EASCFG-01 | Phase 23 | Pending |
| EASCFG-02 | Phase 23 | Pending |
| EASCFG-03 | Phase 23 | Pending |
| SHIP-01 | Phase 24 | Pending |
| SHIP-02 | Phase 24 | Pending |
| SHIP-03 | Phase 24 | Pending |
| SHIP-04 | Phase 24 | Pending |
| SHIP-05 | Phase 24 | Pending |

**Coverage:**
- v0.5 requirements: 18 total
- Mapped to phases: 18/18 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-22*
*Last updated: 2026-07-22 after v0.5 roadmap creation (Phases 20-24)*
