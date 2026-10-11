# Phase 35: App Store Connect Readiness - Pattern Map

**Mapped:** 2026-08-17
**Files analyzed:** 10 (9 new, 1 modified in this repo; 1 modified in sibling repo)
**Analogs found:** 7 / 10 (3 are pure new-content files with no direct code analog — style guidance only)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `app.json` (modify — add `ios.supportsTablet: false`) | config | request-response (build config) | `app.json` itself (existing `ios` block) | exact (self-modification) |
| `../portuguese-verb-backend/src/app.ts` (modify — add `disableRequestLogging: true` or custom serializer) | config/middleware | request-response | `src/app.ts` itself (existing `Fastify({ logger: true })` init) | exact (self-modification) |
| `store/metadata/description.md` | config/documentation | batch (static copy) | `.planning/.continue-here.md`, `.planning/milestones/*.md` | role-match (doc-style prose, not code) |
| `store/metadata/subtitle.txt` | config/documentation | batch | none (plain text, no analog needed) | no-analog |
| `store/metadata/keywords.txt` | config/documentation | batch | none (plain text, no analog needed) | no-analog |
| `store/metadata/review-notes.md` | config/documentation | batch | `CLAUDE.md` §"Key Domain Facts" (network-call enumeration style) | role-match |
| `store/privacy/nutrition-label-answers.md` | config/documentation | batch/transform (data-flow → label mapping) | Backend route handlers' curated-field logging pattern (`src/routes/feedback/routes.ts`, `src/routes/product-feedback/routes.ts`) — as the *source of truth* for the mapping table, not a style analog | role-match (content source) |
| `store/screenshots/README.md` | config/documentation | batch | `scripts/validate-brand.ts` (checklist/constant style) | partial (checklist framing only) |
| `docs/support.html` | component (static page) | request-response (served page) | none in-repo (first HTML file in this repo) | no-analog |
| `docs/privacy.html` | component (static page) | request-response (served page) | `docs/support.html` (sibling file, same phase) | exact (once support.html exists) |

## Pattern Assignments

### `app.json` (config, request-response)

**Analog:** `app.json` itself — existing `ios` block, this repo, lines 9-15

**Current state** (verified via direct read):
```json
"ios": {
  "bundleIdentifier": "com.avram.aruh.lafa",
  "buildNumber": "1",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

**Pattern to apply:** Add `"supportsTablet": false` as a top-level sibling key inside the `ios` object, alongside `bundleIdentifier`/`buildNumber` — same flat-key style already used for `infoPlist.ITSAppUsesNonExemptEncryption`. No nesting needed; `supportsTablet` is a direct Expo `ios` config key, not an `infoPlist` key.

**Resulting shape:**
```json
"ios": {
  "bundleIdentifier": "com.avram.aruh.lafa",
  "buildNumber": "1",
  "supportsTablet": false,
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

**Verification pattern:** Follow existing repo convention — after any `app.json` edit, run `npm run typecheck` and `npm test` (both pass with config-only changes; no code path reads `supportsTablet` at runtime other than the native build). No `__tests__/` coverage expected for a config-only key per this repo's `TESTING.md` convention (business-logic-only unit tests).

---

### `../portuguese-verb-backend/src/app.ts` (config/middleware, request-response)

**Analog:** `src/app.ts` itself (sibling repo), full file (31 lines), read in full this session

**Full current file:**
```typescript
import Fastify from "fastify";
import { ZodError } from "zod";
import { feedbackRoutes } from "./routes/feedback/routes.js";
import { contentRoutes } from "./routes/content/routes.js";
import { productFeedbackRoutes } from "./routes/product-feedback/routes.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(feedbackRoutes);
  app.register(contentRoutes);
  app.register(productFeedbackRoutes);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const { fieldErrors } = error.flatten();
      request.log.warn(
        { fields: Object.keys(fieldErrors) },
        "feedback validation failed",
      );
      return reply.code(400).send({ error: "ValidationError", fields: fieldErrors });
    }

    request.log.error({ err: error }, "unhandled error");
    return reply.code(500).send({ error: "InternalServerError" });
  });

  return app;
}
```

**Fix pattern (Option A from RESEARCH.md, recommended):** Change the `Fastify({ logger: true })` call to disable the built-in per-request logging that captures `remoteAddress` via Fastify's default `req` serializer (`node_modules/fastify/lib/logger-pino.js:53`):

```typescript
const app = Fastify({ logger: true, disableRequestLogging: true });
```

This is a single-line change to the existing `buildApp()` function — no new imports, no new files, no structural change. It preserves `logger: true` (so `req.log.info(...)` calls in `src/routes/feedback/routes.ts` and `src/routes/product-feedback/routes.ts` — the deliberately curated, non-IP-bearing log calls — keep working exactly as-is), while suppressing Fastify's automatic "incoming request"/"request completed" log lines that embed `req.ip`.

**Note for planner:** this file lives in the sibling repo (`portuguese-verb-api` / `portuguese-verb-backend`), not this repo's `src/`. Scope this as a cross-repo task with its own verification (sibling repo's own test suite / manual curl + log inspection), not bundled into this repo's `npm test`/`typecheck`/`lint` gates.

