# Phase 27: Expo Config & Startup Flash Fix - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Cold app launch never shows Expo's default blue splash or an unbranded
background — the warm Lafa background (`#FFF9F6`) is visible end-to-end from
splash through first paint. This phase touches `app.json`'s
`expo-splash-screen` plugin config, `android.adaptiveIcon`, top-level
`userInterfaceStyle`, and `app/_layout.tsx`'s Stack/StatusBar/expo-system-ui
wiring. Requirements CONFIG-01 through CONFIG-04 already lock the exact
target hex values, `imageWidth`, and config fields — this discussion covered
only the remaining implementation choices those requirements leave open.

</domain>

<decisions>
## Implementation Decisions

### Orphaned Android background asset
- **D-01:** When `android.adaptiveIcon.backgroundImage` is removed from
  `app.json` (CONFIG-02), also delete `assets/images/android-icon-background.png`
  from the repo — don't leave it as a dead file. Matches the asset-cleanup
  precedent set in Phase 25.

### Header token mapping (CONFIG-04)
- **D-02:** `Stack` `screenOptions.headerStyle.backgroundColor` = `colors.background`
  (`#FFF9F6`) — same warm tone as the splash screen, for a seamless
  splash-to-first-screen transition.
- **D-03:** `Stack` `screenOptions.headerTintColor` = `colors.text` (`#24201E`)
  — dark ink for the back button/title, consistent with `userInterfaceStyle: "light"`
  and the dark-content status bar (D-04).
- Rejected alternative: `colors.surface` background + `colors.primary` tint
  (more brand-forward but less neutral for nav chrome).
- No per-screen `Stack.Screen` overrides currently set `headerStyle`/
  `headerTintColor` (`app/index.tsx`, `app/quiz.tsx`, `app/results.tsx` only
  set `headerShown`/`headerTitle`), so setting these on the root `Stack`'s
  `screenOptions` in `_layout.tsx` propagates to all three screens without
  per-screen edits.

### Status bar approach (CONFIG-04)
- **D-04:** Render `<StatusBar style="dark" />` from `expo-status-bar`
  (already a dependency, currently unused anywhere in `app/`/`src/`) once in
  `RootLayout` (`app/_layout.tsx`). Declarative, React-driven, no app.json
  plugin config needed for this — `expo-status-bar`'s static config is mostly
  for Android translucency, not the dark/light content choice.

### expo-system-ui wiring (CONFIG-04)
- **D-05:** Call `SystemUI.setBackgroundColorAsync("#FFF9F6")` (from
  `expo-system-ui`, already a dependency, currently unused) in its own
  separate `useEffect` in `app/_layout.tsx` — not folded into the existing
  `prefetch()` effect. Keeps the UI-setup concern (root background) separate
  from the dataset-prefetch concern.

### Claude's Discretion
- Exact hex/imageWidth/userInterfaceStyle values for CONFIG-01/02/03 are
  already fully specified by REQUIREMENTS.md — no discretion needed there,
  just apply them.
- Whether the `SystemUI.setBackgroundColorAsync` call needs error handling
  (e.g. try/catch) is left to the planner/executor — check existing patterns
  in the codebase for how fire-and-forget native calls are handled (if any
  precedent exists).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (CONFIG-01 through CONFIG-04, lines ~36-47) —
  locked exact target values for this phase
- `.planning/ROADMAP.md` (Phase 27 section) — goal, success criteria,
  dependencies on Phase 25 (regenerated `splash-icon.png`) and Phase 26
  (brand tokens)

### Prior phase context (dependencies)
- `.planning/phases/25-brand-asset-pipeline/25-01-PLAN.md` — confirms
  `android-icon-background.png` was deliberately left untouched, explicitly
  deferred to this phase
- `.planning/phases/26-theme-palette-update/` — source of the brand token
  values (`colors.background`, `colors.text`, etc.) this phase consumes

No other external specs/ADRs — requirements fully captured in decisions
above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts` — `colors.background` (`#FFF9F6`), `colors.text`
  (`#24201E`), `colors.surface` (`#F1EFED`) already exist with the correct
  final values (Phase 26 shipped these) — no new tokens needed for this
  phase.
- `expo-status-bar` (`~57.0.1`) and `expo-system-ui` (`~57.0.1`) are both
  already in `package.json` dependencies but currently unimported anywhere
  in `app/`/`src/` — no new npm install required.

### Established Patterns
- `app/_layout.tsx` currently has one `useEffect` calling `prefetch()` on
  mount, wrapped in `SafeAreaProvider` around a bare `<Stack screenOptions={{ headerShown: true }} />`
  — this is the file CONFIG-04 changes are added to.
- None of `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx` override
  `headerStyle`/`headerTintColor` in their `Stack.Screen options` — they only
  set `headerShown`/`headerTitle` (and `quiz.tsx` sets its own back-button
  interception options). Root-level `screenOptions` changes will apply
  everywhere without touching these three files.

### Integration Points
- `app.json`'s `expo-splash-screen` plugin block (`backgroundColor`,
  `image`, `imageWidth`) — CONFIG-01.
- `app.json`'s `android.adaptiveIcon` block (`backgroundColor`,
  `backgroundImage` removal) — CONFIG-02.
- `app.json`'s top-level `userInterfaceStyle` — CONFIG-03 (currently
  `"automatic"`, target `"light"`).
- `app/_layout.tsx`'s `Stack screenOptions` + new `StatusBar` + new
  `expo-system-ui` effect — CONFIG-04.

</code_context>

<specifics>
## Specific Ideas

No specific visual references beyond the already-locked hex values in
REQUIREMENTS.md — this phase is mechanical config/wiring work, not new
visual design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Per-screen palette application
beyond the header (screen bodies, buttons, cards) is explicitly Phase 28's
scope (UI-01, UI-02), not touched here.

</deferred>

---

*Phase: 27-Expo Config & Startup Flash Fix*
*Context gathered: 2026-08-13*
