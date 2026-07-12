import { buildFeedbackPayload } from "../src/feedback/payload";
import { feedbackPayloadSchema } from "../src/feedback/schema";
import { reasonLabels } from "../src/feedback/reasons";
import type { FeedbackReason } from "../src/feedback/types";

const REASONS: FeedbackReason[] = [
  "wrong_answer",
  "typo",
  "confusing",
  "other",
];

const baseParams = {
  verb: "falar",
  tense: "present_indicative" as const,
  subject: "eu" as const,
  correctAnswer: "falo",
  selectedAnswer: "falas",
  appVersion: "1.0.0",
  platform: "ios" as const,
};

describe("buildFeedbackPayload", () => {
  REASONS.forEach((reason) => {
    it(`composes "<label>: <freeText>" message for reason=${reason} with free text`, () => {
      const payload = buildFeedbackPayload({
        ...baseParams,
        reason,
        freeText: "verb is misspelled",
      });
      expect(payload.message).toBe(
        `${reasonLabels[reason]}: verb is misspelled`,
      );
    });

    it(`composes label-only message for reason=${reason} with empty free text`, () => {
      const payload = buildFeedbackPayload({
        ...baseParams,
        reason,
        freeText: "",
      });
      expect(payload.message).toBe(reasonLabels[reason]);
    });

    it(`composes label-only message for reason=${reason} with whitespace-only free text`, () => {
      const payload = buildFeedbackPayload({
        ...baseParams,
        reason,
        freeText: "   ",
      });
      expect(payload.message).toBe(reasonLabels[reason]);
    });
  });

  it("trims free text before composing the message", () => {
    const payload = buildFeedbackPayload({
      ...baseParams,
      reason: "other",
      freeText: "  extra spaces  ",
    });
    expect(payload.message).toBe("Other: extra spaces");
  });

  it("passes through all context fields unchanged", () => {
    const payload = buildFeedbackPayload({
      ...baseParams,
      reason: "wrong_answer",
      freeText: "",
    });
    expect(payload.verb).toBe(baseParams.verb);
    expect(payload.tense).toBe(baseParams.tense);
    expect(payload.subject).toBe(baseParams.subject);
    expect(payload.correctAnswer).toBe(baseParams.correctAnswer);
    expect(payload.selectedAnswer).toBe(baseParams.selectedAnswer);
    expect(payload.appVersion).toBe(baseParams.appVersion);
    expect(payload.platform).toBe(baseParams.platform);
  });

  it("produces a payload that round-trips through feedbackPayloadSchema", () => {
    const payload = buildFeedbackPayload({
      ...baseParams,
      reason: "confusing",
      freeText: "not sure why this is wrong",
    });
    expect(feedbackPayloadSchema.safeParse(payload).success).toBe(true);
  });
});
