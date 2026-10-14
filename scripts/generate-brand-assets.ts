import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import { DOMParser } from "linkedom";
import sharp from "sharp";

import { DEPTH_FILL_HEX, ICON_BACKGROUND_HEX, MONOCHROME_FILL_HEX, ORANGE_FILL_HEX } from "./brand-colors.ts";

const SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
const FAVICON_OUTPUT_PATH = "assets/images/favicon.png";
const SPLASH_OUTPUT_PATH = "assets/images/splash-icon.png";
const ANDROID_FOREGROUND_OUTPUT_PATH = "assets/images/android-icon-foreground.png";
const ANDROID_MONOCHROME_OUTPUT_PATH = "assets/images/android-icon-monochrome.png";
const LOCKUP_SOURCE_SVG_PATH = "assets/brand/lafa-homepage-lockup.svg";
const LOCKUP_OUTPUT_PATH = "assets/images/lafa-homepage-lockup.png";
const LOCKUP_MARK_SLOT_ID = "lockup-mark-slot";

const CANVAS_PX = 1024;
const SPLASH_WIDTH_PX = 1024;
const FAVICON_PX = 48;
const SAFE_ZONE_RATIO = 0.66;
const SAFE_ZONE_PX = Math.round(CANVAS_PX * SAFE_ZONE_RATIO); // 676
const LOCKUP_WIDTH_PX = 3200; // 2x the 1600x520 source (D-03: single high-res PNG, no @1x/@2x/@3x variants)
const LOCKUP_HEIGHT_PX = 1040;

const TRANSPARENT_BACKGROUND = "rgba(0,0,0,0)";
const MONOCHROME_FILL = `fill="${MONOCHROME_FILL_HEX}"`;

const MARK_DEPTH_ID = "mark-depth";
const MARK_FILL_ID = "mark-fill";
const MARK_HIGHLIGHT_ID = "mark-highlight";
const EXPECTED_MARK_IDS = [MARK_DEPTH_ID, MARK_FILL_ID, MARK_HIGHLIGHT_ID] as const;
const COLOR_OUTPUT_LAYER_IDS = EXPECTED_MARK_IDS; // D-06: depth renders in icon, splash, Android foreground
const MONOCHROME_LAYER_IDS = [MARK_FILL_ID, MARK_HIGHLIGHT_ID] as const; // D-07: depth dropped

// No `rx` — the flattened square is deliberate so the OS-level icon mask does not
// double-round on top of a pre-baked rounded-rect background (D-03).
const FLAT_BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" fill="${ICON_BACKGROUND_HEX}"/>`;

type MarkLayerId = (typeof EXPECTED_MARK_IDS)[number];

interface ExtractedMark {
  /** transform attribute of the unnamed <g> that parents all three layers,
   *  i.e. "translate(512 512) scale(0.96) translate(-512 -512)" */
  groupTransform: string;
  /** serialized outerHTML of each ided layer element, keyed by id */
  layers: Record<MarkLayerId, string>;
}

function extractMarkOnly(svg: string): ExtractedMark {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(svg, "image/svg+xml") as unknown as Document;
  } catch {
    throw new Error(
      `${SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
    );
  }

  const root = doc.querySelector("svg");
  if (!root) {
    throw new Error(
      `${SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
    );
  }

  const layerElements: Partial<Record<MarkLayerId, Element>> = {};
  for (const id of EXPECTED_MARK_IDS) {
    const element = doc.querySelector(`[id="${id}"]`);
    if (!element) {
      throw new Error(
        `${SOURCE_SVG_PATH} is missing the layer with id="${id}" — source may have changed shape`,
      );
    }
    layerElements[id] = element;
  }

  const allIdedElements = Array.from(doc.querySelectorAll("[id]"));
  const actualIds = allIdedElements.map((el) => el.getAttribute("id")).sort();
  const expectedIdsSorted = [...EXPECTED_MARK_IDS].sort();
  if (
    actualIds.length !== expectedIdsSorted.length ||
    actualIds.some((id, i) => id !== expectedIdsSorted[i])
  ) {
    throw new Error(
      `${SOURCE_SVG_PATH} has an unexpected set of ided elements (${JSON.stringify(
        actualIds,
      )}), expected exactly ${JSON.stringify(expectedIdsSorted)} — source may have changed shape`,
    );
  }

  const depthEl = layerElements[MARK_DEPTH_ID]!;
  const fillEl = layerElements[MARK_FILL_ID]!;
  const highlightEl = layerElements[MARK_HIGHLIGHT_ID]!;

  const parent = fillEl.parentElement;
  if (!parent || parent.tagName.toLowerCase() !== "g") {
    throw new Error(
      `${SOURCE_SVG_PATH} mark-fill's parent is not a <g> — source may have changed shape`,
    );
  }
  const groupTransform = parent.getAttribute("transform");
  if (!groupTransform) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark layer wrapper <g> has no transform attribute — source may have changed shape`,
    );
  }
  if (depthEl.parentElement !== parent || highlightEl.parentElement !== parent) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark layers do not share the same parent <g> — source may have changed shape`,
    );
  }

  const layers: Partial<Record<MarkLayerId, string>> = {};
  for (const [id, element] of Object.entries(layerElements) as [MarkLayerId, Element][]) {
    const markup = element.outerHTML;
    if (!markup || !markup.includes("fill=")) {
      throw new Error(
        `${SOURCE_SVG_PATH} layer with id="${id}" serialized without a fill attribute — source may have changed shape`,
      );
    }
    layers[id] = markup;
  }

  return { groupTransform, layers: layers as Record<MarkLayerId, string> };
}

