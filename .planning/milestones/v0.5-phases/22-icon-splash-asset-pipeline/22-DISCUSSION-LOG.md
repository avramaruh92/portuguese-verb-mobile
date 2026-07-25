# Phase 22: Icon & Splash Asset Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 22-Icon & Splash Asset Pipeline
**Areas discussed:** Icon composition, Splash icon treatment, Asset-generation tooling, Icon Composer removal blast radius

---

## Icon composition

| Option | Description | Selected |
|--------|-------------|----------|
| Bleed edge-to-edge | Scale the 'icon' group so the rounded square fills the full 1024 canvas — iOS already applies its own corner mask + shadow | ✓ |
| Keep as-is (inset on white) | Crop exactly what's in the SVG today: rounded orange square inset within a white 1024 canvas | |
| You decide | Let the implementer pick based on how it looks at actual icon sizes | |

**User's choice:** Bleed edge-to-edge (recommended)

**Follow-up — background fill for the bled icon:**

| Option | Description | Selected |
|--------|-------------|----------|
| Light peach (#FCE4DA) | Matches the SVG's existing rounded-square background color exactly | ✓ |
| Solid brand orange (#E8663D) | Bolder background but requires re-coloring the 'a' mark to stay visible | |
| You decide | Pick whichever renders best at actual icon size | |

**User's choice:** Light peach (#FCE4DA) — recommended

---

## Splash icon treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with Lafa mark | Generate a white/light version of the orange 'a' mark to sit on the existing blue background | ✓ |
| Leave unchanged | Ship with the current default Expo triangle/A glyph — treat splash branding as out of scope | |
| You decide after seeing icon result | Decide once the new app icon is generated | |

**User's choice:** Replace with Lafa mark (recommended)

**Follow-up — recolor treatment for splash mark:**

| Option | Description | Selected |
|--------|-------------|----------|
| White monochrome mark | Render just the 'a' glyph paths (drop the peach background) in solid white | ✓ |
| Keep original brand colors | Use orange/peach/white/green mark as-is on the blue background | |
| You decide | Pick whichever renders with the best contrast | |

**User's choice:** White monochrome mark (recommended)

**Notes:** Splash background (#208AEF blue, set via `expo-splash-screen` plugin config) stays unchanged — only the glyph itself gets replaced.

---

## Asset-generation tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Add a one-off rasterizer dependency | Install a small SVG-to-PNG library (e.g. sharp + resvg-js) as a devDependency, write a script to render exact-size PNG variants | ✓ |
| Manual export by you | User exports PNGs themselves (Figma/Preview/etc.) and hands files to the pipeline | |
| You decide | Let the implementer pick the most reliable path | |

**User's choice:** Add a one-off rasterizer dependency (recommended)

**Follow-up — keep or remove the tooling after use:**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it | Leave the devDependency + script in the repo for future rebrands | ✓ |
| Remove after use | Uninstall the devDependency and delete the script once PNGs are generated | |

**User's choice:** Keep it (recommended)

**Notes:** No SVG rendering tool was found on this dev machine (checked: rsvg-convert, inkscape, imagemagick/magick/convert, cairosvg — none present).

---

## Icon Composer removal blast radius

| Option | Description | Selected |
|--------|-------------|----------|
| No concern — proceed as decided | Confirm the flat PNG icon is fine; delete assets/expo.icon/ and remove ios.icon from app.json | ✓ |
| Reconsider — want the Composer effects | Pause removal and discuss regenerating assets/expo.icon/ with the new Lafa mark instead | |

**User's choice:** No concern — proceed as decided (recommended)

**Notes:** This confirms (does not reopen) the decision already logged in `.planning/PROJECT.md`'s Key Decisions table.

---

## Claude's Discretion

None — all four areas reached explicit decisions (mostly via the recommended option).

## Deferred Ideas

None — discussion stayed fully within the phase's scope.
