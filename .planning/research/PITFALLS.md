# Pitfalls Research

**Domain:** iOS-first Expo/React Native offline quiz app + single external REST API integration (Render-hosted) + hand-authored European Portuguese conjugation dataset
**Researched:** 2026-07-12
**Confidence:** MEDIUM (Expo/RN and Render behaviors verified against official docs/community sources; linguistic dataset pitfalls are domain-expert judgment, flagged LOW-MEDIUM per item)

## Critical Pitfalls

### Pitfall 1: Feedback enum literal mismatch causes silent/confusing 400s

**What goes wrong:**
The backend's `POST /feedback` Zod schema hard-fails (400) on any literal outside its enums (`tense`: `present_indicative | preterite | imperfect | future`; `subject`: `eu | tu | ele_ela | nos | voces | eles_elas`; `platform`: `ios | android`). The UI naturally wants to display accented, friendly labels ("nós", "ele/ela", "você/vocês"). If the app accidentally sends the display label (or a locally-invented enum, e.g. `voce` singular vs `voces`, or `nos`/`nós` with/without diacritic) instead of the exact backend literal, every feedback submission from real users 400s — and because this is a "nice to have" feature that doesn't block the quiz, the failure can go unnoticed for a long time (no user-facing crash, just silently failing feedback).

**Why it happens:**
Two independently-designed systems (backend Zod schema authored months before this app existed, mobile UI dataset authored fresh) model the same real-world concept (Portuguese subject pronouns) with different literal conventions. There's also a genuine linguistic wrinkle: European Portuguese doesn't have a clean 1:1 pronoun-to-conjugation-slot mapping — "você" (singular formal "you") conjugates like "ele/ela" (3rd person singular), and "vocês" conjugates like "eles/elas" (3rd person plural). The backend's `ele_ela` / `eles_elas` naming suggests it modeled the 3rd-person conjugation *slot*, not the literal pronoun word, which is correct for EP grammar but easy to get subtly wrong when a UI is authored independently (e.g. a developer might label a quiz question subject "você" but not realize it must map to `ele_ela`, not some `voce` literal that doesn't exist in the schema).

**How to avoid:**
- Define a single, centralized mapping module (e.g. `src/api/feedbackMapping.ts`) that is the *only* place UI subject/tense concepts are converted to backend literals. Never construct the payload ad hoc at call sites.
- Write this mapping as a total function over a closed union type mirroring the UI's own subject/tense enums, so TypeScript forces exhaustiveness (no literal can be added to the UI dataset without updating the mapping).
- Unit test the mapping directly against the literal values pasted from CLAUDE.md/backend docs (not re-derived from memory) — this is the single highest-value test in the whole app relative to effort.
- If feasible, get one live confirmation round-trip against the real `https://portuguese-verb-api.onrender.com/feedback` endpoint (even manually via curl) during Phase 5, rather than trusting the docs transcription alone, since this is flagged as a best-guess on the backend side too (D-07/D-08).

**Warning signs:**
- Any `400 { error: "ValidationError", fields: {...} }` response during manual QA of the feedback form.
- Mapping function has an `as any`, `// eslint-disable` cast, or non-exhaustive switch without a `default: assertNever(...)`.

**Phase to address:**
Phase 2 (domain model) — define the UI-side subject/tense enums deliberately compatible with backend concepts (3rd-person slot, not literal pronoun). Phase 5 (feedback integration) — implement and test the mapping layer; do the live round-trip check here.

---

### Pitfall 2: Feedback network/cold-start handling blocks or corrupts the core quiz loop

**What goes wrong:**
Render's free tier spins down a web service after ~15 minutes of no inbound traffic; the next request takes on the order of 50 seconds to a minute to wake it back up. If the feedback submission is implemented as a blocking call (e.g. an awaited fetch inside the same handler that also navigates away, or a modal that can't be dismissed until the request resolves), a learner who taps "submit feedback" right after finishing a quiz can be stuck staring at a spinner for up to a minute, or — worse — lose their quiz results screen if a naive implementation navigates before the request settles and an error handler unwinds state unexpectedly.

**Why it happens:**
Feedback is genuinely a secondary feature ("must never block the quiz" per PROJECT.md Core Value), but it's easy to wire it with straightforward `await submitFeedback()` code that "works" in local dev (where the backend is always warm) and only reveals the cold-start problem against the real deployed API after 15+ minutes idle — a gap easy to miss in a quick manual test pass.

