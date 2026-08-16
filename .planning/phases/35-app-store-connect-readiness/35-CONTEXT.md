# Phase 35: App Store Connect Readiness - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase gets the app submitted to Apple for App Review with a complete,
accurate App Store Connect listing. It covers: versioned store metadata
(`store/`), a live Support URL + Privacy Policy URL, an honest App Privacy
nutrition label, the age rating questionnaire, `ios.supportsTablet` locked
to `false`, 3-5 alpha-free 6.9" screenshots from the final branded build,
export compliance re-verification, a production `eas build` + `eas submit`
with an incremented build number, `icon.png` re-confirmed alpha-free on that
real production build (the deferred half of Phase 31/BRAND-04), and the
manual "Submit for Review" click in App Store Connect. This is the terminal
phase of v1.0 — depends on Phases 30-34 (build pipeline, brand assets,
homepage lockup, quiz press-state fix, brand validation) all being done,
since screenshots and the submitted build must reflect the truly final state.

No new app features, no analytics/crash-reporting SDKs, no iPad support, no
Fastlane automation, no localized listing copy — all explicitly out of scope
per `.planning/research/FEATURES.md`.

</domain>

<decisions>
## Implementation Decisions

### Support & Privacy Policy URL hosting
- **D-01:** Host both pages via GitHub Pages on this repo
  (`portuguese-verb-mobile`) — no new repo, no third-party hosting account.
  Static HTML/markdown pages served from a `/docs` folder or equivalent,
  reachable at a `github.io` URL. Matches the project's existing
  minimal-infrastructure convention (no marketing site, no backend DB
  access beyond the two documented endpoints).
- **D-02:** Support page contact method is a `mailto:` link to
  **aruhicen@gmail.com** — no new dedicated inbox, no in-app-feedback-only
  framing. Simplest option, no new infra to stand up before submission.
- **D-03:** Privacy Policy page uses the same contact email.

### Store listing copy & category
- **D-04:** Primary category is **Education** (single category, no
  secondary) — direct match for a structured A1-A2 verb-conjugation quiz;
  best discoverability for language-learning searches.
- **D-05:** Subtitle/description tone is **direct & functional** —
  keyword-forward, no marketing fluff, no forced warmth. Matches the app's
  existing no-gamification design.
- **D-06:** The description must explicitly state, in plain terms: the app
  is **free**, has **no account/login**, and teaches **European Portuguese**
  (not Brazilian) — all three facts reduce reviewer friction and pre-empt
  the most likely user confusion (PT-PT vs PT-BR).

### Privacy nutrition label answers
- **D-07:** `POST /feedback` and `POST /product-feedback` message content →
  classify as **"Data Not Linked to You"**, category **User Content**. The
  payload is free-text feedback plus quiz metadata (verb/tense/subject/
  answers); nothing in the request ties it to an identifiable user (no
  account, no device id, no email field in the contract).
- **D-08:** `GET /content/verbs` → classify as **"Data Not Collected"**. It's
  a read-only GET, no request body, no auth, no identifiers sent.
