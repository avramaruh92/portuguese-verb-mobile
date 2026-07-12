import type { FeedbackPayload, SubmitResult } from "./types";

const FEEDBACK_ENDPOINT = "https://portuguese-verb-api.onrender.com/feedback";
const TIMEOUT_MS = 90_000;

export async function submitFeedback(
  payload: FeedbackPayload,
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 201) {
      const data = await response.json();
      return { status: "success", data };
    }

    if (response.status === 400) {
      return { status: "validation-error" };
    }

    return { status: "server-error" };
  } catch {
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