**How to avoid:**
- Fire-and-forget the network call from the UI's perspective: optimistically close/dismiss the feedback UI (or show a lightweight "Thanks — sending..." toast) immediately, and let the request resolve in the background.
- Use a short client-side timeout (e.g. 8-10s) purely for UI state ("still sending...") separate from the actual request, which should be allowed to complete even after the timeout UI has settled, since cold starts can take up to a minute.
- Never let quiz completion, score display, or navigation depend on feedback request state in any way.
- Test explicitly against the live Render URL with a deliberately cold instance (wait >15 min, or trigger via Render dashboard) at least once before considering Phase 5 done — this condition cannot be reproduced against localhost/mocks.

**Warning signs:**
- Any `await` on the feedback submit sitting between the user's tap and a UI transition the user is waiting on.
- No retry/timeout policy documented for the feedback client.
- Manual QA only ever tested against a warm instance.

**Phase to address:**
Phase 5 (feedback API integration) — build a fire-and-forget client wrapper (queue + background retry, optional) from the start, not as an afterthought. Phase 6 (polish/QA) — explicit cold-start manual test pass against the live Render URL.

---

### Pitfall 3: Hand-authored conjugation dataset has silent accuracy errors that automated tests can't catch by construction

**What goes wrong:**
A 50-verb × 4-tense × 6-subject dataset (1,200 conjugated forms) authored by an LLM and spot-checked by one human reviewer will very likely contain a handful of wrong forms — most commonly: (a) missing or wrong diacritics (á/â/ã/ê/é/ô/ó/ç — European Portuguese is diacritic-dense and a missing tilde or misplaced acute accent is easy to miss visually), (b) European vs. Brazilian Portuguese drift (e.g. BP habitually drops "tu" conjugations or uses different preterite/imperfect forms that an LLM trained mostly on BP text may default to), (c) irregular verb forms that look "regular-shaped" and get accidentally regularized (e.g. "fazer" → preterite "fiz/fizeste/fez..." not "fazi/fazeste"), (d) orthographic-reform inconsistency (pre/post Acordo Ortográfico spelling mixed within the same dataset).

**Why it happens:**
The dataset's shape (does every verb have exactly 24 forms, is nothing null) is trivially unit-testable, but *linguistic correctness* is not — a test suite can confirm "all cells populated" while several cells are wrong. LLM-authored conjugation tables in particular tend to be internally consistent-*looking* (plausible morphology) even when wrong, which defeats casual visual review, and BP/EP interference is a known blind spot because most training data and most online Portuguese content is Brazilian.

**How to avoid:**
- Treat automated tests as verifying *completeness and shape only* (no nulls, no duplicate answer choices, every tense/subject cell present) — never claim they verify *correctness*.
- For correctness, use a dedicated, sourced reference for European Portuguese conjugation (e.g. Ciberdúvidas, Infopédia conjugator, or Priberam) verb-by-verb rather than relying on model-generated tables alone; cross-check every irregular verb individually (irregulars are where errors concentrate) even if regulars are sampled.
- Explicitly flag "tu" forms for extra scrutiny — since Brazilian Portuguese largely doesn't use "tu," EP-specific "tu" conjugations (2nd person singular) are more likely to be a weak spot in any general-purpose Portuguese knowledge source.
- Standardize on post-1990 Acordo Ortográfico spelling throughout and grep the dataset for common pre-reform artifacts (e.g. stray "cc," "pp," "ct" consonant clusters that were simplified) as a lint pass.
- Since the user (native or fluent reviewer) is doing final review per PROJECT.md, structure the dataset file so a human reviewer can diff/scan it tense-by-tense (e.g. one table per tense) rather than needing to review 1,200 scattered form strings — this materially increases the chance real errors get caught.

**Warning signs:**
- Dataset review happens in one pass at the end rather than incrementally per-tense/per-verb-class.
- No irregular-verb-specific checklist distinct from the regular-verb generation approach.
- "tu" and "vós"/"vocês" forms not spot-checked separately from "eu"/"ele" forms.