**Existing curated-logging pattern to preserve (do not touch), for reference — `src/routes/feedback/routes.ts` lines 1-23:**
```typescript
import type { FastifyInstance } from "fastify";
import { SubmitFeedbackSchema } from "./contracts.js";
import { submitFeedback } from "./handler.js";

export async function feedbackRoutes(app: FastifyInstance) {
  app.post("/feedback", async (req, reply) => {
    const input = SubmitFeedbackSchema.parse(req.body);
    const result = await submitFeedback(input);
    req.log.info(
      {
        id: result.id,
        verb: input.verb,
        tense: input.tense,
        subject: input.subject,
        platform: input.platform,
        appVersion: input.appVersion,
        outcome: "success",
      },
      "feedback submitted",
    );
    return reply.code(201).send(result);
  });
}
```
This confirms the app-level log calls never include IP/UA — only Fastify's framework-default request logger does, which is exactly what `disableRequestLogging: true` suppresses.

---

### `store/metadata/description.md`, `store/metadata/review-notes.md` (config/documentation, batch)

**Analog:** `CLAUDE.md` §"Key Domain Facts" (this repo, root) — the existing convention for enumerating exact network-call contracts in prose+list form, and `.planning/.continue-here.md` for terse, factual status-doc tone.

**Pattern to apply:** Plain Markdown, no frontmatter, short declarative sentences, backtick-quoted field/endpoint names exactly as they appear in code (e.g. `` `POST /feedback` ``, `` `message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform` ``) — mirrors how `CLAUDE.md` documents the feedback contract. `review-notes.md` must enumerate all **three** network calls per RESEARCH.md's finding (`POST /feedback`, `POST /product-feedback`, `GET /content/verbs`) — do not under-count to the two implied by `CLAUDE.md`'s stale framing.

**description.md must state three facts explicitly (D-06):** free, no account/login, European Portuguese (not Brazilian) — phrase these as short, direct sentences per D-05's "direct & functional" tone, no marketing adjectives (matches the project's existing no-gamification, plain-copy convention visible throughout `CLAUDE.md` and `PROJECT.md`).

---

### `store/privacy/nutrition-label-answers.md` (config/documentation, batch/transform)

**Analog/source-of-truth:** RESEARCH.md's "Pattern 2: Data-flow-to-nutrition-label mapping table" (already fully drafted in `.planning/phases/35-app-store-connect-readiness/35-RESEARCH.md` lines 269-278) — reuse this exact table verbatim as the file's backbone, plus the Option A/B reasoning from the "Backend Data-Retention Investigation" section (lines 83-114).

**Pattern to apply:**
```markdown
| Call | Fields sent (client) | Server persists | Server logs (transient) | Nutrition label category | Linked to you? |
|------|----------------------|------------------|--------------------------|---------------------------|-----------------|
| `POST /feedback` | `message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform` | Same fields, `id`, `createdAt` (no IP/UA) | Client IP (Fastify default; suppressed if Option A fix applied) | User Content | Not Linked to You |
| `POST /product-feedback` | `category, message, screen, appVersion, platform` | Same fields, `id`, `createdAt` (no IP/UA) | Client IP (same) | User Content | Not Linked to You |
| `GET /content/verbs` | (no body, no auth, no identifiers) | Nothing (read-only) | Client IP (same) | — | Data Not Collected |
```
Document which option (A: backend fix applied, or B: judgment-call fallback) was actually taken, referencing whether the sibling-repo `src/app.ts` change landed before submission.

---

### `store/screenshots/README.md` (config/documentation, batch)

**Analog:** `scripts/validate-brand.ts` (this repo, `scripts/`) — not for its TypeScript code, but for its checklist/constant-driven verification style (named constants for exact expected dimensions, explicit pass/fail framing). Mirror that precision in prose form:

