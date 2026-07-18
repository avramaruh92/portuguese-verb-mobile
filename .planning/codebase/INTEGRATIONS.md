# External Integrations

**Analysis Date:** 2026-07-18

## APIs & External Services

**Feedback submission:**
- `portuguese-verb-api` backend (live, hosted at `https://portuguese-verb-api.onrender.com`) - the only user-write integration in the app
  - Endpoint: `POST https://portuguese-verb-api.onrender.com/feedback`
  - Implementation: `src/feedback/submit.ts` (`submitFeedback` function), invoked from `src/feedback/ReportFeedbackModal.tsx`
  - Client: native `fetch` (no SDK/client library), wrapped with a 90-second timeout via `AbortController` (`TIMEOUT_MS = 90_000`)
  - Request body schema mirrored client-side in `src/feedback/schema.ts` (Zod) and built via `src/feedback/payload.ts` (`buildFeedbackPayload`): `message`, `verb`, `tense`, `subject`, `correctAnswer`, `selectedAnswer`, `appVersion`, `platform`
    - `tense` enum sourced from `TENSES` in `src/dataset/types.ts`
    - `subject` enum sourced from `SUBJECTS` in `src/dataset/types.ts`
    - `platform` enum hardcoded as `z.enum(["ios", "android"])` in `src/feedback/schema.ts`
  - Response handling (`src/feedback/submit.ts`): `201` → `{ status: "success", data }` (parses returned persisted row); `400` → `{ status: "validation-error" }`; any other status → `{ status: "server-error" }`; network/timeout failure (fetch throw) → `{ status: "network-error" }`
  - Auth: none — endpoint is unauthenticated, no API key or token sent
  - UI surface: `src/feedback/ReportFeedbackModal.tsx` - a modal presented from the quiz screen (`app/quiz.tsx`) that lets a user pick a feedback reason (`src/feedback/reasons.ts`), add optional free text, and submit; shows submitting/success/error states and offers retry on `server-error`/`network-error`

**Content/dataset fetch:**
- `portuguese-verb-api` backend - a second, read-only integration used to fetch the verb dataset remotely, with local fallback
  - Endpoint: `GET https://portuguese-verb-api.onrender.com/content/verbs`
  - Implementation: `src/dataset/remote.ts` (`fetchRemoteVerbs` function)
  - Client: native `fetch`, wrapped with the same 90-second `AbortController` timeout pattern as feedback submission
  - Response is expected to be `{ verbs: Verb[] }`; the `verbs` array is validated at runtime against the same dataset schema used for the bundled local dataset (`src/dataset/validate.ts`'s `validateDataset`) before being accepted
  - On any failure (non-OK response, malformed payload, validation failure, network error, or timeout), the caller falls back to the bundled local dataset — see `src/dataset/source.ts` (`resolve()` function): tries `fetchRemoteVerbs()` first, catches any error, and falls back to `verbs` from `src/dataset/verbs.ts`
  - Result is cached in-memory for the app session via `src/dataset/source.ts`'s module-level `cachedResult` promise, with a `prefetch()` call triggered from `app/_layout.tsx` on app start
  - UI surface: `src/components/OfflinePill.tsx` - reads the resolved dataset source (`"remote"` vs `"local"`) via `resolveVerbs()` and renders a "Using saved content" pill (`OFFLINE_PILL_TEXT`) when the source was `"local"` (i.e., the remote fetch failed and the local bundled dataset was used)

**Note on cross-repo assumptions:** `CLAUDE.md` in this repo states the mobile app "holds a local, offline verb dataset for quiz play — it does not fetch quiz content from any backend" and that "there is currently no content-serving API." The actual code in `src/dataset/remote.ts` and `src/dataset/source.ts` contradicts this: the app does attempt a remote `GET /content/verbs` fetch on startup and only falls back to the bundled local dataset if that fetch fails or the response is invalid. Treat the CLAUDE.md description of dataset sourcing as stale relative to the current implementation; `POST /feedback` remains the only integration matching CLAUDE.md's original scope, and `GET /content/verbs` is an additional integration not currently documented at the repo root.

## Data Storage

**Databases:**
- None — the app holds no database client and no direct database connection. All backend interaction is via the two HTTP endpoints above.

**File Storage:**
- Local filesystem only (bundled static assets referenced in `app.json`, e.g. `./assets/images/icon.png`, splash images). No cloud file storage integration.

**Caching:**
- In-memory only: `src/dataset/source.ts` caches the resolved verb dataset promise (`cachedResult`) for the lifetime of the app process. No disk-based cache (no AsyncStorage, no `expo-file-system` usage found in `src/`).

## Authentication & Identity

**Auth Provider:**
- None. No login, accounts, or sessions anywhere in the app (confirmed by absence of any auth-related package, e.g. no Supabase client, no OAuth library, no token storage) and consistent with `CLAUDE.md`'s stated auth model.

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Bugsnag, or similar crash/error reporting SDK in `package.json` dependencies.

**Logs:**
- No structured logging library found. Error states surface only through in-app UI state (e.g., `ReportFeedbackModal`'s `state === "error"` branch) rather than being sent to any remote logging service.

## CI/CD & Deployment

**Hosting:**
- Backend API is hosted on Render (`https://portuguese-verb-api.onrender.com`), per the endpoint hostname — this is the sibling `portuguese-verb-api` repo's deployment, not something this mobile repo controls.
- No `eas.json` found in this repo — no EAS Build/Submit configuration for iOS/Android app store deployment yet.

**CI Pipeline:**
- No CI config directory found (no `.github/workflows/` observed in the file listing) — no automated CI pipeline detected in this repo as of this analysis.

## Environment Configuration

**Required env vars:**
- None detected. Both backend endpoints (`https://portuguese-verb-api.onrender.com/feedback` and `https://portuguese-verb-api.onrender.com/content/verbs`) are hardcoded string constants in `src/feedback/submit.ts` and `src/dataset/remote.ts` respectively, not read from environment variables or Expo config (`app.json` `extra` field is not used for this).

**Secrets location:**
- Not applicable — the app holds no credentials, API keys, or secrets of any kind (no Supabase keys, no auth tokens). This matches `CLAUDE.md`'s constraint that the app "never embeds Supabase credentials or connection strings."

## Webhooks & Callbacks

**Incoming:**
- None — this is a client-only mobile app with no server component receiving callbacks.

**Outgoing:**
- None beyond the two direct HTTP calls documented above (`POST /feedback`, `GET /content/verbs`); no webhook-style fire-and-forget notification pattern found.

## Native Platform Integrations

**Sharing:**
- React Native core `Share` API (`import { Share } from "react-native"`) - used in `app/results.tsx` to open the native iOS/Android share sheet with a plain-text score message built by `buildShareMessage` in `src/quiz/share.ts` (e.g. `"I scored 8/10 on Portuguese Verb Quiz!"`)
- No `expo-sharing` usage found in `src/` or `app/` despite the package convention notes in project docs recommending against it for plain-text use — confirmed not imported anywhere in the current codebase.

**App version / device info:**
- `expo-constants` (`Constants` from `expo-constants`) - imported in `app/quiz.tsx`, used to source the app version value passed as `appVersion` in feedback payloads (via `buildFeedbackPayload`). No other `expo-constants` usage found elsewhere.
- `expo-device` is present in `package.json` dependencies but not imported anywhere in `src/` or `app/` — installed but currently unused.

**Analytics:**
- None detected — no analytics SDK (e.g., Amplitude, Mixpanel, Firebase Analytics) present in `package.json` or imported in source.

---

*Integration audit: 2026-07-18*
