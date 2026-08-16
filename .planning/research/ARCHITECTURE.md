# Architecture Research

**Domain:** Expo/React Native app — brand-asset generation pipeline, homepage image lockup, design-token pressed-state fix, App Store submission readiness
**Researched:** 2026-08-16
**Confidence:** HIGH (all findings verified by reading the actual current source files, not training-data assumption)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BRAND SOURCE (new, this milestone)                                       │
│  assets/brand/candidates/lafa-icon-warm-bold.svg   (icon/splash source)   │
│  assets/brand/candidates/lafa-homepage-lockup.svg  (lockup source)        │
│  → promoted to: assets/brand/lafa-icon.svg (icon)                         │
│                 assets/brand/lafa-homepage-lockup.svg (lockup, new file)  │
│  Both need STABLE <g id="..."> layer ids added during promotion —         │
│  neither candidate SVG currently has them (verified: only <clipPath id>,  │
│  <title id>, <desc id> exist today, zero <g id="mark"> anywhere)          │
├──────────────────────────────────────────────────────────────────────────┤
│  GENERATOR (scripts/generate-brand-assets.ts — single script, extended)   │
│  reads lafa-icon.svg          → icon.png / favicon.png / splash-icon.png/ │
│                                   android-icon-foreground.png/monochrome  │
│  reads lafa-homepage-lockup.svg → lafa-homepage-lockup.png (NEW output)   │
├──────────────────────────────────────────────────────────────────────────┤
│  VALIDATOR (scripts/validate-brand.ts — extended, same standalone shape)  │
│  checks: warm-bold source is canonical, all PNG dims/alpha, lockup PNG    │
│  exists, forbidden-hex absence — independent literal list, does NOT       │
│  import from generate-brand-assets.ts (existing convention)               │
├──────────────────────────────────────────────────────────────────────────┤
│  CONSUMPTION                                                              │
│  app.json → assets/images/{icon,splash-icon,favicon,android-*}.png        │
│  app/index.tsx → assets/images/lafa-homepage-lockup.png (NEW, replaces    │
│    the plain <Text>Lafa</Text> heading) via an <Image>/expo-image         │
├──────────────────────────────────────────────────────────────────────────┤
│  TOKENS (src/theme/tokens.ts — one new key)                               │
│  colors.choicePressed = "#E7DFDA"  → consumed by ONE call site:           │
│  app/quiz.tsx's answer-choice Pressable (line ~148), NOT the Next/primary │
│  buttons which keep colors.pressed                                       │
├──────────────────────────────────────────────────────────────────────────┤
│  STORE SUBMISSION ARTIFACTS (new, outside src/app, versioned separately)  │
│  eas.json → new/extended profile for store-ready production build         │
│  store/ or .planning/store/ → metadata, review notes, screenshot manifest │
│  (no code integration — pure repo/process artifacts, gh/EAS CLI driven)   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `assets/brand/lafa-icon.svg` (replaced) | Canonical icon/splash/Android source | Single SVG, promoted from `candidates/lafa-icon-warm-bold.svg`, background rect + one or more `<g id="mark">` groups |
| `assets/brand/lafa-homepage-lockup.svg` (new) | Canonical Setup-screen lockup source | Single SVG, promoted from `candidates/lafa-homepage-lockup.svg` (mark + wordmark `<text>` + accent dot + tagline `<text>`), needs its own stable ids if the generator needs to isolate/recolor sub-parts (it doesn't currently — the whole lockup rasterizes as one flat image) |
| `scripts/generate-brand-assets.ts` (extended) | Deterministic, idempotent SVG→PNG asset generation, single source of truth for all shipped brand PNGs | Same script, additional `SOURCE_LOCKUP_SVG_PATH`/`LOCKUP_OUTPUT_PATH` constants + one new render step at the end of `main()`; icon-extraction logic rewritten to use `querySelector`-style id lookup instead of fill-string counting |
| `scripts/validate-brand.ts` (extended) | Permanent regression gate on brand-asset correctness | Same script, additional checks appended to the `results` array in `main()`; independent literal list (does not import generator constants) |
| `app/index.tsx` (modified) | Setup screen — currently renders `<Text style={styles.heading}>Lafa</Text>`; swaps to an `<Image>` lockup | Static `require("../assets/images/lafa-homepage-lockup.png")`, `resizeMode="contain"`/`contentFit="contain"`, no dynamic sizing logic needed (fixed aspect ratio from a 1600×520 source) |
| `src/theme/tokens.ts` (modified) | Design tokens — flat `colors` export, no ThemeProvider | Add one key, `choicePressed`, alongside existing `pressed`/`success`/`error`; `tokens.test.ts` must be updated for its exhaustive `toEqual()` assertion |
| `app/quiz.tsx` (modified) | Owns the answer-choice `Pressable` press-state branching | The array-form `style` prop at the choice `Pressable` (`lockedChoice === null && pressed && {...}`) swaps `colors.pressed` → `colors.choicePressed`; the `Next` button `Pressable` (separate element, same file) is untouched |
| `eas.json` (possibly extended) | Build/submit profile source of truth | Existing `production` build+submit profile likely reusable as-is for the store submission; verify whether Apple requires anything eas.json-level beyond what's already configured (it does not — screenshots/metadata are ASC-side, not eas.json-side) |
| Store metadata files (new) | Human-authored App Store Connect copy, versioned for review/history | New `store/` (or `.planning/store/`) directory: `description.md`, `keywords.txt`, `review-notes.md`, `privacy-answers.md`, screenshot source list — **not consumed by any build tool**, purely documentation/authoring convenience unless `eas metadata`/`fastlane`-style tooling is deliberately adopted (out of scope per this milestone's stated constraints — no fastlane) |

## Recommended Project Structure

```
assets/
├── brand/
│   ├── lafa-icon.svg                  # REPLACED: promoted warm-bold source (add stable <g id> layers)
│   ├── lafa-homepage-lockup.svg       # NEW: promoted lockup source
│   └── candidates/                    # existing exploration dir — stays untracked/reference-only,
│                                       #   NOT read by generate-brand-assets.ts (avoid a second source of truth)
├── images/
│   ├── icon.png                       # unchanged output path, new pixel content
│   ├── favicon.png                    # unchanged output path, new pixel content
│   ├── splash-icon.png                # unchanged output path, new pixel content
│   ├── android-icon-foreground.png    # unchanged output path, new pixel content
│   ├── android-icon-monochrome.png    # unchanged output path, new pixel content
│   └── lafa-homepage-lockup.png       # NEW output, consumed by app/index.tsx
scripts/
├── generate-brand-assets.ts           # EXTENDED — same file, id-based extraction + lockup render step
├── validate-brand.ts                  # EXTENDED — same file, new checks appended
└── preflight.ts                       # unchanged, unrelated to this milestone
app/
├── index.tsx                          # MODIFIED — Text heading → Image lockup
└── quiz.tsx                           # MODIFIED — one Pressable style branch: colors.pressed → colors.choicePressed
src/theme/
├── tokens.ts                          # MODIFIED — + colors.choicePressed
└── tokens.test.ts                     # MODIFIED — assert new key
store/                                  # NEW, top-level, not under src/ or app/ (not app runtime code)
├── metadata/
│   ├── description.md
│   ├── keywords.txt
│   ├── support-privacy-urls.md
│   └── review-notes.md
├── privacy/
│   └── nutrition-label-answers.md
└── screenshots/                       # source PNGs or a capture script's output dir, gitignored if large
```

### Structure Rationale

- **One generator script, not two:** the existing script is already structured as "read one SVG source, produce N outputs" — the lockup is just another output driven by another (single) source SVG at the same trust level as the icon source. Splitting into a second script would duplicate the Resvg/sharp boilerplate (canvas setup, PNG writing, error-message conventions) for no isolation benefit — `validate-brand.ts` already treats "the generator" as one unit to audit.
- **`candidates/` is exploration-only, never a build input:** promoting means *copying/renaming* the chosen SVG into `assets/brand/` as the new canonical file (matching the exact pattern the v0.6 rebrand already used — `lafa-icon.svg` fully replaced prior AI-concept sources, zero dual-source ambiguity). `generate-brand-assets.ts` must only ever read from `assets/brand/*.svg` at fixed, hardcoded paths — never from `candidates/`.
- **`store/` sits outside `src/`/`app/`/`assets/`:** it is not consumed by Metro, TypeScript, or any runtime code — it's pure documentation/process artifact, same tier as `.planning/`. Putting it under `.planning/` (e.g. `.planning/store/`) is equally valid and arguably more consistent with this repo's existing convention of keeping non-shipped planning/process docs under `.planning/`; either location works as long as it's excluded from anything bundled into the app binary (it already would be — Metro only bundles what's imported).

## Architectural Patterns

### Pattern 1: Stable-id SVG extraction (replaces fill-count parsing)

**What:** `extractMarkOnly()` currently identifies "the mark" by counting occurrences of the literal string `fill="#F2643E"` (`MARK_FILL`, `EXPECTED_MARK_PATH_COUNT = 2`) and stripping a hardcoded `BACKGROUND_RECT` string. This is brittle by the milestone's own framing — it breaks the instant path count, fill color, or exact rect markup changes, and it cannot generalize to a second source file (the lockup) which has a *different* internal structure (mark + text + circle, not just 2 fill paths).

**When to use:** Any time a generator needs to reliably re-extract a named sub-part of a hand-authored/design-tool-exported SVG across future edits.

**Trade-offs:** Requires the SVG source itself to carry semantic `id`s (a one-time manual edit to `lafa-icon.svg`/`lafa-homepage-lockup.svg` during promotion — neither candidate file has any `<g id>` today, confirmed by grep). Slightly more parsing code (a real SVG/XML parse or regex-based `<g id="...">...</g>` extraction) than pure string search, but decouples correctness from incidental formatting (fill hex, path count, whitespace).

**Example (regex-based `<g id="...">` extraction, no new dependency needed):**
```typescript
function extractGroupById(svg: string, id: string): string {
  const openTagPattern = new RegExp(`<g[^>]*\\bid="${id}"[^>]*>`);
  const openMatch = svg.match(openTagPattern);
  if (!openMatch || openMatch.index === undefined) {
    throw new Error(`${SOURCE_SVG_PATH} is missing <g id="${id}"> — source may have changed shape`);
  }
  // naive depth-tracking to find this group's matching closing </g>,
  // since nested <g> groups (e.g. background/mark siblings) are expected
  let depth = 1;
  let i = openMatch.index + openMatch[0].length;
  const rest = svg.slice(i);
  const tagPattern = /<g\b[^>]*>|<\/g>/g;
  let m: RegExpExecArray | null;
  let endOffset = -1;
  while ((m = tagPattern.exec(rest))) {
    if (m[0].startsWith("</g>")) {
      depth--;
      if (depth === 0) { endOffset = m.index; break; }
    } else {
      depth++;
    }
  }
  if (endOffset === -1) {
    throw new Error(`${SOURCE_SVG_PATH}'s <g id="${id}"> has no matching </g> — malformed source`);
  }
  return rest.slice(0, endOffset);
}
```
Apply this the same way `extractMarkOnly()` is applied today: call once for `id="mark"` (icon) and, if the icon source keeps a separate background group, once for `id="background"`. The rest of the pipeline (`getMarkBBox`, `renderCenteredOnSafeZone`, `toMonochromeSilhouette`) is agnostic to *how* the mark markup was extracted and needs no changes — only `extractMarkOnly()`'s internals change, keeping the function's return contract (`innerMarkup: string`) identical so every downstream call site in `main()` is untouched.

### Pattern 2: Second single-source render step in the same `main()`

**What:** Add a second, independent block inside `generate-brand-assets.ts`'s existing `main()` (or a small `generateLockup()` helper called from `main()`) that reads `assets/brand/lafa-homepage-lockup.svg`, rasterizes it at a fixed target width (e.g. 2x the largest on-screen render size for Retina sharpness — the source is already 1600×520, a 3.08:1 aspect ratio well suited to direct `Resvg` rendering with `fitTo: { mode: "width", value: N }`), and writes `assets/images/lafa-homepage-lockup.png`.

**When to use:** Whenever a second, structurally unrelated brand asset needs generating from a *different* SVG than the icon — the lockup has no safe-zone/monochrome/adaptive-icon requirements the icon pipeline was built around, so it doesn't need to route through `renderCenteredOnSafeZone` or `toMonochromeSilhouette` at all; it's a much simpler "render this whole SVG to a PNG" step.

**Trade-offs:** Because the lockup SVG already bakes in its own background rect + full composition (mark, wordmark text, accent dot, tagline), unlike the icon it does **not** need mark-only extraction, bbox-centering, or a separate transparent/opaque variant — a single `Resvg(...).render().asPng()` call suffices. This is simpler than the icon path, not more complex — no id-extraction is strictly required for the lockup unless a future requirement demands recoloring/reflowing sub-parts of it independently.

**Example:**
```typescript
const LOCKUP_SOURCE_SVG_PATH = "assets/brand/lafa-homepage-lockup.svg";
const LOCKUP_OUTPUT_PATH = "assets/images/lafa-homepage-lockup.png";
const LOCKUP_RENDER_WIDTH_PX = 960; // 2x a ~480pt on-screen width, tune to actual layout

