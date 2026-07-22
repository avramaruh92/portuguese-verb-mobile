# Project Research Summary

**Project:** Lafa (portuguese-verb-mobile) — v0.5 milestone: first iOS TestFlight release
**Domain:** iOS release engineering for a managed Expo SDK ~57 / Expo Router app (EAS Build + EAS Submit)
**Researched:** 2026-07-22
**Confidence:** HIGH

## Executive Summary

This milestone is not a product feature milestone — it's release engineering: taking a fully-shipped, working Expo Router app (v0.4 core loop already validated) from "no `eas.json`, no bundle identifier" to "a signed, submitted build sitting in TestFlight in front of testers." The expert-standard path for a managed Expo project with no existing native `ios/` directory is EAS Build + EAS Submit with EAS-managed (remote) Apple credentials — no fastlane, no manually-managed `.p12`/provisioning profiles, no `expo prebuild`-and-commit. All release identity (bundle ID, build number, version, icon, splash) lives exclusively in `app.json`, with `eas.json` layered on top as build/submit profile config. This is a config-and-process milestone, not a new-architecture milestone; the app's existing architecture (Zustand store, pure-function `quiz`/`dataset`/`feedback` domains) is unaffected and out of scope.

The recommended approach: (1) run a clean `expo-doctor`/`expo install --check` pass and one throwaway `eas build` early to surface any native-dependency drift before investing in polish; (2) lock `ios.bundleIdentifier` (`com.avram.aruh.lafa`), slug/scheme (`lafa`), and build number/version identity in `app.json` once, treating it as effectively irreversible; (3) regenerate the app icon as a flat, alpha-free, exactly-1024x1024 PNG from `assets/brand/lafa-logo-v2.svg` — critically, addressing **both** icon paths this project has configured (`expo.icon` -> `assets/images/icon.png` and the SDK-54+ `ios.icon` -> `assets/expo.icon/` Icon Composer bundle, which currently still ships Expo's default template icon and silently wins on iOS if left untouched); (4) author a minimal `eas.json` with one `production` build profile (EAS-managed credentials, `appVersionSource: "remote"`, `autoIncrement: true`) and one `submit.production.ios` profile prefilled with `ascAppId`/`appleTeamId` once the App Store Connect app record exists; (5) fix the two known lint failures and run a live-backend preflight (including against a *cold*, post-idle Render instance) before sending tester invites.

The dominant risks are all "looks done but isn't" failure modes that surface late (at submit or post-processing, not at build time): an alpha-channel icon rejected only at `eas submit` (`ITMS-90717`), a bundle-ID/App-Store-Connect-record mismatch discovered only when `eas submit` can't find a destination app, a missing export-compliance answer that leaves an otherwise-successful build undistributable to external testers, and Render's free-tier cold start (45-50s, already measured in a prior milestone) poisoning a first-time tester's very first app open. None of these require architectural changes to fix — they require sequencing (lock identity before building, verify alpha-free icons programmatically before submitting, set `ITSAppUsesNonExemptEncryption` proactively, warm the backend before sending invites) — but each is easy to discover only after burning a full build/submit cycle if not gated explicitly.

## Key Findings

### Recommended Stack

The only net-new dependency is `eas-cli` (`^21.0.3`, as a devDependency, invoked via `npx`) plus a new `eas.json` config file at the repo root — no new runtime npm packages, no changes to the existing `expo`/`react-native`/`expo-router`/`zustand`/`zod` stack. `app.json` gains new fields (`ios.bundleIdentifier`, `ios.buildNumber`, `extra.eas.projectId` written automatically by `eas build:configure`) rather than being restructured.

**Core technologies:**
- `eas-cli` (^21.0.3, devDependency) — the only tool that can produce a signed iOS build without a checked-in native `ios/` project or local Xcode; required because this is a managed-workflow project.
- `eas.json` (new file, build/submit profile schema) — single source of truth EAS reads for credentials source, channel, and submit destination; `cli.appVersionSource: "remote"` + `build.production.autoIncrement: true` avoids manual build-number bumping from build #2 onward.
- EAS-managed (remote) Apple credentials — EAS generates/stores the distribution cert + provisioning profile server-side; correct choice here since there's no existing fastlane/match infrastructure and the milestone explicitly scopes this in.

### Expected Features

**Must have (table stakes — blocks TestFlight entirely if missing):**
- `ios.bundleIdentifier` set in `app.json` (`com.avram.aruh.lafa`) — currently absent.
- App Store Connect app record created with the exact matching bundle ID (external/manual, user-owned step, but a hard ordering dependency before `eas submit`).
- 1024x1024, alpha-free app icon — both `expo.icon` (legacy path) and `ios.icon` (SDK 54+ Icon Composer path, currently still the unmodified Expo template default) must be addressed.
- `eas.json` with a `production` build profile and a `submit.production.ios` profile (with `ascAppId` filled in once the ASC record exists).
- EAS-managed iOS credentials configured (`eas credentials`).
- Build number `1`, version stays `1.0.0` (first-ever upload).
- `npm run lint` / `npm run typecheck` clean — 2 known lint failures (`ReportFeedbackModal.tsx`, `ProductFeedbackModal.tsx` modal-reset effects) must be fixed.
- `ITSAppUsesNonExemptEncryption: false` set proactively — standard-HTTPS-only app qualifies for the encryption exemption; unset, it blocks external-tester distribution even after a successful submit.
- Live-backend preflight (`GET /health`, `GET /content/verbs`, `POST /feedback`, `POST /product-feedback`) run against the deployed Render backend before tester invites — including at least once against a cold (>15 min idle) instance.

**Should have (smoother repeat-release process, cheap to include now):**
- `appVersionSource: "remote"` + `autoIncrement: true` in `eas.json` (trivial now, pays off starting with build #2).
- A `preview`/internal-distribution EAS profile for on-device sanity checks before spending a TestFlight upload slot — matches this project's established "verify on real device" pattern.

**Defer (v0.6+ / out of scope this milestone):**
- `.eas/workflows/` automated build+submit CI pipeline.
- Full public App Store listing (screenshots, description, privacy nutrition label) — TestFlight-only target this milestone.
- Android build/Play Console setup.
- Push notification capability/entitlement setup.
- Local (fastlane match / manual `.p12`) credential management.

### Architecture Approach

No product architecture changes this milestone — the existing screens/store/domain-logic structure (`app/`, `src/store/`, `src/quiz/`, `src/dataset/`, `src/feedback/`) is untouched. The release-config "architecture" is entirely config-as-code: `app.json` is the single source of truth for release identity (bundle ID, build number, version, icon, splash references), and `eas.json` (new, repo root, sibling to `app.json`) declares build/submit profiles on top of it. There is no native `ios/` directory checked in and none should be — EAS Build performs its own ephemeral cloud `expo prebuild` from `app.json` on every build.

**Major components:**
1. `app.json` (`expo` block) — release identity source of truth; gains `ios.bundleIdentifier`, `ios.buildNumber`, updated `slug`/`scheme` (`lafa`).
2. `eas.json` (new) — `build.production` (EAS-managed credentials, `autoIncrement`) and `submit.production.ios` (`ascAppId` once the ASC record exists).
3. Icon/splash asset pipeline — `assets/brand/lafa-logo-v2.svg` (source) -> rasterized, alpha-flattened, 1024x1024 -> `assets/images/icon.png`; a parallel decision needed on `assets/expo.icon/` (Icon Composer bundle, SDK 54+, currently unmodified Expo template default, wins on iOS if left as-is).
4. EAS Build/Submit cloud services — external, invoked via CLI, produce the signed `.ipa` and upload it to App Store Connect -> TestFlight.

### Critical Pitfalls

1. **Icon alpha channel rejected only at submit time (`ITMS-90717`)** — not caught by `eas build`, only by `eas submit`/ASC processing after a 10-20+ minute build. Avoid by programmatically verifying both `assets/images/icon.png` and `assets/expo.icon/` are alpha-free (`sips -g hasAlpha` / ImageMagick) before any real submit attempt.
2. **Bundle ID / App Store Connect record / EAS credentials drift** — this is the app's first-ever release, so there's no existing bundle ID, ASC record, or credentials to check against; a stray typo or wrong-order step (building before the ASC record exists) causes `eas submit` to fail cryptically or silently create the wrong app. Avoid by locking `com.avram.aruh.lafa` once, creating the ASC record with the exact matching string before the first submit, and pre-filling `eas.json`'s `ascAppId`/`appleTeamId`.
3. **Missing export compliance declaration blocks external-tester distribution even after a successful build+submit** — not prompted by the EAS CLI flow at all. Avoid by setting `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.json` ahead of the first build.
4. **`expo-doctor`/native dependency drift only surfaces on the first real EAS build** — Expo Go/dev-client development doesn't validate the native dependency graph the way a real build does. Avoid by running `npx expo-doctor` + `npx expo install --check` and one throwaway `eas build --clear-cache` as the very first concrete step of this milestone, before icon/eas.json polish.
5. **Render free-tier cold start (45-50s) poisons a first-time tester's very first app open** — a warm-instance-only preflight check misses this. Avoid by explicitly testing against a deliberately cold (>15 min idle) instance during preflight, and by warming the backend operationally right before sending TestFlight invites.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Native build risk front-loading
**Rationale:** This is the first-ever EAS build for this project; native dependency drift that's invisible in Expo Go/dev-client only surfaces at real build time. Cheapest and safest to discover this before any icon/identity polish work is invested.
**Delivers:** Clean `npx expo-doctor` pass, `npx expo install --check` resolved, one successful throwaway `eas build --platform ios --profile production --clear-cache` run (minimal/placeholder `eas.json` + credentials sufficient to prove the pipeline works).
**Addresses:** Table-stakes gate (build succeeds at all).
**Avoids:** Pitfall 5 (expo-doctor/native build drift discovered late).

### Phase 2: Release identity lock (bundle ID, slug/scheme, version)
**Rationale:** Bundle identifier and slug are effectively irreversible once a build/credential/ASC record is created against them — must be decided and locked before any "real" (non-throwaway) build.
**Delivers:** `app.json` updated with `ios.bundleIdentifier: "com.avram.aruh.lafa"`, `slug`/`scheme: "lafa"`, `ios.buildNumber: "1"`, `version` confirmed `1.0.0`; `extra.eas.projectId` check (verify no pre-existing project id under the old slug before renaming).
**Addresses:** Table-stakes identity fields from FEATURES.md.
**Avoids:** Pitfall 2 (bundle ID/credential drift), Pitfall 3 (slug/scheme rename breaking EAS project link).

### Phase 3: Icon/splash asset pipeline
**Rationale:** Icon must be baked into the binary before any build that goes to TestFlight — a post-build icon fix requires a full rebuild, so this should land before the "real" production build, and this project's dual icon-path (`expo.icon` vs. `ios.icon`) config makes it more failure-prone than a typical single-PNG swap.
**Delivers:** 1024x1024, alpha-free `assets/images/icon.png` regenerated from `assets/brand/lafa-logo-v2.svg`; explicit decision + action on `assets/expo.icon/` (regenerate via Icon Composer or delete + remove `ios.icon` key); splash re-export if visual QA requires it.
**Addresses:** Table-stakes icon requirement from FEATURES.md.
**Avoids:** Pitfall 1 (icon alpha channel rejected only at submit time), Architecture Anti-Pattern 1 (regenerating one icon path but not the other).

### Phase 4: `eas.json` build/submit profile authoring + credentials
**Rationale:** Requires Phase 2's identity fields to be final; can proceed in parallel with the App Store Connect app record being created (external/manual, user-owned).
**Delivers:** `eas.json` with `production` build profile (EAS-managed credentials, `appVersionSource: "remote"`, `autoIncrement: true`) and `submit.production.ios` profile prefilled with `ascAppId`/`appleTeamId` once the ASC record exists; `ITSAppUsesNonExemptEncryption: false` set in `app.json`.
**Uses:** `eas-cli` ^21.0.3, `eas.json` schema from STACK.md.
**Implements:** `eas.json` build/submit profile split architecture pattern.

### Phase 5: Quality gates + preflight + first real submit
**Rationale:** Final gate before testers see the build — must happen last, after identity/icon/eas.json are all locked, and must explicitly include a cold-instance check that a simple "is it up" preflight would miss.
**Delivers:** Lint fixes (`ReportFeedbackModal.tsx`/`ProductFeedbackModal.tsx`) landed and verified clean; live-backend preflight run against both warm and deliberately cold (>15 min idle) Render instances; first real `eas build --profile production` + `eas submit --profile production` cycle; internal TestFlight testers added.
**Addresses:** Remaining table-stakes items (lint clean, backend preflight, testers added) from FEATURES.md.
**Avoids:** Pitfall 4 (missing export compliance), Pitfall 6 (cold Render backend poisoning first tester impression).

### Phase Ordering Rationale

- Native build risk (Phase 1) is front-loaded because it's cheapest to discover and fix early, and every later phase depends on `eas build` actually working end-to-end.
- Identity (Phase 2) must precede icon/eas.json work because bundle ID/slug changes after credentials or an EAS project link exist are costly to undo — research (Pitfalls 2 & 3) flags this as the single most important ordering constraint in the whole workflow.
- Icon (Phase 3) precedes the real build/submit (Phase 4-5) because it's baked in at build time, not swappable post-build.
- eas.json/credentials (Phase 4) can start once identity is locked, in parallel with the user's manual App Store Connect app-record creation — but must complete before Phase 5's real submit, since `ascAppId` requires the ASC record to exist.
- Quality gates + preflight + submit (Phase 5) is last because it's the only phase that actually produces a tester-visible artifact, and several of its sub-steps (export compliance, cold-backend check) are the specific "looks done but isn't" failure modes research flagged as easy to skip if not made an explicit gate.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (icon pipeline):** The exact SDK 54+ Icon Composer `.icon` bundle format and whether it's practical without macOS-only Icon Composer tooling access needs a concrete decision (regenerate vs. delete `ios.icon`) — flagged as MEDIUM confidence in STACK.md/ARCHITECTURE.md, worth a `--research-phase` pass if the decision isn't obvious once icon work starts.
- **Phase 5 (first real submit):** First-time submission specifics (interactive prompts, exact ASC UI flow for export compliance if not set via `Info.plist`, internal vs. external tester distinction) are well-documented in principle but this is a one-shot, unrepeatable-cheaply operation — worth double-checking current Expo/Apple UI flow immediately before executing, since these interfaces change.

Phases with standard patterns (skip research-phase):
- **Phase 1 (native build risk):** `expo-doctor`/`expo install --check` is a well-documented, standard Expo workflow — no deeper research needed.
- **Phase 2 (identity lock):** `app.json` field additions are simple, well-documented config changes.
- **Phase 4 (eas.json authoring):** Schema and recommended shape are fully documented and verified in STACK.md/ARCHITECTURE.md with HIGH confidence.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified directly against current Expo/EAS official docs and live npm registry check for `eas-cli` version; a few narrow field-level nuances (e.g. exact Icon Composer format details) flagged MEDIUM. |
| Features | HIGH | Cross-checked against Expo/Apple official docs and direct repo inspection (`app.json` current state, `.planning/PROJECT.md` milestone scope). |
| Architecture | HIGH | Based on official Expo docs (build/submit config, icon/splash requirements) plus direct in-repo verification of the dual icon-path config and `.gitignore` state. |
| Pitfalls | MEDIUM | EAS/App Store mechanics verified against Expo docs, GitHub issues, and Apple developer forums; exact current `expo-doctor` check list for SDK 57 could not be independently confirmed beyond community reports — verify live during Phase 1. |

**Overall confidence:** HIGH

### Gaps to Address

- **`assets/expo.icon/` (Icon Composer bundle) resolution path:** whether to regenerate it with the Lafa mark (requires macOS-only Icon Composer tooling) or delete it and rely solely on the flat `expo.icon` PNG is not yet decided — surface this as an explicit decision point in Phase 3, not an assumption.
- **`expo-doctor` SDK 57 check specifics:** community-report-level confidence only: run it live early (Phase 1) rather than trusting the research's specific failure-mode predictions.
- **Internal vs. external TestFlight tester scope:** the milestone's "external testers" phrasing needs clarification — if it means genuinely external (non-team) people, Apple's first-time Beta App Review (~24-48h) is an unavoidable additional dependency that should be surfaced to the user before setting Phase 5 timeline expectations.
- **Render cold-start operational mitigation:** explicitly out of scope to "fix" (no paid tier/keep-alive service), but the "warm before inviting" step is a manual operator runbook item, not a code change — make sure this is captured as a process note, not silently dropped.

## Sources

### Primary (HIGH confidence)
- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/)
- [Configure EAS Submit with eas.json — Expo Documentation](https://docs.expo.dev/submit/eas-json/)
- [App version management — Expo Documentation](https://docs.expo.dev/build-reference/app-versions/)
- [Submit to the Apple App Store with EAS Submit — Expo Docs](https://docs.expo.dev/submit/ios/)
- [Splash screen and app icon — Expo Documentation](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Set up EAS Build — Expo Documentation](https://docs.expo.dev/build/setup/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [eas-cli — npm](https://www.npmjs.com/package/eas-cli)
- Direct repo inspection: `app.json`, `assets/expo.icon/`, `package.json`, `.gitignore`, `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- [expo/eas-cli#2911 — EAS Submit reads too much info from local project folder expo config file](https://github.com/expo/eas-cli/issues/2911)
- [expo/eas-cli#2084 — extra.eas.projectId missing/present mismatch](https://github.com/expo/eas-cli/issues/2084)
- [expo/eas-cli#1530 — Wrong app slug read from expo config](https://github.com/expo/eas-cli/issues/1530)
- [expo/expo#3693 — App Store Icon can't be transparent or contain alpha channel](https://github.com/expo/expo/issues/3693)
- [Apple Developer Forums — Bundle identifier error when running EAS build](https://developer.apple.com/forums/thread/720459)
- [Apple Developer Help — Determine and upload export compliance documentation](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-export-compliance-documentation/)
- [GitHub Community Discussion — Render service goes to sleep after inactivity](https://github.com/orgs/community/discussions/197645)

### Tertiary (LOW confidence)
- [blog.samkiel.dev — Your Render Free Tier Is Not Broken, It's Just Cold](https://blog.samkiel.dev/your-render-free-tier-is-not-broken-its-just-cold) — informal source, corroborates but not authoritative
- Community reports on exact `expo-doctor` SDK 57 check list — not independently confirmed against official docs, verify live during Phase 1

---
*Research completed: 2026-07-22*
*Ready for roadmap: yes*
