import type { Tense, Subject } from "../dataset/types";
import type { FeedbackReason, FeedbackPayload } from "./types";
import { reasonLabels } from "./reasons";

export function buildFeedbackPayload(params: {
  verb: string;
  tense: Tense;
  subject: Subject;
  correctAnswer: string;
  selectedAnswer: string;
  reason: FeedbackReason;
  freeText: string;
  appVersion: string;
  platform: "ios" | "android";
}): FeedbackPayload {
  const trimmedFreeText = params.freeText.trim();
  const label = reasonLabels[params.reason];
  const message = trimmedFreeText ? `${label}: ${trimmedFreeText}` : label;

  return {
    message,
    verb: params.verb,
    tense: params.tense,
    subject: params.subject,
    correctAnswer: params.correctAnswer,
    selectedAnswer: params.selectedAnswer,
    appVersion: params.appVersion,
    platform: params.platform,
  };
}
