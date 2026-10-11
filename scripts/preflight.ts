const BASE_URL = "https://portuguese-verb-api.onrender.com";
const HEALTH_ENDPOINT = `${BASE_URL}/health`;
const CONTENT_ENDPOINT = `${BASE_URL}/content/verbs`;
const FEEDBACK_ENDPOINT = `${BASE_URL}/feedback`;
const PRODUCT_FEEDBACK_ENDPOINT = `${BASE_URL}/product-feedback`;
const TIMEOUT_MS = 90_000;

const DUMMY_FEEDBACK_PAYLOAD = {
  message: "preflight smoke test — ignore",
  verb: "falar",
  tense: "present_indicative",
  subject: "eu",
  correctAnswer: "falo",
  selectedAnswer: "falo",
  appVersion: "preflight",
  platform: "ios",
};

const DUMMY_PRODUCT_FEEDBACK_PAYLOAD = {
  category: "other",
  message: "preflight smoke test — ignore",
  screen: "setup",
  appVersion: "preflight",
  platform: "ios",
};

interface CheckResult {
  label: string;
  ok: boolean;
  actual: number | string;
  expected: number;
}

async function checkStatus(
  label: string,
  url: string,
  expected: number,
  init?: RequestInit,
): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { label, ok: response.status === expected, actual: response.status, expected };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkHealth(): Promise<CheckResult> {
  return checkStatus("/health", HEALTH_ENDPOINT, 200);
}

async function checkContentVerbs(): Promise<CheckResult> {
  return checkStatus("/content/verbs", CONTENT_ENDPOINT, 200);
}

async function checkFeedback(): Promise<CheckResult> {
  return checkStatus("/feedback", FEEDBACK_ENDPOINT, 201, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DUMMY_FEEDBACK_PAYLOAD),
  });
}

async function checkProductFeedback(): Promise<CheckResult> {
  return checkStatus("/product-feedback", PRODUCT_FEEDBACK_ENDPOINT, 201, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DUMMY_PRODUCT_FEEDBACK_PAYLOAD),
  });
}

async function main(): Promise<void> {
  const results = [
    await checkHealth(),
    await checkContentVerbs(),
    await checkFeedback(),
    await checkProductFeedback(),
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
