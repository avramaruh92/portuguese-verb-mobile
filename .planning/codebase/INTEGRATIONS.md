---
last_mapped_commit: 94ea956
---

# External Integrations

**Analysis Date:** 2026-10-14

## Summary

The app has exactly one external service: the companion backend `portuguese-verb-api`, hosted on Render (Frankfurt region). It makes three network calls in app code plus one health probe in a dev script. There is no database client, no auth provider, no analytics, no push, and no webhook surface on the device. Everything is plain `fetch` over HTTPS.

## APIs & External Services

**Backend API (companion repo `portuguese-verb-api`, sibling `portuguese-verb-backend` on GitHub):**
- Base URL: `https://portuguese-verb-api-fra.onrender.com`
  - Defined once in `src/config/api.ts` as `API_BASE_URL`
  - `scripts/preflight.ts` repeats the literal (Node type stripping cannot import `src/config/api.ts`)
  - Former Oregon host (`portuguese-verb-api.onrender.com`) is forbidden. `__tests__/api-host-guard.test.ts` fails if it appears in `src/`, `scripts/`, `app/`, `app.json`, `package.json`, or `eas.json`.
- SDK/Client: none. Plain `fetch` with `AbortController`.
- Auth: none. No headers, no tokens, no cookies. No login or accounts.

**Endpoints the app calls:**

| Method | Path | Caller | Timeout | Purpose | Success | Failure handling |
|---|---|---|---|---|---|---|
| GET | `/content/verbs` | `src/dataset/remote.ts` (`fetchRemoteVerbs`) | 15s | Verb dataset plus optional learning content | `200`, body `{ verbs, learning? }` | Any throw falls back to bundled dataset (see Content Source below) |
| POST | `/feedback` | `src/feedback/submit.ts` (`submitFeedback`) | 45s | Quiz-question problem report | `201` returns persisted row (`id`, `createdAt` plus payload) | `400` maps to `validation-error`, anything else to `server-error`, thrown/aborted to `network-error`. No retry from the app layer. |
| POST | `/product-feedback` | `src/productFeedback/submit.ts` (`submitProductFeedback`) | 45s | General bug/idea/other report | `201` returns persisted row | Same mapping as `/feedback` |
| GET | `/health` | `scripts/preflight.ts` only | 90s overall abort | Dev smoke check; not called by the app | `200` | Script exits `1` on failure |

Note: `CLAUDE.md` says the mobile app calls only `POST /feedback` and `GET /content/verbs`. That is stale. `POST /product-feedback` is live. `src/productFeedback/ProductFeedbackModal.tsx` is mounted on `app/index.tsx`, `app/quiz.tsx`, and `app/results.tsx` (screen values `setup`, `quiz`, `results`).

### `GET /content/verbs` details

- Request: plain `fetch(CONTENT_ENDPOINT, { signal })`, no body, no headers object.
- Response handling in `src/dataset/remote.ts`:
  1. `!response.ok` throws `content fetch failed: <status>`
  2. `payload.verbs` must be an array, else throws
  3. `validateDataset(payload.verbs)` (`src/dataset/validate.ts`, Zod) must be valid, else throws
  4. `LearningContentSchema.safeParse(payload.learning)` (`src/learning/schema.ts`). A failure is non-fatal: `learning` becomes `undefined` and the verbs still load.
- Contract fixture: `__tests__/fixtures/content-verbs-v0.4.sample.json` (50 verbs, `learning.version` 1). Exercised by `__tests__/contract-fixture.test.ts`.

### `POST /feedback` request contract

Built by `src/feedback/payload.ts`, validated by type only in `src/feedback/schema.ts`:

| Field | Type / enum |
|---|---|
| `message` | string, min 1 |
| `verb` | string, min 1 |
| `tense` | `present_indicative \| preterite \| imperfect \| future` (from `TENSES` in `src/dataset/types.ts`) |
| `subject` | `eu \| tu \| ele_ela \| nos \| voces \| eles_elas` (from `SUBJECTS` in `src/dataset/types.ts`) |
| `correctAnswer` | string, min 1 |
| `selectedAnswer` | string, min 1 |
| `appVersion` | string, min 1 (from `Constants.expoConfig?.version`) |
| `platform` | `ios \| android` |

The `tense`/`subject`/`platform` literals were chosen by the backend team. The app reuses the dataset constants, so they match the quiz UI. The backend-side verification is still open per `CLAUDE.md`.

### `POST /product-feedback` request contract

Built by `src/productFeedback/payload.ts` (`message` is trimmed), schema in `src/productFeedback/schema.ts`:

| Field | Type / enum |
|---|---|
| `category` | `bug \| idea \| other` (labels in `src/productFeedback/categories.ts`) |
| `message` | string, 1 to 2000 chars |
| `screen` | `setup \| quiz \| results` (`SCREENS` in `src/productFeedback/types.ts`) |
| `appVersion` | string, 1 to 20 chars |
| `platform` | `ios \| android` |

### Feedback reasons (client-side only)

`src/feedback/reasons.ts` defines the reason picker shown in `src/feedback/ReportFeedbackModal.tsx`: `wrong_answer | typo | confusing | other`. The reason is not a separate field on the wire. `buildFeedbackPayload` in `src/feedback/payload.ts` prefixes the label to the free text (`"<Reason label>: <free text>"`, or the label alone when free text is blank), and that combined string is sent as `message`.

## Content Source (Remote-first, Bundled Fallback)

Not an external service, but it is the app's main data dependency:

