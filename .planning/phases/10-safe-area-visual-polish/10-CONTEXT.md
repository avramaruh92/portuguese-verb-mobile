# Phase 10: Safe-Area & Visual Polish - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The app looks and feels like a coherent, finished product: no content renders
under the iOS status bar/notch/home indicator on any of the 3 screens, Setup/
Quiz/Results share a consistent visual language (spacing, typography, color)
drawn from shared style tokens instead of one-off per-screen values, and the
existing fetch-adjacent loading/error surfaces (the Start/Try Again "Starting…"
button state, and the `status === "error"` text) get proper styling. Covers
UI-01, UI-02, UI-03 only. Does NOT touch the exit-flow behavior built in
Phase 9 (only its visual treatment may change) or the fetch/snapshot
pipeline's actual logic (Phases 7-8, unchanged).

</domain>

<decisions>
## Implementation Decisions

### Header/safe-area strategy
- **D-01:** All 3 screens (Setup, Quiz, Results) get a native Expo Router
  `Stack.Screen` header — not just Quiz. This replaces the current
  `headerShown: false` app-wide default in `app/_layout.tsx` (or overrides it
  per-screen) so every screen gets correct top-safe-area handling for free
  via the native header, consistent with how Quiz already handles its own
  inset. Bottom/home-indicator safe area (not covered by the native header)
  still needs explicit handling — via `SafeAreaProvider` +
  `useSafeAreaInsets`/`SafeAreaView` bottom padding on scrollable/actionable
  content — since `react-native-safe-area-context` is already an installed
  dependency but not yet wired anywhere in the app.

### Header titles
- **D-02:** All 3 headers stay **empty/untitled** (`headerTitle: ""`, matching
  Quiz's current treatment) — headers exist for safe-area/chrome consistency,
  not as title bars. Setup keeps its existing on-screen "Portuguese Verb
  Quiz" heading in the screen body, unchanged. No new title text is
  introduced on Results either.

### Visual palette & style tokens
- **D-03:** Keep the current iOS-system color palette exactly as-is — blue
  `#007AFF` (primary actions/selected state), light gray `#F2F2F7` (secondary
  backgrounds/unselected chips), green `#34C759` (correct answer), red
  `#FF3B30` (wrong answer / error text), gray `#8E8E93` (secondary/caption
  text), white `#FFFFFF` (screen background), black `#000000` (primary text).
  This is a **pure tokenization pass, not a redesign** — extract these exact
  values (plus the existing spacing scale: 8/12/16/24/48/64 and font sizes:
  14/16/20/56) into a shared tokens module all 3 screens import from, with
  zero visible color/spacing change to the end user. Lowest-risk choice for a
  single-milestone polish phase.

### Fetch loading indicator (UI-03, part 1)
- **D-04:** No new visible loading UI is added anywhere in the app. The
  background `prefetch()` (Phase 7/8) stays fully silent/invisible during
  app launch — the ONLY loading-state surface in the app is the existing
  "Starting…" button-text-swap on Setup's Start button and Results' Try
  Again button (built functionally in Phase 8, this phase gives it real
  visual polish — e.g. an activity-indicator glyph alongside/instead of the
  disabled-opacity text swap). Confirmed: the roadmap's "styled loading
  indicator while the app resolves remote content" success criterion is
  satisfied by this existing button state, not a new always-visible
  status element.

### Error/fallback state styling (UI-03, part 2)
- **D-05:** The existing `status === 'error'` red text on Setup and Results
  is restyled with the new shared tokens (proper spacing/card treatment
  instead of bare inline red text) — no new error surface is introduced.
  Confirmed during discussion: fetch failures are already silently absorbed
  by Phase 7's fallback-to-local-dataset behavior and never reach this error
  state; the only real-world trigger for `status === 'error'` today is
  `startQuiz()`'s own `InsufficientVerbsError` (e.g. a tense/irregular filter
  combination yielding fewer than 10 eligible questions) — this phase styles
  that existing state, it does not add fetch-specific error handling.

### Claude's Discretion
- Exact tokens module location/naming (e.g. `src/theme/tokens.ts` vs
  `src/styles/tokens.ts`) and shape (flat exports vs a single `theme` object)
  — implementation detail, no user-visible difference.
- Whether Setup/Results' native headers get a `headerLeft`/back affordance or
  stay chrome-only with no left/right elements — Claude decides during
  planning; D-01/D-02 only lock that headers exist and are titleless, not
  their full button configuration. Note Results already has an in-body "Back
  to Setup" button — a header back button would be redundant, so leaning
  toward chrome-only headers for Setup/Results unless planning finds a
  reason otherwise.
- Exact activity-indicator treatment for the "Starting…" button state (RN
  core `ActivityIndicator` component vs a text-only polish) — Claude's call,
  should feel native/iOS-consistent per the kept palette (D-03).
