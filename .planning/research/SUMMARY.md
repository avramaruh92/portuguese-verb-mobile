# Project Research Summary

**Project:** Lafa — v1.0 milestone: warm brand-asset finalization + quiz press-state color fix + first full Apple App Store submission
**Domain:** Expo/React Native app polish + Apple App Store Connect submission readiness (small, no-login, no-analytics education app)
**Researched:** 2026-08-16
**Confidence:** MEDIUM-HIGH

## Executive Summary

This milestone has two distinct halves that share almost no technical surface but must be sequenced carefully: (1) hardening the existing brand-asset generation pipeline (promoting the "warm bold mark" SVG candidate, replacing brittle fill-string-counting with stable `id`-based layer extraction, adding a new homepage-lockup PNG output, and fixing a quiz answer-button press-state color that currently misreads as "wrong answer"), and (2) taking the app through its first real Apple App Store Connect submission (as opposed to v0.5's internal-TestFlight-only milestone). Experts build both halves the same way this app's existing conventions already point: one extended generator script (not a new one), a regression-gate validator script kept independent of the generator, tokens sourced from `src/theme/tokens.ts` rather than inline hex, and App Store metadata/screenshots treated as a manual, versioned-documentation process — not automated via Fastlane or `eas metadata`, both of which are disproportionate for a 3-screen, no-login app with no growth budget.

The recommended approach is almost entirely reuse of what's already proven: `@resvg/resvg-js` + `sharp` stay as the rasterization/compositing engine (only the upstream string-extraction step changes, via a lightweight DOM-style parser — `linkedom` — or a dependency-free regex depth-tracker), the already-proven `eas.json` `production` build+submit profile carries the store-submission build with no config changes required, and App Store Connect metadata/screenshots/privacy label are new manual/documentation work in a new `store/` (or `.planning/store/`) directory, not new code integrations. No new runtime dependencies are needed in the shipped app; the only new npm dependency under consideration is a build-time-only SVG parsing library.

The key risks are well-precedented by this repo's own incident history rather than hypothetical: (a) a **fourth** recurrence of Node/lockfile drift breaking the EAS production build (already happened 3 times per PROJECT.md, with no durable fix ever landed — must be closed this milestone, ideally first, before any dependency-touching work); (b) the icon-generator refactor silently reintroducing an alpha channel, which Apple's asset-catalog validation rejects outright (a real risk specifically because this milestone touches the exact extraction logic responsible for producing the opaque icon); (c) a state-precedence bug where the new `choicePressed` token could visually override locked correct/incorrect quiz feedback if branch ordering isn't explicit; and (d) App Store Connect submission gates (privacy nutrition label accuracy, screenshot staleness/sizing, age rating) that are process/documentation risks, not code risks, but block "Submit for Review" if mishandled. All four are directly actionable with explicit phase-level mitigations described below.

## Key Findings

### Recommended Stack

The only new dependency under real consideration is a build-time-only SVG parser (`linkedom`, preferred over `jsdom` for weight and over `svgson` because this milestone only needs select-and-extract, not tree rewriting) to replace `generate-brand-assets.ts`'s current brittle `fill="#F2643E"` string-counting with `id`-based `getElementById()` lookups — this requires adding stable `<g id="...">` attributes to the SVG sources themselves, since neither current candidate file has any today. Everything else is unchanged: `@resvg/resvg-js` and `sharp` keep their existing roles (rasterize, composite/strip-alpha/resize), and the already-pinned `eas-cli` + App Store Connect API Key auth (proven in v0.5) is reused as-is for the store submission — there is no EAS/Expo tooling for screenshot generation or App Store metadata upload; both are manual App Store Connect web-UI or `xcrun simctl`-driven steps.

**Core technologies:**
- `linkedom` (or a dependency-free regex depth-tracker, see ARCHITECTURE.md Pattern 1) — replaces fill-count string parsing with stable-id-based SVG layer extraction, build-time only, zero coupling to the RN/Expo runtime dependency graph
- `@resvg/resvg-js` + `sharp` (unchanged, already installed) — SVG rasterization and PNG compositing/alpha-stripping, only the upstream extraction step changes
- `xcrun simctl io booted screenshot` (Xcode CLI, not npm) — manual App Store screenshot capture; no Expo/EAS built-in equivalent exists
- Existing `eas-cli` + App Store Connect API Key — already proven end-to-end for the upload mechanism; only the App Store Connect UI steps after upload (metadata, "Submit for Review") are new

### Expected Features

**Must have (table stakes — gates App Store submission):**
- Complete App Store Connect listing metadata (name, subtitle, keywords, description, category)
- Live Support URL + Privacy Policy URL (genuinely new infrastructure — no marketing site exists in this repo today)
- Honest, field-by-field App Privacy nutrition label matching the real `POST /feedback` + `POST /product-feedback` + `GET /content/verbs` data flows (including backend-side IP logging, not just client code)
- Age rating questionnaire under Apple's 2026-overhauled tier system (4+/9+/13+/16+/18+)
- iPhone 6.9" screenshots (1320×2868, alpha-free sRGB, 3-5 of the 1-10 allowed) — must be captured last, from the final branded build
- Export compliance re-confirmation (already answered, just re-verify)
- Production `eas build`/`eas submit` with an incremented build number (already automated via `autoIncrement: true`)

**Should have (differentiators, in-scope this milestone):**
- Warm Bold Mark canonical promotion (icon + homepage lockup) — first-impression/App-Store-icon quality
- Homepage lockup UI swap (`Text` → `Image` in `app/index.tsx`)
- `choicePressed` token fix on quiz answer press states
- `validate-brand.ts` extended to cover the new source/lockup outputs (matches existing regression-gate convention)

**Defer (explicitly out of scope this milestone):**
- Fastlane/Maestro/Detox screenshot automation — disproportionate for a one-time, 1-3-screen capture
- Full marketing website — a single static page suffices for Support/Privacy URLs
- External TestFlight beta group — already deferred twice (v0.5 and again here)
- iPad support/screenshots — no signal this app needs it; confirm `ios.supportsTablet` stays unset/false
- Analytics/crash reporting SDKs — would reopen the privacy label and contradicts the app's zero-analytics premise

### Architecture Approach

The brand-asset pipeline stays a single extended script (`generate-brand-assets.ts`) reading from newly-`id`-tagged canonical SVGs under `assets/brand/` (never from the untracked `assets/brand/candidates/` exploration directory), producing both the existing icon/splash/Android outputs (now via id-based extraction) and one new homepage-lockup PNG via a simple, unrelated second render step (no safe-zone/monochrome logic needed for the lockup, since it's already a fully composed image). `validate-brand.ts` stays intentionally independent (no shared imports with the generator, per an existing v0.6 convention) and gets new checks appended. The quiz press-state fix is a single token addition (`colors.choicePressed`) plus a one-line value swap in `app/quiz.tsx`, with `tokens.test.ts`'s exhaustive assertion requiring an update. App Store submission artifacts live in a new `store/` (or `.planning/store/`) directory that has zero code/build coupling — pure documentation, versioned like other planning docs.

**Major components:**
1. `scripts/generate-brand-assets.ts` (extended) — single source of truth for all shipped brand PNGs; id-based extraction replaces fill-counting; adds a lockup render step
2. `scripts/validate-brand.ts` (extended) — independent regression gate, asserts canonical source, PNG dimensions/alpha, new lockup output existence
3. `app/index.tsx` + `app/quiz.tsx` (modified) — Image lockup swap; one-line `colors.pressed` → `colors.choicePressed` swap, gated by existing `lockedChoice === null` precedence guard
4. `src/theme/tokens.ts` (modified) — one new flat `colors.choicePressed` key, no nested grouping
5. `store/` (new, top-level) — App Store Connect metadata/privacy/screenshot manifest, pure documentation, no runtime coupling

### Critical Pitfalls

1. **A 4th Node/lockfile drift recurrence during the production build** — already hit 3 times (Phase 20/24/29); must be structurally fixed (`.nvmrc` + `package.json engines` + `eas.json`'s `node` field, all matching the real EAS build image) before any dependency-touching brand work begins, not patched ad hoc again.
2. **Regenerated app icon silently reintroduces an alpha channel** — the exact generator refactor planned this milestone (fill-count → id-based extraction) is precisely the kind of change that can regress the already-solved opaque-icon invariant; requires an explicit flatten/strip-alpha step plus a real `eas build`/`eas submit` cycle, not just local validation, since Apple validates at ingestion time.
3. **Stale on-device icon misread as a pipeline bug** — iOS icon caching means a real fix can appear "not working" on an already-provisioned device; always delete-and-reinstall (not update-in-place) before concluding the generator is broken.
4. **Pressed-state color visually overrides locked correct/incorrect quiz feedback** — a second conditional-style branch (press vs. locked-answer) on the same element is exactly the shape of a last-writer-wins bug; needs an explicit priority chain (locked+correct → locked+incorrect → pressed → default) and ideally a behavioral unit test, not just the token's existence.
5. **App Store screenshots at the wrong size, with alpha, or showing stale pre-rebrand UI** — must be captured last, strictly after brand-asset and press-state work is verified on a real build, at the exact 6.9" pixel dimensions, alpha-free.
6. **Privacy nutrition label answers don't match actual feedback-flow data collection** — both `POST /feedback` and `POST /product-feedback` carry free-text fields and are backend-persisted; answers must be cross-checked against actual payload/retention behavior (including backend IP logging), not filled from "no accounts = no data" assumption.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Build pipeline hardening (Node/lockfile drift fix)
**Rationale:** This is a prerequisite, not a feature — every subsequent phase touches dependencies (new SVG parser) or produces a real EAS production build, and this exact bug has already broken 3 prior milestones. Fixing it first removes a recurring blocker before it can strike at the worst possible time (final submission build).
**Delivers:** `.nvmrc`, `package.json engines.node`, and `eas.json` build-profile `node` field all pinned to the same version verified against real EAS build logs; a pristine regenerated `package-lock.json`; ideally a preflight check asserting `process.version` matches.
**Addresses:** No FEATURES.md item directly — pure technical-debt closure explicitly flagged as "Next Milestone" tech debt in PROJECT.md.
**Avoids:** Pitfall 1 (4th lockfile drift recurrence).

### Phase 2: Brand-asset source promotion + generator id-based rewrite
**Rationale:** Must happen before any downstream regeneration or validator extension — the id-based extraction logic needs ids to exist on the source SVG first, and the icon-only path should be verified in isolation (dimensions/alpha unchanged) before adding the lockup as a second concern.
**Delivers:** `assets/brand/lafa-icon.svg` promoted from the warm-bold candidate with stable `<g id>` layers; `extractMarkOnly()` rewritten to use id-based lookup (linkedom or regex depth-tracking); icon/splash/Android outputs regenerated and verified byte-for-byte-equivalent in shape (dimensions, alpha) to the pre-refactor baseline.
**Uses:** `linkedom` (or dependency-free regex) from STACK.md; Pattern 1 from ARCHITECTURE.md.
**Avoids:** Pitfall 2 (alpha-channel regression) — must include explicit re-verification, not just visual review; Pitfall 3 (stale-icon false alarm) — document delete-and-reinstall protocol in this phase's human-verify step.

### Phase 3: Homepage lockup asset + UI wiring
**Rationale:** Independent render path (no id-extraction needed, since the lockup is a single flat composed image), but should land after Phase 2 confirms the generator's core rewrite is stable, keeping the diff reviewable as separable additions.
**Delivers:** `assets/brand/lafa-homepage-lockup.svg` promoted, new `generateLockup()` step in the same script producing `assets/images/lafa-homepage-lockup.png`, `app/index.tsx`'s `Text` heading swapped for an `Image`.
**Addresses:** FEATURES.md's "Homepage lockup UI swap" (P1 differentiator).
**Implements:** ARCHITECTURE.md Pattern 2 (second single-source render step in the same `main()`).

### Phase 4: Quiz press-state color fix
**Rationale:** Fully independent of all brand-asset work (different files, different token) — can run in parallel with Phases 2-3, but is called out separately here because its Definition of Done requires a distinct verification step (precedence testing) that's easy to skip if bundled into brand work.
**Delivers:** `colors.choicePressed` added to `src/theme/tokens.ts` (+ `tokens.test.ts` update), `app/quiz.tsx`'s answer-choice `Pressable` swapped from `colors.pressed`, plus an explicit priority-chain check or behavioral unit test proving locked success/error states beat the press color in all combinations.
**Uses:** ARCHITECTURE.md Pattern 3.
**Avoids:** Pitfall 4 (state-precedence bug) — must include a behavioral test or disabled-after-lock check as part of Definition of Done, not just the token's existence.

### Phase 5: `validate-brand.ts` extension
**Rationale:** Depends on Phases 2-3 producing real generated output to assert against; extending checks before outputs exist means the new checks fail by construction.
**Delivers:** New checks appended to the validator (warm-bold source canonical, lockup PNG exists/sized correctly, alpha-channel check runs against every regenerated variant), independent-literal convention preserved (no shared imports with the generator).
**Addresses:** FEATURES.md's "validate-brand.ts extension" (P2).

### Phase 6: App Store Connect readiness (metadata, privacy, screenshots, submission)
**Rationale:** Must come strictly last — screenshots must reflect the final shipped UI (brand assets + press-state fix), and the production build submitted for review should carry the finished state, not an intermediate one.
**Delivers:** `store/` metadata (description, subtitle, keywords, category, review notes), Support URL + Privacy Policy URL hosted and live, field-by-field-accurate App Privacy nutrition label (cross-checked against both feedback endpoints' actual backend retention), age-rating questionnaire completed, 3-5 alpha-free 6.9" iPhone screenshots captured from the final verified build, production `eas build`/`eas submit`, manual "Submit for Review" handoff.
**Addresses:** All FEATURES.md table-stakes items.
**Avoids:** Pitfall 5 (stale/wrong-size/alpha screenshots) and Pitfall 6 (inaccurate privacy label) — both explicitly gated to this phase, sequenced last.

### Phase Ordering Rationale

- Phase 1 (build hardening) must lead because it's a structural prerequisite with 3x prior-incident evidence, not a feature — every later phase touches dependencies or produces a real EAS build.
- Phases 2-4 (brand assets, lockup, press-state fix) can mostly parallelize internally but Phase 2 must precede Phase 3 (shared generator script, isolate risk to one variable at a time) and Phase 4 is fully independent of both.
- Phase 5 (validator extension) must follow Phases 2-3 since it asserts against their real output.
- Phase 6 (App Store submission) must be strictly last — it's the terminal action gated by every other phase's completion (Apple blocks "Submit for Review" until all fields are filled, and screenshots/build must reflect the truly final state).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (generator id-based rewrite):** Needs a concrete decision between `linkedom` vs. dependency-free regex depth-tracking, and exact `<g id>` naming/placement in the SVG source — worth a focused `--research-phase` pass to firm up the extraction approach before implementation.
- **Phase 6 (App Store Connect readiness):** Apple's 2026 age-rating tier system and exact screenshot pixel-dimension requirements should be spot-checked live in App Store Connect at execution time (FEATURES.md/STACK.md both flag this as MEDIUM confidence, not yet exercised by this repo).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Node/lockfile pin):** Well-documented Expo/EAS pattern, already solved 3 times in this exact repo — just needs a durable fix this time.
- **Phase 3 (lockup asset):** Simple, well-understood `Resvg` render-to-PNG pattern, no id-extraction complexity.
- **Phase 4 (press-state fix):** Established token-addition convention already used throughout this codebase; the precedence-testing approach is well-specified in PITFALLS.md.
- **Phase 5 (validator extension):** Direct extension of an existing, proven script pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Direct repo file reads confirm current state (HIGH); new-dependency comparison (linkedom vs. alternatives) and 2026 screenshot dimensions are WebSearch-sourced, cross-referenced across multiple sources but not Context7-verified (MEDIUM) |
| Features | MEDIUM | Apple's submission process itself is well-documented, but the specific 2026 age-rating tier overhaul and exact deadline/requirement details are recent and should be spot-checked live at execution time |
| Architecture | HIGH | All findings verified by directly reading current source files (`generate-brand-assets.ts`, `validate-brand.ts`, `tokens.ts`, `app/index.tsx`, `app/quiz.tsx`, `app.json`, `eas.json`) — not training-data assumption |
| Pitfalls | MEDIUM-HIGH | Node/lockfile-drift and icon/alpha-channel findings are HIGH (corroborated by this repo's own 3x incident history and multiple independent external sources); App Store metadata/screenshot specifics are MEDIUM (Apple's stated specs + current third-party ASO guidance, not yet exercised by this specific repo) |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Exact EAS build-image Node version:** Must be read from real build logs, not assumed from the local dev machine — handle during Phase 1 by running an actual build and inspecting logs before pinning.
- **Apple's exact 2026 screenshot pixel dimensions and age-rating questionnaire flow:** Third-party-sourced (MEDIUM confidence); spot-check directly in App Store Connect at Phase 6 execution time in case Apple has updated specifics since this research.
- **Backend-side data retention for `/feedback` and `/product-feedback` (IP logging, retention duration):** Not verifiable from this repo alone — must be confirmed with the sibling `portuguese-verb-api` repo before finalizing the privacy nutrition label in Phase 6.
- **`ios.supportsTablet` current value:** Confirmed absent/unset in `app.json` at research time — verify and explicitly lock to `false` early in Phase 6 planning to avoid an unnecessary iPad screenshot requirement.

## Sources

### Primary (HIGH confidence)
- Direct repo file reads: `scripts/generate-brand-assets.ts`, `scripts/validate-brand.ts`, `src/theme/tokens.ts`, `app/index.tsx`, `app/quiz.tsx`, `app.json`, `eas.json`, `package.json`, `.planning/PROJECT.md`, `assets/brand/candidates/*.svg`
- [Submit to the Apple App Store with EAS Submit — Expo Docs](https://docs.expo.dev/submit/ios/)
- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/)
- [App Privacy Details (Nutrition Labels) — Apple Developer](https://developer.apple.com/app-store/app-privacy-details/)
- [Updated age ratings in App Store Connect — Apple Developer](https://developer.apple.com/news/?id=ks775ehf)

### Secondary (MEDIUM confidence)
- [ERROR ITMS-90717: "Invalid App Store Icon" — expo/expo#1086](https://github.com/expo/expo/issues/1086) and related icon-caching community threads
- [App Store Screenshot Sizes & Guidelines 2026 — MobileAction](https://www.mobileaction.co/guide/app-screenshot-sizes-and-guidelines-for-the-app-store/) and cross-referenced ASO guides
- [Expo App Store Screenshots: What EAS Submit Skips — Mokbi](https://mokbi.com/blog/expo-eas-app-store-screenshots)
- [App Store Rejection Reasons in 2026 — QAwerk](https://qawerk.com/blog/app-store-rejection-reasons/)

### Tertiary (LOW confidence)
- Vendor blog screenshot-dimension figures (AppScreenshotStudio) — used only for cross-referencing pixel dimensions, not as primary source
- `linkedom`/`svgson` npm listing comparisons — WebSearch-sourced, not Context7-verified

---
*Research completed: 2026-08-16*
*Ready for roadmap: yes*
