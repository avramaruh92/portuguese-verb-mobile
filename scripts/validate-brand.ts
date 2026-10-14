import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

import { LOCKUP_CONTENT_X0, LOCKUP_CONTENT_X1, LOCKUP_CONTENT_Y0, LOCKUP_CONTENT_Y1 } from "../src/theme/lockup.ts";
import { colors } from "../src/theme/tokens.ts";
import { DEPTH_FILL_HEX, ICON_BACKGROUND_HEX, MONOCHROME_FILL_HEX, ORANGE_FILL_HEX } from "./brand-colors.ts";

const ROOT = resolve(import.meta.dirname, "..");
const abs = (rel: string): string => resolve(ROOT, rel);

const APP_JSON_PATH = "app.json";
const GENERATOR_PATH = "scripts/generate-brand-assets.ts";

const ICON_PATH = "assets/images/icon.png";
const FAVICON_PATH = "assets/images/favicon.png";
const SPLASH_PATH = "assets/images/splash-icon.png";
const ANDROID_FOREGROUND_PATH = "assets/images/android-icon-foreground.png";
const ANDROID_MONOCHROME_PATH = "assets/images/android-icon-monochrome.png";
const LOCKUP_PATH = "assets/images/lafa-homepage-lockup.png";

const CANVAS_PX = 1024;
const FAVICON_PX = 48;
const LOCKUP_WIDTH_PX = 3200; // mirrors scripts/generate-brand-assets.ts
const LOCKUP_HEIGHT_PX = 1040;

const PIXEL_TOLERANCE = 8;
const LOCKUP_ALPHA_MIN = 200;
const LOCKUP_CROP_TOLERANCE_PX = 2;

const FORBIDDEN_HEXES = ["#208AEF", "#E6F4FE"];

const ALLOWED_SVG_SOURCE = "assets/brand/lafa-icon.svg";
const RETIRED_BRAND_ASSETS = [
  "assets/brand/lafa-logo.svg",
  "assets/brand/lafa-logo-v2.svg",
  "assets/brand/lafa-logo-concept.png",
  "assets/brand/lafa-logo-v2-concept.png",
];

interface CheckResult {
  label: string;
  ok: boolean;
  actual: number | string;
  expected: number | string;
}

async function checkPngDimensions(
  label: string,
  path: string,
  expectedWidth: number,
  expectedHeight: number,
): Promise<CheckResult> {
  const expected = `${expectedWidth}x${expectedHeight}`;
  try {
    const metadata = await sharp(abs(path)).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const actual = `${width}x${height}`;
    return { label, ok: actual === expected, actual, expected };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected };
  }
}

async function checkNoAlpha(label: string, path: string): Promise<CheckResult> {
  const expected = "false";
  try {
    const metadata = await sharp(abs(path)).metadata();
    const hasAlpha = metadata.hasAlpha ?? true;
    return { label, ok: hasAlpha === false, actual: String(hasAlpha), expected };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected };
  }
}

function checkForbiddenHexAbsent(): CheckResult {
  const label = "app.json forbidden hex absent";
  try {
    const text = readFileSync(abs(APP_JSON_PATH), "utf-8").toLowerCase();
    const found = FORBIDDEN_HEXES.find((hex) => text.includes(hex.toLowerCase()));
    if (found) {
      return { label, ok: false, actual: `found ${found}`, expected: "none present" };
    }
    return { label, ok: true, actual: "none present", expected: "none present" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: "none present" };
  }
}

function checkAdaptiveBackground(): CheckResult {
  const label = "android adaptiveIcon backgroundColor";
  try {
    const json = JSON.parse(readFileSync(abs(APP_JSON_PATH), "utf-8"));
    const actual = json?.expo?.android?.adaptiveIcon?.backgroundColor ?? "undefined";
    return { label, ok: actual === ICON_BACKGROUND_HEX, actual, expected: ICON_BACKGROUND_HEX };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: ICON_BACKGROUND_HEX };
  }
}

