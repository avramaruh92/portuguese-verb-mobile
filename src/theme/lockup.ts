// The lockup source (assets/brand/lafa-homepage-lockup.svg, rendered 2x to
// assets/images/lafa-homepage-lockup.png at 3200x1040) paints its own
// background rect the same color as the app background, so its 1600x520
// canvas has a large blank margin to the right of the visible content
// (mark/wordmark/dot/tagline). Centering or left-aligning the full image's
// bounding box therefore visually mis-centers the glyphs themselves. These
// constants crop the rendered PNG down to just its non-background content
// region so *that* crop box can be centered correctly.
//
// Measured (not estimated) via a one-off sharp bounding-box scan of
// assets/images/lafa-homepage-lockup.png, scanning for pixels differing
// from background #FFF9F6 (tolerance 6/channel, alpha >= 200 to ignore
// antialiased edges), then halved to the 1600x520 source coordinate space:
// { x0: 176, y0: 93, x1: 976.5, y1: 382.5 }. Re-measure if the lockup
// source SVG ever changes.
//
// scripts/validate-brand.ts re-measures the PNG bounding box (alpha >= 200,
// tolerance 8/channel vs #FFF9F6) and fails if any constant drifts by more
// than 2 px. This module is imported by Node with a `.ts` extension, so it
// must stay import-free with erasable syntax only.
export const LOCKUP_CONTENT_X0 = 176;
export const LOCKUP_CONTENT_Y0 = 93;
export const LOCKUP_CONTENT_X1 = 976.5;
export const LOCKUP_CONTENT_Y1 = 382.5;
