import { existsSync, readFileSync } from "node:fs";

import sharp from "sharp";

const APP_JSON_PATH = "app.json";
const GENERATOR_PATH = "scripts/generate-brand-assets.ts";

const ICON_PATH = "assets/images/icon.png";
const FAVICON_PATH = "assets/images/favicon.png";
const SPLASH_PATH = "assets/images/splash-icon.png";
const ANDROID_FOREGROUND_PATH = "assets/images/android-icon-foreground.png";
const ANDROID_MONOCHROME_PATH = "assets/images/android-icon-monochrome.png";

const CANVAS_PX = 1024;
const FAVICON_PX = 48;

const EXPECTED_BRAND_BG_HEX = "#FFF9F6";

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
    const metadata = await sharp(path).metadata();
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
    const metadata = await sharp(path).metadata();
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
    const text = readFileSync(APP_JSON_PATH, "utf-8").toLowerCase();
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
    const json = JSON.parse(readFileSync(APP_JSON_PATH, "utf-8"));
    const actual = json?.expo?.android?.adaptiveIcon?.backgroundColor ?? "undefined";
    return { label, ok: actual === EXPECTED_BRAND_BG_HEX, actual, expected: EXPECTED_BRAND_BG_HEX };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: EXPECTED_BRAND_BG_HEX };
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
    const json = JSON.parse(readFileSync(APP_JSON_PATH, "utf-8"));
    const config = findSplashPluginConfig(json);
    if (!config) {
      return [
        { label: bgLabel, ok: false, actual: "plugin entry not found", expected: EXPECTED_BRAND_BG_HEX },
        { label: imageLabel, ok: false, actual: "plugin entry not found", expected: expectedImage },
      ];
    }
    const actualBg = config.backgroundColor ?? "undefined";
    const actualImage = config.image ?? "undefined";
    return [
      { label: bgLabel, ok: actualBg === EXPECTED_BRAND_BG_HEX, actual: String(actualBg), expected: EXPECTED_BRAND_BG_HEX },
      { label: imageLabel, ok: actualImage === expectedImage, actual: String(actualImage), expected: expectedImage },
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      { label: bgLabel, ok: false, actual: `error: ${message}`, expected: EXPECTED_BRAND_BG_HEX },
      { label: imageLabel, ok: false, actual: `error: ${message}`, expected: expectedImage },
    ];
  }
}

function checkReferencedAssetsExist(): CheckResult[] {
  try {
    const json = JSON.parse(readFileSync(APP_JSON_PATH, "utf-8"));
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
      const ok = existsSync(strippedPath);
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
    const text = readFileSync(GENERATOR_PATH, "utf-8");
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
    generatorText = readFileSync(GENERATOR_PATH, "utf-8");
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
    const existsOnDisk = existsSync(assetPath);
    const ok = !referencedInGenerator && !existsOnDisk;
    const actual = `referencedInGenerator=${referencedInGenerator}, existsOnDisk=${existsOnDisk}`;
    return { label: `generator + disk have no reference to ${assetPath}`, ok, actual, expected: "absent" };
  });
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
    checkForbiddenHexAbsent(),
    checkAdaptiveBackground(),
    ...checkSplashBackground(),
    ...checkReferencedAssetsExist(),
    checkGeneratorSource(),
    ...checkGeneratorHasNoRetiredRefs(),
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
