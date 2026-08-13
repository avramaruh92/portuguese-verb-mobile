# Phase 26: Theme Palette Update - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

`src/theme/tokens.ts` becomes the single source of truth for the new brand
guideline color palette. This phase only touches `colors` in
`src/theme/tokens.ts` and its assertions in `src/theme/tokens.test.ts` —
`spacing`, `radius`, and `typography` are untouched. Applying the new tokens
across screens/components is explicitly out of scope (that's Phase 28).

</domain>

<decisions>
## Implementation Decisions

### Color mapping — existing semantic names keep their names, new hex values
- **D-01:** `primary` → `#F2643E` (primary orange, was `#E8663D`)
- **D-02:** `primarySoft` → `#FDE7DF` (soft peach, was `#FCE4DA`)
- **D-03:** `success` → `#1F7F66` (green, was `#2FA84F`)
- **D-04:** `text` → `#24201E` (ink, was `#1C1B1A`)
- **D-05:** `textSecondary` → `#746D69` (stone, was `#6B6560`)
- **D-06:** `background` → `#FFF9F6` (warm background, was `#FFFFFF`) — matches
  the Phase 25 icon/splash warm background for visual continuity from
  splash through first paint (relevant groundwork for Phase 27).
- **D-07:** `surface` → `#F1EFED` (canvas, was `#F2F2F1`)

### Error color — kept outside the 9-color guideline palette
- **D-08:** `error` stays `#D64545` (unchanged). None of the 9 guideline
  colors read as a danger/error color; reusing deep orange would put
  error too close to primary orange and reduce distinctiveness for
  wrong-answer feedback. This is a deliberate, discussed exception to
  "existing semantic token names preserved" being a closed set of only
  the 9 listed hexes — `error` is the one token that keeps its pre-rebrand
  value.

### New aliases (per THEME-01's "pressed/info/background states" clause)
- **D-09:** `pressed` → `#C94A2D` (deep orange) — the pressed/active state
  of `primary`. Not yet wired to any `Pressable` (no screen currently uses
  a pressed-state style function) — this phase only adds the token value;
  wiring it into components is Phase 28's job.
- **D-10:** `info` → `#36799A` (teal) — new semantic color for neutral
  informational UI (e.g., `OfflinePill`), not yet applied to any component
  in this phase.
- **D-11:** No separate `canvas`/`warmBackground` aliases are added —
  `background` and `surface` directly absorb those two guideline colors
  (see D-06/D-07). Only `pressed` and `info` are genuinely new alias keys,
  matching THEME-01's "new aliases added only for pressed/info/background
  states" — the "background" part of that clause is satisfied by
  repointing the existing `background`/`surface` names, not by adding a
  third background-related key.

### Full resulting `colors` object (for planner/executor reference)
```ts
{
  primary: "#F2643E",
  primarySoft: "#FDE7DF",
  pressed: "#C94A2D",
  info: "#36799A",
  success: "#1F7F66",
  error: "#D64545",
  background: "#FFF9F6",
  text: "#24201E",
  textSecondary: "#746D69",
  surface: "#F1EFED",
}
```

### Claude's Discretion
- Exact key ordering in the `colors` object literal.
- Whether `tokens.test.ts`'s existing test structure (one `toEqual` per
  token group) is preserved as-is or split further — the assertion values
  must simply match the mapping above exactly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements source
- `.planning/REQUIREMENTS.md` lines 26-32 — THEME-01/THEME-02 exact wording
  and the 9 guideline hex values (this is the only source for the palette;
  no separate brand-guideline doc exists in the repo).
- `.planning/ROADMAP.md` lines 124-132 — Phase 26 goal and success criteria.

### Cross-phase continuity
- `.planning/phases/25-brand-asset-pipeline/25-CONTEXT.md` — confirms
  `#FFF9F6` (warm background) and `#F2643E` (mark orange) are already the
  app-icon/splash source-of-truth colors from Phase 25; D-06 here keeps
  `colors.background` visually consistent with that.
- Phase 27 (Expo Config & Startup Flash Fix) depends on this phase's
  `background`/`text` token values for `app.json` splash config and
  `app/_layout.tsx` Stack/StatusBar styling — do not rename `background`/
  `text` without checking Phase 27's plan.
- Phase 28 (UI Token Application) is the phase that actually wires
  `pressed`/`info` into components and removes old hardcoded hex literals
  from `app/`/`src/` — this phase (26) only needs the token values to
  exist and be correct, not applied anywhere new.

No external specs beyond the above — requirements fully captured in
decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts` — single flat token module, no `ThemeProvider`;
  every screen/component imports `colors`/`spacing`/`radius`/`typography`
  directly by name. No structural change needed, only value changes.

### Established Patterns
- `src/theme/tokens.test.ts` uses exact `toEqual()` snapshots per token
  group (not partial `toMatchObject`) — THEME-02's update must replace the
  entire `colors` expectation object, not patch individual keys.
- `noUncheckedIndexedAccess` is irrelevant here — `colors` is a flat object
  literal accessed by static key, not indexed.

### Integration Points
- Current call sites of `colors.error`/`colors.success`/`colors.surface`/
  `colors.primarySoft` (confirmed via grep, unchanged by this phase, listed
  for Phase 28's benefit): `app/index.tsx`, `app/quiz.tsx`,
  `app/results.tsx`, `src/components/OfflinePill.tsx`,
  `src/components/ExplanationPanel.tsx`, `src/feedback/ReportFeedbackModal.tsx`,
  `src/productFeedback/ProductFeedbackModal.tsx` — none of these files are
  touched by Phase 26; they keep resolving the same token names, now to new
  hex values, automatically.
- `pressed`/`info` are net-new keys with zero current call sites — adding
  them to `tokens.ts` is inert until Phase 28 references them.

</code_context>

<specifics>
## Specific Ideas

No component-level or visual specifics beyond the color mapping above —
this phase is a pure data/token change, no rendering to review.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (token values only; no
requests to apply tokens to screens, which correctly belongs to Phase 28).

</deferred>

---

*Phase: 26-theme-palette-update*
*Context gathered: 2026-08-13*