```
scripts/validate-brand.ts lines 1-18 pattern (constants-as-spec):
const CANVAS_PX = 1024;
const LOCKUP_WIDTH_PX = 3200;
const LOCKUP_HEIGHT_PX = 1040;
```

**Pattern to apply in the README:** State exact required dimensions (1320×2868 per STORE-06/RESEARCH.md), the 3 required filenames/states (`01-setup.png`, `02-quiz-locked.png`, `03-results.png`), device (iPhone 16 Pro Max or equivalent 6.9" simulator), and the capture command from RESEARCH.md's Code Examples section:
```bash
xcrun simctl io booted screenshot store/screenshots/01-setup.png
```

---

### `docs/support.html`, `docs/privacy.html` (component/static page, request-response)

**Analog:** None in-repo (first HTML files) — no existing HTML template to copy structurally. Use minimal semantic HTML5, no framework/build step (GitHub Pages "Deploy from branch" requires plain static files per RESEARCH.md's GitHub Pages Setup Mechanics section).

**Pattern to apply (from RESEARCH.md D-01/D-02/D-03 + GitHub Pages Setup Mechanics):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lafa - Support</title>
</head>
<body>
  <h1>Lafa Support</h1>
  <p>For help, questions, or feedback, contact us at
    <a href="mailto:aruhicen@gmail.com">aruhicen@gmail.com</a>.
  </p>
</body>
</html>
```
`docs/privacy.html` follows the identical skeleton (same `<head>`/contact-link structure), with the privacy policy body text and the same `mailto:aruhicen@gmail.com` contact link per D-03. Both files must land in a `docs/` folder at repo root (not `.planning/`), committed to `main`, before GitHub Pages can be enabled per the exact `gh api` command documented in RESEARCH.md:
```bash
gh api repos/avramaruh92/portuguese-verb-mobile/pages -X POST \
  -f "source[branch]=main" -f "source[path]=/docs"
```
Resulting URLs: `https://avramaruh92.github.io/portuguese-verb-mobile/support.html` and `.../privacy.html`.

---

## Shared Patterns

### No-code-coupling documentation tier
**Source:** RESEARCH.md's "Pattern 1: Store artifacts as pure documentation, zero code coupling" + this repo's existing `.planning/` convention (versioned Markdown, never imported by build tooling)
**Apply to:** All `store/**` files
```
store/ contains no code, is never imported by any build tool, and is not
referenced by eas.json. Matches this project's existing convention of
keeping process artifacts under version control (e.g. .planning/milestones/).
```

### Config-key-only modification (no new abstraction)
**Source:** `app.json`'s existing `ios` block structure
**Apply to:** `app.json` (`supportsTablet`) and sibling repo's `src/app.ts` (`disableRequestLogging`)
```
Both fixes are single flat-key additions to an existing object literal —
no new files, no new functions, no structural refactor. Preserve every
existing key exactly as-is; add only the one new key each requires.
```

### Cross-repo network-call enumeration (must total three, not two)
**Source:** `CLAUDE.md` §"Key Domain Facts" (currently documents only `POST /feedback`) cross-checked against `src/productFeedback/` (this repo) and backend's `ProductFeedbackReport` model + `contentRoutes` (sibling repo)
**Apply to:** `store/metadata/review-notes.md`, `store/privacy/nutrition-label-answers.md`
```
Any file enumerating "what the app talks to the backend for" must list all
three real calls: POST /feedback, POST /product-feedback, GET /content/verbs.
CLAUDE.md's framing is stale (mentions only /feedback) — do not copy that
omission into new store/ artifacts.
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `store/metadata/subtitle.txt` | config/documentation | batch | Plain single-line text file, no code/structure to model — just write ≤30 chars per D-05/D-06 tone |
| `store/metadata/keywords.txt` | config/documentation | batch | Plain comma-separated text file, ≤100 chars, no structural analog needed |
| `docs/support.html` | component (static page) | request-response | First HTML file in this repo; built directly from RESEARCH.md's Code Examples skeleton rather than an in-repo analog |

## Metadata

**Analog search scope:** This repo root (`app.json`, `eas.json`, `scripts/validate-brand.ts`, `.planning/*.md`, `CLAUDE.md`), sibling repo `/Users/avi/portuguese-verb/portuguese-verb-backend` (`src/app.ts`, `src/routes/feedback/routes.ts`)
**Files scanned:** 9 (5 this repo, 4 sibling repo, per direct `Read`/`cat` in this session and prior RESEARCH.md investigation)
**Pattern extraction date:** 2026-08-17
