import type { Verb } from "./types";
import { validateDataset } from "./validate";
import { LearningContentSchema } from "../learning/schema";
import type { LearningContent } from "../learning/types";

const CONTENT_ENDPOINT = "https://portuguese-verb-api.onrender.com/content/verbs";
const TIMEOUT_MS = 90_000;

export async function fetchRemoteVerbs(): Promise<{
  verbs: Verb[];
  learning: LearningContent | undefined;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CONTENT_ENDPOINT, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`content fetch failed: ${response.status}`);
    }

    const payload = await response.json();

    if (!Array.isArray(payload.verbs)) {
      throw new Error("content fetch failed: payload.verbs is not an array");
    }

    const { valid, errors } = validateDataset(payload.verbs);
    if (!valid) {
      throw new Error(`invalid remote dataset shape: ${errors.join("; ")}`);
    }

    const learningResult = LearningContentSchema.safeParse(payload.learning);
    const learning = learningResult.success ? learningResult.data : undefined;

    return { verbs: payload.verbs as Verb[], learning };
  } finally {
    clearTimeout(timeoutId);
  }
}