/** Re-wraps the requested layers in the parent group so the 0.96 scale is preserved. */
function composeMark(mark: ExtractedMark, ids: readonly MarkLayerId[]): string {
  if (ids.length === 0) {
    throw new Error("composeMark requires at least one layer id");
  }
  const layerMarkup = ids.map((id) => mark.layers[id]).join("");
  return `<g transform="${mark.groupTransform}">${layerMarkup}</g>`;
}

function wrapMarkDoc(markMarkup: string, viewBox: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markMarkup}</svg>`;
}

function buildFullIconDoc(markMarkup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">${FLAT_BACKGROUND_RECT}${markMarkup}</svg>`;
}

/** Injects the canonical composed mark into the lockup source's mark slot at render time (D-02). */
function buildLockupDoc(lockupSvg: string, colorMarkup: string): string {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(lockupSvg, "image/svg+xml") as unknown as Document;
  } catch {
    throw new Error(
      `${LOCKUP_SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
    );
  }

  const root = doc.querySelector("svg");
  if (!root) {
    throw new Error(
      `${LOCKUP_SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
    );
  }

  const slot = doc.querySelector(`[id="${LOCKUP_MARK_SLOT_ID}"]`);
  if (!slot) {
    throw new Error(
      `${LOCKUP_SOURCE_SVG_PATH} is missing the mark slot with id="${LOCKUP_MARK_SLOT_ID}" — source may have changed shape`,
    );
  }

  if (slot.children.length === 0) {
    throw new Error(
      `${LOCKUP_SOURCE_SVG_PATH} mark slot id="${LOCKUP_MARK_SLOT_ID}" has no element children — source may have changed shape`,
    );
  }

  slot.innerHTML = colorMarkup;

  const serialized = root.outerHTML;
  for (const id of EXPECTED_MARK_IDS) {
    if (!serialized.includes(`id="${id}"`)) {
      throw new Error(
        `${LOCKUP_SOURCE_SVG_PATH} mark injection did not produce a layer with id="${id}" — source may have changed shape`,
      );
    }
  }

  return serialized;
}

function getMarkBBox(markOnlyDoc: string): { x: number; y: number; width: number; height: number } {
  const bbox = new Resvg(markOnlyDoc, {
    fitTo: { mode: "width", value: CANVAS_PX },
  }).getBBox();

  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark bbox came back empty — source may have changed shape`,
    );
  }

  if (bbox.width >= CANVAS_PX) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark bbox spans the full canvas (${bbox.width}px) — the background rect was likely not stripped, source may have changed shape`,
    );
  }

  return bbox;
}

async function renderCenteredOnSafeZone(
  croppedMarkDoc: string,
  bbox: { width: number; height: number },
): Promise<Buffer> {
  const scale = SAFE_ZONE_PX / Math.max(bbox.width, bbox.height);
  const fitMode: "width" | "height" = bbox.width >= bbox.height ? "width" : "height";
  const fitValue =
    fitMode === "width" ? Math.round(bbox.width * scale) : Math.round(bbox.height * scale);

  const rendered = new Resvg(croppedMarkDoc, {
    fitTo: { mode: fitMode, value: fitValue },
    background: TRANSPARENT_BACKGROUND,
  })
    .render()
    .asPng();

  return sharp({
    create: {
      width: CANVAS_PX,
      height: CANVAS_PX,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: rendered, gravity: "center" }])
    .png()
    .toBuffer();
}

// Changed input contract: receives fill+highlight markup only, never depth (D-07).
function toMonochromeSilhouette(markMarkup: string): string {
  if (markMarkup.includes(`id="${MARK_DEPTH_ID}"`) || markMarkup.includes(DEPTH_FILL_HEX)) {
    throw new Error(
      `${SOURCE_SVG_PATH} monochrome input includes the depth layer — depth must never reach the monochrome silhouette (it would read as a smudge/ghosting artefact once colour contrast is removed by the themed-icon treatment)`,
    );
  }

  const recolored = markMarkup.replaceAll(`fill="${ORANGE_FILL_HEX}"`, MONOCHROME_FILL);

  if (recolored.includes(ORANGE_FILL_HEX) || recolored.includes(DEPTH_FILL_HEX)) {
    throw new Error(
      `${SOURCE_SVG_PATH} monochrome recolor left an orange fill behind — partial recolour must never ship as a themed icon`,
    );
  }

  return recolored;
}

