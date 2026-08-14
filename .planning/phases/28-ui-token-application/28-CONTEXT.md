# Phase 28: UI Token Application - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Every screen and shared component visually reflects the new brand palette
established in Phase 26 (`src/theme/tokens.ts`), with zero remaining
dependence on old palette hex values. A codebase scout confirmed every color
usage in `app/`/`src/` already resolves through `colors.*` token names (zero
literal hex outside `src/theme/tokens.ts`/`tokens.test.ts`, zero old-palette
hex values anywhere) — so UI-02's hex-removal criterion is structurally
already satisfied by the token indirection Phase 26 put in place. This
phase's real, discussed work is narrower than "recolor everything": confirm
the Setup heading treatment (UI-01), wire the two token aliases Phase 26
added but left unused (`pressed`, `info`) into actual UI, and add the
`infoSoft` companion token `info` currently lacks. Touches `app/index.tsx`
(heading + Start Quiz button), `app/quiz.tsx` (choice buttons, Next
button), `app/results.tsx` (Share/Try Again buttons), `src/feedback/ReportFeedbackModal.tsx`,
`src/productFeedback/ProductFeedbackModal.tsx` (submit/retry buttons),
`src/components/OfflinePill.tsx`, and `src/theme/tokens.ts` (new `infoSoft`
token). `src/components/ExplanationPanel.tsx` was reviewed and needs no
change — it already fully resolves through tokens with no pressed/info
surface.

</domain>

<decisions>
## Implementation Decisions

### Setup heading (UI-01)
- **D-01:** The "Lafa" heading on the Setup screen stays text-only —
  `typography.heading` (20px/600) + `colors.text`, unchanged from current.
  No icon mark is added next to or instead of the text. Rejected: icon +
  text (would need `Image` wired to the existing `assets/images/icon.png`
  PNG — no `react-native-svg` dependency exists, so any icon use must go
  through RN's built-in `Image` component, not raw SVG); icon-only (UI-01
  explicitly disallows inventing a wordmark, and text-only was preferred
  for the small learning-app context).
- **D-02:** No typography change either — heading styling stays at
  `typography.heading`, not bumped to `typography.display`. This phase is
  about token correctness, not a heading redesign.

### Pressed-state styling (new work, not previously wired)
- **D-03:** Wire `colors.pressed` (`#C94A2D`, deep orange) into pressed-state
  visuals for primary-action buttons only — not every `Pressable` in the
  app. In scope:
  - `app/index.tsx` — `startButton` (Start Quiz)
  - `app/quiz.tsx` — choice buttons, but **only while unanswered**
    (`lockedChoice === null`); once a choice is locked, the existing
    correct/incorrect (`colors.success`/`colors.error`) styling takes over
    and pressed-state no longer applies
  - `app/quiz.tsx` — `nextButton`
  - `app/results.tsx` — `shareButton`, `tryAgainButton`
  - `src/feedback/ReportFeedbackModal.tsx` and
    `src/productFeedback/ProductFeedbackModal.tsx` — the primary submit
    button and the error-state retry button
  - Out of scope: chips (tense/verb-mode selectors on Setup), the header
    Exit link, "Report a problem"/"Help us improve" text links, Results'
    back-to-setup link — these are secondary/low-stakes taps and stay as-is.
- **D-04:** Mechanism: use `Pressable`'s `style` function prop —
  `style={({ pressed }) => [baseStyle, pressed && { backgroundColor: colors.pressed }]}`.
  No `onPressIn`/`onPressOut` + `useState` tracking — the codebase has no
  existing precedent for manual press-state tracking, and the style-function
  form is RN's built-in mechanism for exactly this case.

### OfflinePill info color (new work, completes Phase 26's D-10 intent)
- **D-05:** Switch `OfflinePill` from `primarySoft`/`primary` (orange) to
  `info`-based colors (teal, `#36799A`). This fulfills Phase 26's explicit
  D-10 note that `info` was added specifically for `OfflinePill`, and frees
  `primarySoft` to read as a pure brand/primary accent rather than being
  double-duty for a neutral status pill.
- **D-06:** Add a new `colors.infoSoft` token to `src/theme/tokens.ts`
  (light teal tint), mirroring the existing `primary`/`primarySoft` pairing
  pattern exactly. `OfflinePill`'s pill background becomes `infoSoft`, text
  becomes `info` — same structural pairing as the current
  `primarySoft`-background/`primary`-text pattern, just swapped to the teal
  pair. Exact tint hex for `infoSoft` is Claude's discretion (see below).

