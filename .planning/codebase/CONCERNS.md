---
last_mapped_commit: 94ea956
analysis_date: 2026-10-14
focus: concerns
---

# Codebase Concerns

**Analysis Date:** 2026-10-14

Scope: full repo at `94ea956`. Verified against current code: `npm run typecheck` is clean, `npx jest` passes (23 suites, 277 tests), and `npx eslint app src __tests__` reports 0 errors and 20 warnings (all `require()` imports in `__tests__/`). Backend host is `src/config/api.ts` (`https://portuguese-verb-api-fra.onrender.com`), with a 15s content timeout and 45s feedback timeouts. Older Oregon-host and 90s-timeout notes are stale and are not repeated here.

Priority summary:
1. An empty or undersized remote dataset is accepted with no fallback, so the core quiz loop breaks for every learner (High).
2. Product feedback has no input cap, so messages over the backend's 2000-char limit get a generic failure (Medium).
3. Feedback Retry can create duplicate rows (accepted risk, still open) (Medium).
4. Accessibility is largely unlabelled on the quiz path (Medium).
5. Failures are silent: no error reporting, and a bad `learning` payload drops explanations without a trace (Medium).
6. Test coverage stops at pure logic. Modals, screens and the quit-quiz flow have no tests (Medium).
7. Open, non-blocking review items from phases 36 and 39 (Low).

---

## Tech Debt

**Remote dataset accepted without a minimum size (no fallback on empty or undersized content):**
- Issue: `validateDataset` only checks each entry's shape. It never checks how many verbs there are. `resolve()` treats any remote payload that passes validation as `source: "remote"`, even an empty `verbs: []`. `generate()` then throws `InsufficientVerbsError` (`pool.length < count`, `src/quiz/engine.ts:44-46`), and `startQuiz` shows "Not enough verbs for that combination" (`src/store/useQuizStore.ts:76-86`). The bundled fallback is never used.
- Files: `src/dataset/validate.ts` (no `.min()` on the array, `validateDataset` lines 29-46), `src/dataset/remote.ts` (lines 28-40 accept any array), `src/dataset/source.ts` (`resolve()` lines 21-28, no fallback on a bad-but-valid payload), `src/store/useQuizStore.ts` (lines 74-88)
- Impact: a backend misconfiguration (an empty content table, a bad deploy, or a truncated payload) blocks quiz start for every learner. This goes against the CLAUDE.md rule that feedback and content must never block the offline core loop. No test covers an empty or undersized remote payload (`__tests__/dataset-remote.test.ts` has no such case).
- Fix approach: in `src/dataset/source.ts` `resolve()` (and in the background refresh), treat a remote result as failed when it cannot produce a quiz. Minimum: `verbs.length >= 1`. Better: check that the eligible triple pool for every tense/verb-mode combination is at least `QUESTIONS_PER_SESSION` (10), or use a documented floor constant. Fall back to `localVerbs` in that case. Add tests for `verbs: []` and for a payload with fewer verbs than the floor, in `__tests__/dataset-source.test.ts`.

**Duplicated feedback submission and modal code:**
- Issue: `src/feedback/` and `src/productFeedback/` have near-identical `submit.ts` files (same timeout, same status mapping, same `SubmitResult` type declared twice in `src/feedback/types.ts` and `src/productFeedback/types.ts`). `ReportFeedbackModal.tsx` (283 lines) and `ProductFeedbackModal.tsx` (275 lines) duplicate the whole state machine (`idle/submitting/success/error`, the `prevVisible` reset, the auto-close timer, retry logic).
- Files: `src/feedback/submit.ts`, `src/productFeedback/submit.ts`, `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`
- Impact: every change (idempotency, a new status, a timeout change, a fix for the empty-input case) has to be made twice. Drift is already visible: only the product modal disables Submit on empty text.
- Fix approach: extract a shared `postJson(endpoint, payload, timeoutMs)` helper and a shared `useSubmitState` hook. Keep the two domain-specific payload builders and schemas separate.

