import { colors, spacing, radius, typography } from "./tokens";

describe("theme tokens (Lafa palette + token completeness)", () => {
  it("colors export the exact Lafa palette", () => {
    expect(colors).toEqual({
      primary: "#F2643E",
      primarySoft: "#FDE7DF",
      pressed: "#C94A2D",
      info: "#36799A",
      success: "#1F7F66",
      error: "#D64545",
      background: "#FFF9F6",
      text: "#24201E",
      textSecondary: "#746D69",
      surface: "#F1EFED",
    });
  });

  it("colors no longer export the old accent/secondary keys", () => {
    expect((colors as Record<string, unknown>).accent).toBeUndefined();
    expect((colors as Record<string, unknown>).secondary).toBeUndefined();
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

  it("radius exports control and the new pill radius", () => {
    expect(radius).toEqual({ control: 12, pill: 999 });
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
