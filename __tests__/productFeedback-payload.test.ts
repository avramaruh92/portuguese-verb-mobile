import { buildProductFeedbackPayload } from "../src/productFeedback/payload";
import { productFeedbackPayloadSchema } from "../src/productFeedback/schema";

const baseParams = {
  category: "bug" as const,
  message: "Something is broken",
  screen: "quiz" as const,
  appVersion: "1.0.0",
  platform: "ios" as const,
};

describe("buildProductFeedbackPayload", () => {
  it("trims the message", () => {
    const payload = buildProductFeedbackPayload({
      ...baseParams,
      message: "  hi  ",
    });
    expect(payload.message).toBe("hi");
  });

  it("does not prefix the message with any category label", () => {
    const payload = buildProductFeedbackPayload({
      ...baseParams,
      category: "idea",
      message: "add dark mode",
    });
    expect(payload.message).toBe("add dark mode");
  });

  it("passes through all fields unchanged", () => {
    const payload = buildProductFeedbackPayload(baseParams);
    expect(payload.category).toBe(baseParams.category);
    expect(payload.message).toBe(baseParams.message);
    expect(payload.screen).toBe(baseParams.screen);
    expect(payload.appVersion).toBe(baseParams.appVersion);
    expect(payload.platform).toBe(baseParams.platform);
  });

  it("returns exactly the 5 allowed fields, never quiz-answer context (PFDBK-05)", () => {
    const payload = buildProductFeedbackPayload(baseParams);
    expect(Object.keys(payload).sort()).toEqual([
      "appVersion",
      "category",
      "message",
      "platform",
      "screen",
    ]);
  });

  it("produces a payload that round-trips through productFeedbackPayloadSchema", () => {
    const payload = buildProductFeedbackPayload(baseParams);
    expect(productFeedbackPayloadSchema.safeParse(payload).success).toBe(
      true,
    );
  });
});