**Silent drop of learning content:**
- Issue: `remote.ts` parses `payload.learning` with `safeParse` and silently sets `learning` to `undefined` on failure (`src/dataset/remote.ts:37-38`). Explanations then vanish from the quiz (`app/quiz.tsx:69-72`) with no log, no `OfflinePill` change, and no signal to the learner or the developer.
- Files: `src/dataset/remote.ts`, `src/learning/explain.ts` (`selectExplanation` returns `undefined` for missing `learning`, `formIndex`, or a verb entry, lines 42-48)
- Impact: a contract drift on the backend's `learning` block (v1 literal, template strings, enum keys) quietly removes the feature. This is the same kind of silent degradation the NET-02 review cares about.
- Fix approach: at minimum, record a `learningStatus` flag (`"ok" | "invalid" | "absent"`) in the resolved result and expose it in dev builds. Add a contract test that feeds the sample fixture through `fetchRemoteVerbs` (see Test Coverage Gaps).

**Hardcoded lockup source dimensions (v1.0 review IN-01, still open):**
- Issue: `app/index.tsx:27-28` hardcodes `1600` and `520` for the lockup canvas size. The crop constants are in `src/theme/lockup.ts`, and the same canvas size is repeated in `scripts/validate-brand.ts` (around lines 24-25, with only a "mirrors" comment).
- Files: `app/index.tsx`, `src/theme/lockup.ts`, `scripts/validate-brand.ts`
- Impact: if the lockup asset is regenerated at a different size, the layout drifts. The `validate-brand` gate catches pixel drift, but not the duplicated size literal.
- Fix approach: export `LOCKUP_SOURCE_WIDTH = 1600` and `LOCKUP_SOURCE_HEIGHT = 520` from `src/theme/lockup.ts` and import them in `app/index.tsx` and `scripts/validate-brand.ts`.

**Dead Zod runtime path (schemas used for typing only):**
- Issue: `feedbackPayloadSchema` (`src/feedback/schema.ts`) and `productFeedbackPayloadSchema` (`src/productFeedback/schema.ts`) are used only through `z.infer` for types. Nothing calls `.parse` or `.safeParse` before `submitFeedback` or `submitProductFeedback` POST. Payload limits (`message.max(2000)`, `appVersion.max(20)`) are not enforced on the client.
- Files: `src/feedback/schema.ts`, `src/productFeedback/schema.ts`, `src/feedback/submit.ts`, `src/productFeedback/submit.ts`
- Impact: the client relies entirely on the server for validation, and the server's 400 response gets a generic message (see Known Bugs).
- Fix approach: call `productFeedbackPayloadSchema.safeParse(payload)` inside `submitProductFeedback` and return `{ status: "validation-error" }` before the network call, or enforce the same caps in the modal (see Known Bugs).

**Version drift between `package.json` and `app.json`:**
- Issue: `package.json:4` says `"version": "1.0.0"` while `app.json:5` says `"version": "1.0.1"`. The runtime `appVersion` sent with feedback comes from `Constants.expoConfig?.version` (`app/quiz.tsx:60`, `app/index.tsx:45`, `app/results.tsx:27`), so `app.json` is the value that matters.
- Files: `package.json`, `app.json`, `app/quiz.tsx`, `app/index.tsx`, `app/results.tsx`
- Impact: low runtime risk, but any tooling that reads `package.json` will report the wrong release.
- Fix approach: bump `package.json` with the release, or drop the field, since EAS uses `appVersionSource: "remote"` (`eas.json`).

**User-facing raw error strings:**
- Issue: unexpected errors are rendered as `String(error)`. `app/index.tsx:74` and `app/results.tsx:82` pass the raw message into `setUnexpectedError`, and `app/results.tsx:43` renders it. A learner can see strings like `Error: Unknown verb "..." not found in provided verb list` (`src/quiz/engine.ts:57`).
- Files: `app/index.tsx`, `app/results.tsx`, `src/store/useQuizStore.ts` (rethrows non-`InsufficientVerbsError` at line 88)
- Impact: confusing copy, and internal details leak to the UI.
- Fix approach: map unexpected errors to one fixed user-facing message, and log the raw error.