**Phase to address:**
Phase 2 (domain model/dataset) — build the dataset with a tense-by-tense reviewable structure and do the irregular-verb-specific pass here, not deferred to polish. Phase 6 (polish/QA) — final full read-through against an authoritative EP conjugation reference before ship, treating this as equally important as functional QA.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ship a smaller seed dataset (e.g. 15-20 verbs) instead of the full 50 | Faster to ship v0, less authoring/review risk | Feels thin for repeat play; may need a follow-up content pass | Only if authoring the full 50 with proper irregular-verb verification is at risk of blocking the milestone — flag explicitly as scope renegotiation, not silent under-delivery |
| Skip a real cold-start test against the live Render URL, rely on localhost mock only | Saves ~15 min wait per test cycle | Cold-start UX bug ships silently since it only manifests after 15+ min idle | Never for the final Phase 5/6 QA pass; acceptable during early dev iteration |
| Hardcode feedback enum literals inline at the call site instead of a typed mapping module | Slightly less code up front | Any future dataset/UI label change silently breaks payloads with no compiler help | Never |
| Use BP-flavored Portuguese resources to spot-check EP conjugations because they're more abundant online | Faster research | Silently reintroduces BP forms into an EP-labeled app | Never for irregular verbs; only as a last resort for uncontroversial regular forms, with EP-specific cross-check still required |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| Render-hosted `POST /feedback` | Awaiting the request synchronously in the UI thread's tap handler, blocking navigation | Fire-and-forget with background resolution; UI never waits on it |
| Zod-validated backend schema | Sending UI display strings (accented labels) instead of exact enum literals | Centralized, exhaustively-typed mapping module; test against literals copied verbatim from source docs |
| iOS native Share sheet (`expo-sharing` / RN `Share` API) | Assuming the returned promise always means "shared successfully" | Handle `Share.dismissedAction` explicitly; don't treat share-sheet dismissal as an error or log it as a failure |
| Backend error responses | Trying to surface `500 { error: "InternalServerError" }` internals to the user, or crashing on unexpected shape | Show a generic "couldn't send feedback, try again later" message for any non-201; never assume response body shape beyond what's documented |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing/reshuffling the full verb pool from scratch on every question instead of once per quiz session | Minor jank, wasted CPU on lower-end iPhones | Build the filtered/shuffled question set once at quiz start, store in Zustand session state | Noticeable on older devices once quiz length or dataset size grows significantly beyond 50 verbs |
| Loading the entire 1,200-cell dataset as one large uncompiled JSON parsed at runtime import | Slightly slower cold app launch | Keep dataset as a typed TS module (compiled, not parsed JSON) or lazy-import if it grows much larger | Only matters if dataset scales far beyond current 50-verb target; not a concern at this scale |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full feedback payloads (including free-text `message`) to a third-party crash/analytics tool without review | Could leak whatever a user typed (potentially PII) to a vendor | If any crash reporting is added later, scrub or exclude the feedback `message` field from logs |
| Embedding any Supabase URL/key "just for local debugging" and forgetting to remove it | Direct DB write path exposed in a shipped iOS binary (extractable from the app bundle) | Never introduce Supabase client code in this repo at all — locked constraint, enforce via code review/lint rule if feasible (e.g. ban `@supabase/*` from package.json) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Feedback form requires a network round-trip to confirm before dismissing | Learner feels the app "hangs" right after finishing a quiz, undermining the core loop's snappy feel | Instant optimistic dismissal + background send, silent success, unobtrusive failure toast only if it truly fails |
| Native share sheet triggered from results screen has app state (score) get modified or navigated away from underneath it | Share sheet appears with stale/wrong score, or crashes on return | Snapshot the score/message text at share-invocation time; don't let the results screen unmount or re-fetch state while the native share sheet is presented |
| Irregular-verb toggle changes question pool but doesn't reset an in-progress quiz clearly | Learner confused why toggling mid-quiz didn't change current question, or quiz silently restarts losing progress | Disable/hide the toggle once a quiz session has started; only apply it at the "start quiz" screen |
| Subject label ambiguity ("você" not shown as a distinct pronoun since it maps to the ele/ela slot) | Learner who expects to see "você" as an option gets confused why it's missing or grouped oddly | Decide explicitly (Phase 2) whether "você" is presented in the UI at all, and if so, document clearly that it conjugates as 3rd-person singular so learners aren't confused by the grouping |

## "Looks Done But Isn't" Checklist

