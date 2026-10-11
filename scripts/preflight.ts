const BASE_URL = "https://portuguese-verb-api-fra.onrender.com";
const HEALTH_ENDPOINT = `${BASE_URL}/health`;
const CONTENT_ENDPOINT = `${BASE_URL}/content/verbs`;
const FEEDBACK_ENDPOINT = `${BASE_URL}/feedback`;
const PRODUCT_FEEDBACK_ENDPOINT = `${BASE_URL}/product-feedback`;
// Overall abort for the dev tool. /health runs first with only this limit so
// it absorbs a Render cold boot; the later checks must also finish within the
// app's own timeouts, or a PASS would not prove the app gets that response.
const TIMEOUT_MS = 90_000;
const CONTENT_BUDGET_MS = 15_000; // src/dataset/remote.ts TIMEOUT_MS (NET-01)
const FEEDBACK_BUDGET_MS = 45_000; // src/feedback + src/productFeedback TIMEOUT_MS (NET-02)

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
  expected: string;
}

async function checkStatus(
  label: string,
  url: string,
  expectedStatus: number,
  budgetMs: number,
  init?: RequestInit,
): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const expected = `${expectedStatus} within ${budgetMs}ms`;
  const started = Date.now();

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const ms = Date.now() - started;
    return {
      label,
      ok: response.status === expectedStatus && ms <= budgetMs,
      actual: `${response.status} in ${ms}ms`,
      expected,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ms = Date.now() - started;
    return { label, ok: false, actual: `error after ${ms}ms: ${message}`, expected };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkHealth(): Promise<CheckResult> {
  return checkStatus("/health", HEALTH_ENDPOINT, 200, TIMEOUT_MS);
}

async function checkContentVerbs(): Promise<CheckResult> {
  return checkStatus("/content/verbs", CONTENT_ENDPOINT, 200, CONTENT_BUDGET_MS);
}

async function checkFeedback(): Promise<CheckResult> {
  return checkStatus("/feedback", FEEDBACK_ENDPOINT, 201, FEEDBACK_BUDGET_MS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DUMMY_FEEDBACK_PAYLOAD),
  });
}

async function checkProductFeedback(): Promise<CheckResult> {
  return checkStatus("/product-feedback", PRODUCT_FEEDBACK_ENDPOINT, 201, FEEDBACK_BUDGET_MS, {
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