---

## Known Bugs

**Over-length product feedback is rejected with a generic failure:**
- Symptoms: a message longer than 2000 characters is accepted by the TextInput, sent to `POST /product-feedback`, rejected with `400`, and shown as "Something went wrong. Please try again." `submitProductFeedback` maps `400` to `validation-error`, and the modal never shows a retry or a reason (`src/productFeedback/ProductFeedbackModal.tsx:102-105`, `:180`).
- Files: `src/productFeedback/ProductFeedbackModal.tsx` (TextInput at lines 144-151 has no `maxLength`), `src/productFeedback/schema.ts:7` (`max(2000)`), `src/productFeedback/submit.ts:26-28`
- Trigger: type or paste more than 2000 characters in "Help us improve" and tap Submit.
- Workaround: the learner can shorten the message and submit again. The Submit button stays enabled in the error state, so this is not a dead end, but the message is misleading.
- Fix approach: add `maxLength={2000}` to the TextInput, validate with the existing schema before POSTing (see Tech Debt), and show a specific message for `validation-error`.

**Feedback Retry can create duplicate rows (accepted risk):**
- Symptoms: when the 45s client timeout fires on a cold-booting backend, the server may still insert the row. The modal then shows `network-error` with "Retry submission", and the retry POSTs the same payload again.
- Files: `src/feedback/submit.ts:5`, `src/productFeedback/submit.ts:5`, `src/feedback/ReportFeedbackModal.tsx:111-113`, `src/productFeedback/ProductFeedbackModal.tsx:102-104`
- Trigger: a submit that exceeds 45s on a cold instance, followed by Retry.
- Status: accepted by user decision on 2026-10-11 (`.planning/phases/36-api-base-url-cutover-timeouts/36-REVIEW-FIX.md`, WR-02). The NET-02 wording in REQUIREMENTS.md and PROJECT.md was corrected to say 45s covers a cold boot or warm latency, not both. No client-only fix exists. An idempotency key needs a backend contract change in `portuguese-verb-api`.

**Retry risk from the preflight script:**
- Symptoms: `npm run preflight` POSTs to `/feedback` and `/product-feedback` on the live backend (`scripts/preflight.ts:78-90`), so each run inserts real rows into the production `FeedbackReport` and `ProductFeedbackReport` tables.
- Files: `scripts/preflight.ts`
- Trigger: running the preflight gate.
- Workaround: none in code. Treat preflight POSTs as production writes, and expect test rows in the backend data.
- Fix approach: give the backend a test-only marker or a separate preflight path, or accept and document the rows.

**Learner-visible explanations silently missing offline:**
- Symptoms: when the app is in `"local"` mode, `learning` is `undefined`, so no explanation panel appears. The `OfflinePill` says "Using saved content", but nothing says that explanations are off.
- Files: `src/dataset/source.ts:26` (local fallback sets `learning: undefined`), `app/quiz.tsx:69-72`
- Trigger: cold backend at launch, or no network.
- Fix approach: bundle a copy of the learning content as a local fallback, or document that explanations are online-only.

---

## Security Considerations

**No client-side secrets, and the write surface is narrow:**
- Risk: low. The app holds no Supabase credentials or tokens. The only writes are `POST /feedback` and `POST /product-feedback`, and the only read is `GET /content/verbs`. Checked: no `process.env` use in `app/` or `src/`.
- Files: `src/config/api.ts`, `src/feedback/submit.ts`, `src/productFeedback/submit.ts`, `src/dataset/remote.ts`
- Current mitigation: single host constant, a Jest guard against the retired Oregon host in `src`, `scripts`, `app` and the root config files (`__tests__/api-host-guard.test.ts`), and a no-headers fetch test for the content endpoint (`__tests__/dataset-remote.test.ts:192`).
- Recommendations: keep the host guard in CI. Add the backend's allowed origin/rate-limit story to the cross-repo notes.

