# Phase 24: Quality Gates, Preflight & First Submit - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Get a signed iOS build into App Store Connect and internal TestFlight,
gated by clean lint and a live-backend preflight that explicitly checks a
cold Render instance. Requirements: SHIP-01 through SHIP-05. This phase
fixes two known lint errors, builds a reusable preflight script, and walks
through the real `eas build`/`eas submit` cycle plus TestFlight tester
setup — all real actions against Apple/Render infrastructure, not
speculative work.

</domain>

<decisions>
## Implementation Decisions

### Lint fix (SHIP-01)
- **D-01:** Implementer's discretion on the exact fix for the
  `react-hooks/set-state-in-effect` errors in `ReportFeedbackModal.tsx:54`
  and `ProductFeedbackModal.tsx:49` (both are a "reset form state when the
  modal becomes visible" pattern). Use whatever React-idiomatic fix is
  cleanest (e.g. deriving reset state during render via a tracked
  prev-`visible` ref, per React's official "adjusting state when a prop
  changes" guidance) as long as user-visible behavior is unchanged: the
  modal must still reset `reason`/`category`, `message`, `state`, and
  `lastStatus` to their defaults every time it transitions to visible.
  Do not use a `key`-based remount — user did not want that pattern forced.

### Preflight script (SHIP-02, SHIP-03)
- **D-02:** Build a checked-in, reusable script (not a one-off manual
  curl session) — follow the existing `scripts/generate-brand-assets.ts`
  precedent (a plain script, invoked via a new `package.json` script
  entry, e.g. `npm run preflight`).
- **D-03:** The script checks **status codes only**, not response body
  shape. Assert: `GET /health` → 200, `GET /content/verbs` → 200,
  `POST /feedback` → 201 (using a syntactically valid dummy payload
  matching `feedback/schema.ts`'s contract), `POST /product-feedback` →
  201 (dummy payload matching `productFeedback`'s contract). No Zod
  body-shape validation — that's out of scope for this phase's narrow
  smoke-test goal.
- **D-04:** The cold-instance check (SHIP-03) is **not automated as an
  in-plan sleep**. The plan produces a **human-executed checkpoint task**:
  the user lets the Render instance idle 15+ minutes on their own schedule,
  then runs the preflight script themselves and reports the result back.
  No agent task should literally sleep/wait 15+ minutes inline.

### Build/submit execution (SHIP-04)
- **D-05:** `eas build --profile production` and `eas submit --profile
  production` are **not run autonomously by an agent**. The plan produces
  the exact commands plus a pre-flight checklist (lint clean, preflight
  script passed warm + cold, `eas.json`'s `ascAppId` already filled in —
  confirmed done in Phase 23 follow-up) as a **human-executed checkpoint
  task**. The user runs the commands themselves (interactive Apple ID
  auth required) and reports back the Processing/Ready status from App
  Store Connect.

### TestFlight testers (SHIP-05)
- **D-06:** Handled as a **human-executed checkpoint task**, not specified
  now. The plan documents the steps (App Store Connect → TestFlight →
  Internal Testing → add team members) as a checklist; the user adds
  testers and confirms install themselves, then reports back.

### Claude's Discretion
- Exact script filename/location for the preflight script (e.g.
  `scripts/preflight.ts`), as long as it's invoked via an `npm run`
  script entry consistent with `scripts/generate-brand-assets.ts`.
- Exact dummy payload values used to hit `POST /feedback` and
  `POST /product-feedback` during preflight (must be schema-valid but
  content is arbitrary/placeholder).
- Internal structure of the human-executed checkpoint tasks (how many
  tasks, what order) as long as SHIP-03/04/05's manual-execution
  constraints (D-04/D-05/D-06) are respected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project/milestone context
- `.planning/PROJECT.md` §"Current Milestone: v0.5 iOS TestFlight Readiness" — milestone goal, phase sequencing rationale
- `.planning/REQUIREMENTS.md` §SHIP-01 through SHIP-05 — exact requirement wording, out-of-scope table (no `.eas/workflows/` CI automation, no Fastlane, no push notifications)
- `.planning/ROADMAP.md` §"Phase 24: Quality Gates, Preflight & First Submit" — goal, success criteria, dependency on Phase 22 + Phase 23

### Prior phase history (direct dependencies/context)
- `.planning/phases/23-eas-build-submit-configuration/23-01-SUMMARY.md` — confirms `eas.json`'s `submit.production.ios.ascAppId` placeholder was already replaced with the real value (`6794382182`) in a follow-up commit after Phase 23 closed; this phase's build/submit checklist should NOT re-flag that as outstanding
- `.planning/phases/20-native-build-risk-front-loading/20-CONTEXT.md` — EAS CLI already authenticated on this machine (`eas whoami` → `avram.aruh`); no `eas login` step needed before build, only submit-time Apple ID auth
- `.planning/phases/22-icon-splash-asset-pipeline/` — icon/splash assets already human-verified and shipped; nothing further needed there before build

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-brand-assets.ts` — existing precedent for a checked-in
  standalone script invoked via an `npm run` entry; the preflight script
  should follow this same structural pattern (plain Node/TS script, no
  new tooling dependency).
- `src/feedback/schema.ts` (`feedbackPayloadSchema`) and
  `src/feedback/submit.ts` (`FEEDBACK_ENDPOINT`) — exact contract shape
  and endpoint URL for the `POST /feedback` preflight check.
- `src/productFeedback/submit.ts` (`PRODUCT_FEEDBACK_ENDPOINT`) — same for
  `POST /product-feedback`.
- `src/dataset/remote.ts` (`CONTENT_ENDPOINT`) — endpoint URL for
  `GET /content/verbs`.
- No existing `/health` endpoint reference in mobile code — confirmed
  live via direct `curl` during this discussion (returns `200`); this
  will be a new endpoint reference, first used by the preflight script.

### Established Patterns
- Backend endpoints are hardcoded string constants directly in source
  (not env vars) — `https://portuguese-verb-api.onrender.com` is the
  base URL used consistently across `src/dataset/remote.ts`,
  `src/feedback/submit.ts`, `src/productFeedback/submit.ts`. The
  preflight script should reuse the same base URL literal or import the
  existing endpoint constants where possible rather than re-declaring
  them.
- `AbortController` + `setTimeout`/`clearTimeout` is this project's
  standard timeout pattern for fetch calls (see `src/dataset/remote.ts`,
  `src/feedback/submit.ts`) — the preflight script's own fetch calls
  should follow the same pattern rather than an unbounded fetch.

### Integration Points
- Both lint-failing modals (`ReportFeedbackModal.tsx`,
  `ProductFeedbackModal.tsx`) share the identical
  reset-on-visible-effect shape — a fix pattern validated on one should
  transfer directly to the other.
- `eas.json` (current state, post-Phase-23 follow-up): `submit.production
  .ios.ascAppId` = `"6794382182"` (real value, no longer a placeholder);
  `cli.appVersionSource: "remote"`; `build.production.autoIncrement:
  true`. `app.json`'s `ios.infoPlist.ITSAppUsesNonExemptEncryption` =
  `false`. Both files are ready for the first real `eas build`/`eas
  submit` cycle with no further config edits needed.

</code_context>

<specifics>
## Specific Ideas

No particular UI/behavior references — this phase is entirely
release-engineering (lint fix, preflight script, real build/submit,
TestFlight setup), not a user-facing feature.

</specifics>

<deferred>
## Deferred Ideas

- `.eas/workflows/` CI automation for future release cycles — explicitly
  out of scope per REQUIREMENTS.md (one-shot manual build/submit is
  sufficient for a first release).
- Fastlane / manually-managed `.p12` credentials — explicitly out of
  scope; EAS-managed credentials chosen, no fastlane infrastructure to
  build on.
- Push notification capability/entitlement setup — explicitly out of
  scope; no push functionality exists in the app.
- Zod body-shape validation in the preflight script — considered and
  declined (D-03); status-code-only checks are sufficient for this
  phase's narrow smoke-test goal. Could be revisited in a future phase if
  the preflight script needs to catch contract drift, not just liveness.

None of this discussion surfaced any new capability requests — scope
stayed within SHIP-01 through SHIP-05.

</deferred>

---

*Phase: 24-quality-gates-preflight-first-submit*
*Context gathered: 2026-07-24*