function findSplashPluginConfig(json: unknown): { backgroundColor?: unknown; image?: unknown } | undefined {
  const plugins = (json as { expo?: { plugins?: unknown[] } })?.expo?.plugins;
  if (!Array.isArray(plugins)) {
    return undefined;
  }
  for (const entry of plugins) {
    if (Array.isArray(entry) && entry[0] === "expo-splash-screen") {
      const config = entry[1];
      if (config && typeof config === "object") {
        return config as { backgroundColor?: unknown; image?: unknown };
      }
    }
  }
  return undefined;
}

function checkSplashBackground(): CheckResult[] {
  const bgLabel = "expo-splash-screen backgroundColor";
  const imageLabel = "expo-splash-screen image";
  const expectedImage = "./assets/images/splash-icon.png";
  try {
    const json = JSON.parse(readFileSync(abs(APP_JSON_PATH), "utf-8"));
    const config = findSplashPluginConfig(json);
    if (!config) {
      return [
        { label: bgLabel, ok: false, actual: "plugin entry not found", expected: ICON_BACKGROUND_HEX },
        { label: imageLabel, ok: false, actual: "plugin entry not found", expected: expectedImage },
      ];
    }
    const actualBg = config.backgroundColor ?? "undefined";
    const actualImage = config.image ?? "undefined";
    return [
      { label: bgLabel, ok: actualBg === ICON_BACKGROUND_HEX, actual: String(actualBg), expected: ICON_BACKGROUND_HEX },
      { label: imageLabel, ok: actualImage === expectedImage, actual: String(actualImage), expected: expectedImage },
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      { label: bgLabel, ok: false, actual: `error: ${message}`, expected: ICON_BACKGROUND_HEX },
      { label: imageLabel, ok: false, actual: `error: ${message}`, expected: expectedImage },
    ];
  }
}

function checkReferencedAssetsExist(): CheckResult[] {
  try {
    const json = JSON.parse(readFileSync(abs(APP_JSON_PATH), "utf-8"));
    const expo = json?.expo ?? {};
    const splashConfig = findSplashPluginConfig(json);

    const references: { label: string; value: unknown }[] = [
      { label: "expo.icon exists", value: expo.icon },
      { label: "expo.web.favicon exists", value: expo?.web?.favicon },
      { label: "expo.android.adaptiveIcon.foregroundImage exists", value: expo?.android?.adaptiveIcon?.foregroundImage },
      { label: "expo.android.adaptiveIcon.monochromeImage exists", value: expo?.android?.adaptiveIcon?.monochromeImage },
      { label: "expo-splash-screen image exists", value: splashConfig?.image },
    ];

    return references.map(({ label, value }) => {
      if (typeof value !== "string") {
        return { label, ok: false, actual: "reference missing/not a string", expected: "existing file" };
      }
      const strippedPath = value.startsWith("./") ? value.slice(2) : value;
      const ok = existsSync(abs(strippedPath));
      return { label, ok, actual: ok ? `${strippedPath} exists` : `${strippedPath} missing`, expected: "existing file" };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [{ label: "referenced assets exist", ok: false, actual: `error: ${message}`, expected: "existing file" }];
  }
}

function checkGeneratorSource(): CheckResult {
  const label = "generator references allowed SVG source";
  try {
    const text = readFileSync(abs(GENERATOR_PATH), "utf-8");
    const ok = text.includes(ALLOWED_SVG_SOURCE);
    return { label, ok, actual: ok ? "present" : "absent", expected: "present" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: "present" };
  }
}

function checkGeneratorHasNoRetiredRefs(): CheckResult[] {
  let generatorText: string;
  try {
    generatorText = readFileSync(abs(GENERATOR_PATH), "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return RETIRED_BRAND_ASSETS.map((assetPath) => ({
      label: `generator + disk have no reference to ${assetPath}`,
      ok: false,
      actual: `error: ${message}`,
      expected: "absent",
    }));
  }

  return RETIRED_BRAND_ASSETS.map((assetPath) => {
    const basename = assetPath.split("/").pop() ?? assetPath;
    const referencedInGenerator = generatorText.includes(basename);
    const existsOnDisk = existsSync(abs(assetPath));
    const ok = !referencedInGenerator && !existsOnDisk;
    const actual = `referencedInGenerator=${referencedInGenerator}, existsOnDisk=${existsOnDisk}`;
    return { label: `generator + disk have no reference to ${assetPath}`, ok, actual, expected: "absent" };
  });
}