**Free-text feedback is collected and transmitted:**
- Risk: learners may type personal data into the `message` fields. The App Privacy label (`store/privacy/nutrition-label-answers.md`) discloses this as User Content, Not Linked to You, and `docs/privacy.html` describes it. The public wording "collects no personal data" (`docs/privacy.html:89`) is broader than the disclosed feedback text.
- Files: `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`, `docs/privacy.html`
- Current mitigation: submission is user-initiated only, and no identifiers are sent.
- Recommendations: align the privacy page wording with the disclosed free-text collection. Add a short in-modal notice.

**Retained server log detail is out of this repo:**
- Risk: PROJECT.md carries forward a note that the backend `disableRequestLogging` option is deprecated in Fastify 6, which the "no IPs logged" privacy claim relies on.
- Files: backend repo `portuguese-verb-api` (not in this checkout)
- Recommendation: re-verify the privacy label claim when the backend upgrades Fastify.

---

## Performance Bottlenecks

**Cold-start latency on the first quiz:**
- Problem: content fetch has a 15s budget, and Render cold boots have been measured near 40s (`.planning/phases/36-api-base-url-cutover-timeouts/36-REVIEW.md` WR-01). A cold instance at launch means the first session runs on bundled content.
- Files: `src/dataset/remote.ts:8` (`TIMEOUT_MS = 15_000`), `src/dataset/source.ts:39-60` (background retry)
- Cause: the fetch is in-memory only. There is no on-disk cache and no persisted last-good dataset.
- Improvement path: persist the last successful remote payload (for example in `expo-file-system` or AsyncStorage), and use it as the fallback before the bundled dataset. This reopens the no-persistence scope decision in PROJECT.md, so it needs an explicit product decision. The background refresh in `src/dataset/source.ts` (Phase 36 WR-01 fix) is mitigation, but its on-device behavior is still marked "requires human verification".

**Background refresh on every setup mount while local:**
- Problem: `OfflinePill` without a `source` prop calls `resolveVerbs()` on mount (`src/components/OfflinePill.tsx:26-37`), and `resolveVerbs()` starts a background remote retry whenever the settled source is `"local"` (`src/dataset/source.ts:68-75`). While the backend is down, each setup mount and each Start tap can issue a 15s fetch. `refreshInFlight` prevents parallel requests, so the cost is bounded.
- Files: `src/dataset/source.ts`, `src/components/OfflinePill.tsx`, `app/index.tsx`
- Improvement path: add a minimum interval (for example 30s) between background retries.

**Full dataset held in the store and scanned per render:**
- Problem: the store keeps all verbs and the full learning block (`src/store/useQuizStore.ts:23-24`). `app/quiz.tsx:68` runs `verbs.find(...)` on every render.
- Files: `src/store/useQuizStore.ts`, `app/quiz.tsx`
- Impact: negligible at 50 verbs. Would matter at a much larger remote dataset.
- Improvement path: build a `Map` keyed by verb once in `startQuiz`.

---

## Fragile Areas

**Module-level singletons that survive for the process lifetime:**
- Files: `src/dataset/source.ts` (`cachedResult`, `settledSource`, `refreshInFlight`, lines 14-19), `src/store/useQuizStore.ts` (`startToken`, line 51)
- Why fragile: `reset()` does not clear the dataset cache, and tests must isolate module state (`jest.resetModules()` or a fresh import per test). A new code path that writes `cachedResult` directly, outside `startInitialResolve`/`refreshInBackground`, would bypass the single-flight and stale-while-revalidate invariants.
- Safe modification: change these only through `prefetch()`, `resolveVerbs()`, and `startQuiz`. Keep each new test file's `beforeEach` isolated.
- Test coverage: `__tests__/dataset-source.test.ts` (202 lines) and `__tests__/useQuizStore.test.ts` (280 lines) cover the main transitions. The double-tap race in `useQuizStore` (`token !== startToken`) is covered only by unit tests with a mocked `resolveVerbs`.

