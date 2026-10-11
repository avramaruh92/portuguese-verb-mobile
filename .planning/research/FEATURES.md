# Feature Research

**Domain:** Apple App Store Connect submission readiness for a small, no-login, no-analytics Expo/RN education app (going from internal TestFlight to public App Store release)
**Researched:** 2026-08-16
**Confidence:** MEDIUM (Apple's process is well-documented but the specific 2026 age-rating/SDK deadline changes are recent and should be spot-checked live in App Store Connect at execution time)

## Feature Landscape

### Table Stakes (Apple Requires These — Non-Negotiable for Submission)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| App Store Connect listing metadata: name, subtitle (30 char), promotional text, description, keywords (100 char, comma-separated) | Apple rejects/blocks submission without a complete listing; keywords drive ASO discoverability | LOW | Pure copywriting — no code changes. Lafa's name is already locked (`app.json` `expo.name: "Lafa"`); subtitle/keywords/description are net-new copy work, not implementation |
| Primary category (+ optional secondary) | Required field, affects where app surfaces in Store browsing/charts | LOW | "Education" is the obvious primary category for a verb-conjugation quiz app; "Reference" or a language-specific secondary category could be considered but is optional |
| Support URL (must be a live, reachable page) | Apple validates the URL resolves; users need a way to reach the developer | LOW-MEDIUM | No existing marketing site in this repo — needs a minimal static page (could be a single GitHub Pages / Vercel page, or even a simple hosted markdown-to-HTML page) with contact info or a form. This is new infrastructure, not just copy |
| Privacy Policy URL (must be live and accurate) | Legally required by Apple for every app, regardless of data collected; must match the App Privacy label answers | LOW-MEDIUM | Same infra gap as Support URL — needs a real hosted page. Content itself is simple given the app's minimal data footprint (no accounts, only free-text feedback submitted to the backend) but still needs drafting + hosting |
| App Privacy "nutrition label" questionnaire (App Store Connect → App Privacy section) | Mandatory per-app declaration of what data types are collected/linked/used to track; must be re-attested on every listing/major update | LOW-MEDIUM | For this app the honest answer set is narrow: the only data leaving the device is free-text feedback content (`message` field on both `POST /feedback` and `POST /product-feedback`) plus contextual quiz metadata (verb/tense/subject/answers) — this is "User Content" (or "Other User Content"), not linked to an identity, not used for tracking, no third-party SDKs collect anything. Likely resolves to "Data Not Linked to You" for the feedback text, or possibly "Data Not Collected" if the team decides feedback text doesn't count as identifying — needs a deliberate per-field walk-through, not a rubber-stamp "No data collected" |
| Age rating questionnaire (Apple's 2026-overhauled system: 4+, 9+, 13+, 16+, 18+ — replaces the old 12+/17+ tiers) | Mandatory; blocks submission if incomplete (Apple enforced completion for all developers by 2026-01-31) | LOW | For a verb-quiz education app with no user-generated public content, no ads, no web browser access, this should land at 4+. Must walk the actual questionnaire (now includes new mandatory questions on in-app controls/capabilities) rather than assuming the old rating carries over |
| iPhone screenshots (2026 minimum: one 6.9-inch iPhone set, 1320×2868px, up to 10 images) | Apple requires at least one device-size screenshot set before submission is possible | MEDIUM | No existing screenshot pipeline in this repo (`eas.json`/EAS Submit does **not** generate or upload screenshots — confirmed: EAS Submit only uploads the binary). Needs a manual or lightly-scripted capture pass (Simulator screenshots of the 3 branded screens: Setup, Quiz, Results) sized/cropped to Apple's exact pixel dimensions, alpha-free. 1-10 images requested by the milestone; 3-5 covering the core loop is likely sufficient for a first release |
| iPad screenshots — conditionally required | Only required if the app is marked as supporting iPad (`ios.supportsTablet`) | LOW (if avoidable) | **Verify `app.json`'s `ios.supportsTablet` setting first** — it is currently absent from `app.json`, and Expo's default is `false` (iPhone-only) as of recent SDKs, which would make iPad screenshots unnecessary. If it resolves to iPad-supporting, budget for a second screenshot set at iPad Pro 13" dimensions (2064×2752px) |
| App Review "Notes" field | Not strictly required by Apple, but strongly reduces review friction/rejection risk for atypical apps (no login, free content) | LOW | Should explicitly state: no account/login exists by design, all content is immediately accessible with no gating, the only network calls are quiz-content fetch (`GET /content/verbs`, silently falls back to bundled data) and two feedback-submission POSTs — pre-empts a reviewer flagging "can't find how to sign in" or assuming a hidden paywall |
| Export compliance declaration | Already answered in `app.json` (`ITSAppUsesNonExemptEncryption: false`) — re-confirmed at each submission | LOW | Already locked from v0.5; no new work, just re-verify it still holds (no new crypto usage added by v1.0's scope) |
| Production build via `eas build --profile production` + `eas submit` | Only path from source to a reviewable App Store Connect build | LOW-MEDIUM | Direct reuse of the v0.5-proven pipeline (`eas.json` production profile, `ascAppId` already set) — this milestone's risk here is low since the pipeline already succeeded once for TestFlight; the delta is submitting *for App Review* rather than internal TestFlight-only, and manually flipping the build for public release in App Store Connect once approved |
| Version/build number bump for the new submission | Apple requires a build number higher than any previously uploaded build for the same version | LOW | `eas.json`'s `autoIncrement: true` on the production profile already handles this automatically; `app.json` `version` may need a bump to `1.0.0`→ confirm it's still first-release-appropriate (it already reads `1.0.0`) |

### Differentiators (Worth Doing Well, Not Strictly Required)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Warm Bold Mark brand asset finalization (icon + homepage lockup) as the canonical source | A cohesive, polished icon + in-app lockup meaningfully affects App Store conversion (icon is the first thing a browsing user sees) and in-app first impression | MEDIUM | Already scoped in this milestone: promote `assets/brand/candidates/lafa-icon-warm-bold.svg` to canonical, rewrite `scripts/generate-brand-assets.ts` to use stable SVG layer ids (replacing brittle fill-count parsing — a real robustness improvement, not just cosmetic), and add the new `lafa-homepage-lockup.svg` → PNG generation target |
| Screenshot captions/marketing treatment (not just raw simulator captures) | Apple Store screenshots with captions/context convert meaningfully better than bare screenshots, per general ASO guidance | LOW-MEDIUM | Given the milestone's stated scope (1-10 "alpha-free" screenshots, not "designed marketing screenshots"), plain captioned device-frame screenshots are proportionate; a full Fastlane `frameit` + branded-background pipeline is likely over-engineering for a first release with no growth/marketing budget behind it |
| `choicePressed` quiz-answer press-state color fix | Fixes a real (if minor) UX misread — users could interpret the pressed-but-unsubmitted state as "wrong answer" | LOW | Small, isolated token addition (`colors.choicePressed = "#E7DFDA"`) scoped only to quiz answer options; low risk given the codebase's existing token-driven styling convention |
| `validate-brand.ts` extended to cover the new warm-source + homepage lockup outputs | Keeps the existing regression-gate pattern (established v0.6) consistent as new asset outputs are added | LOW-MEDIUM | Direct extension of an existing, proven script — same shape as prior checks (dimensions, alpha, forbidden hex, generator hygiene) |

### Anti-Features (Would Add Scope Without Real Value Here)

| Feature | Why It Might Seem Needed | Why Problematic for This Milestone | Alternative |
|---------|---------------------------|--------------------------------------|-------------|
| Fastlane `snapshot` + `frameit` automated screenshot pipeline | "Automate everything" instinct; common in larger app teams | Real setup/maintenance cost (Ruby toolchain, Fastfile, Framefile.json, simulator automation) for a 1-3 screen app that will rarely need re-shooting; the milestone only needs 1-10 static screenshots once | Manual/lightly-scripted Simulator screenshot capture (`xcrun simctl` or Expo's `expo run:ios` on a fixed device + manual crop/export) — one-time effort, revisit only if screenshots need frequent refreshes later |
| Full marketing website / blog for support+privacy URLs | Feels like "doing it properly" | Disproportionate to a free, no-account education app; a marketing site is a whole separate project | A single static page (even a GitHub Pages markdown render or a one-file Vercel/Netlify deploy) satisfying both the Support URL and Privacy Policy URL requirements is sufficient and matches the app's minimal-infrastructure philosophy elsewhere (no backend DB access, no auth) |
| External TestFlight Beta App Review before public submission | Feels like a safer staged rollout | Explicitly deferred in v0.5's Out of Scope with the same rationale (~24-48h extra review delay, unpredictable timeline) — re-litigating this now would reopen a decision already made twice | Go straight from internal-only TestFlight (already proven in v0.5) to the real public App Review submission; the milestone's own scope statement confirms this ("not just TestFlight") |
| iPad-optimized layouts/screenshots | "Might as well support iPad since Expo makes it easy" | Adds a whole additional QA/screenshot surface for a milestone that's explicitly about brand polish + submission, not new platform support; app has never been iPad-tested | Confirm/lock `ios.supportsTablet: false` explicitly in `app.json` (currently unset/ambiguous) so Apple's screenshot requirements and review scope stay iPhone-only, matching "iOS-first" framing in CLAUDE.md |
| Collecting analytics/crash reporting SDK ahead of submission "to see how the launch goes" | Reasonable growth instinct | Would immediately complicate the privacy nutrition label (introduces "Data Linked to You" / tracking questions), directly contradicts the existing "no analytics SDKs, no ads, no tracking" premise this milestone's research question explicitly assumes, and is out of scope for a brand+submission milestone | Ship with the current zero-analytics footprint; revisit analytics as an explicit, separately-scoped future milestone decision if the team wants launch metrics |

## Feature Dependencies

```
Warm Bold Mark canonical source (SVG, stable layer ids)
    └──requires──> updated scripts/generate-brand-assets.ts
                       └──produces──> icon.png, splash icon, favicon, Android foreground/monochrome, homepage lockup PNG
                                          └──enables──> App Store icon upload (App Store Connect requires the same production icon)
                                          └──enables──> Homepage lockup UI swap (app/index.tsx Text → Image)
                                          └──enables──> Accurate, branded App Store screenshots (screenshots should reflect the *final* brand, not pre-v1.0 assets)

scripts/validate-brand.ts extension
    └──requires──> Warm Bold Mark generator changes landing FIRST (validator checks generator output)

App Store Connect metadata (description/keywords/category/support+privacy URLs/age rating/privacy label)
    └──independent of──> brand asset work (can be done in parallel)
    └──requires──> Support URL + Privacy Policy URL hosting (new, small infra dependency — must exist BEFORE App Store Connect submission, Apple validates the URLs resolve)

Screenshots
    └──requires──> Final branded build (icon + homepage lockup + choicePressed fix all landed) — screenshots taken from a stale pre-brand-fix build would need to be retaken
    └──requires──> Production/preview EAS build reachable on a real device or Simulator

Production EAS build + EAS Submit
    └──requires──> app.json/eas.json unchanged from the proven v0.5 pipeline (or explicitly re-verified if touched)
    └──requires──> All App Store Connect metadata + privacy label + age rating + screenshots complete (Apple blocks "Submit for Review" until every required field is filled)

Public App Review submission
    └──requires──> ALL of the above (brand assets, metadata, privacy label, age rating, screenshots, build) complete
    └──enhances──> nothing further; this is the terminal milestone action
```

### Dependency Notes

- **Brand asset work should land before screenshots are captured.** Retaking screenshots is cheap, but capturing them against a build that still shows the plain-text homepage title or the old brand candidate would waste the screenshot effort — sequence screenshots last.
- **Support URL / Privacy Policy URL hosting is the one genuinely new piece of infrastructure this milestone needs** (everything else is either copy, existing-pipeline reuse, or asset-generation-script extension). It has no dependency on the brand/UI work and can be built in parallel, but it gates final App Store Connect submission (Apple's URL fields are validated as reachable).
- **The privacy nutrition label depends on an honest inventory of exactly what data crosses the wire** — this is already fully knowable from the existing codebase (`src/feedback/`, `src/productFeedback/`, `src/dataset/remote.ts`) without any new research; it's a documentation/declaration task, not an implementation task.
- **EAS build/submit pipeline has no new dependencies** — it was proven end-to-end in v0.5. The only change in v1.0 is what gets bundled into that build (finalized brand assets, UI fix, new token) and that the resulting review status changes from "internal TestFlight" to "submitted for public App Review."

## MVP Definition

### Launch With (v1.0 — this milestone)

- [ ] Canonical Warm Bold Mark SVG + regenerated icon/splash/favicon/Android assets — brand identity must be final before any App Store asset (icon, screenshots) is created
- [ ] Homepage lockup (SVG → PNG, responsive `Image` in `app/index.tsx`) — explicitly scoped UI fix
- [ ] `choicePressed` token fix on quiz answer press states — explicitly scoped UX fix
- [ ] `scripts/validate-brand.ts` extended for the new source/lockup outputs — matches existing regression-gate pattern, low cost given the script already exists
- [ ] Complete App Store Connect metadata (description, subtitle, keywords, category, review notes)
- [ ] Live Support URL + Privacy Policy URL
- [ ] Honest, field-by-field App Privacy nutrition label matching actual `POST /feedback` + `POST /product-feedback` + `GET /content/verbs` data flows
- [ ] Age rating questionnaire completed under the new (2026) tier system
- [ ] 3-5 alpha-free iPhone screenshots at the required 6.9" size (1-10 requested; fewer than 10 is fine for a simple 3-screen app)
- [ ] Production EAS build + EAS Submit, then manual "Submit for Review" handoff in App Store Connect

### Add After Validation (post-v1.0, if App Review flags something or the team wants iteration)

- [ ] Additional device-size screenshot sets (e.g., smaller iPhone sizes) if Apple's auto-downscaling from the 6.9" master set looks poor on review
- [ ] Localized App Store listing copy (e.g., Portuguese) — not requested this milestone, natural next step given the app teaches Portuguese
- [ ] External TestFlight beta group population — explicitly deferred twice already (v0.5, and implicitly again here)

### Future Consideration (v2+, explicitly out of this milestone's scope)

- [ ] Fastlane-automated screenshot regeneration pipeline — only worth it once screenshots need frequent refreshing across multiple releases
- [ ] Analytics/crash reporting integration — would require reopening the privacy nutrition label and is a deliberate non-goal per this milestone's own framing
- [ ] `.eas/workflows/` CI automation for build+submit — already tracked as a deferred v2 candidate (`RELEASE-01`) from v0.5
- [ ] iPad support — no current signal this app needs it; would add a whole new screenshot/QA surface

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Warm Bold Mark canonical asset promotion + generator update | HIGH (first impression, App Store icon) | MEDIUM | P1 |
| Homepage lockup UI swap | MEDIUM | LOW-MEDIUM | P1 |
| `choicePressed` token fix | LOW-MEDIUM (fixes real confusion) | LOW | P1 |
| App Store Connect metadata (description/keywords/category) | HIGH (gates submission) | LOW | P1 |
| Support + Privacy Policy URL hosting | HIGH (gates submission) | LOW-MEDIUM | P1 |
| App Privacy nutrition label | HIGH (gates submission, legal) | LOW-MEDIUM | P1 |
| Age rating questionnaire | HIGH (gates submission) | LOW | P1 |
| iPhone screenshots (6.9") | HIGH (gates submission) | MEDIUM | P1 |
| Review notes explaining no-login design | MEDIUM (reduces rejection risk) | LOW | P1 |
| `validate-brand.ts` extension | LOW-MEDIUM (regression safety) | LOW-MEDIUM | P2 |
| iPad screenshots | LOW (conditional — likely N/A) | LOW if not needed | P3 / N/A pending `supportsTablet` check |
| Fastlane screenshot automation | LOW for a one-time release | HIGH | P3 (defer) |

**Priority key:**
- P1: Must have for this milestone's stated goal (submission-ready + brand-final)
- P2: Should have, low-cost safety net matching existing project conventions
- P3: Nice to have or explicitly deferred

## Sources

- [App Store submissions now open for the latest OS releases — Apple Developer](https://developer.apple.com/news/?id=6lxhtioi) (MEDIUM confidence — official Apple news page)
- [Upcoming SDK minimum requirements — Apple Developer](https://developer.apple.com/news/?id=ueeok6yw) (MEDIUM — official)
- [App Store Connect minimum SDK requirements update — Expo blog](https://expo.dev/blog/app-store-connect-minimum-sdk-26) (MEDIUM — official Expo, directly relevant to this EAS-built app)
- [App Privacy Details - App Store - Apple Developer](https://developer.apple.com/app-store/app-privacy-details/) (HIGH — official Apple documentation)
- [Privacy Nutrition Labels in the App Store — Jamf](https://www.jamf.com/blog/privacy-nutrition-labels-in-the-app-store/) (LOW-MEDIUM — third-party explainer, cross-checked against Apple's own page)
- [Updated age ratings in App Store Connect — Apple Developer](https://developer.apple.com/news/?id=ks775ehf) (HIGH — official Apple news, confirms 2026 tier overhaul and Jan 31 2026 deadline)
- [Age ratings values and definitions — App Store Connect Help — Apple Developer](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) (HIGH — official reference)
- [The ultimate guide to App Store rejections — RevenueCat](https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections) (MEDIUM — reputable RN/mobile-focused company, general guidance)
- [App Store Guideline 4.2 Minimum Functionality — TechNet Experts](https://www.technetexperts.com/guideline-4-2-minimum-functionality/) (LOW-MEDIUM — third-party, consistent with widely-known Apple guideline text)
- [Expo App Store Screenshots: What EAS Submit Skips — Mokbi](https://mokbi.com/blog/expo-eas-app-store-screenshots) (MEDIUM — directly confirms EAS Submit does not generate/manage screenshots, consistent with this project's `eas.json` contents)
- [Fastlane + MCP for App Store Screenshots — AppScreenshotStudio](https://appscreenshotstudio.com/blog/how-to-automate-app-store-screenshots-2026) (LOW-MEDIUM — vendor blog, used only for the 2026 screenshot pixel-dimension figures, cross-referenced against general knowledge of Apple's published screenshot spec)
- Project's own `eas.json`, `app.json`, `.planning/PROJECT.md` (HIGH — primary source, current repo state as of 2026-08-16)

---
*Feature research for: Apple App Store Connect submission readiness (v1.0 milestone) — small, no-login, no-analytics Expo/RN education app*
*Researched: 2026-08-16*
