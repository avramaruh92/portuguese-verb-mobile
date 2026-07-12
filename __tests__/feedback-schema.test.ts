import { feedbackPayloadSchema } from "../src/feedback/schema";
import { FEEDBACK_REASONS, reasonLabels } from "../src/feedback/reasons";
import { TENSES, SUBJECTS } from "../src/dataset/types";

const PLATFORMS = ["ios", "android"] as const;

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    message: "Wrong answer",
    verb: "falar",
    tense: "present_indicative",
    subject: "eu",
    correctAnswer: "falo",
    selectedAnswer: "falas",
    appVersion: "1.0.0",
    platform: "ios",
    ...overrides,
  };
}

describe("feedbackPayloadSchema", () => {
  TENSES.forEach((tense) => {
    SUBJECTS.forEach((subject) => {
      PLATFORMS.forEach((platform) => {
        it(`accepts valid payload for tense=${tense} subject=${subject} platform=${platform}`, () => {
          const result = feedbackPayloadSchema.safeParse(
            validPayload({ tense, subject, platform }),
          );
          expect(result.success).toBe(true);
        });
      });
    });
  });

  it("rejects an invalid tense literal", () => {
    const result = feedbackPayloadSchema.safeParse(
      validPayload({ tense: "present" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid subject literal", () => {
    const result = feedbackPayloadSchema.safeParse(
      validPayload({ subject: "ele" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid platform literal", () => {
    const result = feedbackPayloadSchema.safeParse(
      validPayload({ platform: "web" }),
    );
    expect(result.success).toBe(false);
  });

  (
    [
      "message",
      "verb",
      "correctAnswer",
      "selectedAnswer",
      "appVersion",
    ] as const
  ).forEach((field) => {
    it(`rejects an empty-string ${field}`, () => {
      const result = feedbackPayloadSchema.safeParse(
        validPayload({ [field]: "" }),
      );
      expect(result.success).toBe(false);
    });
  });
});

describe("FEEDBACK_REASONS", () => {
  it("is ordered exactly wrong_answer, typo, confusing, other", () => {
    expect(FEEDBACK_REASONS.map((r) => r.value)).toEqual([
      "wrong_answer",
      "typo",
      "confusing",
      "other",
    ]);
  });

  it("maps each reason to the exact UI copy label", () => {
    expect(reasonLabels).toEqual({
      wrong_answer: "Wrong answer",
      typo: "Typo or spelling",
      confusing: "Confusing wording",
      other: "Other",
    });
  });

  it("FEEDBACK_REASONS labels match reasonLabels", () => {
    FEEDBACK_REASONS.forEach(({ value, label }) => {
      expect(label).toBe(reasonLabels[value]);
    });
  });
});