**Quit-quiz navigation guard with an eslint suppression:**
- Files: `app/quiz.tsx:45-53` (`beforeRemove` listener, with `// eslint-disable-next-line react-hooks/exhaustive-deps`)
- Why fragile: the effect omits `confirmExit` and `onConfirm` from its dependency list. The listener closes over `status` and `reset`/`router`, so a future change to `onConfirm` can silently run stale code. The Android hardware back path depends on this listener, since `predictiveBackGestureEnabled` is false (`app.json`).
- Safe modification: move `confirmExit` and `onConfirm` into `useCallback`, or into the store, and remove the suppression.
- Test coverage: none. No test exercises `beforeRemove` or the Exit button (see Test Coverage Gaps).

**Quiz choice rendering keys by choice text:**
- Files: `app/quiz.tsx:127` (`key={choice}`)
- Why fragile: React keys must be unique within a question. `pickDistractors` enforces uniqueness through `exclude` sets (`src/quiz/engine.ts:84-120`), so the current code is safe. Any change to distractor selection, or a remote verb whose forms collide, would produce duplicate-key warnings and wrong selection state.
- Safe modification: key by index, or assert uniqueness in `buildQuestion`.

**Cross-repo contract literals (feedback enums):**
- Files: `src/feedback/schema.ts`, `src/dataset/types.ts`, `src/productFeedback/types.ts` (`SCREENS`, `categories.ts`)
- Why fragile: `tense`, `subject` and `platform` enums are shared with the backend's `POST /feedback` Zod contract. The CLAUDE.md warning that these literals were best-guess (backend Phase 3 decisions D-07/D-08) still applies. The current mobile enums match `TENSES` and `SUBJECTS`, but no test compares them with a live or pinned backend schema.
- Safe modification: change enums only together with the backend. Add a contract fixture test (see Test Coverage Gaps).

**Hand-authored 1954-line local dataset:**
- Files: `src/dataset/verbs.ts`
- Why fragile: 50 verbs, each with 24 hand-written forms, and the file is the offline fallback that must match the backend's `/content/verbs` payload. Conjugation edits need a manual review (CLAUDE.md dataset authoring rule). The file is validated only by Jest against the schema, not against the backend's actual content.
- Safe modification: keep changes in `verbs.ts` and the backend content in sync. Re-run `__tests__/dataset.test.ts` after every edit.

**Feedback modal reset via "previous visible" state:**
- Files: `src/feedback/ReportFeedbackModal.tsx:57-66`, `src/productFeedback/ProductFeedbackModal.tsx:52-61`
- Why fragile: the modal resets its state during render, to satisfy the React Compiler rule that forbids reading or writing `ref.current` during render. Any new field added without a matching reset will keep the previous value across reopenings. The auto-close `setTimeout(onClose, 1500)` (lines 99 and 90) is not cleared if the screen unmounts first, so `onClose` can fire on an unmounted parent.
- Safe modification: add new resets in the `if (visible)` block. Clear the timer on unmount.

---

## Scaling Limits

**Single backend instance and cold starts:**
- Current capacity: one Render service in Frankfurt (`src/config/api.ts`). The keep-warm pingers are owned by the backend.
- Limit: the 15s content budget is shorter than a cold boot. Once keep-warm is removed, a larger share of first launches will fall back to local content.
- Scaling path: move content to a CDN-cached static JSON with an `ETag`, or document the keep-warm dependency as a required backend service. `REQUIREMENTS.md` ties keep-warm to the Oregon service, which the backend deleted on 2026-10-14.

