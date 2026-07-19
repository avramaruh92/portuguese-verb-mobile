# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- ✅ **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10.1 (shipped 2026-07-17)
- 🚧 **v0.2 Lafa Design System + Tense Label Refresh** — Phases 11-12 (in progress)

## Phases

<details>
<summary>✅ v0.0 Offline Quiz MVP (Phases 1-6) — SHIPPED 2026-07-13</summary>

- [x] Phase 1: Scaffold (2/2 plans) — completed 2026-07-12
- [x] Phase 2: Dataset & Domain Vocabulary (3/3 plans) — completed 2026-07-12
- [x] Phase 3: Quiz Engine (3/3 plans) — completed 2026-07-12
- [x] Phase 4: Quiz Experience (Setup → Quiz → Results) (2/2 plans) — completed 2026-07-12
- [x] Phase 5: Feedback Integration (4/4 plans) — completed 2026-07-13
- [x] Phase 6: Polish & Verification (4/4 plans) — completed 2026-07-13

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.0-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.1 Online Quiz, Exit Flow & UI Polish (Phases 7-10.1) — SHIPPED 2026-07-17</summary>

- [x] Phase 7: Dataset Seam & Fetch/Fallback Pipeline (3/3 plans) — completed 2026-07-13
- [x] Phase 8: Async Quiz Start & Dataset Snapshot (2/2 plans) — completed 2026-07-14
- [x] Phase 9: End-Quiz-Early Flow (2/2 plans) — completed 2026-07-14
- [x] Phase 10: Safe-Area & Visual Polish (4/4 plans) — completed 2026-07-14
- [x] Phase 10.1: Close gap: UI-03 — Offline Content Indicator (INSERTED) (2/2 plans) — completed 2026-07-17

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.1-ROADMAP.md`.

</details>

### 🚧 v0.2 Lafa Design System + Tense Label Refresh (In Progress)

**Milestone Goal:** Apply the Lafa brand identity (colors, typography,
tense-label copy) to the shipped app without changing quiz logic, backend
contracts, dataset keys, or navigation.

- [ ] **Phase 11: Lafa Design Tokens & Brand Identity** - Rebrand app name, restyle all screens and shared components onto the new Lafa token set
- [ ] **Phase 12: Tense Label Refresh** - Update displayed tense labels to friendly English names, keep internal enum literals and payloads locked

## Phase Details

### Phase 11: Lafa Design Tokens & Brand Identity
**Goal**: The app displays as "Lafa" and every screen and shared component renders using the new Lafa design tokens (colors, typography, spacing, radius) — no default iOS-blue or hardcoded hex values remain anywhere.
**Depends on**: Nothing (first phase of v0.2)
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, TEST-02
**Success Criteria** (what must be TRUE):
  1. App displays "Lafa" as its name — Setup screen heading and `app.json`'s `expo.name` both read "Lafa" instead of "Portuguese Verb Quiz"
  2. Setup, Quiz, and Results screens, plus `OfflinePill` and `ReportFeedbackModal`, all render using tokens from `src/theme/tokens.ts` — no default iOS-blue or hardcoded hex values remain in any of these files
  3. Answer-choice states (default/selected-correct/selected-wrong) keep existing selection behavior, now styled with Lafa `success`/`error` tokens and white text on colored choices
  4. `OfflinePill` displays with `primarySoft` background, `primary` text, and `pill` radius, with its "Using saved content" copy unchanged
  5. A token-completeness Jest test passes, confirming all required Lafa token keys exist in `src/theme/tokens.ts`
**Plans**: TBD
**UI hint**: yes

### Phase 12: Tense Label Refresh
**Goal**: Displayed tense labels read as friendly English names ("Completed past", "Imperfect past") while every internal enum literal and outbound `POST /feedback` payload remains exactly as locked by the backend contract.
**Depends on**: Phase 11 (reuses the Lafa typography/spacing system for secondary/help-text styling)
**Requirements**: LABEL-01, LABEL-02, LABEL-03, TEST-01
**Success Criteria** (what must be TRUE):
  1. Displayed tense labels read "Completed past" for `preterite` and "Imperfect past" for `imperfect`; `present_indicative` still reads "Present" and `future` still reads "Future"
  2. Portuguese grammar names ("Pretérito perfeito"/"Pretérito imperfeito") appear only as secondary/help text where space allows, never as the primary label, and "Perfect past" is never used anywhere in the UI
  3. The `POST /feedback` payload continues to send the exact locked backend enum literals (`present_indicative`/`preterite`/`imperfect`/`future`) unchanged — the label change is display-only
  4. `__tests__/quiz-labels.test.ts` passes, asserting the new displayed labels while confirming internal literals are unchanged
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|-----------------|--------|-----------|
| 1. Scaffold | v0.0 | 2/2 | Complete | 2026-07-12 |
| 2. Dataset & Domain Vocabulary | v0.0 | 3/3 | Complete | 2026-07-12 |
| 3. Quiz Engine | v0.0 | 3/3 | Complete | 2026-07-12 |
| 4. Quiz Experience (Setup → Quiz → Results) | v0.0 | 2/2 | Complete | 2026-07-12 |
| 5. Feedback Integration | v0.0 | 4/4 | Complete | 2026-07-13 |
| 6. Polish & Verification | v0.0 | 4/4 | Complete | 2026-07-13 |
| 7. Dataset Seam & Fetch/Fallback Pipeline | v0.1 | 3/3 | Complete | 2026-07-13 |
| 8. Async Quiz Start & Dataset Snapshot | v0.1 | 2/2 | Complete | 2026-07-14 |
| 9. End-Quiz-Early Flow | v0.1 | 2/2 | Complete | 2026-07-14 |
| 10. Safe-Area & Visual Polish | v0.1 | 4/4 | Complete | 2026-07-14 |
| 10.1. Close gap: UI-03 — Offline Content Indicator | v0.1 | 2/2 | Complete | 2026-07-17 |
| 11. Lafa Design Tokens & Brand Identity | v0.2 | 0/TBD | Not started | - |
| 12. Tense Label Refresh | v0.2 | 0/TBD | Not started | - |

---

*Milestones v0.0 and v0.1 shipped. v0.2 roadmap drafted — awaiting approval. Run `/gsd:plan-phase 11` once approved.*