- Whether `SafeAreaProvider` wraps the root in `app/_layout.tsx` (new) vs
  some other mount point — must be the root layout per standard Expo Router
  convention, no real alternative to weigh here.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03 (this phase's requirements)
- `.planning/ROADMAP.md` §"Phase 10: Safe-Area & Visual Polish" — the 4
  success criteria (no content under status bar/notch/home indicator,
  consistent visual language via shared tokens, styled loading indicator
  while resolving remote content, styled error/fallback state)

### Prior phase context (read for continuity — this phase inherits their
"Phase 10 owns final styling" carve-outs)
- `.planning/phases/09-end-quiz-early-flow/09-CONTEXT.md` — D-01 (Quiz's
  native header + Exit button, temporary/functional-first, explicitly left
  open for this phase to restyle — NOT to change the underlying exit
  behavior), D-03 (Exit button label "Exit", appearance only may change here)
- `.planning/phases/08-async-quiz-start-dataset-snapshot/08-CONTEXT.md` —
  D-02 (Start/Try Again "Starting…" button loading state — functional only,
  explicitly deferred final visual treatment to this phase, see D-04 above)
- `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-CONTEXT.md` —
  D-03/D-05/D-06 (why fetch failures never surface as a user-facing error —
  informs D-05's scoping of the error state to `InsufficientVerbsError` only)

### Existing code (read before touching)
- `app/_layout.tsx` — currently `<Stack screenOptions={{ headerShown: false
  }}>` with a `prefetch()` `useEffect`; this phase changes the header default
  and adds `SafeAreaProvider` wrapping here
- `app/index.tsx` (Setup) — inline `StyleSheet`, on-screen heading text,
  Start button with existing `starting` state/"Starting…" text swap,
  `status === 'error' && errorMessage` red-text block
- `app/quiz.tsx` (Quiz) — already has a native `Stack.Screen` header with
  `headerLeft` Exit button (Phase 9) — the pattern to extend to the other 2
  screens' header setup (titleless, but Quiz keeps its Exit `headerLeft`)
- `app/results.tsx` (Results) — inline `StyleSheet`, Try Again button with
  existing `starting` state/"Starting…" text swap, `status === 'error' &&
  errorMessage` red-text block, existing in-body "Back to Setup" button
- `package.json` — confirms `react-native-safe-area-context: ~5.7.0` already
  installed as a dependency but not yet imported/wired anywhere in the app
  (known v0.0 tech debt this phase resolves)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `react-native-safe-area-context` (already installed, unused) —
  `SafeAreaProvider` for the root layout, `useSafeAreaInsets`/`SafeAreaView`
  for bottom-inset padding on each screen's scrollable/actionable content.
- `app/quiz.tsx`'s existing `Stack.Screen options={{ headerShown: true,
  headerTitle: "", headerLeft: ... }}` — the exact pattern to replicate
  (titleless) on Setup/Results, minus the `headerLeft` Exit button which
  stays Quiz-only.

### Established Patterns
- All 3 screens currently define their own `StyleSheet.create({...})` at the
  bottom of the file with duplicated color/spacing/font-size literals
  (`#007AFF`, `#F2F2F7`, `#FF3B30`, `#8E8E93`, `16`, `24`, etc.) — this phase
  replaces the duplicated literals with imports from the new shared tokens
  module, keeping each screen's own `StyleSheet.create` structure otherwise
  intact.
- The `starting`/`unexpectedError` local `useState` pattern is duplicated
  identically in `app/index.tsx` and `app/results.tsx` — this phase only
  restyles the JSX these states render, not the state logic itself.

### Integration Points
- `app/_layout.tsx` is the single integration point for both `SafeAreaProvider`
  (wraps `<Stack>`) and the header-default change (`headerShown` flips from
  app-wide `false` to `true`, with each screen's own `Stack.Screen options`
  setting `headerTitle: ""`).
- A new shared tokens module (location per Claude's Discretion) becomes an
  import in all 3 screen files' `StyleSheet.create` calls — no other files
  need to change.

</code_context>

<specifics>
## Specific Ideas

No specific mockups or external references — the four decisions above (D-01
through D-05) fully specify the visual scope: headers everywhere for
safe-area (titleless), tokenize the existing palette unchanged, polish the
existing "Starting…" button state as the sole loading indicator, and restyle
the existing error text without adding new error surfaces.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The "refresh the look" and
"new always-visible fetch status indicator" options were considered and
explicitly declined in favor of the lower-risk polish-only approach — not
deferred to a future phase, just not chosen.)

</deferred>

---

*Phase: 10-Safe-Area & Visual Polish*
*Context gathered: 2026-07-14*
