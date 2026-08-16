# Phase 32: Homepage Lockup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 32-Homepage Lockup
**Areas discussed:** Mark consistency in lockup, Generator rendering approach, Image resolution strategy, Lockup content scope

---

## Mark Consistency in Lockup

| Option | Description | Selected |
|--------|-------------|----------|
| Update to new 3-layer mark | Swap the lockup's embedded mark paths for the promoted mark-depth/mark-fill/mark-highlight layers so the lockup visually matches the app icon exactly | ✓ |
| Keep lockup's mark as-is | Treat the lockup as its own frozen artwork; don't touch the embedded mark | |

**User's choice:** Update to new 3-layer mark (Recommended option).
**Notes:** The candidate lockup's embedded mark predates Phase 31's mark promotion — it's the old 2-layer version with no ids and no depth-shadow layer.

---

## Generator Rendering Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Compose programmatically | Reuse extractMarkOnly()/composeMark() to pull the canonical mark markup and inject it into the lockup's mark slot at render time | ✓ |
| Hand-edit the candidate SVG once | Manually replace the lockup SVG's embedded mark paths once and Resvg-render the static file directly | |

**User's choice:** Compose programmatically (Recommended option).
**Notes:** Follows directly from the mark-consistency decision — one source of truth for the mark avoids future drift between icon and lockup.

---

## Image Resolution Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single high-res PNG scaled via style | One rendered PNG referenced by a fixed-aspect-ratio Image with explicit width/height style, matching icon.png/splash-icon.png's existing pattern | ✓ |
| @1x/@2x/@3x density variants | Generate density-variant files so RN's asset resolution picks the right one automatically | |

**User's choice:** Single high-res PNG scaled via style (Recommended option).
**Notes:** No other image in this codebase uses density variants — stays consistent with the established pattern.

---

## Lockup Content Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full lockup incl. tagline | Use the complete candidate as-is — mark, wordmark, dot, and tagline — as one image | ✓ |
| Drop the tagline | Render only mark + wordmark + dot, cropping out the tagline | |

**User's choice:** Full lockup incl. tagline (Recommended option).
**Notes:** No existing tagline text elsewhere on the Setup screen, so this isn't a duplicate — it's new copy introduced by the lockup image itself.

---

## Claude's Discretion

- Exact injected mark size/position tuning within the lockup's transform slot (new mark's bbox differs slightly from the old one due to the depth-shadow offset).
- Exact PNG render resolution/scale factor, as long as it stays crisp on 3x-density devices.
- Exact `Image` `resizeMode` and container styling conventions.
- Accessibility label text for the `Image` replacing the semantic value the plain `Text` title previously carried.

## Deferred Ideas

None — discussion stayed within phase scope.
