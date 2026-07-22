# Pitfalls Research

**Domain:** First-time EAS Build + EAS Submit + TestFlight release for a managed Expo SDK ~57 app (Lafa)
**Researched:** 2026-07-22
**Confidence:** MEDIUM — EAS/App Store mechanics verified against Expo docs, GitHub issues, and Apple developer forums; some specifics (exact expo-doctor check list for SDK 57) could not be independently confirmed beyond community reports, so treat those items as MEDIUM/LOW and verify live during the milestone.

## Critical Pitfalls

### Pitfall 1: iOS icon has an alpha channel / transparency and gets rejected at upload, not at build time

**What goes wrong:**
The 1024x1024 App Store icon (and the derived asset-catalog icons Xcode generates from it) must be fully opaque. If the source PNG has any alpha channel — even fully-opaque pixels with an alpha channel present — `eas submit` or App Store Connect processing rejects the build with `ITMS-90717: Invalid App Store Icon... can't be transparent nor contain an alpha channel`. This is one of the single most common first-time iOS submission failures and it is **not** caught by `eas build` — it only surfaces at submit/processing time, after a build that can take 10-20+ minutes.

**Why it happens:**
Design tools (Figma, Sketch, most SVG-to-PNG converters) export PNGs with an alpha channel by default even when the image is visually fully opaque. `assets/brand/lafa-logo-v2.svg` is the source of truth per the milestone plan — SVG→PNG conversion tools very commonly preserve alpha unless explicitly flattened. This project's icon config is also unusually split: `app.json`'s top-level `icon` points to `./assets/images/icon.png` (used for Android/web/legacy), while `ios.icon` points to `./assets/expo.icon` (Expo's newer platform-specific icon format, SDK 57+). Both paths need to be regenerated and both need alpha stripped — it's easy to fix one and miss the other.

**How to avoid:**
- Flatten the icon onto an opaque background (the plan already specifies "no alpha, mark-only") and explicitly verify with a tool (`identify -format '%A' icon.png` via ImageMagick reports `srgb` when no alpha, or `sips -g hasAlpha`) before ever running a build.
- Regenerate **both** `assets/images/icon.png` (legacy/Android/web path) and whatever `assets/expo.icon` requires (SDK 57's new iOS icon format may be a `.icon` bundle/folder, not a flat PNG — confirm the exact format Expo SDK 57 expects for `ios.icon` before assuming a single PNG swap is sufficient).
- Do a local `eas build --platform ios --profile production` and inspect the resulting `.ipa`'s asset catalog, or at minimum run `npx expo-doctor` and manually inspect the generated icon, before spending an `eas submit` cycle on it.

**Warning signs:** Build succeeds but `eas submit` fails with `ITMS-90717`; App Store Connect shows the build stuck in "Invalid Binary" state after processing.

**Phase to address:** Icon/asset generation phase — verify alpha-free output as an explicit gate before the first real EAS build, not after.

---

### Pitfall 2: `eas.json` iOS credentials/bundle identifier drift from the App Store Connect app record

**What goes wrong:**
This is the app's **first-ever** release — there is no existing App Store Connect app record, no existing bundle ID registered, and no existing provisioning profile/certificate. The milestone specifies a **new** bundle id `com.avram.aruh.lafa` (this app currently has no `ios.bundleIdentifier` key set in `app.json` at all — confirm this before assuming otherwise). If the bundle ID typed into `app.json`, the one registered in the Apple Developer portal (implicitly, by EAS on first credential creation), and the one used to create the App Store Connect app record ever diverge — even by a stray character — `eas submit` will either register a *new*, wrong bundle ID silently, or fail with a cryptic "no matching app record found."

**Why it happens:**
EAS-managed credentials will auto-create a new App ID / provisioning profile / distribution certificate for whatever `ios.bundleIdentifier` is in `app.json` at build time if none exists yet — it does not require the App Store Connect app record to exist first for `eas build`, only for `eas submit`. This makes it easy to build successfully, then discover at submit time that the bundle ID doesn't match any app record because the App Store Connect record was created with a typo, or wasn't created at all yet. EAS Submit also reads project/bundle-identifier config from the *local* Expo config at submit time (not from the build artifact itself in older CLI versions) — a documented source of mismatch bugs (expo/eas-cli#2911) when `app.json` changes between build and submit.

**How to avoid:**
- Set `ios.bundleIdentifier: "com.avram.aruh.lafa"` in `app.json` once, verify it, and do not touch it again for the rest of this milestone.
- Create the App Store Connect app record (user does this, per milestone context) using the **exact same string**, copy-pasted, before the first `eas submit` attempt — not after.
- Pre-fill `eas.json`'s `submit.production.ios` block with `ascAppId` (App Store Connect app ID, numeric), `appleTeamId`, and `appleId` ahead of time so `eas submit` doesn't have to interactively guess/create anything.
- Run `eas credentials` once ahead of the real build to inspect what EAS already knows/has created for this bundle ID, so a mismatch is caught before a submit attempt burns a build.

**Warning signs:** `eas submit` prompts to "create a new app" unexpectedly, or fails with an App Store Connect API error about the bundle ID/app not being found; Apple Developer portal shows an App ID that doesn't match what's in App Store Connect.

**Phase to address:** Release identity / EAS config phase — lock bundle id + create ASC app record + populate `eas.json` submit fields as one atomic step, before any build is attempted.

---

### Pitfall 3: `slug`/`scheme` rename (`portuguese-verb-mobile` → `lafa`) breaks the EAS project link or the app's deep-link scheme silently

**What goes wrong:**
The milestone specifies slug/scheme becoming `lafa` while the repo/package name stays `portuguese-verb-mobile`. Expo's `slug` field is tied to the EAS **project id** (`extra.eas.projectId` in `app.json`, created via `eas init`/`eas build:configure`). If this project has never run `eas init` before (likely, since this is the first EAS build ever), the slug can be set freely with no drift risk. But if any earlier exploratory step (e.g. `expo start` telemetry, a stray `eas.json` from template scaffolding, or a previous `npx create-expo-app`) already registered a project id under the old slug `portuguese-verb-mobile`, changing `slug` without updating `extra.eas.projectId` produces the documented "slug for project identified by extra.eas.projectId does not match slug in app config" error.

**Why it happens:**
`slug` and `extra.eas.projectId` are two independent identifiers that must stay in sync manually; EAS CLI validates but does not auto-reconcile them. `scheme` is unrelated to EAS (it's the deep-link URL scheme), but changing it silently changes what `expo-router`'s universal links / native `Linking` resolve to — low risk here since the app doesn't use deep links today, but worth a grep to confirm nothing hardcodes the old `portugueseverbmobile://` scheme.

**How to avoid:**
- Before changing `slug`, check whether `app.json`/`app.config.*` already has an `extra.eas.projectId`. If none exists, this is a non-issue — set `slug: "lafa"` and let `eas init` (or the first `eas build`) create a fresh project id under that slug.
- If a project id already exists under the old slug, either keep the old slug (cosmetic slug change is optional — bundle id and app name are what actually matter for the store listing) or explicitly run `eas project:info` / re-link deliberately, understanding this creates a new EAS project.
- Grep the codebase for `portugueseverbmobile` (the current scheme) to confirm nothing else references it before renaming.

**Warning signs:** `eas build` fails immediately with a slug/projectId mismatch error; `eas whoami`/`eas project:info` shows an unexpected or missing project.

**Phase to address:** Release identity phase, immediately after deciding the new slug/scheme — verify via `eas project:info` before the first build kicks off.

---

### Pitfall 4: Missing export compliance / encryption declaration blocks TestFlight distribution to external testers even after a successful build+submit

**What goes wrong:**
A build can build successfully, submit successfully, and finish App Store Connect processing (~10-20 min) — and then sit un-distributable in TestFlight because Apple requires an export compliance (encryption usage) answer before the build can be added to a testing group. This is a distinct step from build/submit and easy to miss entirely on a first release since nothing in the EAS CLI flow prompts for it.

**Why it happens:**
Apple's export compliance question is asked per-build inside App Store Connect (or is skipped if `ITSAppUsesNonExemptEncryption` is set in `Info.plist`/`ios.infoPlist` ahead of time). This app only makes standard HTTPS calls (`fetch` to the backend over TLS) — that qualifies for the standard exemption — but if the question is left unanswered, TestFlight blocks the build from being usable by *external* testers (internal team testers on some plans can sometimes bypass this, external cannot).

**How to avoid:**
- Set `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.json` ahead of the first build (standard HTTPS-only apps qualify) so App Store Connect never blocks on this and doesn't ask per-build.
- If the operator prefers answering manually in App Store Connect instead, budget explicit time for it in the plan — it is not automatic and not part of `eas submit`'s output.

**Warning signs:** Build shows "Ready to Submit" or "Missing Compliance" status in App Store Connect's TestFlight tab; external testers report they can't install despite an invite being sent.

**Phase to address:** EAS build config phase — set the `Info.plist` key alongside the rest of `eas.json`/`app.json` release identity work, verified during the first real submit.

---

### Pitfall 5: `expo-doctor` fails on install-time warnings that don't block `expo start` but do block/degrade `eas build`

**What goes wrong:**
This app has never been through a production EAS build. Packages that "work fine" in Expo Go / dev client (e.g. version mismatches against the SDK 57 bundled set, or packages requiring config plugins that were never applied because dev builds don't need them) can cause `npx expo-doctor` to report failures that were previously invisible. Common failure classes: (a) installed package version doesn't match the version Expo SDK 57 expects (`npx expo install --check`/`--fix` needed), (b) a package requires a config plugin listed in `app.json`'s `plugins` array that isn't present, (c) native module version drift between `package.json` and the prebuilt native project if `ios/`/`android/` dirs exist locally (per CLAUDE.md, `ios/` output should stay untracked, but a stale local prebuild folder on the dev machine can still cause local-build-only failures that don't reproduce on EAS's clean cloud build).

**Why it happens:**
Managed Expo apps get away with dependency drift during iterative `expo start`/Expo Go development because Metro doesn't validate native compatibility the way a real native build does. The first EAS build is frequently the first time the project's *actual* native dependency graph gets exercised end-to-end.

**How to avoid:**
- Run `npx expo-doctor` and `npx expo install --check` early in this milestone — before touching icons/eas.json — as a standalone gating step, and fix everything it flags, not just what blocks the CLI from exiting non-zero.
- Do a throwaway `eas build --platform ios --profile production --clear-cache` run early (even before icon/asset work is finalized) purely to surface native-build-only failures with maximum time to fix them, rather than discovering them on the "real" release build.
- Confirm no stale local `ios/`/`android/` prebuild directories are lingering in the working tree (per CLAUDE.md, these should be gitignored and absent) — if present locally, delete them before relying on EAS's clean cloud build as the source of truth.

**Warning signs:** `expo-doctor` exits non-zero; `eas build` fails at the "Install dependencies" or "Prebuild" step (not the JS bundling step) with native/Gradle/CocoaPods errors; a package that "works in Expo Go" throws a native-module-not-found error only in the EAS build.

**Phase to address:** Should be the *first* concrete phase of this milestone (before icon/eas.json work) — a clean `expo-doctor` pass plus one throwaway EAS build is the cheapest way to front-load native-build risk.

---

### Pitfall 6: Render free-tier cold start hits testers during their very first onboarding session, right after install — worse timing than any point during normal development

**What goes wrong:**
The backend's cold-start behavior (verified in Phase 6 of a prior milestone: 45-50s cold start) is already known and the in-app feedback flow already tolerates it gracefully (90s timeout, loading state). But TestFlight testers are a *new* audience with a specific behavior pattern: they install from a push notification/email, open the app once, and if the very first thing they see is a long stall (e.g. `GET /content/verbs` on a cold instance during the dataset prefetch), they may assume the app is broken and abandon before ever reaching a quiz — even though the local-fallback dataset resolves correctly in the background. This is a first-impression risk, not a correctness risk, and it's specific to *this* milestone because it's the first time a wider, less-forgiving audience (testers, not the developer) will hit a cold backend.

**Why it happens:**
Render's free tier spins down services after ~15 minutes of no inbound traffic and takes 30-60s to spin back up on the next request. A TestFlight invite sent hours or days after the last dev/test request will almost certainly hit a cold instance on first tester open. The app's `prefetch()`/`resolveVerbs()` design already handles this *functionally* (silent fallback to local dataset, `OfflinePill` indicator) but the milestone's "live backend preflight" step checks that endpoints eventually succeed — it does not, by itself, prevent testers from perceiving a slow or "broken" first launch if the fallback UX isn't given a moment to actually engage.

**How to avoid:**
- Treat this as a UX/timing question, not just an endpoint-reachability check: confirm the setup screen doesn't appear to hang indefinitely waiting on the remote fetch before falling back — the existing zero-blocking guarantee (from `.planning/codebase/ARCHITECTURE.md`) should already cover this, but explicitly re-verify it on a *cold* instance during this milestone's preflight step, not just a warm one.
- Practically "warm" the Render instance immediately before sending TestFlight invites (a manual `curl` to `/health` a minute or two ahead of an invite round, or a lightweight uptime pinger) so early testers' first impression is a fast, remote-served dataset rather than the local fallback — this is a process step for the operator, not a code change.
- Do not attempt to "fix" this with a paid Render tier or a keep-alive service as part of this milestone — it's explicitly out of scope (backend feature work is out of scope) but worth flagging to the user as a known operational gotcha for invite timing.

**Warning signs:** Preflight check only tests a single already-warm request; testers report the app feels "stuck" or slow on first open with no visible cause (since the local-fallback UX may only show `OfflinePill` briefly or not at all, depending on timing).

**Phase to address:** Live backend preflight phase — explicitly test against a cold (post-15-min-idle) instance at least once, and document the "warm the backend before sending invites" step as an operator runbook note, not just a one-time technical check.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Using EAS-managed Apple credentials (vs. manually managed certs/profiles) | Zero manual cert/profile juggling, fastest path to first build | Less control over credential rotation/revocation, harder to reason about when things go wrong first time | Fine, even ideal, for a first release / small team — this milestone's explicit choice |
| Skipping `eas.json`'s pre-filled `ascAppId`/`appleTeamId` and answering CLI prompts interactively each time | Slightly less upfront config work | Every `eas submit` re-prompts, higher chance of a typo/mismatch on a rushed submit | Never — fill it in once, it's a few minutes and removes an entire class of Pitfall 2 |
| Leaving `ios.bundleIdentifier` unset until the last moment / iterating on it after the first build | Avoids "locking in" a name early | Bundle identifier changes after the first EAS-managed credential/App ID creation require re-registering everything, effectively starting over | Never once a build has been attempted — decide and lock it before build 1, matches this milestone's explicit plan |
| Treating a single warm-instance backend preflight check as sufficient | Fast, simple checklist item | Misses the cold-start first-impression risk (Pitfall 6) entirely | Only acceptable if the operator separately commits to a "warm before inviting" runbook step |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|------------------|--------------------|
| App Store Connect | Assuming `eas submit` creates the app record automatically | Create the app record manually in App Store Connect first, using the exact bundle id, before the first `eas submit` |
| EAS-managed Apple credentials | Running `eas build` before deciding the final bundle identifier | Lock `ios.bundleIdentifier` in `app.json` before the first build; treat any change after as a "start over" event |
| Render backend (free tier) | Preflight-checking only a warm instance | Explicitly test a cold-started request during preflight, and warm the instance operationally before sending TestFlight invites |
| `expo-splash-screen` / icon plugins | Assuming icon swap is just replacing one PNG file | Regenerate both the legacy `icon` path and the SDK-57-specific `ios.icon` asset; verify neither has an alpha channel |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Cold Render backend on tester's very first open | Tester perceives app as broken/slow before ever seeing a quiz | Re-verify the zero-blocking fallback UX specifically against a cold instance, and warm the backend before sending invites |
| Generic/default splash screen background left mismatched against the new Lafa icon | Jarring first-launch visual (icon looks branded, splash looks like the old blue default) | Milestone plan already flags this ("splash updated if needed") — explicitly do a real-device visual QA pass on the splash+icon combo together, not icon alone |

## "Looks Done But Isn't" Checklist

- [ ] **Icon regenerated:** Verify with an actual alpha-channel check (`sips -g hasAlpha <file>` or ImageMagick), not just "looks opaque visually" — both `assets/images/icon.png` and the `ios.icon` asset.
- [ ] **`eas.json` submit profile:** Verify `ascAppId`, `appleTeamId`, and `appleId` are actually populated (not left as placeholders per the milestone's "submit profile placeholder" phrasing) before the real submit attempt — a placeholder that silently works via interactive prompts today can still fail non-interactively in CI later.
- [ ] **Bundle identifier consistency:** Confirm the same exact string (`com.avram.aruh.lafa`) appears in `app.json`'s `ios.bundleIdentifier`, the Apple Developer portal App ID, and the App Store Connect app record — a byte-for-byte match, not "looks the same."
- [ ] **Backend preflight:** Confirm the preflight check was run against a cold (>15 min idle) instance at least once, not only immediately after a prior warm request during development.
- [ ] **Export compliance:** Confirm `ITSAppUsesNonExemptEncryption` is set (or the App Store Connect prompt was explicitly answered) — a build can be fully "submitted" and still be undistributable to external testers without this.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Icon rejected for alpha channel after submit | LOW | Re-export icon without alpha, bump `ios.buildNumber`, rebuild + resubmit — no credential/identity impact |
| Bundle identifier mismatch discovered after first build | MEDIUM | If no App Store Connect record/credentials committed yet, simply correct `app.json` and rebuild; if EAS already created credentials under the wrong id, may need `eas credentials` cleanup before retrying |
| Slug/EAS project id mismatch | LOW-MEDIUM | Either revert slug to match the existing project id, or accept a fresh EAS project link (re-run `eas init`) — no App Store impact since this is EAS-internal, not Apple-internal |
| Missing export compliance blocking distribution | LOW | Set the `Info.plist` key or answer the App Store Connect prompt directly on the existing build — no rebuild needed if answered in ASC UI |
| Cold backend surprises first-wave testers | LOW | Warm the instance, re-send/remind testers; no code or build change needed — purely an operational/timing fix |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Icon alpha channel rejection | Icon/asset generation phase | Programmatic alpha check on both icon assets + one throwaway EAS build/submit cycle before final |
| Bundle id / credential mismatch | Release identity + EAS config phase | `eas credentials` inspection + manual App Store Connect record cross-check before first real submit |
| Slug/EAS project id drift | Release identity phase | `eas project:info` confirms expected project/slug pairing before first build |
| Missing export compliance | EAS build config phase | `Info.plist` key present, or App Store Connect "Missing Compliance" banner absent after first successful submit |
| expo-doctor / native build drift | First phase of the milestone (before icon/eas.json work) | Clean `npx expo-doctor` run + one throwaway `eas build --profile production --clear-cache` completing successfully |
| Render cold-start first-impression risk | Live backend preflight phase | Preflight explicitly re-run against a deliberately cold (idle >15 min) instance, plus an operator runbook note about warming before invites |

## Sources

- [expo/eas-cli#2858 — Testflight Group auto-creating](https://github.com/expo/eas-cli/issues/2858)
- [Expo Docs — EAS Documentation](https://docs.expo.dev/llms-eas.txt)
- [Expo Docs — Submit to app stores](https://docs.expo.dev/submit/introduction/)
- [Expo Docs — Submit to the Apple App Store with EAS Submit](https://docs.expo.dev/submit/ios/)
- [expo/eas-cli#2911 — EAS Submit reads too much info from local project folder expo config file](https://github.com/expo/eas-cli/issues/2911)
- [Apple Developer Forums — Bundle identifier error when running EAS build](https://developer.apple.com/forums/thread/720459)
- [Apple Developer Forums — Failed to register bundle identifier](https://developer.apple.com/forums/thread/717807)
- [expo/eas-cli#2084 — extra.eas.projectId missing/present mismatch](https://github.com/expo/eas-cli/issues/2084)
- [expo/eas-cli#1530 — Wrong app slug read from expo config](https://github.com/expo/eas-cli/issues/1530)
- [expo/expo#3693 — App Store Icon can't be transparent or contain alpha channel](https://github.com/expo/expo/issues/3693)
- [expo/expo#1086 — ITMS-90717 Invalid App Store Icon alpha channel](https://github.com/expo/expo/issues/1086)
- [Apple Developer Forums — App Store Connect Upload Fails with Icon Alpha Channel Error](https://developer.apple.com/forums/thread/794410)
- [Apple Developer Help — Determine and upload export compliance documentation](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-export-compliance-documentation/)
- [DEV Community — Solution to fix the "Missing Compliance" Warning at App Store Connect](https://dev.to/surhidamatya/solution-to-fix-the-missing-compliance-warning-at-app-store-connect-1kb6)
- [Expo Docs — Troubleshoot build errors and crashes](https://docs.expo.dev/build-reference/troubleshooting/)
- [ShipNative — Expo EAS App Store Submission 12-Step Checklist](https://www.shipnative.dev/blog/expo-eas-app-store-submission-checklist)
- [GitHub Community Discussion — Render service goes to sleep after inactivity](https://github.com/orgs/community/discussions/197645)
- [blog.samkiel.dev — Your Render Free Tier Is Not Broken, It's Just Cold](https://blog.samkiel.dev/your-render-free-tier-is-not-broken-its-just-cold)
- Project-internal: `.planning/PROJECT.md` (Phase 6 cold-start verification: 45-50s), `.planning/codebase/ARCHITECTURE.md` (zero-blocking fetch/fallback contract), `app.json` (current icon/scheme/slug config, no `ios.bundleIdentifier` currently set)

---
*Pitfalls research for: First-time iOS EAS Build + EAS Submit + TestFlight release, managed Expo SDK ~57*
*Researched: 2026-07-22*