async function generateLockup(): Promise<void> {
  const sourceSvg = readFileSync(LOCKUP_SOURCE_SVG_PATH, "utf-8");
  const rendered = new Resvg(sourceSvg, {
    fitTo: { mode: "width", value: LOCKUP_RENDER_WIDTH_PX },
  }).render();
  const png = await sharp(rendered.asPng()).png().toBuffer();
  writeFileSync(LOCKUP_OUTPUT_PATH, png);
}
```
Call `await generateLockup();` as the last step inside the existing `main()`, after the icon/splash/Android outputs — keeps one script, one `npm run generate-assets` invocation, one exit code.

### Pattern 3: Scoped pressed-color token (not a new pattern, a targeted key addition)

**What:** `src/theme/tokens.ts`'s `colors` object stays a flat, ungrouped map (established v0.6 convention — no nested `colors.quiz.choicePressed`). Add `choicePressed: "#E7DFDA"` as a sibling to `pressed`, `success`, `error`. The *only* consumer is `app/quiz.tsx`'s answer-choice `Pressable` (line ~148 of the current file), which today reads:
```typescript
style={({ pressed }) => [
  styles.choice,
  style.container,
  lockedChoice === null && pressed && { backgroundColor: colors.pressed },
]}
```
This is the exact component/line that "owns" choice-button press state — confirmed as the only `Pressable` in the codebase wrapping the 4 answer choices, gated by `lockedChoice === null` so the press overlay can never render once an answer is locked (at which point `style.container` — `choiceCorrect`/`choiceWrong`, driven by `choiceStyle()` — takes over and must keep winning). The fix is a one-line value swap: `colors.pressed` → `colors.choicePressed`.

**Why it doesn't collide with correct/incorrect coloring:** `choiceStyle()` (lines 82-98 of `app/quiz.tsx`) computes `style.container` from `lockedChoice`/`correctAnswer`, completely independent of the `Pressable`'s function-form `pressed` state. The array-form `style` prop's press overlay is only appended `lockedChoice === null && pressed && {...}` — i.e. only *before* any answer is locked, so it can structurally never appear at the same time as `choiceCorrect`/`choiceWrong` backgrounds (which only render *after* `lockedChoice !== null`). The bug being fixed is purely a color-*choice* problem (deep-orange `colors.pressed` reads as "this might be wrong" mid-press, before the user even releases), not a logic/precedence bug — no branching/gating code changes, only the color value at that one call site.

**When to use:** Exactly this kind of narrow, semantically distinct pressed-state — a new token key is the right call whenever an existing shared key (`colors.pressed`) is being reused across UI elements with genuinely different meaning (primary-action affordance vs. neutral answer-option affordance) and a future palette change to one shouldn't silently affect the other.

**Trade-offs:** `tokens.test.ts` uses an exhaustive `toEqual()` on the full `colors` object (per CONVENTIONS.md/ARCHITECTURE.md's documented pattern) — adding `choicePressed` requires updating that test in the same change, or it fails immediately (this is the intended regression-catching behavior, not a gotcha to work around).

## Data Flow

### Brand Asset Generation Flow (build-time, not runtime)

```
assets/brand/candidates/lafa-icon-warm-bold.svg  (chosen candidate)
    ↓ (manual promotion: copy + add stable <g id> layers)