async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const mark = extractMarkOnly(sourceSvg);

  const colorMarkup = composeMark(mark, COLOR_OUTPUT_LAYER_IDS);
  const monoMarkup = composeMark(mark, MONOCHROME_LAYER_IDS);

  // Colour bbox intentionally includes mark-depth's translate(18 22) offset (D-08) —
  // the colour outputs render depth as part of one composition.
  const fullCanvasMarkDoc = wrapMarkDoc(colorMarkup, `0 0 ${CANVAS_PX} ${CANVAS_PX}`);
  const bbox = getMarkBBox(fullCanvasMarkDoc);
  const croppedMarkDoc = wrapMarkDoc(colorMarkup, `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  // Monochrome bbox is genuinely different (D-08) — depth is not rendered in this variant.
  const fullCanvasMonoDoc = wrapMarkDoc(monoMarkup, `0 0 ${CANVAS_PX} ${CANVAS_PX}`);
  const monoBBox = getMarkBBox(fullCanvasMonoDoc);
  const croppedMonoDoc = wrapMarkDoc(
    toMonochromeSilhouette(monoMarkup),
    `${monoBBox.x} ${monoBBox.y} ${monoBBox.width} ${monoBBox.height}`,
  );

  // icon.png — full-bleed flat #FFF9F6 background, no baked-in rounding (D-03).
  const iconRender = new Resvg(buildFullIconDoc(colorMarkup), {
    fitTo: { mode: "width", value: CANVAS_PX },
    background: ICON_BACKGROUND_HEX,
  }).render();

  if (iconRender.width !== CANVAS_PX || iconRender.height !== CANVAS_PX) {
    throw new Error(
      `rendered icon is ${iconRender.width}x${iconRender.height}, expected ${CANVAS_PX}x${CANVAS_PX} — check fitTo/viewBox config`,
    );
  }

  // resvg's `background` option flattens pixel data to opaque, but @resvg/resvg-js
  // always encodes PNGs with an RGBA color type — sips still reports hasAlpha: yes even
  // though every pixel is fully opaque. Route through sharp's removeAlpha() to re-encode
  // as a true alpha-free (RGB) PNG.
  const iconPng = await sharp(iconRender.asPng()).removeAlpha().png().toBuffer();
  writeFileSync(ICON_OUTPUT_PATH, iconPng);

  // favicon.png — downscaled from the already-rendered icon buffer so it stays
  // pixel-consistent with icon.png.
  const faviconPng = await sharp(iconPng)
    .resize(FAVICON_PX, FAVICON_PX, { kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .png()
    .toBuffer();
  writeFileSync(FAVICON_OUTPUT_PATH, faviconPng);

  // splash-icon.png — full-canvas mark composition, transparent, no background rect.
  const splashRender = new Resvg(fullCanvasMarkDoc, {
    fitTo: { mode: "width", value: SPLASH_WIDTH_PX },
    background: TRANSPARENT_BACKGROUND,
  }).render();
  writeFileSync(SPLASH_OUTPUT_PATH, splashRender.asPng());

  // android-icon-foreground.png — mark centered within the ~66% Android safe zone.
  const foregroundPng = await renderCenteredOnSafeZone(croppedMarkDoc, bbox);
  writeFileSync(ANDROID_FOREGROUND_OUTPUT_PATH, foregroundPng);

  // android-icon-monochrome.png — same centering, solid white silhouette, no depth layer (D-07).
  const monochromePng = await renderCenteredOnSafeZone(croppedMonoDoc, monoBBox);
  writeFileSync(ANDROID_MONOCHROME_OUTPUT_PATH, monochromePng);

  // lafa-homepage-lockup.png — the lockup's own baked-in #FFF9F6 rounded-rect background
  // already paints the canvas; the mark is injected from the canonical icon source at
  // render time (D-02) so an icon change propagates here automatically.
  const lockupSvg = readFileSync(LOCKUP_SOURCE_SVG_PATH, "utf-8");
  const lockupDoc = buildLockupDoc(lockupSvg, colorMarkup);
  const lockupRender = new Resvg(lockupDoc, {
    fitTo: { mode: "width", value: LOCKUP_WIDTH_PX },
    background: TRANSPARENT_BACKGROUND,
  }).render();

  if (lockupRender.width !== LOCKUP_WIDTH_PX || lockupRender.height !== LOCKUP_HEIGHT_PX) {
    throw new Error(
      `rendered lockup is ${lockupRender.width}x${lockupRender.height}, expected ${LOCKUP_WIDTH_PX}x${LOCKUP_HEIGHT_PX} — check fitTo/viewBox config`,
    );
  }

  writeFileSync(LOCKUP_OUTPUT_PATH, lockupRender.asPng());
}

main();
