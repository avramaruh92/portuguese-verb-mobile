# Feature Research

**Domain:** iOS release engineering — first TestFlight build for a managed Expo Router app
**Researched:** 2026-07-22
**Confidence:** HIGH (Expo official docs + Apple developer docs; verified against `app.json`/`CLAUDE.md` current state)

> Note: this file replaces the v0.1-era FEATURES.md (online content fetch, end-quiz-early, UI
> polish competitor research) with research scoped to the v0.5 milestone: getting the first
> TestFlight build out for `portuguese-verb-mobile` (Lafa). That prior research is superseded,
> not merged — it documented a different domain (in-app UX) for a shipped, closed milestone.

## Feature Landscape

### Table Stakes (Users Expect These — "Users" Here Are Testers/Apple Review)

Steps that are non-negotiable to get any build into TestFlight at all. Skipping any one of these blocks the whole pipeline, not just a nice-to-have.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Apple Developer Program membership (paid, $99/yr) | Apple hard-requires this before any App Store Connect record or `eas submit` can succeed | LOW (external dependency, not code) | Confirmed already held by the user per `.planning/PROJECT.md` ("Operator has Apple Developer access"). Blocks everything downstream if missing/expired. |
| App Store Connect app record created (bundle ID registered, app name reserved) | `eas submit` needs an existing ASC app to attach the build to — it does not auto-create one from a bare bundle ID in most flows | LOW-MED (manual, one-time, done in App Store Connect UI, not code) | Must exist **before** the first `eas submit --platform ios`. User will create/approve this per PROJECT.md context. Bundle ID `com.avram.aruh.lafa` must be registered here (and in Apple's identifier registry) and match `app.json`'s `ios.bundleIdentifier` exactly. |
| `ios.bundleIdentifier` set in `app.json` | EAS Build/Submit require a concrete bundle identifier; current `app.json` has no `ios.bundleIdentifier` key at all (only `ios.icon`) | LOW | Direct gap found in the repo's current `app.json` — must be added as `com.avram.aruh.lafa` per milestone scope. |
| 1024x1024 opaque (no alpha channel) app icon, square, no transparency | Apple App Store rejects/mishandles icons with alpha channel or non-1024 marketing icon; EAS Build generates all other sizes from this single source | LOW-MED | Current `app.json` points `expo.icon` at `./assets/images/icon.png` and additionally sets `ios.icon` to `./assets/expo.icon` (a separate, iOS-only icon path introduced by Expo SDK 57's newer icon system) — verify which one actually governs the produced App Store icon before assuming a single swap fixes it. Source is `assets/brand/lafa-logo-v2.svg`; must be exported at 1024x1024 PNG, flattened (no alpha), mark-only version. |
| `eas.json` with a build profile (e.g. `production`) targeting iOS | `eas build` requires a named profile even for a single build; no profile file at all blocks CLI use entirely | LOW | Repo currently has no `eas.json` at all — confirmed not present. Minimal valid shape is `{ "build": { "production": {} } }`; iOS-specific fields (`autoIncrement`, `credentialsSource`) layer on top. |
| `eas.json` submit profile (`submit.production.ios`) with `ascAppId` | `eas submit` needs to know which App Store Connect app record to attach the build to; without `ascAppId` it prompts interactively every time (workable for a one-off first submit, brittle for repeatability) | LOW | `ascAppId` is the numeric Apple ID found in ASC → App Information, added after the app record exists (hard dependency ordering: ASC record → copy ID → eas.json). |
| EAS-managed (remote) iOS credentials — distribution certificate + provisioning profile | Apple requires a valid signing identity + provisioning profile for any TestFlight build; EAS can generate/manage these automatically via `eas credentials`, avoiding manual Apple portal work | MEDIUM (mostly automated, but requires an interactive `eas login`/`eas credentials` pass tied to the Apple Developer account) | Milestone scope explicitly calls for "EAS-managed Apple credentials" — this is the standard path for teams without an existing fastlane match repo, which this project doesn't have. |
| Build number bump (`ios.buildNumber`) distinct from `version` | Apple requires every new binary uploaded to a given App Store Connect app to have a strictly increasing build number even when `version` (e.g. `1.0.0`) stays the same; a duplicate/lower build number is rejected outright by App Store Connect at upload time | LOW | Milestone scope: build number `1`, version stays `1.0.0` — correct for a genuinely first upload. For any *second* TestFlight build later, this must increment (see Dependency Notes below — `appVersionSource: "remote"` + `autoIncrement: true` handles this automatically going forward, or it must be bumped by hand each time). |
| `npm run lint` and `npm run typecheck` passing before a release build | A release/production build is the wrong place to discover lint/type errors that were previously tolerated in dev; this milestone explicitly calls out 2 known lint failures blocking release | LOW-MED (fix is scoped: `ReportFeedbackModal.tsx` + `ProductFeedbackModal.tsx` modal-reset effect warnings) | Already identified in PROJECT.md milestone scope — no new discovery needed, just execution. Not enforced by EAS itself (EAS Build does not run `lint`/`typecheck` by default), so this is a manual gate the team must run before triggering `eas build`. |
| `ITSAppUsesNonExemptEncryption` compliance answer | Every App Store Connect build requires an export-compliance answer before it's usable in TestFlight; Apple blocks tester distribution until this is set (either via Info.plist key or answered manually in ASC per build) | LOW | This app uses only standard HTTPS (`fetch` to a Render-hosted backend) — qualifies for the "exempt encryption" answer. EAS's interactive build/submit flow (or `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.json`) should set this proactively so it doesn't stall the first TestFlight availability after upload. Not mentioned in the milestone scope bullet list — flag as a likely-missed step. |
| Live-backend smoke check before tester invites | Testers hitting a cold/broken Render backend on first launch would see failures unrelated to any mobile code, poisoning the first impression of the TestFlight build | LOW (no code — a manual/scripted curl pass) | Explicitly in milestone scope: `GET /health`, `GET /content/verbs`, `POST /feedback`, `POST /product-feedback`. This is a pre-invite gate, not a build-time gate — must run against the deployed build's actual target URLs, not local dev. |
| Internal TestFlight testers added (up to 100, no Apple review) | Fastest path to get the first build in front of real testers — internal testing has **zero** Apple Beta App Review delay, unlike external testing | LOW (manual, ASC UI — add App Store Connect Users and Roles as internal testers) | Not explicit in milestone scope's bullet list, but implied by "TestFlight for external testers" framing — worth clarifying: if "external testers" means people outside the Apple Developer team roster, that specific path requires a first-time Beta App Review (~24-48h) before those testers can install; internal testers (team members) skip review entirely. This distinction changes the realistic timeline and should be surfaced to the user before setting expectations for "first testers see the build." |

### Differentiators (Nice-to-Haves for a Smoother Repeat-Release Process)

Not required to get the *first* build into TestFlight, but meaningfully reduce friction for build #2 onward. Reasonable to scope in if cheap, otherwise defer.

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| `appVersionSource: "remote"` + `autoIncrement: true` in `eas.json` | Removes the manual "did I bump the build number" failure mode for every subsequent release build — EAS tracks and increments it server-side | LOW | Cheap to set up now even though it only pays off starting with build #2; recommended to include in this milestone's `eas.json` rather than deferred, since it's a few lines and prevents a very common, easy-to-forget mistake later. |
| EAS internal-distribution / preview build profile alongside `production` | Lets the team sideload an ad-hoc build to a personal device for a final on-device sanity check before spending a TestFlight upload slot | LOW-MED | Genuinely useful given this project's stated pattern of "human-verify on a real device" at nearly every past milestone (see `.planning/PROJECT.md` decision log) — but adds a second profile to configure/maintain. Reasonable differentiator, not required for TestFlight itself. |
| `eas build:configure` scaffolding instead of hand-writing `eas.json` | Generates a known-good default `eas.json` (development/preview/production) and wires `expo-dev-client` where relevant, reducing hand-authoring mistakes | LOW | Faster/safer starting point than writing `eas.json` from scratch, but the milestone's actual need (one production profile + one submit profile) is small enough that hand-authoring is also fine. |
| `.eas/workflows/submit-ios.yml` automated build+submit-on-push workflow | Removes the manual `eas build` → wait → `eas submit` two-step dance for future releases | MEDIUM | Explicitly out of scope for a *first* release — this is CI/CD maturity, not a release-readiness blocker. Flag as a natural v0.6+ candidate once the manual flow is proven once. |
| Splash screen re-export to match the new icon/brand exactly | Visual polish/consistency between icon and splash on the lock/launch screen | LOW | Milestone scope already flags this as conditional ("splash updated if needed... unless visual QA rejects it") — correctly scoped as an if-needed item, not a hard requirement. |

### Anti-Features (Things That Seem Necessary for "Release Readiness" But Aren't, for This Milestone)

| Feature | Why Requested | Why Problematic (For This Milestone) | Alternative |
|---------|---------------|----------------------------------------|-------------|
| Local (fastlane match / manual `.p12`+`.mobileprovision`) credential management | Feels more "production-grade" / gives full control over signing identity | Adds real complexity (managing a private Git repo for certs, fastlane setup) that this project has no existing infrastructure for and the milestone scope explicitly says "EAS-managed Apple credentials" | Use EAS-managed (remote) credentials — `eas credentials` — exactly as scoped; revisit local credential management only if the team later needs CI outside EAS or multi-team signing coordination |
| Full App Store public listing (screenshots, description, keywords, privacy nutrition label, App Review submission for production release) | "Release readiness" sounds like it should mean store-ready | This milestone targets **TestFlight only**, not a public App Store release — a full store listing is unnecessary work with no tester-facing benefit at this stage, and premature per PROJECT.md ("First distribution target is TestFlight, not a public App Store release") | Do the minimum App Store Connect app record needed to attach a TestFlight build (name, bundle ID, primary language, SKU) — defer screenshots/description/privacy nutrition label to whenever an actual public release milestone happens |
| Android build/Play Console setup alongside the iOS work | Symmetry/completeness instinct — "release readiness" sounds like it should cover both platforms | Explicitly out of scope per PROJECT.md ("no Android build/release effort in this milestone"); would double the credential/store-account surface area for no tester value this cycle | Keep the `platform: ios \| android` enum compatible in code (already true) but do zero Android release infra work this milestone |
| Push notification capability/entitlement setup | Common "while we're doing release config, let's also wire push" scope creep | App has no push notification feature at all; adding the capability/entitlement without a feature behind it is pure unused surface area and an extra thing Apple/EAS credentials must account for | Skip entirely; add only if/when a push-notification feature is actually scoped |
| CI/CD pipeline (GitHub Actions triggering EAS builds automatically) | Feels like "doing it right" from day one | Unnecessary process overhead for getting *one* first build out; the milestone is about proving the manual path works at all | Ship the first build via manual `eas build` + `eas submit` from a local machine; automate later once the manual flow is validated at least once |
| Renaming/changing the bundle identifier after the App Store Connect record is created | "Just in case" — teams sometimes want to tweak the bundle ID mid-setup | Bundle identifiers are effectively permanent once an ASC app record + provisioning profile are tied to them; changing later means creating an entirely new app record and losing any TestFlight build/tester history | Lock `com.avram.aruh.lafa` before creating the ASC record and treat it as immutable going forward, exactly as the milestone scope states |

## Feature Dependencies

```
Apple Developer Program membership (external, already held)
    └──requires (before)──> App Store Connect app record created
                                 └──requires (before)──> ascAppId known
                                                              └──requires (before)──> eas.json submit.production.ios.ascAppId set
                                                                                           └──requires (before)──> eas submit succeeds

ios.bundleIdentifier set in app.json
    └──requires (before)──> App Store Connect app record created (bundle ID must be registered first/matching)
    └──requires (before)──> eas build --platform ios succeeds (bundle ID must resolve to a signing identity)

1024x1024 opaque icon exported from lafa-logo-v2.svg
    └──requires (before)──> eas build (icon is baked into the binary at build time, not swappable post-build)

eas.json build.production profile (iOS)
    └──requires (before)──> EAS-managed credentials configured (eas credentials)
                                 └──requires (before)──> eas build --platform ios --profile production succeeds
                                                              └──requires (before)──> eas submit --platform ios succeeds
                                                                                           └──requires (before)──> build appears in TestFlight (10-15 min processing)
                                                                                                                        └──requires (before)──> internal testers can install immediately
                                                                                                                        └──requires (before, external only)──> Apple Beta App Review (~24-48h) ──enables──> external testers can install

npm run lint clean + npm run typecheck clean
    └──enhances──> eas build reliability (not a hard EAS gate, but a project-level release-quality gate per milestone scope)

Live backend preflight (GET /health, GET /content/verbs, POST /feedback, POST /product-feedback all succeed)
    └──requires (before)──> tester invites sent (should not precede this check)
```

### Dependency Notes

- **App Store Connect app record must exist before `eas submit`:** this is the single most important ordering constraint in the whole workflow — `eas build` can succeed independently (it only needs valid signing credentials + a bundle ID), but `eas submit` needs a destination ASC app to attach the binary to. Confirmed the user already plans to create this record per PROJECT.md.
- **Bundle identifier is a hard, early, effectively-irreversible dependency:** `com.avram.aruh.lafa` must be decided and registered (both in Apple's developer portal and in ASC) before the app record is created, and matched exactly in `app.json`. Changing it later means starting over with a new ASC app record.
- **Icon is baked at build time, not submit time:** the 1024x1024 icon change must land in `app.json`/`assets/` before the `eas build` invocation that produces the binary actually going to TestFlight — a change after building does nothing until the next build.
- **Lint/typecheck are project-level gates, not EAS-enforced gates:** EAS Build will happily produce a binary with lint errors present; this project's milestone scope treats a clean `npm run lint`/`npm run typecheck` as a manual pre-build checklist item, not something EAS blocks automatically.
- **Internal vs. external testers materially changes the timeline:** internal testers (Apple Developer team members, up to 100) get the build with zero review delay once TestFlight processing finishes (~10-15 min); external testers require Apple's Beta App Review (typically 24h, sometimes up to 48h) on the *first* build submitted for external testing. If the milestone's "external testers" phrasing means genuinely external people (not team members with Apple IDs on the account), this review step is an unavoidable additional dependency the roadmap should account for.

## MVP Definition

### Launch With (v0.5 — this milestone)

- [ ] `ios.bundleIdentifier: "com.avram.aruh.lafa"` added to `app.json` — required for any EAS build/submit to resolve credentials
- [ ] Slug/scheme updated to `lafa` per milestone scope — cosmetic but locked-in identity work, cheap to do alongside the bundle ID change
- [ ] `ios.buildNumber: "1"`, `version` stays `"1.0.0"` — minimum viable version identity for a genuinely first upload
- [ ] 1024x1024, alpha-free app icon generated from `assets/brand/lafa-logo-v2.svg`, wired to replace `assets/images/icon.png` (and verify/align whatever `ios.icon` → `./assets/expo.icon` is doing, since SDK 57 has two icon config paths)
- [ ] `eas.json` created with a `production` build profile (iOS, EAS-managed credentials) and a `submit.production.ios` profile (with `ascAppId` placeholder to fill in once the ASC record exists)
- [ ] `ITSAppUsesNonExemptEncryption: false` set (via `app.json` `ios.infoPlist` or answered in the interactive EAS/ASC flow) — standard-encryption-only app, avoids a compliance stall before testers can install
- [ ] Fix the 2 known `npm run lint` failures in `ReportFeedbackModal.tsx`/`ProductFeedbackModal.tsx` (modal reset effects), zero behavior change
- [ ] Live-backend preflight check (`GET /health`, `GET /content/verbs`, `POST /feedback`, `POST /product-feedback`) run and passing against the deployed Render backend, before any tester invite is sent

### Add After Validation (once the first build is in TestFlight)

- [ ] `appVersionSource: "remote"` + `autoIncrement: true` in `eas.json` — trivial to add now, but only actually exercised starting with the second build; reasonable to include proactively rather than defer, given how cheap it is
- [ ] A `preview`/internal-distribution EAS profile for local on-device sanity checks before spending TestFlight upload slots — matches this project's established "verify on a real device" pattern from every prior milestone

### Future Consideration (v0.6+)

- [ ] `.eas/workflows/submit-ios.yml` automated build+submit CI pipeline — defer until the manual flow has been proven at least once
- [ ] Full public App Store listing (screenshots, description, privacy nutrition label) — only relevant once a public release (not just TestFlight) is actually planned
- [ ] Android release infrastructure — explicitly out of scope per PROJECT.md, no timeline yet

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Bundle ID + slug/scheme identity in `app.json` | HIGH (blocks everything) | LOW | P1 |
| 1024x1024 alpha-free icon | HIGH (blocks App Store acceptance) | LOW-MED | P1 |
| `eas.json` build + submit profiles | HIGH (blocks build/submit entirely) | LOW | P1 |
| EAS-managed credentials setup | HIGH (blocks build entirely) | MEDIUM | P1 |
| Build number = 1, version = 1.0.0 | HIGH (blocks upload acceptance) | LOW | P1 |
| Lint fixes (2 known failures) | MEDIUM (release-quality gate, not an EAS-enforced blocker) | LOW | P1 |
| Live-backend preflight | HIGH (protects first-tester impression) | LOW | P1 |
| `ITSAppUsesNonExemptEncryption` compliance answer | MEDIUM (blocks tester install if unset, but easy to fix reactively) | LOW | P1 (flagged as commonly missed) |
| App Store Connect app record creation | HIGH (blocks `eas submit`) | LOW-MED (manual, by user, not this milestone's code) | P1 (external dependency, tracked not built) |
| `autoIncrement`/`appVersionSource: remote` | LOW for build #1, HIGH for build #2+ | LOW | P2 |
| Preview/internal-distribution EAS profile | MEDIUM (dev convenience) | LOW-MED | P2 |
| Splash screen re-export | LOW-MED (polish) | LOW | P2 (conditional per milestone scope) |
| Automated EAS Workflows CI | LOW this milestone | MEDIUM | P3 |
| Full App Store public listing | NONE this milestone (TestFlight-only target) | MEDIUM-HIGH | P3 (anti-feature this cycle) |

## Sources

- [Submit to the Apple App Store with EAS Submit — Expo Docs](https://docs.expo.dev/submit/ios/)
- [Configure EAS Build with eas.json — Expo Docs](https://docs.expo.dev/build/eas-json/)
- [Configure EAS Submit with eas.json — Expo Docs](https://docs.expo.dev/submit/eas-json/)
- [Splash screen and app icon — Expo Docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [App version management — Expo Docs](https://docs.expo.dev/build-reference/app-versions/)
- [Manage different app versions — Expo Docs](https://docs.expo.dev/tutorial/eas/manage-app-versions/)
- [Overview of distributing apps for review — Expo Docs](https://docs.expo.dev/review/overview/)
- [Create a production build for iOS — Expo Docs](https://docs.expo.dev/tutorial/eas/ios-production-build/)
- [Invite external testers — App Store Connect Help (Apple)](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/)
- [TestFlight — Apple Developer](https://developer.apple.com/testflight/)
- Local repo verification: `app.json` (current state has no `ios.bundleIdentifier`, no `eas.json` present, existing dual icon config via `expo.icon` + `ios.icon`), `.planning/PROJECT.md` (milestone scope, prior decisions, current shipped state)

---
*Feature research for: iOS TestFlight release readiness (Expo managed workflow)*
*Researched: 2026-07-22*
