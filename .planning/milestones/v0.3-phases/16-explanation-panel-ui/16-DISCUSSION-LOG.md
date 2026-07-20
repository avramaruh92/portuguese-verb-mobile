# Phase 16: Explanation Panel UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 16-Explanation Panel UI
**Areas discussed:** Panel visual treatment, Layout stability, Copy/label, Timing/animation (wrap-up)

---

## Panel visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral surface card | `colors.surface` background, `colors.textSecondary` text — same "quiet" treatment as `OfflinePill`. Reads as supplementary info, not another alert. | ✓ |
| Tinted primary card | `colors.primarySoft` background (used by the offline pill) for a branded "tip" feel — more visually prominent. | |
| Plain text, no card | Text block with no background/border — simplest, lowest visual weight, but blends into the meta row above. | |

**User's choice:** Neutral surface card
**Notes:** None

---

## Layout stability

| Option | Description | Selected |
|--------|-------------|----------|
| Conditional mount | Panel only renders when there's an explanation to show. Matches EXPL-03 literally. Choices/Next button shift position between questions. | ✓ |
| Reserved space, hidden state | Mirrors `nextButton`/`reportButton`'s opacity-0 pattern already in `quiz.tsx` — constant panel space, no jump, but adds an empty gap when no explanation exists. | |

**User's choice:** Conditional mount (recommended option)
**Notes:** None

---

## Copy/label

| Option | Description | Selected |
|--------|-------------|----------|
| Sentence only | No heading above the explanation — backend templates are already self-contained sentences. | ✓ |
| Small heading + sentence | Adds a caption-styled label like "Why?" or "Explanation" above the sentence. | |

**User's choice:** Sentence only (recommended option)
**Notes:** None

---

## Timing/animation (wrap-up check)

| Option | Description | Selected |
|--------|-------------|----------|
| Ready for context | Panel appears instantly, no fade/animation — consistent with the app's existing zero-animation answer reveal. | ✓ |
| One more thing to discuss | — | |

**User's choice:** Ready for context (recommended option)
**Notes:** User confirmed no further areas needed discussion; proceeded straight to CONTEXT.md.

---

## Claude's Discretion

- Where the Quiz screen sources the `learning` block and the formIndex-bearing
  `Verb` object — two known wiring gaps identified during codebase scouting
  (store doesn't expose `learning`; `quiz.tsx`'s `currentVerb` reads the local
  bundled dataset instead of the resolved/fetched one). Documented in
  CONTEXT.md as implementation details for the planner, not user preferences.
- Exact component boundary (dedicated `ExplanationPanel` component vs. inline
  JSX in `quiz.tsx`).
- Whether `selectExplanation` is memoized vs. computed inline per render.

## Deferred Ideas

None new — the only known limitation (cross-verb `formIndex` gap) was already
captured and deferred in Phase 15's CONTEXT.md; it applies unchanged here.
