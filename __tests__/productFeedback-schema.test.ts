import { productFeedbackPayloadSchema } from "../src/productFeedback/schema";
import {
  CATEGORY_OPTIONS,
  categoryLabels,
} from "../src/productFeedback/categories";
import { SCREENS } from "../src/productFeedback/types";

const CATEGORIES = ["bug", "idea", "other"] as const;
const PLATFORMS = ["ios", "android"] as const;

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    category: "bug",
    message: "Something is broken",
    screen: "setup",
    appVersion: "1.0.0",
    platform: "ios",
    ...overrides,
  };
}

describe("productFeedbackPayloadSchema", () => {
  CATEGORIES.forEach((category) => {
    SCREENS.forEach((screen) => {
      PLATFORMS.forEach((platform) => {
        it(`accepts valid payload for category=${category} screen=${screen} platform=${platform}`, () => {
          const result = productFeedbackPayloadSchema.safeParse(
            validPayload({ category, screen, platform }),
          );
          expect(result.success).toBe(true);
        });
      });
    });
  });

  it("rejects an invalid category literal", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ category: "invalid" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid screen literal", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ screen: "invalid" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid platform literal", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ platform: "invalid" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string message", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ message: "" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string appVersion", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ appVersion: "" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ message: "a".repeat(2001) }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a message of exactly 2000 characters", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ message: "a".repeat(2000) }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an appVersion over 20 characters", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ appVersion: "a".repeat(21) }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts an appVersion of exactly 20 characters", () => {
    const result = productFeedbackPayloadSchema.safeParse(
      validPayload({ appVersion: "a".repeat(20) }),
    );
    expect(result.success).toBe(true);
  });
});

describe("CATEGORY_OPTIONS", () => {
  it("is ordered exactly bug, idea, other", () => {
    expect(CATEGORY_OPTIONS.map((c) => c.value)).toEqual([
      "bug",
      "idea",
      "other",
    ]);
  });

  it("maps each category to the exact UI copy label", () => {
    expect(categoryLabels).toEqual({
      bug: "Bug",
      idea: "Idea",
      other: "Other",
    });
  });

  it("CATEGORY_OPTIONS labels match categoryLabels", () => {
    CATEGORY_OPTIONS.forEach(({ value, label }) => {
      expect(label).toBe(categoryLabels[value]);
    });
  });
});