- **D-09 (open — flagged for research):** The above two classifications
  assume standard ephemeral server request logs don't count as "collection"
  for nutrition-label purposes. This assumption is **not yet verified**
  against the actual `portuguese-verb-api` backend behavior (retention
  duration, whether IP addresses are logged/stored beyond transient access
  logs) — the sibling repo isn't checked out locally in this session.
  **Researcher/planner must confirm this with the backend repo (or via the
  shared memory MCP's cross-repo tools) before the answers are entered live
  in App Store Connect.** If the backend does retain IPs beyond ephemeral
  logging, D-07/D-08 may need to change to acknowledge IP address collection.

### Screenshots
- **D-10:** Style is **plain simulator captures** — no captions, no device
  frame overlay, no Fastlane `frameit`. Matches the "alpha-free" scope and
  the research doc's explicit anti-feature call-out against screenshot
  automation tooling for a one-time release.
- **D-11:** Exactly **3 screenshots**, covering: Setup screen (tense/verb-mode
  picker), Quiz screen with a choice locked in (showing correct/incorrect
  feedback state), Results screen with score. This is the minimum viable set
  covering the full core loop — no Explanation-panel shot, no extra states.
- **D-12:** Capture via **iOS Simulator, manual capture** (e.g. iPhone 16 Pro
  Max or equivalent 6.9" simulator, `Cmd+S` / `xcrun simctl io screenshot`)
  against the final branded production/preview build — not a real device,
  not scripted automation.

### Claude's Discretion
- Exact GitHub Pages folder structure (`/docs` vs a dedicated branch) and
  exact HTML/markdown wording for the Support/Privacy pages, as long as
  D-01/D-02/D-03 hold.
- Exact subtitle text (≤30 chars), full description copy, and keyword list
  (≤100 chars) — draft within the direct/functional tone and the three
  mandatory facts (D-04/D-05/D-06); no further user review requested before
  planning, but the user can adjust during plan review.
- Exact wording of App Review "Notes" field content (not separately
  discussed — follow `.planning/research/FEATURES.md`'s guidance: state no
  login by design, no gating, and the two documented network calls).
- `store/` directory location and internal file layout — the architecture
  research (`.planning/research/ARCHITECTURE.md`) proposes a top-level
  `store/metadata|privacy|screenshots/` layout; this wasn't separately
  re-litigated in discussion and Claude may follow that structure directly.
- Age rating questionnaire answers — not discussed in depth; research
  strongly suggests 4+ is the correct outcome for this app (no UGC, no ads,
  no web browser access), but the actual 2026 questionnaire must be walked
  live in App Store Connect at execution time per
  `.planning/research/FEATURES.md`'s confidence caveat.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / Requirements
- `.planning/ROADMAP.md` §"Phase 35: App Store Connect Readiness" — goal,
  success criteria, depends-on (Phases 30-34)
- `.planning/REQUIREMENTS.md` lines 45-53 — STORE-01 through STORE-09
  requirement text
- `.planning/REQUIREMENTS.md` lines 103-111 — requirement-to-phase
  traceability table

### v1.0 milestone research (covers this phase directly)
- `.planning/research/FEATURES.md` — full feature landscape for App Store
  Connect submission readiness: table-stakes list, anti-features (Fastlane
  automation, full marketing site, TestFlight beta, iPad support,
  analytics), MVP definition, dependency graph
- `.planning/research/ARCHITECTURE.md` — proposed `store/` directory
  structure (`store/metadata/`, `store/privacy/`, `store/screenshots/`),
  and confirms EAS Submit does not handle metadata/screenshots (App Store
  Connect UI only)

### Prior phase context
- `.planning/phases/34-brand-validation-extension/34-CONTEXT.md` — confirms
  `npm run validate-brand` is the pre-submission regression gate this phase
  re-runs before the real EAS build
- `.planning/.continue-here.md` — Phase 34 completion state, confirms
  Phase 35 is next and lists the open backend-retention research item

### Cross-repo contract (data flows for the privacy label)
- `CLAUDE.md` §"Key Domain Facts" — `POST /feedback` request contract
  (message, verb, tense, subject, correctAnswer, selectedAnswer,
  appVersion, platform) — the exact fields that must be walked for D-07
- Sibling repo `portuguese-verb-api` — **must be consulted** (not available
  locally this session) to confirm actual retention/IP-logging behavior
  before finalizing D-07/D-08/D-09

### Config files to modify
- `app.json` — add explicit `ios.supportsTablet: false` (STORE-05,
  currently absent/ambiguous)
- `eas.json` — production build/submit profile already proven in v0.5;
  re-verify unchanged before this phase's real submission build

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eas.json`'s `production` build profile (`autoIncrement: true`, `node:
  "22.23.2"`, `submit.production.ios.ascAppId: "6794382182"`) — direct
  reuse for the real submission build, no changes expected unless
  Phase 30's node pin needs re-verification.
- `scripts/validate-brand.ts` (`npm run validate-brand`, 21/21 checks as of
  Phase 34) — re-run this before the production build to catch any brand
  regression prior to the real App Store submission.

### Established Patterns
- `app.json`'s `ios` block currently has `bundleIdentifier`, `buildNumber`,
  `infoPlist.ITSAppUsesNonExemptEncryption: false` but no `supportsTablet`
  key — Expo's default resolves this ambiguously; STORE-05 requires it be
  explicit.
- No existing `store/` or `.planning/store/` directory yet — this phase
  creates it fresh, following the architecture research's proposed layout.

### Integration Points
- `src/feedback/` (submit.ts, payload.ts, schema.ts) and the
  `POST /product-feedback` equivalent, plus `src/dataset/remote.ts`
  (`GET /content/verbs`) are the three network calls the privacy nutrition
  label and review notes must accurately describe — already fully known
  from the codebase, no new investigation needed on the mobile side.

</code_context>

<specifics>
## Specific Ideas

No additional specific requests beyond the decisions above — the user
selected the recommended (minimal, convention-consistent) option at nearly
every choice point: GitHub Pages over a new hosting account, reusing an
existing email over a new dedicated inbox, plain screenshots over
captioned/framed ones, Simulator capture over real-device capture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions
came up during this session.

</deferred>

---

*Phase: 35-App Store Connect Readiness*
*Context gathered: 2026-08-16*
