import type { FeedbackReason } from "./types";

export const reasonLabels: Record<FeedbackReason, string> = {
  wrong_answer: "Wrong answer",
  typo: "Typo or spelling",
  confusing: "Confusing wording",
  other: "Other",
};

export const FEEDBACK_REASONS: { value: FeedbackReason; label: string }[] = (
  ["wrong_answer", "typo", "confusing", "other"] as const
).map((value) => ({ value, label: reasonLabels[value] }));