- Bundled dataset: `src/dataset/verbs.ts` (hand-authored `Verb[]`, used as the offline fallback and as the default in `src/quiz/engine.ts`). It has no learning block, so `learning` is `undefined` in the local case.
- Resolver: `src/dataset/source.ts`
  - `prefetch()` is called once from `app/_layout.tsx` on mount
  - `resolveVerbs()` returns `{ verbs, source: "remote" | "local", learning }`
  - Module-level `cachedResult` memoizes the first resolution
  - When the settled source is `local`, a single background `fetchRemoteVerbs()` retry runs on the next `resolveVerbs()` call (stale-while-revalidate). A remote result is never re-fetched.
- Snapshot rule: `src/store/useQuizStore.ts` snapshots verbs and source at `startQuiz`, so a mid-session refresh cannot change questions.
- UI signal: `src/components/OfflinePill.tsx` shows "Using saved content" when `source === "local"`.

## Data Storage

**Databases:**
- None on the device. No ORM, no SQLite, no Realm.
- Backend persistence is owned by `portuguese-verb-api` (Postgres via Prisma, per `store/privacy/nutrition-label-answers.md`). The mobile app has no connection string and no database credential.

**File Storage:**
- Local filesystem only for bundled assets (`assets/`). No upload path. No `expo-file-system` in app code.

**Caching:**
- In-memory only: Zustand `useQuizStore` (`src/store/useQuizStore.ts`) and the module-level dataset promise in `src/dataset/source.ts`.
- No HTTP cache layer, no persistent cache. The dataset is re-fetched on each cold start.

## Authentication & Identity

- Auth provider: none. No login, accounts, sessions, or user IDs. Requests carry no identifier.
- Device identifiers: none collected (`expo-device` is installed but not imported).

## Monitoring & Observability

- Error tracking: none in the app. No Sentry, Crashlytics, or similar.
- Analytics: none. No usage telemetry SDK.
- Logs: none in app code. `console.log` is not used in `src/` or `app/`.
- Backend logs (cross-repo, for reference): request logs disabled via `disableRequestLogging: true` in `portuguese-verb-backend/src/app.ts` (commit `f06c46b`, per `store/privacy/nutrition-label-answers.md`).

## CI/CD & Deployment

**Mobile app build and release:**
- Expo Application Services (EAS). Project id `88aa092c-033c-4bcc-bf53-450c721977e8` in `app.json` `extra.eas.projectId`.
- Build profiles in `eas.json`: `development` (dev client, internal), `preview` (internal), `production` (`autoIncrement`, Node 22.23.2).
- Version source: `appVersionSource: "remote"` (EAS owns the build number).
- Submit: `submit.production.ios.ascAppId` `6794382182` (App Store Connect app id).
- Distribution: Apple App Store Connect. `store/submission-log.md` records v1.0.0 (build #6) entered in App Store Connect on 2026-08-17.

**Backend hosting:**
- Render, Frankfurt region, service host `portuguese-verb-api-fra.onrender.com`. Health endpoint `/health`.

**Static pages:**
- GitHub Pages under `avramaruh92.github.io/portuguese-verb-mobile/` serving `support.html` and `privacy.html` (sources in `docs/`). These URLs are the App Store Connect support and privacy URLs.

**CI Pipeline:**
- None detected. No `.github/workflows/`, no other CI config in the repo root.

## Environment Configuration

**Required env vars:**
- None. No `.env` files exist. No `EXPO_PUBLIC_*` or `process.env` usage in app code.

**Hardcoded configuration:**
- Backend base URL: `src/config/api.ts`
- Timeouts: `src/dataset/remote.ts` (15s), `src/feedback/submit.ts` (45s), `src/productFeedback/submit.ts` (45s)
- Preflight endpoints and budgets: `scripts/preflight.ts` (content budget 15s, feedback budget 45s)

**Secrets location:**
- No secrets in the app. The mobile client never holds Supabase credentials or any backend token. Any secret belongs to the backend repo only.
- EAS credentials (Apple signing) are managed by EAS, not stored in the repo.

## Preflight Smoke Test

`npm run preflight` (`scripts/preflight.ts`) runs four sequential checks against the live backend and exits `1` if any fails:

1. `GET /health` expects `200` within 90s (absorbs a Render cold boot)
2. `GET /content/verbs` expects `200` within 15s
3. `POST /feedback` with a dummy payload expects `201` within 45s
4. `POST /product-feedback` with a dummy payload expects `201` within 45s

The preflight writes to the live backend and creates real rows tagged with the message `preflight smoke test — ignore`.

## Native Platform Integrations (no network)

- Score sharing: React Native `Share` API in `app/results.tsx`, with the message from `src/quiz/share.ts`. Hands off to the OS share sheet. No network from the app.
- Deep links: URL scheme `lafa` (`app.json` `scheme`). No deep-link handler is implemented in app code, and `expo-linking` is not imported.
- Status bar and system UI: `expo-status-bar` and `expo-system-ui` in `app/_layout.tsx`.
- Platform detection: `Platform.OS` in `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`.
- Native exit confirmation: `Alert` in `app/quiz.tsx`.

## Webhooks & Callbacks

**Incoming:**
- None. The app exposes no server endpoint and receives no webhooks.

**Outgoing:**
- `POST /feedback` and `POST /product-feedback` only, both user-initiated from a modal.

## Data Sent Off-device

Only the three app-initiated calls above leave the device:
- `GET /content/verbs`: no payload, no identifiers.
- `POST /feedback`: the 8 fields listed above.
- `POST /product-feedback`: the 5 fields listed above.

No analytics, identifiers, or location are sent. `store/privacy/nutrition-label-answers.md` declares User Content (App Functionality, not linked to user, not used for tracking) as the only collected data type.

---

*Integration audit: 2026-10-14*