**No pagination or size bound on `/content/verbs`:**
- Current capacity: the client accepts the whole payload in one response (`src/dataset/remote.ts:26-40`) with no size limit.
- Limit: a very large dataset would be parsed in full on the JS thread on every cold start.
- Scaling path: keep the payload small, or add a size budget to the content contract.

---

## Dependencies at Risk

**`react-native-reanimated` and `react-native-worklets` installed but unused:**
- Risk: installed for the default Expo Router template, with no custom usage in `app/` or `src/` (`package.json:27`, `:31`).
- Impact: build and bundle size, and a native module that must stay compatible with Expo SDK ~57.
- Migration plan: confirm with `npx expo-doctor` and remove the unused packages. The same applies to `expo-device`, `expo-font`, `expo-glass-effect`, `expo-image`, `expo-linking`, `expo-symbols`, `expo-web-browser`, `@expo/ui`, `react-native-web`. Verify each before removal, since Expo Router may depend on some of them.

**`react-native-web` and `output: "static"` configured but not used by the product:**
- Risk: `app.json` sets `web.output: "static"` and `react-native-web` is installed. The product is iOS-first and has no web build in CLAUDE.md.
- Impact: extra surface for the `npm run web` script to break silently.
- Migration plan: remove the web config or document it as unsupported.

**`allowImportingTsExtensions` in `tsconfig.json`:**
- Risk: `tsconfig.json:6` enables `.ts`-suffixed imports. Only `scripts/` uses them today, and no code in `app/`, `src/`, or `__tests__/` does. Copying that style into app code would break Metro resolution. (v1.1 audit tech debt.)
- Migration plan: enable the flag only in a scripts-specific tsconfig.

---

## Missing Critical Features

**No error reporting or crash analytics:**
- Problem: no Sentry, Crashlytics, or equivalent is in `package.json`. The app has no `console.*` calls in `app/` or `src/` (only the scripts log). Failures such as a remote parse error, a timeout, or a feedback 500 leave no trace other than the learner-visible states.
- Blocks: diagnosing production issues, measuring fallback rate, and verifying the cold-start behaviour. The v1.1 audit lists this as "requires human verification" because no logs exist.
- Note: `.planning/phases/999.1-add-analytics-sdk-for-usage-metrics` is in the backlog. Any analytics SDK must respect the no-identifiers privacy claim.

**Accessibility for VoiceOver:**
- Problem: the app has 3 accessibility props in total, all on the setup-screen lockup image (`app/index.tsx:86-90`). The quiz choices, Next, Exit, the tense chips, the verb-mode options, and the feedback reason and category options carry no `accessibilityRole`, `accessibilityLabel` or `accessibilityState` (`app/quiz.tsx:126-142`, `app/quiz.tsx:150-159`, `app/index.tsx:112-120`). The Next button is hidden with `opacity: 0` and `pointerEvents="none"` (`app/quiz.tsx:156`, `:267-268`), so it may still be focusable before an answer is chosen.
- Blocks: a VoiceOver learner cannot reliably answer questions, or tell which choice is selected.
- Note: PROJECT.md records that the Lafa palette was never WCAG-AA audited after the v0.6 replacement. A contrast check should go with this work.

**Explanation fallback offline:**
- Problem: explanations are unavailable in local mode (see Known Bugs). A learner who studies offline gets no corrective feedback beyond "wrong".
- Blocks: the core loop's learning value in the documented offline case.

---

## Test Coverage Gaps

**Components and screens are untested:**
- Untested: `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx` (state machine, retry, success auto-close), `src/components/ExplanationPanel.tsx`, `app/index.tsx`, `app/quiz.tsx` (quit confirmation, `beforeRemove`), `app/results.tsx` (Try Again, error branch).
- Files: there is no `@testing-library/react-native` (CONVENTIONS and TESTING design: framework-free unit tests). `src/theme/tokens.test.ts` is the only component-adjacent test.
- Risk: the quit-quiz guard, the Try Again error branch, and the retry state can regress with no failing test.
- Priority: High for the quit guard, Medium for the modals.