- [ ] **Feedback submission:** Often missing true offline/cold-start handling — verify by testing against a genuinely cold (idle 15+ min) Render instance, not just localhost/mocks.
- [ ] **Conjugation dataset:** Often missing EP-specific correctness despite passing shape/completeness tests — verify irregular verbs and "tu" forms against an authoritative EP source (Ciberdúvidas/Infopédia/Priberam), not just visual scan.
- [ ] **Feedback payload mapping:** Often missing exhaustiveness against the backend's actual enum values — verify the mapping module's literals are copied verbatim from CLAUDE.md/backend docs, not retyped from memory, and covered by a unit test asserting each mapped value.
- [ ] **Share sheet:** Often missing dismissed/cancelled-share handling — verify the app treats `Share.dismissedAction` as a normal no-op, not an error path.
- [ ] **Quiz scoring/results:** Often missing a check that navigating to results and back doesn't allow re-answering already-scored questions or double-counting a score — verify session state is cleared/locked after quiz completion.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Enum literal mismatch shipped, feedback silently 400ing in production | LOW | No user-facing quiz impact since feedback is non-blocking; ship a patch correcting the mapping module and its unit test — no data migration needed since failed submissions were never persisted |
| Dataset has a handful of wrong conjugations discovered post-launch | LOW-MEDIUM | Dataset is a static local TS module — fix values and ship an app update; no backend/schema changes needed. Add the specific error case to the reviewer's per-tense checklist to prevent recurrence |
| Feedback UX found to be blocking/janky post-launch | LOW | Isolated to the feedback submission code path; refactor to fire-and-forget without touching quiz engine or dataset |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|---------------|
| Feedback enum literal mismatch (400s) | Phase 2 (define UI enums compatible with backend concepts) + Phase 5 (mapping + tests) | Unit test asserting mapping output matches literals copied from CLAUDE.md; one live round-trip test against the deployed backend |
| Feedback blocking core UX / cold-start mishandling | Phase 5 (fire-and-forget client) | Manual test against a cold (15+ min idle) live Render instance in Phase 6 QA |
| Dataset accuracy errors (accents, irregulars, EP vs BP drift) | Phase 2 (tense-by-tense reviewable authoring + irregular-verb-specific pass) | Human review against authoritative EP conjugation reference before Phase 6 ship; shape/completeness unit tests as a floor, not the correctness bar |
| Share sheet dismissed-action mishandling | Phase 4 (UI) | Manual test tapping "Cancel" on the native share sheet, confirm no error state shown |
| "Include irregular verbs" toggle mid-quiz confusion | Phase 4 (UI) | Manual test: verify toggle is inert/hidden once a quiz session is active |

## Sources

- [Sharing - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/sharing/) — MEDIUM confidence, official docs
- [Share · React Native](https://reactnative.dev/docs/share) — MEDIUM confidence, official docs (dismissedAction behavior)
- [Deploy for Free – Render Docs](https://render.com/docs/free) — HIGH confidence, official docs (15-min spin-down, ~1min wake time)
- [Your Render Free Tier Is Not Broken. It's Just Cold.](https://blog.samkiel.dev/your-render-free-tier-is-not-broken-its-just-cold) — MEDIUM confidence, community write-up corroborating official docs
- [Unit testing with Jest - Expo Documentation](https://docs.expo.dev/develop/unit-testing/) — HIGH confidence, official docs (jest-expo preset behavior)
- [Unit Testing Expo Apps With Jest | Nx Blog](https://nx.dev/blog/unit-testing-expo-apps-with-jest) — MEDIUM confidence
- Domain knowledge: European Portuguese verb morphology (você/vocês grouping into 3rd-person conjugation slots, tu-form scarcity in Brazilian sources, Acordo Ortográfico spelling reform) — LOW-MEDIUM confidence, not independently re-verified against a live conjugator during this research pass; flagged for verification during Phase 2 dataset authoring against Ciberdúvidas/Infopédia/Priberam
- Project-internal: `/Users/avi/portuguese-verb/portuguese-verb-mobile/CLAUDE.md` and `.planning/PROJECT.md` — HIGH confidence, authoritative locked cross-repo contract

---
*Pitfalls research for: Expo/React Native offline quiz app with external feedback API*
*Researched: 2026-07-12*
