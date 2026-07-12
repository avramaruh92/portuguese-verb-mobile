# Feature Research

**Domain:** Conjugation-drill / language-quiz mobile apps (European Portuguese verb practice, offline, no accounts)
**Researched:** 2026-07-12
**Confidence:** MEDIUM (WebSearch across multiple competitor apps, cross-checked against project's already-locked PROJECT.md scope; no Context7-verifiable library claims in this domain — it's a product/UX space, not a library API)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any conjugation-drill app. Missing these makes the product feel incomplete even at v0 scope.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quiz setup filters (tense, verb type) | Every competitor (Conjuguemos, Kwiziq, Spanish Verb Conjugator, Irregular Verbs Quiz) lets the learner scope practice before starting — otherwise practice feels random and unfocused for a beginner who is drilling one tense at a time | LOW | Already in Active requirements: tense multi-select + irregular-verb toggle. Keep the two axes independent (toggle doesn't restrict tense choice) — matches Key Decisions. |
| Clear question context (verb, translation, tense, subject) | Beginners (A1-A2) need scaffolding — competitors that omit translation or subject context see higher confusion/drop-off for early learners; apps aimed at more advanced learners (Bonjour Verbs) omit multiple choice/translation because their audience doesn't need it | LOW | Already in Active requirements. Showing English translation is the right call for A1-A2 vs. e.g. Bonjour Verbs' "no scaffolding" approach, which targets intermediate+ learners. |
| Multiple choice OR typed answer (pick one for v0) | Nearly every competitor supports at least one of these; several (Spanish Verb Conjugator, Irregular Verbs Quiz Game) support both as separate modes | LOW (multiple choice) vs MEDIUM (typed, needs accent-insensitive/diacritic-tolerant matching + input handling) | Project has already chosen multiple choice (4 options, 1 correct) for v0 — correct call for velocity and to avoid EU Portuguese accent-matching edge cases (à, ão, ê, ç) that typed input would require solving well before shipping. |
| Immediate right/wrong feedback per question | Universal pattern across every competitor found (Spanish Verbs Quiz, English Verbs Quiz, Irregular Verbs Quiz Game) — shown as the single biggest driver of perceived "quality" in quiz app reviews | LOW | Already in Active requirements. Show the correct answer even when the user gets it right isn't necessary, but always show correct answer on a wrong pick (competitors uniformly do this: "correct answer appears if you make a mistake"). |
| Score/results screen at end of session | Universal — every competitor ends a session with a score, even ones without account-based history (Conjuguemos untracked mode, Kwiziq per-quiz results) | LOW | Already in Active requirements (score out of 10). |
| Fixed-length session (not infinite drill) | Bounded sessions (10 questions here) give a sense of completion; open-ended "keep going" drills (Conjuguemos' timed mode) work for that product's use case but add complexity (timers, early-exit UX) not needed for v0 | LOW | Matches Active requirements — no timer needed for v0. |
| Randomized question order / no obvious repeats within a session | Competitors that reuse the same few items back-to-back get called out in reviews as feeling "rigged" or lazy; basic shuffling addresses this | LOW | Should be covered by the "quiz generation (correct filtering/randomization)" test requirement already listed — worth confirming the shuffle avoids the exact same verb+tense+subject combo appearing twice in one 10-question session. |

### Differentiators (Competitive Advantage)

Features that set a product apart. For this project, most classic differentiators in this space (streaks, progress tracking, AI-adaptive difficulty, mastery %, multiplayer) are **explicitly out of scope** per PROJECT.md — noted below for roadmap awareness, not as things to build now.

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| European Portuguese specificity | Nearly all competitor apps found are Spanish/French/English-focused; a dedicated EU-Portuguese (not Brazilian) conjugation drill is a real gap in the market | N/A (content, not code) | This is the project's actual differentiator — it's about dataset accuracy/curation (the 50-verb hand-authored dataset), not a UI feature. Reinforces why dataset review-for-accuracy (already a constraint) matters more here than in a crowded-language market. |
| Native share sheet with score | Lightweight organic growth loop competitors rarely bother with at this simplicity | LOW | Already in Active requirements — correctly scoped as a nice-to-have that "must never block" the core loop. |
| In-app feedback submission tied to specific question context | Most competitor apps have no feedback mechanism beyond app store reviews; capturing verb/tense/subject/correctAnswer/selectedAnswer context on submission is unusually structured for a v0 | LOW-MEDIUM | Already in Active requirements. This is a genuine differentiator for improving dataset accuracy over time — treat feedback data as the mechanism for iterating the local dataset (competitors with logins solve this via their own error-tracking/AI; this project's offline model solves it via structured user reports instead). |
| Mastery tracking / AI-adaptive difficulty (Kwiziq-style) | Increases perceived personalization and learning efficacy | HIGH | **Explicitly out of scope for v0** (no accounts, no history) — correctly deferred. Flag for future milestone only if accounts are ever introduced. |
| Streaks / spaced repetition (Conjuguemos/Duolingo-style) | Drives daily engagement habit | HIGH (requires persistence across sessions) | **Explicitly out of scope for v0** per PROJECT.md — correctly deferred, requires local persistence design work beyond a single-session model. |
| Multiplayer / social competition (Conjuguemos-style) | Drives engagement via competition | HIGH | Not remotely in scope; no accounts, no backend content/session sharing exists. Not worth mentioning again after v0 unless product direction changes significantly. |
| Typed-answer mode with accent handling | More rigorous recall test than multiple choice; some competitors offer both modes | MEDIUM-HIGH (diacritic-normalization logic, keyboard handling for EU Portuguese-specific characters) | Reasonable v1.x candidate once multiple-choice mode is validated — not v0. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| User accounts / login | "Let me track my progress across devices" | Directly contradicts the locked no-login/no-accounts product decision (matches backend v0.0 scope); adds auth surface, backend session/storage work, and privacy/data-handling scope with zero backend support currently built for it | Keep single-session, stateless model; if progress tracking is validated as needed later, consider local-only (on-device, no account) persistence before ever introducing accounts |
| Spaced repetition / "smart" review scheduling | Feels like a natural evolution once users find a favorite conjugation drill app (Conjuguemos, Duolingo do this) | Requires persistent per-user item-level performance history, which requires either accounts or complex on-device-only storage design — explicitly deferred by PROJECT.md; premature for a v0 meant to validate the basic quiz loop first | Ship the fixed 10-question random-draw loop first; revisit spaced repetition only after validating retention/interest in a later milestone |
| Backend-served quiz content / remote verb dataset | "Update verbs without an app release" | Explicitly contradicts the locked architecture decision — no content-serving API exists or is planned; introducing this now would require standing up new backend infrastructure outside this milestone's scope and reopens API-versioning/compatibility questions | Ship the dataset bundled with the app; treat dataset corrections as an app-update cadence problem, informed by the feedback-submission loop |
| Timed quiz mode / countdown pressure | Adds "gamified" urgency similar to Conjuguemos' timed graded practice | Adds complexity (timer UI, early-exit handling, score-under-time-pressure semantics) not requested and not part of the core value ("complete a quiz and see an accurate score") — risks making the MVP loop feel more complicated to test/validate | Keep the fixed 10-question, untimed format for v0; reconsider only if user feedback specifically asks for a challenge mode |
| Typed-answer input as the default (instead of multiple choice) | Feels more "rigorous" and closer to real recall | Diacritic/accent handling for European Portuguese (ã, õ, ç, á/à/â, é/ê) is a real edge case that would require careful input normalization and testing before shipping reliably; risks false negatives (marking correct answers wrong due to accent mismatches) undermining trust in the accurate-score core value | Ship multiple choice for v0 (already the project's choice); revisit typed mode later as a v1.x differentiator once normalization logic can be built and tested properly |
| Ads / monetization hooks | Common in free language apps to sustain them | Explicitly out of scope per PROJECT.md; introducing SDKs for ads/analytics at v0 adds third-party dependencies, privacy considerations, and app-review complexity with no product need yet | None needed at this stage — revisit only if there's a monetization milestone later |

## Feature Dependencies

```
Quiz setup (tense filter + irregular toggle)
    └──requires──> Local verb dataset (50 verbs × 4 tenses × 6 subjects, regular/irregular flagged)

Question presentation (verb + translation + tense + subject + 4 choices)
    └──requires──> Local verb dataset
    └──requires──> Quiz session generation (filtering + randomization)

Immediate right/wrong feedback
    └──requires──> Question presentation
    └──enhances──> Perceived quality / trust in "accurate score" core value

Results screen (score out of 10)
    └──requires──> Quiz session generation
    └──requires──> Immediate feedback tracking (running tally of correct answers)

Share sheet (score + app name)
    └──requires──> Results screen

In-app feedback submission (POST /feedback)
    └──requires──> Question context (verb/tense/subject/correctAnswer/selectedAnswer) captured at time of feedback trigger
    └──requires──> Enum-literal mapping (UI labels → backend's locked tense/subject/platform literals)
    └──conflicts──> nothing structurally, but MUST NOT block quiz completion (async/non-blocking submission required per Active requirements)

Typed-answer mode (deferred, v1.x)
    └──requires──> Diacritic-normalization logic (not yet built)
    └──conflicts──> None with multiple choice — can coexist as a toggleable mode later

Spaced repetition / streaks (deferred, future milestone)
    └──requires──> Local or account-based persistence across sessions (not yet designed)
    └──conflicts──> "No login/accounts/history" v0 product scope — must be a deliberate scope change, not an incremental addition
```

### Dependency Notes

- **Question presentation requires the local verb dataset:** the dataset (50 verbs, translations, regular/irregular flags, full tense×subject conjugation grid) is the single hardest content dependency in this project — everything else (quiz setup, question rendering, scoring) is blocked on dataset shape being finalized and validated for accuracy. This should be an early, standalone phase.
- **In-app feedback requires exact enum-literal mapping:** the backend's `tense`/`subject`/`platform` enums were chosen before this app existed and are flagged as unverified against real UI. This mapping layer is a discrete, testable unit that should not be conflated with the quiz UI itself — get it right independently, since a mismatch causes silent-looking 400s on legitimate feedback.
- **Share sheet enhances but never blocks Results:** per Core Value in PROJECT.md, sharing must not gate quiz completion — treat the share action as a strictly additive, non-blocking UI affordance on the already-rendered results screen.
- **Spaced repetition / streaks conflict with the current v0 product scope:** these are the most commonly-expected differentiators in the broader competitor landscape (Conjuguemos, Duolingo-style apps) but require session-spanning persistence that directly contradicts the locked "no accounts, no history" decision. Any future milestone introducing these must treat it as a deliberate scope change requiring a fresh Key Decision, not a quiet feature add.

## MVP Definition

### Launch With (v1 = this project's v0.0 milestone)

- [ ] Tense multi-select + irregular-verb toggle quiz setup — the minimum scoping needed for focused practice
- [ ] 10-question quiz session, randomized, respecting filters — the core loop
- [ ] Multiple-choice question presentation with translation/tense/subject context — beginner-appropriate scaffolding, avoids accent-matching complexity of typed input
- [ ] Immediate right/wrong feedback per question — table stakes across every competitor studied
- [ ] Results screen with score out of 10 — closes the loop, matches Core Value
- [ ] Native share sheet from results — low-cost organic growth, explicitly non-blocking
- [ ] In-app feedback submission with question context, handling 201/400/500/network-delay gracefully — the only backend touchpoint, must degrade gracefully given Render free-tier cold starts
- [ ] Local 50-verb dataset (4 tenses × 6 subjects, translations, regular/irregular flags) — the actual content backbone; may seed smaller initially per PROJECT.md's velocity note

### Add After Validation (v1.x)

- [ ] Typed-answer mode as an alternative to multiple choice — once diacritic-normalization is built and tested, and only if user feedback indicates multiple choice feels too easy/unrigorous
- [ ] Additional verbs beyond the initial 50 if the curated set proves too narrow in practice
- [ ] Android release — enum/platform compatibility already reserved, but no build effort until after iOS validation

### Future Consideration (v2+)

- [ ] On-device (no-account) local progress/streak tracking — only if user interest in repeated engagement is validated; must be designed to avoid backend/account creep
- [ ] Spaced repetition — deliberately deferred per PROJECT.md; requires its own milestone-level scope discussion given the persistence and possibly-accounts implications
- [ ] Backend-served/updatable verb content — only if dataset maintenance via app releases becomes a real bottleneck; would require new backend work outside current architecture

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Local verb dataset (accurate, 50 verbs) | HIGH | HIGH (hand-authored content, accuracy review) | P1 |
| Quiz setup filters (tense, irregular toggle) | HIGH | LOW | P1 |
| Multiple-choice question presentation | HIGH | LOW | P1 |
| Immediate right/wrong feedback | HIGH | LOW | P1 |
| Results screen with score | HIGH | LOW | P1 |
| In-app feedback submission (POST /feedback) | MEDIUM | MEDIUM (enum mapping, error-state handling) | P1 |
| Native share sheet | MEDIUM | LOW | P1 (already scoped in) |
| Typed-answer mode | MEDIUM | MEDIUM-HIGH (accent normalization) | P3 |
| On-device progress/streaks | MEDIUM | HIGH | P3 |
| Spaced repetition | LOW (at this stage, unvalidated) | HIGH | P3 |
| Accounts/login | LOW (explicitly rejected) | HIGH | Not planned |

**Priority key:**
- P1: Must have for launch (this v0.0 milestone)
- P2: Should have, add when possible (none identified beyond P1 for this scope — the project is tightly scoped already)
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Conjuguemos | Kwiziq (Spanish) | Spanish Verb Conjugator / Irregular Verbs Quiz Game | Our Approach |
|---------|-------------|-------------------|------------------------------------------------------|--------------|
| Answer mode | Typed (graded practice) | Multiple choice + typed, varies by quiz type | Both modes offered as separate toggle | Multiple choice only for v0; typed deferred to v1.x |
| Progress tracking | Optional account-based history, tracks struggles over time | AI-driven mastery % per grammar concept, requires account | None (basic quiz apps, no accounts) | None — explicitly out of scope for v0, matches simpler competitor tier |
| Session length | Timed (e.g., 5-minute graded practice), open-ended | Variable, quiz-length driven by AI | Fixed per quiz, no timer | Fixed 10 questions, untimed |
| Feedback on wrong answers | Shows correct form, tracks recurring mistakes | Shows correct answer + link to grammar lesson page | Shows correct answer immediately | Shows correct answer immediately; no lesson-linking (no content beyond dataset) |
| Social/multiplayer | Yes (competitive games) | No | No | Not planned — no backend session infra for this |
| User feedback mechanism | Account-based support/contact, not structured to specific questions | Community Q&A forum tied to quizzes | None found | Structured POST /feedback tied to exact question context (verb/tense/subject/answers) — differentiator despite being lightweight |
| Content scope | Spanish, French, and others; largely Latin American/European Spanish, France French | Spanish only, AI-personalized | Spanish (Latin American focus) | European Portuguese specifically — genuine market gap identified in this research |

## Sources

- [Conju Gate](https://www.appconjugate.com/) — WebSearch summary, MEDIUM confidence (single-source description, not independently verified via official docs)
- [Spanish Verb Conjugator (Google Play)](https://play.google.com/store/apps/details?id=com.mbcode.spanishverbquiz&hl=en_US) — MEDIUM confidence
- [Spanish Verbs Quiz (App Store)](https://apps.apple.com/us/app/english-verbs-quiz/id1170835814) — MEDIUM confidence
- [Irregular Verbs Quiz Game (Google Play)](https://play.google.com/store/apps/details?id=com.irregularQuiz&hl=en_US) — MEDIUM confidence
- [Bonjour Verbs](https://bonjourverbs.com/practice/) — MEDIUM confidence
- [Conjuguemos](https://conjuguemos.com/) and [Conjuguemos Review — Multilingual Mastery](https://multilingualmastery.com/conjuguemos-review/) — MEDIUM confidence (review + official site cross-checked)
- [Kwiziq Spanish](https://spanish.kwiziq.com/) and [Kwiziq Review — Multilingual Mastery](https://multilingualmastery.com/kwiziq-review/) — MEDIUM confidence
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/.planning/PROJECT.md` — HIGH confidence (authoritative, locked project scope)

All competitor findings are WebSearch-sourced (no official docs/changelogs applicable to this product-research domain) and cross-checked across at least two independent sources per claim where possible; treated as MEDIUM confidence throughout. No claims here should be read as verified against the apps' current live behavior — they reflect publicly described feature sets as of research date.

---
*Feature research for: European Portuguese verb conjugation quiz app (iOS-first, offline, no accounts) — v0.0 milestone*
*Researched: 2026-07-12*