**No test for an empty or undersized remote dataset:**
- Untested: `verbs: []` and fewer than 10 eligible verbs from `fetchRemoteVerbs`, and their effect on `resolveVerbs` (`__tests__/dataset-remote.test.ts`, `__tests__/dataset-source.test.ts`).
- Risk: the High-priority Tech Debt item above can ship unnoticed.
- Priority: High.

**Contract test uses a pinned sample, not the live contract:**
- Untested: `__tests__/contract-fixture.test.ts` validates `__tests__/fixtures/content-verbs-v0.4.sample.json`, a snapshot. Nothing checks that the snapshot still matches the backend's current `/content/verbs` response, and `scripts/preflight.ts` checks only status code and timing.
- Risk: backend and mobile can drift on `learning` or `formIndex` without a failing test.
- Priority: Medium.

**Learning-content parse failure path:**
- Untested: `LearningContentSchema.safeParse` failing inside `fetchRemoteVerbs` returns `learning: undefined`, which is tested only for the verbs-only case (`__tests__/dataset-remote.test.ts:95-106`), not for the effect on the quiz.
- Priority: Low.

**Lint warnings in tests:**
- `npx eslint` reports 20 `@typescript-eslint/no-require-imports` warnings across `__tests__/` (lines 67-196 of one suite). Lint passes with warnings, so these are not blocking, but the warnings hide new issues if CI treats warnings as noise.
- Priority: Low.

---

## Open Review Items (non-blocking)

From `.planning/v1.1-MILESTONE-AUDIT.md` `tech_debt`, verified against code:

- **Phase 36 WR-01 (cold-boot pin):** mitigated by the stale-while-revalidate fix in `src/dataset/source.ts:39-60`. Still marked "requires human verification" in `36-REVIEW-FIX.md`.
- **Phase 36 WR-03 (host guard coverage):** fixed. The guard now covers `app`, `app.json`, `package.json` and `eas.json` (`__tests__/api-host-guard.test.ts:31-46`).
- **Phase 36 WR-04 (preflight budget):** fixed in code (`scripts/preflight.ts:10-11`, per-check budgets). Not yet run against the live backend.
- **Phase 36 WR-02 (duplicate rows on Retry):** accepted risk (see Known Bugs).
- **Phase 36 preflight URL literal:** `scripts/preflight.ts:1` duplicates `src/config/api.ts`. Sync is checked by regex in `__tests__/api-host-guard.test.ts`. A reformatted literal fails with a confusing message.
- **Phase 36 IN-02 (exact init key assertion):** `__tests__/dataset-remote.test.ts` still asserts `Object.keys(init)` equals `["signal"]`, which fails on any harmless future option.
- **Phase 39 IN-01 (lockup size literal):** still open, see Tech Debt.
- **Phase 39 IN-02 (two tolerances in `lockup.ts`):** still open. `src/theme/lockup.ts:12` and `:18` mention 6 and 8 per channel.
- **Phase 39 IN-03 (`main()` without catch):** still open. `scripts/validate-brand.ts:426` calls `main();` with no rejection handler.
- **Phase 39 IN-04 (`hexToRgb` accepts malformed input):** still open. `scripts/validate-brand.ts:218-221` does no format check.
- **Selection explanation fail-open (v0.4):** `src/learning/explain.ts:65-71` fills `selectedTenseLabel` and `selectedSubjectLabel` only when matches agree. If a future template uses those placeholders on a mixed match, they render unreplaced.
- **Process debt:** Phase 37 E2E-01 evidence has no HTTP status code. Phase 38 REL-04 frontmatter is missing. Several phases lack `VALIDATION.md` (Nyquist). Phase 39-02 SUMMARY uses `requirements:` where `requirements-completed` is expected. These are documentation debt, not code risk.

---

*Concerns audit: 2026-10-14*
