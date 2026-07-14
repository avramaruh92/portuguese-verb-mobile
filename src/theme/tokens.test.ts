import { colors, spacing, radius, typography } from "./tokens";

describe("theme tokens (D-03 verbatim-value guard)", () => {
  it("colors export exact verbatim iOS-system palette", () => {
    expect(colors).toEqual({
      background: "#FFFFFF",
      secondary: "#F2F2F7",
      accent: "#007AFF",
      error: "#FF3B30",
      success: "#34C759",
      text: "#000000",
      textSecondary: "#8E8E93",
    });
  });

  it("spacing exports exact verbatim scale, including the 12px choiceGap exception", () => {
    expect(spacing).toEqual({
      sm: 8,
      md: 16,
      lg: 24,
      xl2: 48,
      xl3: 64,
      choiceGap: 12,
    });
  });

  it("radius exports exact verbatim control radius", () => {
    expect(radius).toEqual({ control: 12 });
  });

  it("typography.display matches exact verbatim size/weight/lineHeight", () => {
    expect(typography.display).toEqual({
      fontSize: 56,
      fontWeight: "600",
      lineHeight: 62,
    });
  });

  it("typography.heading matches exact verbatim size/weight", () => {
    expect(typography.heading).toEqual({ fontSize: 20, fontWeight: "600" });
  });

  it("typography.body matches exact verbatim size/weight", () => {
    expect(typography.body).toEqual({ fontSize: 16, fontWeight: "400" });
  });

  it("typography.bodyStrong matches exact verbatim size/weight", () => {
    expect(typography.bodyStrong).toEqual({ fontSize: 16, fontWeight: "600" });
  });

  it("typography.caption matches exact verbatim size/weight", () => {
    expect(typography.caption).toEqual({ fontSize: 14, fontWeight: "400" });
  });
});
