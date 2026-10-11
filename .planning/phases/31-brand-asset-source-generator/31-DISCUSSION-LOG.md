# Phase 31: Brand Asset Source & Generator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 31-Brand Asset Source & Generator
**Areas discussed:** SVG parsing approach, Layer id naming & placement, Depth-shadow layer across outputs, Baseline dimension verification

---

## SVG Parsing Approach

| Option | Description | Selected |
|--------|-------------|----------|
| linkedom | Real DOM lib, getElementById()/querySelector semantics, handles nested `<g>` structure correctly, build-time-only dep | ✓ |
| Regex depth-tracker | Zero new dependency, hand-rolled bracket/tag depth-matching, more fragile against real nested structure | |
| You decide | Let implementer pick based on simplicity | |

**User's choice:** linkedom

| Option | Description | Selected |
|--------|-------------|----------|
| Fully replace fill-count check | id-based lookup + explicit missing-id errors, no dual-check | ✓ |
| Keep fill-count as secondary check | Belt-and-suspenders, re-introduces some of the removed fragility | |

**User's choice:** Fully replace

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add linkedom as devDependency | Build-time only, same category as `@resvg/resvg-js`/`sharp` | ✓ |
| No — avoid new deps, use regex instead | Reopens parsing-approach question | |

**User's choice:** Yes, add it

---

## Layer ID Naming & Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic names | `mark-depth`, `mark-fill`, `mark-highlight` — self-documenting | ✓ |
| Numbered/positional | `layer-1`, `layer-2`, `layer-3` — meaningless without cross-referencing | |
| You decide | Planner picks exact strings | |

**User's choice:** Semantic names

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `<g>` wrapper, id on the `<g>` | Minimal diff from candidate as-is | ✓ |
| Flatten — id directly on `<path>`, drop wrapper | Bigger edit, bakes transform/opacity by hand | |

**User's choice:** Keep `<g>` wrapper

| Option | Description | Selected |
|--------|-------------|----------|
| Exact required set, fail loud | Matches old script's philosophy and project's stated preference for structural drift protection | ✓ |
| Lenient — select present ids, skip missing | More forgiving but risks silently shipping incomplete icon | |

**User's choice:** Exact required set, fail loud

---

## Depth-Shadow Layer Across Outputs

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in all color outputs | icon/splash/Android-foreground all show `mark-depth` | ✓ |
| Icon only | Splash/Android foreground stay flatter 2-layer look | |

**User's choice:** Yes, in all color outputs

| Option | Description | Selected |
|--------|-------------|----------|
| Drop it for monochrome | Avoids smudge/ghosting artifact in themed-icon silhouette | ✓ |
| Include, recolored to white at full opacity | Keeps shape-fidelity with color version | |

**User's choice:** Drop it for monochrome

| Option | Description | Selected |
|--------|-------------|----------|
| Full mark bbox incl. depth drives centering | Consistent with treating mark as one composition | ✓ |
| mark-fill bbox only | Centers on primary shape, depth may spill outside crop | |

**User's choice:** Full mark bbox incl. depth

---

## Baseline Dimension Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Manual verification this phase, formalize in Phase 34 | Matches roadmap's explicit dependency ordering | ✓ |
| Add lightweight dimension check in generator this phase | Belt-and-suspenders ahead of Phase 34 | |

**User's choice:** Manual verification this phase, formalize in Phase 34

| Option | Description | Selected |
|--------|-------------|----------|
| Local verification now, real EAS re-confirm at Phase 35 | Matches PITFALLS.md's "necessary but not sufficient" framing | ✓ |
| Trigger a real EAS build during this phase | Re-verify immediately rather than waiting | |

**User's choice:** Local verification now, real EAS re-confirm at Phase 35

**Notes:** This creates a literal tension with ROADMAP.md's Phase 31 success criterion #4 ("re-confirmed against a real EAS build, not just local validation") — flagged explicitly in CONTEXT.md's D-10 for the planner to reconcile (either amend roadmap wording or add a real-build checkpoint task).

---

## Claude's Discretion

- Exact `linkedom` API usage (`getElementById` vs. `querySelector`)
- Exact wording of thrown error messages (must follow existing "source may have changed shape" style, name the missing id)

## Deferred Ideas

None — discussion stayed fully within phase scope. Homepage lockup confirmed out of scope (belongs to Phase 32).
