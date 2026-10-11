# Requirements: Lafa — Milestone v1.1 Frankfurt API Cutover

**Defined:** 2026-10-11
**Core Value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.
**Hard deadline:** 2026-11-01. If the Oregon service (`https://portuguese-verb-api.onrender.com`) still exists that day, the backend pauses its keep-warm pingers and Frankfurt returns to cold starts.
**Source of truth for what changes:** `../portuguese-verb-backend/docs/mobile-handoff.md` (entries 2026-10-09 and 2026-10-08).

## v1.1 Requirements

### API — Base-URL cutover

- [ ] **API-01**: The content, quiz feedback and product feedback requests all build their URLs from one shared base-URL constant set to `https://portuguese-verb-api-fra.onrender.com` (replaces `src/dataset/remote.ts` `CONTENT_ENDPOINT`, `src/feedback/submit.ts` `FEEDBACK_ENDPOINT`, `src/productFeedback/submit.ts` `PRODUCT_FEEDBACK_ENDPOINT`)
- [ ] **API-02**: A Jest test fails if the Oregon host `portuguese-verb-api.onrender.com` appears anywhere in `src/` or `scripts/`
- [ ] **API-03**: `scripts/preflight.ts` targets Frankfurt, and `npm run preflight` passes against it
- [ ] **API-04**: Nothing in `CLAUDE.md`, `AGENTS.md`, `store/metadata/review-notes.md` or `store/privacy/nutrition-label-answers.md` points at Oregon as the current API

### NET — Timeouts & caching

- [ ] **NET-01**: The content fetch aborts after 15s (was 90s) and falls back to the bundled dataset
- [ ] **NET-02**: Quiz feedback and product feedback submissions abort after 45s (was 90s) and return `network-error`. 45s covers a ~40s Render cold boot and the ~11s product-feedback latency observed in the backend's Frankfurt verification
- [ ] **NET-03**: A test proves the content fetch sends no cache-busting headers or query parameters (no hand-sent `If-None-Match`; iOS `NSURLCache` handles ETag/304 revalidation), and that any non-200 response (including a raw 304) falls back to the local dataset. No production behaviour change

### REL — Release 1.0.1

- [ ] **REL-01**: Lafa 1.0.1 is built by EAS production (build #7+, `appVersionSource: remote` autoIncrement); the build number and EAS build id are recorded
- [ ] **REL-02**: The 1.0.1 build is live on TestFlight and installed by an internal tester; the date is recorded
- [ ] **REL-03**: 1.0.1 is submitted to App Review with updated review notes (Frankfurt URLs), "What's New" text and automatic release on approval; the ASC status strings, timestamps and release option are recorded verbatim in `store/submission-log.md`
- [ ] **REL-04**: 1.0.1 is Ready for Distribution on the App Store; the live date is recorded

### E2E — Real-device verification (TestFlight build, against Frankfurt)

- [ ] **E2E-01**: Content loads from Frankfurt, not the local fallback: the offline pill is absent and the request shows up in the Frankfurt service logs
- [ ] **E2E-02**: A quiz feedback ("Report a problem") submission returns 201, and the row exists in the backend
- [ ] **E2E-03**: A product feedback ("Help us improve") submission returns 201, and the row exists in the backend
- [ ] **E2E-04**: In airplane mode the quiz still completes on the bundled dataset with the offline pill showing, and feedback fails gracefully with a Retry option

### HAND — Backend hand-back

- [ ] **HAND-01**: Once the TestFlight build is live, a status line (version, build number, date) is appended to `../portuguese-verb-backend/docs/mobile-handoff.md` (2026-10-09 entry) so the backend's REGION-05 gate can start
- [ ] **HAND-02**: Once 1.0.1 is live on the App Store, a status line with the Oregon-deletion gate recommendation is appended: delete Oregon once 1.0.1 is live AND (~48h of no real Oregon requests OR 2026-10-30), whichever comes first

### DEBT — v1.0 audit tech debt (droppable; must never block the release)

- [ ] **DEBT-01**: Document that `app.json` `ios.buildNumber` "1" is ignored, because `eas.json` remote autoIncrement is the source of truth
- [ ] **DEBT-02**: `validate-brand` checks pixel colour on the brand PNGs, so a wrong-colour icon fails the gate (audit WR-01)
- [ ] **DEBT-03**: `validate-brand` resolves its paths from the repo root, not the current directory (audit WR-02)
- [ ] **DEBT-04**: `validate-brand` gates the hand-measured Setup lockup crop constants in `app/index.tsx`
- [ ] **DEBT-05**: Fix three documents: the 30-02-SUMMARY Node claim, the 35-06-SUMMARY "not yet closed" ending, and the `ios/` reference in `store/screenshots/README.md`

## Future Requirements

Candidates for a later milestone (not v1.1):

- `POST /events` quiz-completion tracking. The backend supports it; mobile does not send it. Relates to backlog item 999.1 (analytics SDK)
- A custom API domain, so future host moves need no app release
- A minimum-version / update prompt for users stuck on old builds

## Out of Scope

| Feature | Reason |
|---------|--------|
| Any API contract change | Backend contract and response bodies are unchanged; the cutover is host-only |
| Hand-rolled ETag storage / `If-None-Match` | Conflicts with iOS `NSURLCache` and can surface a raw 304 with an empty body (backend handoff 2026-10-08) |
| Keeping an Oregon fallback in 1.0.1 | Would keep Oregon receiving traffic and block its deletion |
| New product features | Deadline matters more than scope |
| Android release work | iOS-first; unchanged from prior milestones |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 36 | Pending |
| API-02 | Phase 36 | Pending |
| API-03 | Phase 36 | Pending |
| API-04 | Phase 36 | Pending |
| NET-01 | Phase 36 | Pending |
| NET-02 | Phase 36 | Pending |
| NET-03 | Phase 36 | Pending |
| E2E-01 | Phase 37 | Pending |
| E2E-02 | Phase 37 | Pending |
| E2E-03 | Phase 37 | Pending |
| E2E-04 | Phase 37 | Pending |
| HAND-01 | Phase 37 | Pending |
| REL-01 | Phase 37 | Pending |
| REL-02 | Phase 37 | Pending |
| HAND-02 | Phase 38 | Pending |
| REL-03 | Phase 38 | Pending |
| REL-04 | Phase 38 | Pending |
| DEBT-01 | Phase 39 | Pending |
| DEBT-02 | Phase 39 | Pending |
| DEBT-03 | Phase 39 | Pending |
| DEBT-04 | Phase 39 | Pending |
| DEBT-05 | Phase 39 | Pending |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22 (Phase 36: 7, Phase 37: 7, Phase 38: 3, Phase 39: 5)
- Unmapped: 0

---
*Requirements defined: 2026-10-11*
