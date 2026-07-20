# Requirements — v0.3 Learning Quality Upgrade

Source: `/Users/avi/Downloads/v0.3 Learning Quality Upgrade.md` (codex-authored
plan), reconciled against the backend's already-shipped v0.3 contract
(`portuguese-verb-api`, `GET /content/verbs` → `{ verbs, learning? }`).

## v1 Requirements

### Verb Mode

- [ ] **MODE-01**: User can select verb mode (Regular only / Mixed / Irregular only) on the Setup screen, replacing the boolean "Include irregular verbs" toggle. Default: Regular only. *(code/wiring verified; on-device visual/interaction check still outstanding — see 13-HUMAN-UAT.md)*
- [x] **MODE-02**: Quiz generation filters the eligible verb pool by `isIrregular` per the selected mode — `regular_only`: `isIrregular === false` only; `mixed`: all verbs; `irregular_only`: `isIrregular === true` only.
- [x] **MODE-03**: The existing insufficient-eligible-verbs error path still triggers correctly under Irregular-only's smaller pool (no crash, same user-facing message pattern as today).

### Distractors

- [x] **DIST-01**: Distractor selection prefers same-verb, wrong-subject forms over arbitrary wrong forms.
- [x] **DIST-02**: Distractor selection adds same-verb, wrong-tense forms, prioritizing the Completed-past vs. Imperfect-past confusion pair.
- [x] **DIST-03**: Distractor selection falls back to same-subject/tense forms from another verb (same conjugation class where available) when same-verb options run out.
- [x] **DIST-04**: Every question keeps exactly 4 unique choices with exactly 1 correct answer under the new strategy — the existing invariant, re-verified.

### Explanations

- [x] **EXPL-01**: App parses the optional `learning` block and per-verb `formIndex` from `GET /content/verbs`, Zod-validated, without breaking on payloads that omit `learning` (backend fail-closed-omits it independently of `verbs`).
- [x] **EXPL-02**: After an incorrect answer, the Quiz screen shows a short (1-2 sentence) explanation panel, placed between the answer choices and the Next button, built by resolving the selected answer's actual `{tense, subject}` slot via `formIndex` and filling the matching backend template (`wrongTense` / `wrongSubject` / `wrongTenseAndSubject` / `generic`).
- [x] **EXPL-03**: No explanation panel is shown when learning content is unavailable for that verb/answer (missing `learning` block, missing verb entry, or an answer with no `formIndex` match) — never fabricated/unreviewed grammar prose.
- [x] **EXPL-04**: Explanation rendering never changes `correctAnswer`, scoring, or the `POST /feedback` payload's `selectedAnswer` string; the panel never blocks advancing to the next question.

### Testing

- [x] **TEST-03**: Verb-mode filter unit tests cover `regular_only`/`mixed`/`irregular_only`, including the existing 10-question/no-duplicate-triple guarantees under each mode.
- [x] **TEST-04**: Distractor-strategy unit tests cover wrong-subject, wrong-tense (incl. Completed/Imperfect past), and cross-verb fallback cases, plus the 4-unique-choices/1-correct-answer invariant.
- [x] **TEST-05**: Explanation-selection unit tests cover correct template choice per mismatch type, the missing-learning-content fallback (no panel, no throw), and confirm explanation generation never mutates scoring/feedback data.

## Future Requirements (deferred)

- Prepositions quiz type / verb-preposition mappings — explicitly deferred to a future cross-repo milestone; backend owns canonical data, mobile should not invent it.
- Cross-repo Zod-strictness/Unicode round-trip verification between mobile's dataset schema and the backend's `learningContentSchema`/`verbSeedSchema` — flagged by the backend team as worth revisiting when mobile starts consuming the contract (this milestone); if EXPL-01's validation surfaces any mismatch, address it here rather than deferring further.

## Out of Scope

- Any backend-repo work — the `learning`/`formIndex` contract is already live; this milestone is mobile-only.
- Reclassifying any verb's `isIrregular` flag locally — the backend already derives it from `learning.verbs[verb].irregularTenses`; mobile's local fallback dataset is not touched by this milestone.
- New content authoring (translations, additional verbs, additional `tenseNotes`/`subjectHints` coverage) — content authoring is a backend/content responsibility.
- Prepositions UI, data model, or routes — see Future Requirements above.
- Changes to `POST /feedback`'s contract or payload shape.

## Traceability

| Requirement | Phase | Status |
|--------------|-------|--------|
| MODE-01 | Phase 13 | Partial (code verified, on-device check outstanding) |
| MODE-02 | Phase 13 | Complete |
| MODE-03 | Phase 13 | Complete |
| TEST-03 | Phase 13 | Complete |
| DIST-01 | Phase 14 | Complete |
| DIST-02 | Phase 14 | Complete |
| DIST-03 | Phase 14 | Complete |
| DIST-04 | Phase 14 | Complete |
| TEST-04 | Phase 14 | Complete |
| EXPL-01 | Phase 15 | Complete |
| TEST-05 | Phase 15 | Complete |
| EXPL-02 | Phase 16 | Complete |
| EXPL-03 | Phase 16 | Complete |
| EXPL-04 | Phase 16 | Complete |

Coverage: 14/14 v0.3 requirements mapped, no orphans. 13/14 fully complete; MODE-01 pending on-device confirmation (see 13-HUMAN-UAT.md).
