# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- ✅ **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10.1 (shipped 2026-07-17)
- ✅ **v0.2 Lafa Design System + Tense Label Refresh** — Phases 11-12 (shipped 2026-07-19)
- ✅ **v0.3 Learning Quality Upgrade** — Phases 13-16 (shipped 2026-07-21)
- ✅ **v0.4 Backend v0.4 Contract Sync + Product Feedback** — Phases 17-19 (shipped 2026-07-22)
- ✅ **v0.5 iOS TestFlight Readiness** — Phases 20-24 (shipped 2026-07-25)
- 🚧 **v0.6 Lafa Branding + Expo Splash Cleanup** — Phases 25-29 (in progress)

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

<details>
<summary>✅ v0.5 iOS TestFlight Readiness (Phases 20-24) — SHIPPED 2026-07-25</summary>

- [x] Phase 20: Native Build Risk Front-Loading (2/2 plans) — completed 2026-07-23
- [x] Phase 21: Release Identity Lock (2/2 plans) — completed 2026-07-23
- [x] Phase 22: Icon & Splash Asset Pipeline (3/3 plans) — completed 2026-07-23
- [x] Phase 23: EAS Build/Submit Configuration (1/1 plan) — completed 2026-07-23
- [x] Phase 24: Quality Gates, Preflight & First Submit (3/3 plans) — completed 2026-07-25

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.5-ROADMAP.md`.

</details>

### 🚧 v0.6 Lafa Branding + Expo Splash Cleanup (In Progress)

**Milestone Goal:** Replace the AI-generated Lafa brand assets with the
user-supplied SVG icon as the canonical source, update the app palette to
the new brand guideline, regenerate every Expo app/startup asset from that
source, and eliminate the blue Expo default launch flash on cold start.

- [x] **Phase 25: Brand Asset Pipeline** - Regenerate all app assets from the user-supplied SVG, retire the old AI-generated sources (completed 2026-08-13)
- [x] **Phase 26: Theme Palette Update** - Update design tokens to the new brand guideline palette (completed 2026-08-13)
- [ ] **Phase 27: Expo Config & Startup Flash Fix** - Eliminate the Expo-blue splash/background flash on cold launch
- [ ] **Phase 28: UI Token Application** - Apply the new palette across every screen and shared component
- [ ] **Phase 29: Brand Validation & Release Verification** - Automated brand checks plus a manual EAS release-build confirmation

## Phase Details

### Phase 25: Brand Asset Pipeline
**Goal**: The user-supplied SVG icon is the sole source for every generated
app asset, and the old AI-generated concept assets no longer exist or are
referenced anywhere in the repo.
**Depends on**: Phase 24 (v0.5, complete)
**Requirements**: BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):
  1. `scripts/generate-brand-assets.ts` reads only `assets/brand/lafa-icon.svg` — no code path references `lafa-logo.svg`, `lafa-logo-v2.svg`, or any concept PNG.
  2. Running `npm run generate-assets` produces `icon.png` (1024x1024, opaque RGB, no alpha channel), `favicon.png` (48x48), `splash-icon.png` (transparent, mark only, no background rectangle), `android-icon-foreground.png` (1024x1024, transparent, mark centered in the Android safe zone), and `android-icon-monochrome.png` (1024x1024, transparent monochrome mask).
  3. The old AI-generated brand source/concept files are deleted from the repo, or confirmed to have zero remaining references if removal is unsafe.
**Plans**: 1 plan

Plans:
- [x] 25-01-PLAN.md — Rename source SVG, delete legacy brand assets, rewrite the generator for all five outputs, regenerate and verify

### Phase 26: Theme Palette Update
**Goal**: The app's design-token module carries the new brand guideline
palette as the single source of truth for color going forward.
**Depends on**: Phase 24 (v0.5, complete)
**Requirements**: THEME-01, THEME-02
**Success Criteria** (what must be TRUE):
  1. `src/theme/tokens.ts` exports the new guideline palette (primary orange `#F2643E`, deep orange `#C94A2D`, soft peach `#FDE7DF`, teal `#36799A`, green `#1F7F66`, ink `#24201E`, stone `#746D69`, canvas `#F1EFED`, warm background `#FFF9F6`) under existing semantic token names, with new aliases added only for pressed/info/background states.
  2. `src/theme/tokens.test.ts` asserts the new palette values and passes.
**Plans**: 1 plan

Plans:
- [x] 26-01-PLAN.md — Update the `colors` assertion in `tokens.test.ts`, then repoint the `colors` export in `tokens.ts` to the new guideline palette