assets/brand/lafa-icon.svg  (new canonical source, replaces v0.6's source)
    ↓ npm run generate-assets  (scripts/generate-brand-assets.ts)
    ├→ assets/images/icon.png                     (id-based extraction, opaque, 1024x1024)
    ├→ assets/images/favicon.png                  (downscaled from icon.png buffer)
    ├→ assets/images/splash-icon.png              (transparent, full-canvas mark)
    ├→ assets/images/android-icon-foreground.png  (safe-zone centered)
    └→ assets/images/android-icon-monochrome.png  (safe-zone centered, white silhouette)

assets/brand/candidates/lafa-homepage-lockup.svg
    ↓ (manual promotion: copy, corrected per this milestone's "corrected lockup image" note)
assets/brand/lafa-homepage-lockup.svg  (new canonical source, new file)
    ↓ npm run generate-assets  (same script, new render step)
    └→ assets/images/lafa-homepage-lockup.png

    ↓ npm run validate-brand  (scripts/validate-brand.ts, extended)
    checks: warm-bold source is canonical (not a stale/wrong candidate),
            all 6 PNGs exist at expected dimensions, icon.png has no alpha,
            lockup PNG exists, app.json references are intact

    ↓ consumed by:
    app.json  (icon/splash/android-* — unchanged reference paths, new pixel content)
    app/index.tsx  (NEW: <Image source={require(".../lafa-homepage-lockup.png")} />)
```

### Quiz Press-State Fix Flow (runtime, no new data flow — a value swap)

```
User touches an answer-choice Pressable (lockedChoice === null)
    ↓
Pressable's function-form style callback fires with { pressed: true }
    ↓
style array evaluates: lockedChoice === null && pressed && { backgroundColor: colors.choicePressed }
    (was colors.pressed — only this token reference changes)
    ↓
User releases / selectAnswer(choice) fires → lockedChoice becomes non-null
    ↓
choiceStyle(choice, correctAnswer) now drives style.container (choiceCorrect/choiceWrong)
    — the pressed-overlay branch's `lockedChoice === null` guard is now false,
      so colors.choicePressed can never render simultaneously with success/error colors
```

### Store Submission Flow (process, not app data flow)

```
store/metadata/*.md (authored)  ─┐
store/screenshots/*.png (captured) ─┼→ manually entered/uploaded into App Store Connect (web UI)
store/privacy/*.md (authored)   ─┘        — no CLI/script currently automates this transfer;
                                              `eas metadata`/fastlane-style automation is explicitly
                                              out of scope this milestone (matches the existing
                                              "no fastlane" constraint already locked in PROJECT.md)

eas.json production profile (existing, verified sufficient) ──→ eas build --profile production
                                                              ──→ eas submit --profile production
                                                                    (submits the .ipa; does NOT
                                                                     touch metadata/screenshots —
                                                                     those are ASC-web-UI-only
                                                                     unless `eas metadata` is
                                                                     deliberately adopted)
```

## Scaling Considerations

Not applicable in the traditional sense (this is a build-time asset pipeline and a single-screen UI change, not a runtime service). The relevant "scale" axis here is **number of brand-asset source files and derived outputs over time**:

| Scale | Approach |
|-------|----------|
| 2 sources (icon + lockup), current milestone | Single script, two source constants, two render code paths inside one `main()` — exactly what's proposed above |
| 3+ sources (e.g. a future dark-mode icon variant, a social-share card image) | Still one script is fine as long as each new output is a simple additive function call in `main()`; only refactor into per-asset-type modules (e.g. `scripts/brand/icon.ts`, `scripts/brand/lockup.ts` imported by a thin `generate-brand-assets.ts` orchestrator) if `main()` itself becomes hard to read — not needed yet |
| Many designers/frequent re-promotion cycles | Consider formalizing the "promotion" step (candidate → canonical + id-adding) as its own small script rather than a manual copy-and-hand-edit, to reduce the chance of a promoted SVG silently missing a required `<g id>`. Not warranted for a single one-time promotion this milestone. |

## Anti-Patterns

### Anti-Pattern 1: Reading directly from `assets/brand/candidates/` in the generator

**What people do:** Point `generate-brand-assets.ts` at `assets/brand/candidates/lafa-icon-warm-bold.svg` directly instead of promoting/copying it into `assets/brand/lafa-icon.svg`, to "save a step."
**Why it's wrong:** `candidates/` is explicitly described in the milestone context as untracked exploration output (confirmed: `git status` shows `assets/brand/candidates/` as untracked). `validate-brand.ts`'s existing convention is to assert the generator references one single, specific, tracked canonical source path (`checkGeneratorSource()` checks for `ALLOWED_SVG_SOURCE = "assets/brand/lafa-icon.svg"` literally). Pointing at `candidates/` breaks that invariant, risks the source silently changing/disappearing (untracked files aren't guaranteed to survive a clean checkout), and reintroduces the exact "which file is canonical" ambiguity the v0.6 rebrand deliberately eliminated.
**Do this instead:** Copy the chosen candidate into `assets/brand/` under its permanent name, add the required stable ids, delete/ignore `candidates/` from the generator's concern entirely (it can stay on disk for historical reference, untracked, but the generator and validator should never reference it).

### Anti-Pattern 2: A second brand-asset generator script

**What people do:** Create `scripts/generate-homepage-lockup.ts` as a standalone sibling script because "it's a different asset type."
**Why it's wrong:** Duplicates all the Resvg/sharp setup boilerplate and error-handling conventions already established in `generate-brand-assets.ts`; forces `validate-brand.ts` (and any future CI step) to know about and invoke two scripts instead of one; breaks the single `npm run generate-assets` → "all brand PNGs are fresh" mental model this project has relied on since v0.6.
**Do this instead:** One additional render step inside the existing script's `main()`, as shown in Pattern 2 above.

### Anti-Pattern 3: Reusing `colors.pressed` for both primary-button and choice-button press states "because it already exists"

**What people do:** Skip adding a new token and just conditionally pick a color inline in `app/quiz.tsx` (e.g. `pressed && { backgroundColor: "#E7DFDA" }` as a raw hex literal at the call site) to avoid touching `tokens.ts`.
**Why it's wrong:** Every other pressed-state/color value in this codebase is sourced from `src/theme/tokens.ts` — the project's own Anti-Patterns section (`ARCHITECTURE.md`) already calls out `ReportFeedbackModal.tsx`'s hardcoded hex as the one exception to avoid repeating. A raw hex literal at the `quiz.tsx` call site would reintroduce exactly that anti-pattern in a *new* location, and `tokens.test.ts`'s exhaustive assertion would give zero regression coverage for it.
**Do this instead:** Add `colors.choicePressed` to `tokens.ts`, update `tokens.test.ts`, import and reference it in `quiz.tsx` like every other token.

### Anti-Pattern 4: Store metadata/screenshots committed as binary blobs without a manifest

**What people do:** Drop final screenshot PNGs straight into a `store/` folder with no record of which screen/state/device size each one represents, or author App Store description text ad hoc in the App Store Connect web UI with no versioned source of truth in the repo.
**Why it's wrong:** Makes review-note/description iteration unreviewable (no diff, no history), and makes it easy to accidentally submit a stale screenshot after a UI change. This project's existing convention (PROJECT.md's Key Decisions table, `.planning/milestones/*-MILESTONE-AUDIT.md`) is to keep an auditable record of what shipped and why.
**Do this instead:** Keep authored text (`description.md`, `keywords.txt`, `review-notes.md`, privacy answers) as versioned files in `store/` (or `.planning/store/`), and either (a) keep only a lightweight manifest of expected screenshot filenames/sizes in the repo with the actual PNGs generated fresh right before submission (recommended, avoids binary bloat), or (b) commit final screenshots directly if the team wants full reproducibility — either is fine as long as it's a deliberate choice, not an ad-hoc one.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| App Store Connect (metadata, screenshots, privacy nutrition label, age rating) | Manual web-UI entry, no CLI integration in this repo today | `eas.json` has no `metadata` field/profile in the current config and none is required for `eas build`/`eas submit` to function — ASC metadata is entered separately via App Store Connect's website (or optionally via EAS's `eas metadata` subcommand + an `eas.json` `submit` app-config, which is a **new, optional integration** not currently present; adopting it is a build-order decision, see below) |
| EAS Build/Submit (`eas.json`) | Already fully configured — `production` build profile (`autoIncrement: true`) + `submit.production.ios.ascAppId` | Proven end-to-end in v0.5 (one internal TestFlight build). For a *full store submission* (not just TestFlight), the same `production` profile is reusable as-is — Apple distinguishes internal/external testing vs. public release at the ASC review-submission step, not at the `eas build`/`eas submit` CLI level. No new `eas.json` profile is strictly required unless the team wants a distinct build number/versioning lane for store-submission builds vs. ongoing TestFlight builds (optional hygiene, not a hard requirement) |
| Screenshot capture | No existing tooling in this repo (`scripts/` has no screenshot script) | Apple requires device-accurate screenshots at specific size buckets (e.g. 6.9"/6.5" iPhone). Options: (a) manual Simulator/device screenshots + Preview crop, (b) a small Detox/Maestro/`expo-cli` UI-driven capture script (new tooling, adds a testing-framework dependency this project has deliberately avoided — no `@testing-library/react-native` currently), (c) a documented manual checklist in `store/screenshots/README.md`. Given this project's established preference for minimal added dependencies (CONVENTIONS.md, STACK.md), (a)/(c) — manual capture with a documented checklist — is the lower-friction fit; a capture-automation script is a candidate for a *future* milestone once a second release cycle makes the manual process's repetition cost apparent |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `assets/brand/*.svg` ↔ `scripts/generate-brand-assets.ts` | File read at script-run time (`readFileSync`), no import | One-directional; the generator never writes back to the SVG source |
| `scripts/generate-brand-assets.ts` ↔ `scripts/validate-brand.ts` | Deliberately **no** shared code/imports (existing v0.6 decision, confirmed in PROJECT.md Key Decisions: "declares its forbidden-hex/retired-asset literals independently rather than importing them from `generate-brand-assets.ts`") | Preserve this independence when extending both scripts for the lockup/warm-bold work — do not introduce a shared `scripts/brand-constants.ts` that both import, or the validator stops being an independent check |
| `assets/images/lafa-homepage-lockup.png` ↔ `app/index.tsx` | Static `require()`/import, bundled by Metro like `app.json`'s icon/splash references already are | New integration point — this is the first place `app/` code directly imports a generated brand PNG (today only `app.json`, a config file outside the JS bundle, references them) |
| `src/theme/tokens.ts` ↔ `app/quiz.tsx` | Named import (`colors.choicePressed`), existing pattern | No new boundary type, just one more key flowing through the already-established tokens-consumed-directly-by-screens pattern |
| `store/` ↔ rest of repo | None — zero code imports, zero build-time coupling | Confirms this is documentation/process, not runtime integration; safe to add without touching `tsconfig.json` includes, Jest config, or Metro resolution |

## Suggested Build Order (dependency-aware)

1. **Promote the warm-bold source + add stable ids** — must happen first; every downstream step (generator rewrite, validator extension, icon regeneration) depends on `assets/brand/lafa-icon.svg` existing in its final, id-bearing form. Doing the id-based generator rewrite *before* the source has ids would leave nothing to test it against.
2. **Rewrite `extractMarkOnly()`/generator internals to consume ids** — depends on step 1. Verify against the *existing* icon output shape first (icon/splash/Android outputs must still validate identically in dimensions/alpha) before adding the lockup as a second concern, to isolate any regression to one variable at a time.
3. **Promote the lockup source + add the lockup render step to the same script** — depends on step 2 only insofar as it reuses the same script; the lockup's own rendering (Pattern 2) doesn't need id-based extraction at all, so this can technically happen in parallel with step 1/2, but sequencing it after keeps the generator's `main()` diff reviewable as two clear, separable additions rather than one large rewrite.
4. **Extend `scripts/validate-brand.ts`** — depends on steps 1-3 producing real output files to assert against; extending the validator before the generator produces the new outputs means the new checks would fail by construction (acceptable briefly during TDD-style development, but the validator should not be considered "done" until it passes against real generated output).
5. **Wire `app/index.tsx`'s Image lockup** — depends on step 3's PNG existing on disk; independent of steps 4/6/7, can happen any time after step 3.
6. **Add `colors.choicePressed` + fix `app/quiz.tsx`'s choice-button color** — fully independent of all brand-asset work (different files, different token, no shared dependency); can be done in parallel with 1-5, or sequenced anywhere convenient.
7. **App Store submission artifacts (`store/` metadata, privacy answers, screenshots, production build+submit)** — **should come last**, after steps 1-6 land, because: (a) screenshots must reflect the *final* homepage lockup and any other shipped UI, so capturing them before step 5 lands means recapturing later; (b) the production build submitted for review should be the one actually carrying the finished brand assets and press-state fix, not an intermediate state. `eas.json` itself needs no changes ahead of this step (already sufficient), so this step is pure sequencing, not a technical blocker.

## Sources

- Direct source inspection (HIGH confidence, current-state verified, not training-data assumption):
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/scripts/generate-brand-assets.ts` (current fill-count-based `extractMarkOnly()`)
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/scripts/validate-brand.ts` (current check list, independent-literal convention)
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/theme/tokens.ts` (current `colors` shape, confirms no `choicePressed` key yet)
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/app/index.tsx` (confirms plain-text `<Text style={styles.heading}>Lafa</Text>` heading, no image usage anywhere in this file)
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/app/quiz.tsx` (confirms the exact `Pressable` + `choiceStyle()` structure and the 9-call-site `colors.pressed` pattern, grep-verified: `app/index.tsx`, `app/results.tsx` (x2), `app/quiz.tsx` (x2), `src/feedback/ReportFeedbackModal.tsx` (x2), `src/productFeedback/ProductFeedbackModal.tsx` (x2))
  - `/Users/avi/portuguese-verb/portuguese-verb-mobile/app.json`, `/Users/avi/portuguese-verb/portuguese-verb-mobile/eas.json` (confirms current build/submit config has no metadata-specific profile, `production` build+submit already proven)
  - `assets/brand/candidates/lafa-icon-warm-bold.svg`, `assets/brand/candidates/lafa-homepage-lockup.svg` (grep-verified: zero `<g id="mark">`-style semantic ids present in either candidate today — only `<clipPath id>`/`<title id>`/`<desc id>`; the lockup SVG's structure is a mark `<g transform=...>` (no id) + two `<text>` elements + one `<circle>`, all flat/unlabeled)
  - `package.json` (confirms `npm run generate-assets`/`validate-brand` script names, no existing screenshot/metadata tooling)
  - `.planning/PROJECT.md` (v1.0 milestone goal/target-features section, Key Decisions table for existing generator/validator independence conventions, Out of Scope section confirming no fastlane/automated CI pipeline)
- No external/Context7/WebSearch lookups were needed — this is entirely an integration-with-existing-codebase question, answerable authoritatively from the repo's own current state.

---
*Architecture research for: Lafa mobile app — v1.0 warm-brand-polish + App Store submission-readiness milestone*
*Researched: 2026-08-16*
