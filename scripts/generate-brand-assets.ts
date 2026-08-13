import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
const FAVICON_OUTPUT_PATH = "assets/images/favicon.png";
const SPLASH_OUTPUT_PATH = "assets/images/splash-icon.png";
const ANDROID_FOREGROUND_OUTPUT_PATH = "assets/images/android-icon-foreground.png";
const ANDROID_MONOCHROME_OUTPUT_PATH = "assets/images/android-icon-monochrome.png";

const CANVAS_PX = 1024;
const SPLASH_WIDTH_PX = 1024;
const FAVICON_PX = 48;
const SAFE_ZONE_RATIO = 0.66;
const SAFE_ZONE_PX = Math.round(CANVAS_PX * SAFE_ZONE_RATIO); // 676

const ICON_BACKGROUND_HEX = "#FFF9F6";
const TRANSPARENT_BACKGROUND = "rgba(0,0,0,0)";
const MARK_FILL = 'fill="#F2643E"';
const MONOCHROME_FILL = 'fill="#FFFFFF"';
const EXPECTED_MARK_PATH_COUNT = 2;

const BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" rx="230" fill="${ICON_BACKGROUND_HEX}"/>`;
// No `rx` — the flattened square is deliberate so the OS-level icon mask does not
// double-round on top of a pre-baked rounded-rect background (D-03).
const FLAT_BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" fill="${ICON_BACKGROUND_HEX}"/>`;

function extractMarkOnly(svg: string): string {
  if (!svg.includes(BACKGROUND_RECT)) {
    throw new Error(
      `${SOURCE_SVG_PATH} is missing the expected background rect — source may have changed shape`,
    );
  }

  const markFillCount = svg.split(MARK_FILL).length - 1;
  if (markFillCount !== EXPECTED_MARK_PATH_COUNT) {
    throw new Error(
      `${SOURCE_SVG_PATH} has ${markFillCount} mark paths, expected ${EXPECTED_MARK_PATH_COUNT} — source may have changed shape`,
    );
  }

  const rootTagEnd = svg.indexOf(">", svg.indexOf("<svg"));
  const svgCloseIndex = svg.lastIndexOf("</svg>");
  if (rootTagEnd === -1 || svgCloseIndex === -1) {
    throw new Error(
      `${SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
    );
  }

  const innerMarkup = svg.slice(rootTagEnd + 1, svgCloseIndex).replace(BACKGROUND_RECT, "");

  if (innerMarkup.trim().length === 0 || !innerMarkup.includes('clip-path="url(')) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark markup is missing the expected clip-path reference (or <defs> was lost) — source may have changed shape`,
    );
  }

  return innerMarkup;
}

function wrapMarkDoc(markMarkup: string, viewBox: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markMarkup}</svg>`;
}

function buildFullIconDoc(markMarkup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">${FLAT_BACKGROUND_RECT}${markMarkup}</svg>`;
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

function toMonochromeSilhouette(markDoc: string): string {
  const recolored = markDoc.replaceAll(MARK_FILL, MONOCHROME_FILL);

  if (recolored.includes(MARK_FILL) || recolored.includes("#F2643E")) {
    throw new Error(
      `${SOURCE_SVG_PATH} monochrome recolor left an orange fill behind — partial recolour must never ship as a themed icon`,
    );
  }

  return recolored;
}

async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const mark = extractMarkOnly(sourceSvg);

  const fullCanvasMarkDoc = wrapMarkDoc(mark, `0 0 ${CANVAS_PX} ${CANVAS_PX}`);
  const bbox = getMarkBBox(fullCanvasMarkDoc);
  const croppedMarkDoc = wrapMarkDoc(mark, `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  // icon.png — full-bleed flat #FFF9F6 background, no baked-in rounding (D-03).
  const iconRender = new Resvg(buildFullIconDoc(mark), {
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

  // android-icon-monochrome.png — same centering/scale, solid white silhouette (D-06).
  const monochromePng = await renderCenteredOnSafeZone(
    toMonochromeSilhouette(croppedMarkDoc),
    bbox,
  );
  writeFileSync(ANDROID_MONOCHROME_OUTPUT_PATH, monochromePng);
}

main();