type Rgb = { r: number; g: number; b: number };
type PixelExpectation = (Rgb & { a: number }) | { transparent: true };

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
}

const rawCache = new Map<string, Promise<RawImage>>();

function readRaw(rel: string): Promise<RawImage> {
  let cached = rawCache.get(rel);
  if (!cached) {
    cached = sharp(abs(rel))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => ({ data, width: info.width, height: info.height }));
    rawCache.set(rel, cached);
  }
  return cached;
}

async function checkPixel(
  label: string,
  path: string,
  x: number,
  y: number,
  expected: PixelExpectation,
  tol: number = PIXEL_TOLERANCE,
): Promise<CheckResult> {
  const expectedText =
    "transparent" in expected
      ? "alpha 0"
      : `rgba(${expected.r},${expected.g},${expected.b},${expected.a})±${tol}`;
  try {
    const { data, width, height } = await readRaw(path);
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return { label, ok: false, actual: "out of bounds", expected: expectedText };
    }
    const i = (y * width + x) * 4;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 0;
    const actual = `rgba(${r},${g},${b},${a})`;
    if ("transparent" in expected) {
      return { label, ok: a === 0, actual, expected: expectedText };
    }
    const ok =
      Math.abs(r - expected.r) <= tol &&
      Math.abs(g - expected.g) <= tol &&
      Math.abs(b - expected.b) <= tol &&
      a === expected.a;
    return { label, ok, actual, expected: expectedText };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: expectedText };
  }
}

async function measureLockupBbox(): Promise<{ x0: number; y0: number; x1: number; y1: number }> {
  const { data, width, height } = await readRaw(LOCKUP_PATH);
  const bg = hexToRgb(ICON_BACKGROUND_HEX);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if ((data[i + 3] ?? 0) < LOCKUP_ALPHA_MIN) continue;
      const differs =
        Math.abs((data[i] ?? 0) - bg.r) > PIXEL_TOLERANCE ||
        Math.abs((data[i + 1] ?? 0) - bg.g) > PIXEL_TOLERANCE ||
        Math.abs((data[i + 2] ?? 0) - bg.b) > PIXEL_TOLERANCE;
      if (!differs) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) {
    throw new Error("no content pixels found");
  }
  return { x0: minX / 2, y0: minY / 2, x1: maxX / 2, y1: maxY / 2 };
}