### Claude's Discretion
- Exact hex value for the new `colors.infoSoft` token — should read as a
  light tint of `info` (`#36799A`), analogous to how `primarySoft`
  (`#FDE7DF`) relates to `primary` (`#F2643E`). No specific hex was
  requested by the user.
- Exact key placement/ordering of `infoSoft` in the `colors` object literal
  in `tokens.ts`.
- Whether `tokens.test.ts`'s existing per-token-group `toEqual()` structure
  needs restructuring to add the new key, or just an added assertion line —
  implementation mechanics, not a user preference.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (UI-01, UI-02, lines ~51-57) — locked
  requirement text for this phase
- `.planning/ROADMAP.md` §"Phase 28: UI Token Application" (lines 154-163)
  — goal, success criteria, dependencies on Phase 25 (icon asset) and
  Phase 26 (updated tokens)

### Prior phase context (source of the tokens/aliases this phase wires up)
- `.planning/phases/26-theme-palette-update/26-CONTEXT.md` — source of the
  full `colors` object including `pressed` and `info`, both explicitly
  flagged there as "not yet applied to any component in this phase — Phase
  28's job" (D-09, D-10)
- `.planning/phases/25-brand-asset-pipeline/25-CONTEXT.md` — confirms
  `assets/images/icon.png` is the only rendered icon asset available (SVG
  source exists at `assets/brand/lafa-icon.svg` but no SVG rendering
  pipeline is wired into the app) — relevant since the heading decision
  (D-01) rejected using it
- `.planning/phases/27-expo-config-startup-flash-fix/27-CONTEXT.md` — confirms
  no per-screen `Stack.Screen` options override header styling, so this
  phase's button-level changes don't interact with the header work Phase 27
  already did

No other external specs/ADRs — requirements fully captured in decisions
above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts` — current `colors` object already has `pressed`
  (`#C94A2D`) and `info` (`#36799A`) defined but with zero call sites; this
  phase adds `infoSoft` alongside them and wires all three in.
- `assets/images/icon.png` — flattened PNG icon asset from Phase 25, exists
  but is not used anywhere in `app/`/`src/` today; confirmed not needed for
  this phase per D-01.

### Established Patterns
- Every screen/component already imports `colors`/`spacing`/`radius`/`typography`
  by name from `src/theme/tokens.ts` — no `ThemeProvider`, no inline hex
  literals anywhere in `app/`/`src/` (confirmed via repo-wide grep for
  `#[0-9A-Fa-f]{6}` — zero matches outside `src/theme/`).
- `app/quiz.tsx`'s choice buttons already conditionally apply a `style`
  array based on `lockedChoice`/correctness state (see
  `styles.choice`/correct/incorrect variants around lines 257-266) — the new
  pressed-state styling should compose with this existing conditional-style
  pattern, not replace it, and only take effect pre-lock.
- No existing `Pressable` in the codebase uses the `style` function-prop
  form (`style={({pressed}) => ...}`) yet — all current `Pressable`s use a
  static `style` array/object. This phase introduces the first use of that
  pattern.

### Integration Points
- `src/theme/tokens.ts` — add `infoSoft` to the `colors` object; update
  `src/theme/tokens.test.ts`'s `colors` assertion to match.
- `src/components/OfflinePill.tsx` — swap `styles.container.backgroundColor`
  from `colors.primarySoft` to `colors.infoSoft`, `styles.text.color` from
  `colors.primary` to `colors.info`.
- `app/index.tsx` — `startButton` style needs the pressed-state function
  form.
- `app/quiz.tsx` — choice-button styles (pre-lock only) and `nextButton`
  need the pressed-state function form.
- `app/results.tsx` — `shareButton`, `tryAgainButton` need the pressed-state
  function form.
- `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`
  — primary submit button and retry button need the pressed-state function
  form.

</code_context>

<specifics>
## Specific Ideas

No visual mockups or external references — this phase's decisions were
scoped entirely from Phase 26's already-committed token values and the
current codebase's existing button/pill structures.

</specifics>

<deferred>
## Deferred Ideas

None raised beyond phase scope. Pressed-state styling was explicitly scoped
down from "everywhere" to "primary actions only" (D-03) rather than
deferred to a later phase — the secondary/low-stakes Pressables (chips,
text links) are a deliberate exclusion, not a future-phase TODO.

</deferred>

---

*Phase: 28-UI Token Application*
*Context gathered: 2026-08-14*
