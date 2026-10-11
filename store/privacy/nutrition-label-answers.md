# App Privacy Nutrition Label — Answer Sheet

Paste-ready answers for App Store Connect's App Privacy questionnaire (STORE-03), sourced
per-call against both the mobile client's request contracts and the backend's actual
persistence/logging behavior — not asserted from memory.

## 1. Summary answer

Data **IS** collected: the free-text feedback message a user optionally types into the
in-app "Report a problem" / product-feedback forms, plus the quiz-context fields attached
to that same user-initiated submission.

- **Used for Tracking: No**
- **Data Linked to You: None** — no accounts, no login, no user identifier of any kind
  exists anywhere in this app or its backend (`CLAUDE.md` "Auth Model: None"; confirmed
  again in this plan, no new auth surface added).
- All collected data is classified **Data Not Linked to You**.

## 2. Data-flow mapping table

One row per outbound network call the app makes. There are exactly three. Reused from
`35-RESEARCH.md` §"Pattern 2: Data-flow-to-nutrition-label mapping table", with the
"Server logs" column updated to the post-fix (plan 35-01) state.

| Call | Fields sent (client) | Server persists | Server logs (transient) | Nutrition label category | Linked to you? |
|------|----------------------|------------------|--------------------------|---------------------------|-----------------|
| `POST /feedback` | `message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform` (`src/feedback/payload.ts`) | Same 8 fields plus generated `id`, `createdAt` — no IP/UA/device-id column (`portuguese-verb-backend/prisma/schema.prisma`, `FeedbackReport` model) | Curated `req.log.info({id, verb, tense, subject, platform, appVersion, outcome})` only — no client IP, no client identifiers (post-fix; see §4) | User Content | Not Linked to You |
| `POST /product-feedback` | `category, message, screen, appVersion, platform` (`src/productFeedback/payload.ts`) | Same 5 fields plus generated `id`, `createdAt` — no IP/UA/device-id column (`portuguese-verb-backend/prisma/schema.prisma`, `ProductFeedbackReport` model) | Curated `req.log.info(...)` only — no client identifiers (post-fix; see §4) | User Content | Not Linked to You |
| `GET /content/verbs` | Nothing — no body, no auth header, no identifiers (`src/dataset/remote.ts`: plain `fetch(CONTENT_ENDPOINT, { signal })`, no headers object) | Nothing (read-only endpoint) | Nothing beyond the framework line that plan 35-01 disabled (post-fix; see §4) | — (not applicable, nothing sent) | Data Not Collected |

## 3. Questionnaire answers, field by field

### Selected data type: User Content

- **Data type:** User Content -> **Customer Support** — this is the recommended selection
  for both `POST /feedback` and `POST /product-feedback` (both are user-initiated
  free-text problem reports).
  - **Correction (live-verified at execution time, plan 35-07):** the live App Store
    Connect questionnaire does **not** present "Customer Support" and "Other User Content"
    as an either/or choice as originally assumed above. It presents **both** as separate
    sequential sub-type/purpose screens under the "User Content" group. Both were answered
    identically: **Purpose: App Functionality only** (Third-Party Advertising, Developer's
    Advertising/Marketing, Analytics, Product Personalization, and Other Purposes all left
    unchecked on both screens). See `store/submission-log.md` `## App Privacy` for the
    live-entry record.
  - **Collected:** Yes
  - **Purpose:** App Functionality
  - **Linked to the user's identity:** No
  - **Used for tracking:** No
  - **Rationale:** the free-text `message` field a user voluntarily types into either the
    quiz "Report a problem" modal or the product-feedback modal (`src/feedback/payload.ts`,
    `src/productFeedback/payload.ts`).

### All other Apple data type groups — not collected

| Apple data type | Collected? | One-line evidence |
|---|---|---|
| Contact Info | No | No account/profile/email/phone field anywhere in the app; no login exists (`CLAUDE.md` "Auth Model: None") |
| Health & Fitness | No | App has no health, fitness, or biometric feature surface at all |
| Financial Info | No | No payment, purchase, or financial-account flow exists in the app |
| Location | No | No location permission requested; no `expo-location` or equivalent dependency present |
| Sensitive Info | No | No race, religion, sexual orientation, or similarly sensitive field is ever requested or transmitted |
| Contacts | No | No contacts-list permission requested; no contacts import/export feature exists |
| Browsing History | No | `expo-web-browser` (if present) is not wired to any open/arbitrary browsing feature; no in-app browsing history is recorded (per 35-RESEARCH.md assumption A3) |
| Search History | No | The app has no search feature; verb lookup is a fixed dataset, not a searchable/queried surface |
| Identifiers | No | No advertising identifier, no device identifier, no user identifier is collected or transmitted anywhere in the three network calls above |
| Purchases | No | No in-app purchase, subscription, or store-kit integration exists |
| Usage Data | No (see judgment call below) | No analytics/telemetry SDK exists in the app; the only outbound calls are the three documented above, sent solely in direct response to explicit user action |
| Diagnostics | No | No crash-reporting or performance-monitoring SDK (e.g. Sentry, Crashlytics) is present in either the mobile app or backend dependencies |

### Judgment call to record: quiz-context fields are NOT separately declared as Usage Data

The fields `verb`, `tense`, `subject`, `correctAnswer`, `selectedAnswer` (on
`POST /feedback`) and `category`, `screen` (on `POST /product-feedback`), along with
`appVersion` and `platform` on both, are transmitted **only as attached context of a
user-initiated submission** — they never leave the device except bundled inside a report
the user chose to send by tapping Submit. They are never collected passively, never sent
on a timer, and never sent without an accompanying free-text message action.