### Phase 27: Expo Config & Startup Flash Fix
**Goal**: Cold app launch never shows Expo's default blue splash or an
unbranded background — the warm Lafa background is visible end-to-end from
splash through first paint.
**Depends on**: Phase 25 (regenerated `splash-icon.png`), Phase 26 (brand tokens)
**Requirements**: CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04
**Success Criteria** (what must be TRUE):
  1. `app.json`'s `expo-splash-screen` plugin config uses the warm background (`#FFF9F6`) instead of Expo blue (`#208AEF`), points `image` at the regenerated `splash-icon.png`, and sets `imageWidth` to `160`.
  2. `app.json`'s `android.adaptiveIcon.backgroundColor` uses the warm background instead of the old Expo-blue-tinted value, and `backgroundImage` is removed.
  3. `app.json`'s `userInterfaceStyle` is `"light"`.
  4. `app/_layout.tsx` applies brand tokens to the Stack's `contentStyle`/`headerStyle`/`headerTintColor`/`headerShadowVisible`, configures `StatusBar` for dark content on the warm background, and sets the runtime root background via `expo-system-ui` to `#FFF9F6` so no white/default flash appears after the splash screen.
**Plans**: TBD
**UI hint**: yes

### Phase 28: UI Token Application
**Goal**: Every screen and shared component visually reflects the new
brand palette, with zero remaining dependence on old palette hex values.
**Depends on**: Phase 25 (icon asset for the Setup heading), Phase 26 (updated tokens)
**Requirements**: UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. The Setup screen's "Lafa" heading uses either the generated icon mark plus token-styled text, or a token-styled text-only heading if no vector wordmark is available — no wordmark is invented.
  2. Setup, Quiz, Results, both feedback modals (`ReportFeedbackModal`, `ProductFeedbackModal`), `OfflinePill`, and `ExplanationPanel` all consume the updated tokens — a repo-wide search finds zero occurrences of the old palette hex values (`#208AEF`, `#E6F4FE`, `#E8663D`, `#FCE4DA`, `#2FA84F`) in `app/`/`src/`.
**Plans**: TBD
**UI hint**: yes

### Phase 29: Brand Validation & Release Verification
**Goal**: The rebrand is provably correct both by automated check and on a
real release build, closing out the milestone.
**Depends on**: Phase 27, Phase 28
**Requirements**: VALID-01, VALID-02, VALID-03
**Success Criteria** (what must be TRUE):
  1. A brand validation script/check passes, confirming `app.json` has no Expo-blue splash/adaptive background, generated PNG dimensions match expected sizes, `icon.png` has no alpha channel, and the generator no longer references any old AI SVG source path.
  2. `npm test -- src/theme/tokens.test.ts`, `npm run typecheck`, and `npm run lint` all pass cleanly.
  3. On an EAS release/preview build (not Expo Go/dev client), a human confirms: cold launch shows the warm Lafa splash and never Expo blue, the iOS app icon uses the supplied SVG design, the Android adaptive icon is centered and not clipped by common masks, and Setup/Quiz/Results/modals all show the new palette consistently.
**Plans**: TBD

## Progress

**Execution Order:**
Phases 25 → 26 → 27 → 28 → 29 (25 and 26 have no dependency on each other and could run in parallel; 27 and 28 both depend on 25+26; 29 depends on 27+28).

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
| 20. Native Build Risk Front-Loading | v0.5 | 2/2 | Complete | 2026-07-23 |
| 21. Release Identity Lock | v0.5 | 2/2 | Complete | 2026-07-23 |
| 22. Icon & Splash Asset Pipeline | v0.5 | 3/3 | Complete | 2026-07-23 |
| 23. EAS Build/Submit Configuration | v0.5 | 1/1 | Complete | 2026-07-23 |
| 24. Quality Gates, Preflight & First Submit | v0.5 | 3/3 | Complete | 2026-07-25 |
| 25. Brand Asset Pipeline | v0.6 | 1/1 | Complete    | 2026-08-13 |
| 26. Theme Palette Update | v0.6 | 1/1 | Complete   | 2026-08-13 |
| 27. Expo Config & Startup Flash Fix | v0.6 | 0/TBD | Not started | - |
| 28. UI Token Application | v0.6 | 0/TBD | Not started | - |
| 29. Brand Validation & Release Verification | v0.6 | 0/TBD | Not started | - |

---

*Milestones v0.0, v0.1, v0.2, v0.3, v0.4, and v0.5 shipped. v0.6 roadmap
created 2026-08-13, awaiting user approval before planning begins.*
