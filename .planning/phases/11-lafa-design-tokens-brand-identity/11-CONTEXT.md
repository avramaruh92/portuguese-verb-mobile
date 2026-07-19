# Phase 11: Lafa Design Tokens & Brand Identity - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebrand the app's visible identity from "Portuguese Verb Quiz" to "Lafa" and
replace the default iOS-blue token set with the new Lafa palette, typography
(unchanged values, just formalized), spacing (unchanged), and radius tokens
in `src/theme/tokens.ts`. Migrate all screens (Setup, Quiz, Results) and
shared components (`OfflinePill`, `ReportFeedbackModal`) onto the new tokens
— no default iOS-blue or hardcoded hex values remain anywhere in those
files. No quiz logic, backend contract, dataset key, or navigation changes.

</domain>

<decisions>
## Implementation Decisions

### Palette (no external design doc available — palette proposed and approved in this discussion)
- **D-01:** Lafa palette locked as follows (replaces the entire current
  `colors` export in `src/theme/tokens.ts`):
  - `primary: "#E8663D"` (warm terracotta/coral — buttons, active states; replaces `accent`)
  - `primarySoft: "#FCE4DA"` (light tint of primary — used ONLY where BRAND-04 explicitly calls for it, i.e. `OfflinePill`)
  - `success: "#2FA84F"` (correct-answer state)
  - `error: "#D64545"` (wrong-answer state)
  - `background: "#FFFFFF"` (unchanged)
  - `text: "#1C1B1A"` (near-black, replaces pure `#000000`)
  - `textSecondary: "#6B6560"` (warm gray, replaces `#8E8E93`)
  - `surface: "#F2F2F1"` (NEW — neutral gray for input fields / inactive
    buttons in `ReportFeedbackModal`; replaces the old `secondary` key's
    role. Deliberately kept separate from `primarySoft` so neutral surfaces
    don't get accidentally coral-tinted — see D-03.)

### Token key strategy
- **D-02:** Rename in place, not additive. `accent` → `primary`,
  `secondary` → split into `primarySoft` (BRAND-04's explicit OfflinePill
  use) and `surface` (everything else that was gray). No dead/duplicate
  keys should remain after this phase — every consumer of the old key
  names must be updated in the same pass.
- **D-03:** `primarySoft` (#FCE4DA, coral tint) is reserved for
  `OfflinePill` per BRAND-04's literal wording. All other current
  `colors.secondary` (#F2F2F7 gray) usages — `ReportFeedbackModal`'s input
  field backgrounds and reason-picker buttons — migrate to the new
  `surface` neutral-gray token instead, to avoid an unintended coral tint
  spreading across neutral UI surfaces that BRAND-02/03/04 don't describe.
- **D-04:** Radius: keep `radius.control` (12, buttons/inputs) unchanged,
  add a new `radius.pill` token (true pill shape, e.g. 999 or
  half-of-height) specifically for `OfflinePill` per BRAND-04.

### Typography & spacing
- **D-05:** Typography scale (`caption`/`body`/`bodyStrong`/`heading`/
  `display`, all current sizes/weights) is UNCHANGED this phase. No custom
  fonts, no new sizes/weights — matches REQUIREMENTS.md's explicit
  "typography stays system-font" / no-typography-scope-creep constraint.
- **D-06:** Spacing scale (`sm`/`md`/`lg`/`xl2`/`xl3`/`choiceGap`) is
  UNCHANGED this phase. `OfflinePill`'s pill padding reuses existing
  `spacing.sm`; no new spacing tokens needed.

### App identity scope (BRAND-01)
- **D-07:** Change `app.json`'s `expo.name` from `"Portuguese Verb Quiz"`
  to `"Lafa"` (this also drives the iOS home-screen label since no separate
  `ios.displayName` override exists in `app.json`), and change the Setup
  screen (`app/index.tsx`) heading text from `"Portuguese Verb Quiz"` to
  `"Lafa"`.
- **D-08:** `slug` (`portuguese-verb-mobile`) and `scheme`
  (`portugueseverbmobile`) in `app.json` stay UNCHANGED — locked by
  CLAUDE.md's repo/slug convention. App icon and splash screen are
  out of scope per REQUIREMENTS.md.
- **D-09:** `src/quiz/share.ts`'s native share message
  (`"I scored X/Y on Portuguese Verb Quiz!"`) also gets updated to say
  "Lafa" in this phase — discovered as a third hardcoded old-name location
  during discussion (beyond `app.json` and the Setup heading) and the user
  chose to include it here rather than defer it, since it's cheap and
  user-facing brand text.

### Answer-choice states (BRAND-03)
- **D-10:** Answer-choice visual states (default/selected-correct/
  selected-wrong) keep their existing selection *behavior* unchanged, only
  restyled to use the new `success`/`error` color tokens (D-01) with white
  text on colored (success/error) choices, per BRAND-03's exact wording.
  No new interaction states introduced.

### Claude's Discretion
- Exact `radius.pill` numeric value (999 vs. computed half-height) —
  implementer's choice, as long as it renders as a true pill shape on
  `OfflinePill`.
- Whether `surface` needs a dedicated `textOnSurface` variant or reuses
  existing `text`/`textSecondary` — not raised as a gray area since no
  contrast issue was flagged; default to reusing existing text colors
  unless implementation reveals a contrast problem.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §"Branding & Visual Identity" (BRAND-01..04)
  and §"Testing" (TEST-02) — the locked requirement text for this phase
- `.planning/ROADMAP.md` §"Phase 11: Lafa Design Tokens & Brand Identity"
  — goal and success criteria

### Design source
- No external Lafa design doc was available to this discussion (the
  Codex-authored "Lafa v0.1 Design System + Tense Label Refresh" doc
  referenced in `PROJECT.md` is not version-controlled in this repo and
  the user did not have its values on hand). The palette in `<decisions>`
  D-01 was proposed during this discussion and approved by the user — it
  is the source of truth for this phase, not a pre-existing external doc.
  If the actual Codex design doc surfaces later with different values,
  treat it as superseding D-01.

### Files to modify (identified during discussion)
- `src/theme/tokens.ts` — full token rewrite (colors rename + new keys,
  radius addition)
- `app.json` — `expo.name`
- `app/index.tsx` — Setup screen heading text + colors.accent/secondary
  consumers
- `app/quiz.tsx` — answer-choice state styling consumers
- `app/results.tsx` — token consumers
- `src/components/OfflinePill.tsx` — `primarySoft`/`primary`/`pill` radius
- `src/feedback/ReportFeedbackModal.tsx` — currently 100% hardcoded hex
  (see Existing Code Insights below), full migration onto tokens including
  new `surface` key
- `src/quiz/share.ts` — share message brand-name text (D-09)
- `__tests__/*` — new token-completeness test (TEST-02); existing tests
  referencing old color keys/values will need updating if any assert on
  literal hex or old key names

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts`: single existing token module, already imported by
  all 3 screens and `OfflinePill` — extend/rename in place rather than
  introducing a second token file.

### Established Patterns
- `ReportFeedbackModal.tsx` is the one component that bypasses tokens
  entirely — its entire `StyleSheet.create` block hardcodes hex values
  directly (`#FFFFFF`, `#007AFF`, `#FF3B30`, `#34C759`, `#8E8E93`,
  `#F2F2F7`, `#000000`). This is a known, already-documented anti-pattern
  in `.planning/codebase/ARCHITECTURE.md` — this phase is what finally
  fixes it (BRAND-02 requires zero hardcoded hex in this file).
- `OfflinePill.tsx` already correctly imports from `theme/tokens` — only
  needs its `colors.secondary` reference swapped to `colors.primarySoft`
  and its radius swapped to the new `radius.pill`.

### Integration Points
- Old key names (`colors.accent`, `colors.secondary`) are referenced
  across `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`,
  `src/components/OfflinePill.tsx` — a full-repo grep for `colors.accent`
  and `colors.secondary` is needed before renaming to catch every call
  site (rename-in-place per D-02 means nothing should reference the old
  key names after this phase).

</code_context>

<specifics>
## Specific Ideas

- Palette mood: "warm & friendly," distinct from iOS-blue and from
  Duolingo-green — landed on a coral/terracotta primary (#E8663D) as the
  approved direction (see D-01).
- No existing brand mark/logo constrains the color choice — the palette
  was chosen fresh for this discussion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The `src/quiz/share.ts`
brand-name text was initially raised as a possible defer-to-later item but
the user opted to include it in this phase instead — see D-09, not
deferred.)

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 11-Lafa Design Tokens & Brand Identity*
*Context gathered: 2026-07-19*