- **Recommended answer (what will be entered):** declare these fields as part of the same
  **User Content** submission (§3 above) and do **not** separately declare
  "Usage Data -> Product Interaction".
- **Conservative alternative (documented, not the default):** additionally declare
  **Usage Data -> Product Interaction**, Not Linked to You, purpose App Functionality — if a
  future App Review response or clarified Apple guidance suggests the quiz-context fields
  read as usage/product-interaction data on their own.
- The recommended answer is what will be entered in App Store Connect at execution time
  (plan 35-07) unless the live questionnaire's wording contradicts it — if it does, the
  conservative alternative above should be used instead and this file updated.

## 4. D-09 resolution record

**Original question (D-09):** Does the backend collect or retain client IP addresses, and
if so, does that count as "data collection" for the App Privacy questionnaire?

**Research finding** (`35-RESEARCH.md` §"Backend Data-Retention Investigation"): Fastify's
built-in request logger, enabled by the bare `Fastify({ logger: true })` constructor call
with no `disableRequestLogging` override, unconditionally logged an "incoming request" line
on every request. Fastify's default `req` serializer
(`node_modules/fastify/lib/logger-pino.js`) returns `remoteAddress: req.ip` as part of that
line. This IP-bearing line went only to Render's own rolling platform log stream — it was
never written to the app's Postgres database (no `ip`/`ipAddress`/`remoteAddress` column
exists on either `FeedbackReport` or `ProductFeedbackReport` in
`portuguese-verb-backend/prisma/schema.prisma`), and never exported to any third-party
service (no analytics/observability SDK is present in the backend; `render.yaml` configures
no log-streaming add-on).

**Decision (D-13):** **Option A** — apply the backend fix so the question closes
unconditionally, rather than **Option B** — keeping the pre-fix behavior and documenting a
judgment call that a short-lived platform log line doesn't count as "collection."

**Evidence that Option A was actually applied:**

- File: `portuguese-verb-backend/src/app.ts`
- Exact change: `Fastify({ logger: true, disableRequestLogging: true })` (the
  `disableRequestLogging: true` option was added; `logger: true` was kept so the app's own
  curated `req.log.info`/`warn`/`error` calls — none of which include IP — keep working)
- Commit SHA: `f06c46b` (backend repo, sibling `portuguese-verb-backend`), pushed to
  `origin/main`, per `.planning/phases/35-app-store-connect-readiness/35-01-SUMMARY.md`
- Health check confirmed the deployed service responded `{"status":"ok"}` after the push
  (`35-01-SUMMARY.md`)

**Explicit statement:** Option B (documenting the pre-fix behavior as an acceptable
judgment call without changing the backend) was **NOT** the path taken. Option A was taken
and is confirmed applied to `portuguese-verb-backend/src/app.ts` on `origin/main`.

**On Render's exact log retention window:** this document does not assert a specific
retention duration as verified fact. `35-RESEARCH.md` assumption A2 flags that Render's
exact day-count retention for its rolling platform log stream is not published in Render's
own documentation. This is described here only as "a short, rolling platform-level window,"
and — per the Option A fix above — is now moot regardless of its exact length, since the
IP no longer appears in that stream at all going forward.

## 5. Re-verification triggers

The following changes would invalidate this document and require re-walking the App Store
Connect App Privacy questionnaire before the next submission:

- Adding any analytics, crash-reporting, or attribution SDK to either the mobile app or the
  backend (e.g. Sentry, Crashlytics, Amplitude, Firebase Analytics)
- Adding user accounts, login, sessions, or any persistent user/device identifier
- Adding a new field to the `POST /feedback` or `POST /product-feedback` request payload
- Adding a new outbound network call/endpoint beyond the three documented in §2
- Reverting or removing `disableRequestLogging: true` from
  `portuguese-verb-backend/src/app.ts`
- Adding a third-party log drain, log-streaming add-on, or log export integration to the
  backend's Render service (`render.yaml`)

## 6. Live log verification

**Date checked:** 2026-08-17 (test window `2026-08-17T12:26:37Z`)

**Deployed commit SHA observed:** `f06c46b` — production `HEAD` on the `portuguese-verb-api`
Render service was confirmed to match this SHA (deployed, not just committed to
`origin/main`).

**Health check:** `GET /health` returned `200` on the former Oregon service (the API host at the time of this 2026-08-17 check). The API has since moved to `https://portuguese-verb-api-fra.onrender.com` (v1.1, Phase 36); this record was not re-run against the new host.

**Requests issued during the verification window:**
- `GET /content/verbs` -> `200`
- `POST /feedback` -> `201` (created record `id: cmsx7k5k200001sfier4671f3`)

**Observed result:** Render's live log stream for that window shows no Fastify
`"incoming request"` / `"request completed"` lines and no `remoteAddress`/`ip` field
anywhere. The one curated application log line emitted for the `POST /feedback` call
contains only the documented non-identifying field set
(`id`/`verb`/`tense`/`subject`/`platform`/`appVersion`/`outcome`) — no IP, no user agent,
no other client identifier.

**Conclusion:** The Option A fix (`disableRequestLogging: true`,
`portuguese-verb-backend/src/app.ts`, commit `f06c46b`) is confirmed live in production, not
just in source. The D-09 claim in §4 is now production-verified, not source-level only.

**Non-blocking observation:** Render's logs for this window also show a Fastify
deprecation warning stating that the top-level `disableRequestLogging` option is deprecated
in favor of `logController`/`isLogDisabled` and will be removed in Fastify 6. The option is
still fully functional today and this does not affect the verification above; it is worth
migrating to the newer API before any future Fastify 6 upgrade, but is not a blocker for
this nutrition-label claim (consistent with the same observation already recorded in
`35-01-SUMMARY.md`).
