# Pitfalls Research

**Domain:** Adding brand-asset polish + a press-state color fix to an existing Expo/EAS app, then taking it through its first full (non-TestFlight) Apple App Store submission
**Researched:** 2026-08-16
**Confidence:** MEDIUM-HIGH (icon/alpha-channel and lockfile-drift findings are HIGH — corroborated by this repo's own incident history and multiple independent sources; App Store metadata/screenshot specifics are MEDIUM — Apple's stated specs plus current third-party ASO guidance, not yet exercised by this repo)

## Critical Pitfalls

### Pitfall 1: A FOURTH npm/Node lockfile drift recurrence during the production build

**What goes wrong:**
`package-lock.json` gets regenerated (or a dependency bumped) on the local dev machine under a newer npm major version than the one baked into the EAS build image. The lockfile encodes an `optionalDependencies[].libc`/`os` field shape that the older `npm ci` on EAS rejects, producing a misleading "missing package" error deep into the build — not a clear version-mismatch message.

**Why it happens:**
This repo has hit this exact bug **three times already** (Phase 20, Phase 24, Phase 29 per `.planning/PROJECT.md` Key Decisions) because no durable Node-version pin (`.nvmrc`, `package.json engines`, or `eas.json` build-profile `node` field) has ever been added — each fix was a one-off lockfile regeneration, not a structural guard. Any dependency touch this milestone (`generate-brand-assets.ts` changes, new packages for screenshot tooling, etc.) reintroduces the exact same risk surface.

