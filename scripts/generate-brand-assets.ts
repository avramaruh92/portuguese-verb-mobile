import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";

const SOURCE_SVG_PATH = "assets/brand/lafa-logo-v2.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
const SPLASH_OUTPUT_PATH = "assets/images/splash-icon.png";
const ICON_BACKGROUND = "#FCE4DA";
const SPLASH_BACKGROUND = "rgba(0,0,0,0)";
const ICON_SIZE_PX = 1024;
const SPLASH_WIDTH_PX = 228;
const CROP_VIEWBOX = "192 92 640 640";
const ICON_GROUP_OPEN_TAG = '<g id="icon">';
const ICON_GROUP_CLOSE_TAG = "</g>";
const GREEN_ACCENT_DOT = '<circle cx="667" cy="522" r="18" fill="#2FA84F"/>';
const BACKGROUND_RECT = '<rect x="192" y="92" width="640" height="640" rx="176" fill="#FCE4DA"/>';

function extractIconGroup(svg: string): string {
  const groupStart = svg.indexOf(ICON_GROUP_OPEN_TAG);
  if (groupStart === -1) {
    throw new Error(
      `${SOURCE_SVG_PATH} has no ${ICON_GROUP_OPEN_TAG} — source may have changed shape`,
    );
  }

  const groupEnd = svg.indexOf(ICON_GROUP_CLOSE_TAG, groupStart);
  if (groupEnd === -1) {
    throw new Error(
      `${SOURCE_SVG_PATH} has an unterminated ${ICON_GROUP_OPEN_TAG} group — source may have changed shape`,
    );
  }

  return svg.slice(groupStart, groupEnd + ICON_GROUP_CLOSE_TAG.length);
}

function wrapInSvgRoot(innerMarkup: string): string {
  return `<svg viewBox="${CROP_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">${innerMarkup}</svg>`;
}

function buildIconDoc(iconGroup: string): string {
  return wrapInSvgRoot(iconGroup);
}

function buildSplashDoc(iconGroup: string): string {
  if (!iconGroup.includes(BACKGROUND_RECT)) {
    throw new Error(
      `${SOURCE_SVG_PATH} icon group is missing the expected background rect — source may have changed shape`,
    );
  }
  if (!iconGroup.includes(GREEN_ACCENT_DOT)) {
    throw new Error(
      `${SOURCE_SVG_PATH} icon group is missing the expected green accent dot — source may have changed shape`,
    );
  }

  const withoutBackground = iconGroup.replace(BACKGROUND_RECT, "");
  const withoutGreenDot = withoutBackground.replace(GREEN_ACCENT_DOT, ""); // D-11: green dot is dropped, not recolored
  const monochrome = withoutGreenDot
    .replaceAll('fill="#E8663D"', 'fill="#FFFFFF"')
    .replaceAll('stroke="#E8663D"', 'stroke="#FFFFFF"');

  return wrapInSvgRoot(monochrome);
}

function generateIcon(iconGroup: string): void {
  const iconDoc = buildIconDoc(iconGroup);
  const render = new Resvg(iconDoc, {
    fitTo: { mode: "width", value: ICON_SIZE_PX },
    background: ICON_BACKGROUND,
  }).render();

  if (render.width !== ICON_SIZE_PX || render.height !== ICON_SIZE_PX) {
    throw new Error(
      `rendered icon is ${render.width}x${render.height}, expected ${ICON_SIZE_PX}x${ICON_SIZE_PX} — check fitTo/viewBox config`,
    );
  }

  writeFileSync(ICON_OUTPUT_PATH, render.asPng());
}

function generateSplash(iconGroup: string): void {
  const splashDoc = buildSplashDoc(iconGroup);
  const render = new Resvg(splashDoc, {
    fitTo: { mode: "width", value: SPLASH_WIDTH_PX },
    background: SPLASH_BACKGROUND, // transparent — #208AEF plugin blue must show through (D-05)
  }).render();

  writeFileSync(SPLASH_OUTPUT_PATH, render.asPng());
}

function main(): void {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const iconGroup = extractIconGroup(sourceSvg);

  generateIcon(iconGroup);
  generateSplash(iconGroup);
}

main();