async function checkLockupCrop(): Promise<CheckResult[]> {
  const edges = [
    { name: "LOCKUP_CONTENT_X0", constant: LOCKUP_CONTENT_X0, key: "x0" },
    { name: "LOCKUP_CONTENT_Y0", constant: LOCKUP_CONTENT_Y0, key: "y0" },
    { name: "LOCKUP_CONTENT_X1", constant: LOCKUP_CONTENT_X1, key: "x1" },
    { name: "LOCKUP_CONTENT_Y1", constant: LOCKUP_CONTENT_Y1, key: "y1" },
  ] as const;
  try {
    const bbox = await measureLockupBbox();
    return edges.map(({ name, constant, key }) => ({
      label: `lockup crop ${name} within ±${LOCKUP_CROP_TOLERANCE_PX}px of measured`,
      ok: Math.abs(bbox[key] - constant) <= LOCKUP_CROP_TOLERANCE_PX,
      actual: bbox[key],
      expected: `${constant} ±${LOCKUP_CROP_TOLERANCE_PX}`,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return edges.map(({ name, constant }) => ({
      label: `lockup crop ${name} within ±${LOCKUP_CROP_TOLERANCE_PX}px of measured`,
      ok: false,
      actual: `error: ${message}`,
      expected: `${constant} ±${LOCKUP_CROP_TOLERANCE_PX}`,
    }));
  }
}

async function checkBrandPixels(): Promise<CheckResult[]> {
  const bg = { ...hexToRgb(ICON_BACKGROUND_HEX), a: 255 };
  const orange = { ...hexToRgb(ORANGE_FILL_HEX), a: 255 };
  const white = { ...hexToRgb(MONOCHROME_FILL_HEX), a: 255 };
  const clear = { transparent: true } as const;
  return [
    await checkPixel("icon.png pixel (2,2) is brand background", ICON_PATH, 2, 2, bg),
    await checkPixel("icon.png pixel (512,307) is brand orange", ICON_PATH, 512, 307, orange),
    await checkPixel("favicon.png pixel (3,3) is brand background", FAVICON_PATH, 3, 3, bg),
    await checkPixel("favicon.png pixel (24,14) is brand orange", FAVICON_PATH, 24, 14, orange),
    await checkPixel("splash-icon.png pixel (2,2) is transparent", SPLASH_PATH, 2, 2, clear),
    await checkPixel("splash-icon.png pixel (512,307) is brand orange", SPLASH_PATH, 512, 307, orange),
    await checkPixel("android-icon-foreground.png pixel (2,2) is transparent", ANDROID_FOREGROUND_PATH, 2, 2, clear),
    await checkPixel("android-icon-foreground.png pixel (512,307) is brand orange", ANDROID_FOREGROUND_PATH, 512, 307, orange),
    await checkPixel("android-icon-monochrome.png pixel (2,2) is transparent", ANDROID_MONOCHROME_PATH, 2, 2, clear),
    await checkPixel("android-icon-monochrome.png pixel (512,307) is white", ANDROID_MONOCHROME_PATH, 512, 307, white),
    await checkPixel("lafa-homepage-lockup.png pixel (100,520) is brand background", LOCKUP_PATH, 100, 520, bg),
    await checkPixel("lafa-homepage-lockup.png pixel (1600,520) is brand orange", LOCKUP_PATH, 1600, 520, orange),
  ];
}

// src/theme/tokens.ts is what the app renders with; brand-colors.ts is what the
// generated PNGs are painted with. The lockup PNG paints its own #FFF9F6
// background, so a drift between the two would show a visible box on Setup.
function checkTokensMatchBrandColors(): CheckResult[] {
  const pairs: [string, string, string][] = [
    ["tokens.background matches brand background", colors.background, ICON_BACKGROUND_HEX],
    ["tokens.primary matches brand orange", colors.primary, ORANGE_FILL_HEX],
    ["tokens.pressed matches brand depth", colors.pressed, DEPTH_FILL_HEX],
  ];
  return pairs.map(([label, actual, expected]) => ({
    label,
    ok: actual.toUpperCase() === expected.toUpperCase(),
    actual,
    expected,
  }));
}

async function main(): Promise<void> {
  const results: CheckResult[] = [
    await checkPngDimensions("icon.png dimensions", ICON_PATH, CANVAS_PX, CANVAS_PX),
    await checkNoAlpha("icon.png no alpha", ICON_PATH),
    await checkPngDimensions("favicon.png dimensions", FAVICON_PATH, FAVICON_PX, FAVICON_PX),
    await checkPngDimensions("splash-icon.png dimensions", SPLASH_PATH, CANVAS_PX, CANVAS_PX),
    await checkPngDimensions(
      "android-icon-foreground.png dimensions",
      ANDROID_FOREGROUND_PATH,
      CANVAS_PX,
      CANVAS_PX,
    ),
    await checkPngDimensions(
      "android-icon-monochrome.png dimensions",
      ANDROID_MONOCHROME_PATH,
      CANVAS_PX,
      CANVAS_PX,
    ),
    await checkPngDimensions(
      "lafa-homepage-lockup.png dimensions",
      LOCKUP_PATH,
      LOCKUP_WIDTH_PX,
      LOCKUP_HEIGHT_PX,
    ),
    checkForbiddenHexAbsent(),
    checkAdaptiveBackground(),
    ...checkSplashBackground(),
    ...checkReferencedAssetsExist(),
    checkGeneratorSource(),
    ...checkGeneratorHasNoRetiredRefs(),
    ...(await checkBrandPixels()),
    ...(await checkLockupCrop()),
    ...checkTokensMatchBrandColors(),
  ];

  for (const result of results) {
    if (result.ok) {
      console.log(`PASS ${result.label} -> ${result.actual}`);
    } else {
      console.log(`FAIL ${result.label} -> expected ${result.expected} got ${result.actual}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  const passedCount = results.length - failed.length;
  console.log(`${passedCount}/${results.length} checks passed`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