**How to avoid:**
Before this milestone's first real production build:
1. Pin an explicit Node version in **all three** places that matter for EAS, not just one: `.nvmrc` (for local dev via `nvm use`), `package.json` `engines.node` (documents intent, some tools respect it), and — most importantly — `eas.json`'s build profile `node` field (this is the field EAS Build actually reads to select its build-image Node version; see Expo docs `docs.expo.dev/build/eas-json/`).
2. Match all three to the **same major/minor** version the EAS build image actually uses (check via a real build's logs, not assumption) — do not just copy the local machine's `node -v`.
3. Regenerate `package-lock.json` from a clean `node_modules` using that exact pinned Node version (`nvm use && rm -rf node_modules package-lock.json && npm install`), then commit the pristine lockfile.
4. Add a CI/pre-build check (even a simple `scripts/preflight.ts`-style script, matching this repo's existing pattern) that asserts `process.version` matches `.nvmrc` before running `npm ci`, so drift fails loudly and locally instead of surfacing only inside an EAS build log.

**Warning signs:**
- Any `npm install` (not `npm ci`) run locally after adding/bumping a dependency, without immediately re-running under the pinned Node version.
- `eas build` failing with an `npm ci`/"missing package"/`EUSAGE` error that doesn't obviously match the actual change you made.
- `git diff package-lock.json` showing large diffs (lockfileVersion bump, `os`/`libc`/`cpu` fields appearing/disappearing) from a routine dependency change.

**Phase to address:**
Should be its own early phase (before the brand-asset regeneration work touches any dependencies), explicitly closing the "Next Milestone" tech debt item already flagged in `PROJECT.md`.

---

### Pitfall 2: New/regenerated app icon has an alpha channel or transparency and fails Apple's asset-catalog validation

**What goes wrong:**
Apple's App Store icon validation (`ITMS-90717: "Invalid App Store Icon... can't be transparent nor contain an alpha channel"`) rejects any 1024×1024 App Store icon PNG that has an alpha channel — even fully-opaque pixels with an alpha channel *present* (not just partially transparent pixels) can trigger this. This is a very common Expo/EAS-specific failure mode reported repeatedly against `expo`'s own build tooling.

**Why it happens:**
SVG-to-PNG rendering pipelines (Sharp, resvg, rsvg-convert, etc.) default to RGBA output. Swapping the brand source SVG (`lafa-icon-warm-bold.svg`) for a new candidate, or changing layer-id-based parsing in `scripts/generate-brand-assets.ts`, can silently reintroduce an alpha channel if the flattening/background-compositing step is skipped or misconfigured for the new source's layer structure — this repo already had to solve this once for v0.6 (`icon.png` must be fully opaque was already a validated invariant), and the stable-layer-id refactor planned for this milestone is exactly the kind of generator change that could regress it.

**How to avoid:**
- Explicitly flatten/composite onto an opaque background and strip the alpha channel as a distinct, unskippable step in the generator (e.g. Sharp's `.flatten({ background: '#RRGGBB' })` followed by confirming the output has no alpha channel, not just "looks opaque").
- Keep `scripts/validate-brand.ts`'s existing alpha-channel check and make sure it runs against **every** regenerated icon variant (not just `icon.png` — also check any Android adaptive foreground/monochrome or favicon that Apple/store tooling might independently validate) after the generator refactor lands, before wiring the new production submission steps.
- Do a real `eas build --platform ios` (not just local generation) at least once with the new assets before the final submission build — icon validation happens at Apple ingestion time via `eas submit`, not at local build time, so a clean local PNG inspection is necessary but not sufficient proof.

**Warning signs:**
- `scripts/validate-brand.ts` passing locally but `eas submit` failing at Apple's asset-catalog validation step (these are two different validation passes — passing one doesn't guarantee the other).
- Any change to the SVG→PNG rendering library version, layer-id parsing logic, or background-compositing step in `generate-brand-assets.ts`.
- Inspecting the PNG with `sips -g hasAlpha icon.png` (macOS) or ImageMagick `identify -format '%A' icon.png` shows `true`/anything other than fully opaque, even if the image visually looks solid.

**Phase to address:**
The brand-asset regeneration phase (promoting the warm-bold-mark SVG + stable-layer-id generator refactor) — must include an explicit alpha-channel re-verification step, not just visual review, before that phase is considered done.

---

### Pitfall 3: Stale app icon visible on-device after a genuine asset change ("it didn't work" false alarm)

**What goes wrong:**
After regenerating and shipping a new icon via EAS build, the developer or reviewer sees the *old* icon on a physical device's home screen or in TestFlight and concludes the asset pipeline is broken — when the real cause is iOS's own icon/springboard caching, not a build defect.

**Why it happens:**
iOS caches icon/launch-screen assets at the OS level independent of app content; a fresh install over an existing build (same bundle id) doesn't always force a full icon-cache refresh, especially if the build/version number wasn't bumped meaningfully. This is a well-documented Expo/RN community issue distinct from any code bug.

**How to avoid:**
- Always delete-and-reinstall the app (not just "update in place") when visually verifying icon changes on a physical device, and/or fully restart the device once if a stale icon persists after reinstall.
- Bump `ios.buildNumber` for every new build submitted for visual verification (this repo already does this per its release-identity discipline) — don't rely on `version` alone to force iOS to treat it as a new asset set.
- Don't treat a stale icon on one already-provisioned test device as proof of a pipeline defect; cross-check against a clean simulator install or a second device before debugging the generator.

**Warning signs:**
- Icon "not updating" only on a device that has run several prior builds of this app, but a clean install elsewhere shows the correct icon.
- Icon mismatch appears only in TestFlight's app list view (which has its own icon-caching quirks) but not in Settings > General > iPhone Storage (which reads the actual bundled asset).

**Phase to address:**
The visual sign-off step of the brand-asset phase — document the delete-and-reinstall verification protocol explicitly in that phase's plan so it isn't mistaken for a regression during human-verify.

---

### Pitfall 4: Pressed-state color visually wins over locked-in correct/incorrect quiz feedback (state-precedence bug)

**What goes wrong:**
Adding a new `colors.choicePressed` token and wiring it via `Pressable`'s function-form `style` prop can accidentally let the *pressed* visual state override the *locked-answer* success/error visual state if the style-resolution logic doesn't explicitly check "is this choice locked/answered" before applying the pressed-state color. Symptom: tapping-and-holding (or a slow release) on an already-answered (green/red) choice briefly or persistently shows the neutral pressed color instead of — or blended confusingly with — the correct/incorrect color, or a *subsequent* press on a different unanswered choice after an answer is locked shows the pressed color when it should be inert.

**Why it happens:**
`Pressable`'s `style={({ pressed }) => ...}` callback only knows about the *current gesture's* pressed boolean — it has no inherent awareness of the app's own `lockedChoice`/answered-state. The v0.6 rollout of pressed-state visuals (9 call sites across 5 files, per `PROJECT.md`) already had to solve exactly this precedence problem once for the *existing* `colors.pressed` token on primary buttons; this milestone adds a **second**, semantically-adjacent color (`choicePressed`) into the same answer-choice component that already carries `success`/`error` semantic coloring — two independent conditional-style branches (locked-answer color vs. press color) on the same element is exactly the shape of bug that produces "last-writer-wins" precedence mistakes if the style function's branch order/priority isn't explicit.

**How to avoid:**
- Style resolution must be a single deterministic priority chain, evaluated in this order and made explicit in code (e.g. a comment or a small named helper, not inline ternary soup): **locked+correct → locked+incorrect → pressed → default**. Locked states must short-circuit before the pressed check is ever consulted.
- Once a choice is locked (post-answer), it should arguably not even respond to further press-visual feedback at all — confirm whether the choice `Pressable` is disabled (not just visually overridden) after locking, which sidesteps the precedence question entirely rather than requiring correct branch ordering.
- Add or extend a unit/regression test (this codebase already grep-regression-tests for `onPressIn`/`onPressOut` absence per `PROJECT.md`) that asserts the resolved style for `{ locked: true, correct: true, pressed: true }` and `{ locked: true, correct: false, pressed: true }` combinations still returns the success/error color, not `choicePressed`.
- Because this is presentational logic inside a `.tsx` screen component (not this codebase's usual framework-free `src/` domain layer), this is exactly the kind of logic worth pulling into a small pure exported function (`resolveChoiceStyle(state)`) so it can be unit-tested without rendering — consistent with this repo's established "pure function, framework-free, injectable" convention.

**Warning signs:**
- Manual QA only exercises "press once, release, see result" — never tests tap-and-hold on an already-answered choice, or rapid double-tap sequences.
- The new `choicePressed` styling is added as another `pressed ? colors.choicePressed : ...` ternary branch appended *after* existing locked-state branches without re-reading the full conditional to confirm ordering.
- No test file changes accompany the `choicePressed` token addition (unlike `tokens.test.ts`'s existing exhaustive palette assertion, a *behavioral* precedence test is a different, easy-to-skip category).

**Phase to address:**
The quiz press-state color-fix phase — should explicitly include a precedence unit test (or a disabled-after-lock check) as part of its Definition of Done, not just the new token's existence in `tokens.ts`.

---

### Pitfall 5: App Store screenshots at the wrong device size, with alpha channel, or showing stale UI

**What goes wrong:**
Apple's App Store Connect requires screenshots sized for specific device classes (as of 2026, effectively just the largest device per family — 6.9" iPhone at 1320×2868, since Apple auto-scales down to populate older/smaller device listings) as PNG or JPEG in sRGB with **no alpha channel**, 1-10 images per required size. Common first-submission mistakes: capturing from a simulator/device size that doesn't match a currently-accepted bucket, screenshots with a transparent status bar/notch artifact carrying an alpha channel, or screenshots captured before the final rebrand landed (showing the old Expo-blue splash or pre-warm-palette UI) and never refreshed.

**Why it happens:**
Screenshot capture is usually a late, rushed step, often done from whatever simulator happens to be open rather than the exact required device class, and is easy to treat as "done" once uploaded without re-checking against the current build after later polish changes (like this milestone's own brand/color updates) land afterward.

**How to avoid:**
- Capture screenshots **after** all brand-asset and press-state-color work is finalized and verified on a real device/build, not before — this milestone changes visible UI (homepage lockup image, choice press colors), so screenshots taken early in the milestone will be stale by submission time.
- Capture directly from the 6.9" simulator class (or a real device of that class) at the exact required pixel dimensions; do not manually resize/pad screenshots from a different device size, as this is a common source of rejected or auto-flagged submissions.
- Explicitly verify exported screenshot PNGs have no alpha channel (same check as the icon) before upload — screenshot export tools (simulator screenshot capture, some third-party framing tools) can embed one even though the visual content looks fully opaque.
- Since this is a simple utility/education app, plain unframed device screenshots of the actual Setup/Quiz/Results screens are lower-risk than heavily marketing-annotated screenshots — reduces chance of "misleading screenshot" review flags (misleading screenshots are called out in current App Store rejection data as a common first-submission trigger).

**Warning signs:**
- Screenshot files still show `#0A7EA4`/Expo-blue or the plain-text homepage title from before this milestone's changes landed.
- Screenshot dimensions don't exactly match Apple's currently-published required size for the device class selected in App Store Connect (Apple performs pixel-dimension validation on upload).

**Phase to address:**
The App Store Connect readiness phase — screenshots must be the **last** content-producing step in that phase's plan, sequenced strictly after both the brand-asset and press-state phases are verified complete on a real build.

---

### Pitfall 6: Privacy nutrition-label answers don't match what the app's actual feedback flows collect

**What goes wrong:**
App Store Connect's privacy questionnaire answers are treated as boilerplate ("we don't collect anything") when the app in fact submits two distinct data flows to a live backend (`POST /feedback` with quiz context, `POST /product-feedback` with free-text messages) — both of which include user-authored free text that could contain personal information, plus implicit technical data (IP address logged by the backend HTTP layer, `appVersion`/`platform`). Mislabeling analytics/diagnostic data as "not collected," or omitting IP-address collection that the backend's HTTP layer inherently logs, is called out as a common mistake in current App Store privacy-label guidance.

**Why it happens:**
The mobile app's own code never explicitly collects PII (no accounts, no login — confirmed throughout `PROJECT.md`), which makes it tempting to answer "No data collected." But the nutrition label must reflect the full round-trip including what the **backend** does with submitted data, not just what the client-side code touches — and free-text feedback fields are a common blind spot since users can voluntarily type anything (including identifying info) into "message"/"other" fields.

**How to avoid:**
- Answer the privacy questionnaire based on the actual `POST /feedback` and `POST /product-feedback` payload contracts (already fully documented in this repo's `CLAUDE.md`/`PROJECT.md`) — both include free-text `message` fields, which should be disclosed as potentially containing user-provided content, linked to the app's function ("App Functionality"/"Customer Support" category, not "Analytics" or "Third-Party Advertising").
- Explicitly account for network-layer metadata (IP address is very commonly logged by any HTTP backend, including Render's default request logging) as "Data Used to Track You" or "Other Data" depending on actual backend retention — coordinate with the `portuguese-verb-api` sibling repo to confirm what's actually logged/retained server-side before answering, rather than guessing from the mobile app's code alone.
- Because there's no login/accounts/analytics SDK in this app, most categories should legitimately be "No" — but the two feedback flows are real, live, user-data-touching paths and must not be blanket-denied just because the rest of the app is offline-first.

**Warning signs:**
- Privacy questionnaire completed by only reading `src/` mobile code, without cross-checking what the backend actually stores/retains from submitted feedback (message text is persisted per `CLAUDE.md`'s "`201` response returns the full persisted row").
- "Contact Info" or "User Content" categories left at "No" despite `message`/free-text fields existing in both feedback contracts.

**Phase to address:**
The App Store Connect readiness phase — privacy questionnaire answers should be drafted by directly re-reading the two feedback payload contracts and confirming backend retention behavior with the sibling repo, not filled from memory or assumption.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip pinning Node version in `eas.json`/`.nvmrc` "just this once more" | Saves ~30 min this milestone | 4th recurrence of the exact same build-breaking bug, at the worst possible time (final submission build) | Never — this repo has direct, repeated evidence it always recurs |
| Manually resize/pad an existing screenshot instead of recapturing at the exact required simulator size | Faster to produce | Apple's dimension validation can reject at upload, or screenshot looks subtly stretched/cropped in review | Never for the primary/first screenshot set; acceptable only for later cosmetic-only re-crops of an already-correct-size source |
| Answer privacy questionnaire generically ("no data collected") because the app is "mostly offline" | Fast to fill out | Risk of App Review rejection or post-approval compliance issue once reviewers cross-check against the live `/feedback` endpoints | Never — takes minutes to answer correctly given the contracts are already fully documented in this repo |
| Reuse the existing `colors.pressed` token for the new quiz-choice press state instead of adding `choicePressed` | Fewer new tokens, less code | Conflates a primary-button semantic with an answer-choice semantic; a future primary-button color change would unintentionally recolor quiz-choice press states too | Never — this milestone's own plan already correctly scopes `choicePressed` separately; don't collapse them under time pressure |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| EAS Build native image | Assuming EAS build-image Node version matches local dev machine | Read the actual build image's Node version from real build logs and pin `eas.json`'s `node` field + `.nvmrc` to match exactly |
| Apple App Store Connect asset validation | Trusting local `validate-brand.ts` pass as sufficient proof assets will pass Apple's own ingestion validation | Treat local validation as necessary-but-not-sufficient; only a real `eas submit` (or at minimum a manual Transporter upload) confirms Apple-side acceptance |
| App Store Connect privacy questionnaire | Answering based only on mobile client code, ignoring backend persistence/logging behavior | Cross-check answers against the sibling `portuguese-verb-api` repo's actual data retention for both feedback endpoints |
| iOS icon/launch-screen caching | Treating a stale on-device icon after a real asset change as a build-pipeline bug | Delete-and-reinstall (not update-in-place) plus a device restart before concluding the pipeline is broken |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Pressed-state color visually reads as "wrong answer" on an unanswered choice (the exact bug this milestone is fixing) | Learner briefly thinks they got it wrong before feedback is even locked in, undermining trust in the scoring feedback | Use a clearly neutral, warm-toned pressed color (`#E7DFDA` per this milestone's plan) visually distinct from both `error`/`success`, and disable further press-visual response once a choice is locked |
| Homepage lockup image fails to scale gracefully across device widths (new responsive image replacing plain `Text` title) | Cropped/distorted brand image on smaller iPhone SE-class screens | Verify the lockup image component on the smallest supported device width during human-verify, not just a modern large-screen simulator |

## "Looks Done But Isn't" Checklist

- [ ] **App icon regeneration:** Passing `scripts/validate-brand.ts` locally is not the same as passing Apple's asset-catalog validation — verify with a real `eas build`/`eas submit` cycle, not just the local script.
- [ ] **Node version pin:** Adding `.nvmrc` alone is not the same as fixing the drift — the field EAS Build actually reads is `eas.json`'s build-profile `node` field; verify all three locations (`.nvmrc`, `package.json engines`, `eas.json`) agree with the real build image.
- [ ] **Pressed-state color fix:** Adding the `choicePressed` token to `tokens.ts` (and its palette-completeness test) is not the same as fixing the precedence bug — verify locked-answer states still win over press states with an explicit behavioral test or a disabled-after-lock check.
- [ ] **Screenshots:** Uploaded screenshots existing in App Store Connect is not the same as them reflecting the shipped build — recapture after all brand/color changes in this milestone are verified on a real build, not earlier in the milestone.
- [ ] **Privacy nutrition label:** Submitted answers existing is not the same as them being accurate — answers must reflect actual backend persistence of both `/feedback` and `/product-feedback` free-text payloads, not just "no accounts, so no data."

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| 4th lockfile drift discovered mid-EAS-build | LOW | Regenerate `package-lock.json` under the correct pinned Node version, re-push, re-run build — same fix as the prior three times, just costs a build cycle |
| Icon rejected by Apple for alpha channel at submission time | LOW-MEDIUM | Re-run the generator's flatten/strip-alpha step, re-validate with `sips`/ImageMagick, produce a new build, re-submit — costs a build+submit cycle but no code redesign |
| Pressed-state precedence bug found in App Review or post-ship | MEDIUM | Requires a genuine logic fix (not just a token tweak) plus a new build/submit cycle; better to catch via the unit test before submission |
| Privacy label found inaccurate after submission | LOW | Privacy answers can be updated in App Store Connect at any time without a new app binary submission |
| Screenshots stale after later milestone changes | LOW | Screenshots can be replaced in App Store Connect independently of a binary rebuild, at any time before/after release |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| 4th Node/lockfile drift recurrence | Early phase, before any dependency-touching brand-generator work | `eas.json` `node` field + `.nvmrc` + `package.json engines` all agree with the real EAS build image's Node version; a real `eas build` succeeds from a freshly-cloned checkout |
| Icon alpha-channel regression from generator refactor | Brand-asset regeneration phase | `scripts/validate-brand.ts` alpha-channel check passes AND a real `eas build`+`eas submit` (or manual Transporter check) confirms Apple-side acceptance |
| Stale on-device icon misread as a bug | Brand-asset visual sign-off step | Delete-and-reinstall verification protocol explicitly followed and documented in that phase's human-verify notes |
| Pressed-state color precedence bug | Quiz press-state color-fix phase | A behavioral test (or disabled-after-lock check) proving locked success/error states beat the new `choicePressed` token in all combinations |
| Stale/wrong-size/alpha-bearing screenshots | App Store Connect readiness phase, sequenced last | Screenshots captured from the final verified build, at Apple's currently-required pixel dimensions, with no alpha channel |
| Inaccurate privacy nutrition label | App Store Connect readiness phase | Answers cross-checked directly against both feedback endpoints' actual payload/retention behavior, not filled from memory |

## Sources

- [ERROR ITMS-90717: "Invalid App Store Icon" — expo/expo#1086](https://github.com/expo/expo/issues/1086)
- [ITMS-90717 fix discussion — Medium](https://medium.com/@barretopetros/error-itms-90717-invalid-app-store-icon-df2216956d32)
- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/) (build-profile `node` field)
- [App icon incorrect in TestFlight — expo/expo#11925](https://github.com/expo/expo/issues/11925)
- [iOS: Why Old Launch Screen & App Icon Persist After TestFlight Update](https://www.codestudy.net/blog/ios-keeping-old-launch-screen-and-app-icon-after-update/)
- [App Store Screenshot Sizes & Guidelines 2026 — MobileAction](https://www.mobileaction.co/guide/app-screenshot-sizes-and-guidelines-for-the-app-store/)
- [App Store Rejection Reasons in 2026 — QAwerk](https://qawerk.com/blog/app-store-rejection-reasons/)
- [Why Apps Get Rejected by the App Store in 2026 — Syngrid](https://syngrid.com/why-apps-get-rejected-by-the-app-store-in-2026/)
- [App Privacy Details (Nutrition Labels) — Apple Developer](https://developer.apple.com/app-store/app-privacy-details/)
- [Submitting App Privacy Details to the App Store — Singular Help Center](https://support.singular.net/hc/en-us/articles/360053160271-Submitting-App-Privacy-Details-Nutrition-Labels-to-the-App-Store)
- [React Native `Pressable` docs](https://reactnative.dev/docs/pressable) (pressed-state callback semantics)
- This repo's own incident history: `.planning/PROJECT.md` Key Decisions table (Phase 20/24/29 lockfile drift, Phase 20/21/24 slug/identity resolution, v0.6 alpha-channel/pressed-state precedent)

---
*Pitfalls research for: adding brand-asset finalization + press-state color fix + first full App Store submission to an existing shipped Expo/EAS app*
*Researched: 2026-08-16*
