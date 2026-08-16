import { resolveChoiceStyle } from "../src/quiz/choiceStyle";
import { colors } from "../src/theme/tokens";

describe("resolveChoiceStyle", () => {
  it("unlocked, not pressed: resolves to the default surface color", () => {
    expect(resolveChoiceStyle("falo", "falo", null, false)).toEqual({
      variant: "default",
      backgroundColor: colors.surface,
      textColor: colors.text,
    });
  });

  it("unlocked, pressed: resolves to the neutral choicePressed color, never colors.pressed or colors.error", () => {
    const result = resolveChoiceStyle("falo", "falo", null, true);
    expect(result).toEqual({
      variant: "pressed",
      backgroundColor: colors.choicePressed,
      textColor: colors.text,
    });
    expect(result.backgroundColor).not.toBe(colors.pressed);
    expect(result.backgroundColor).not.toBe(colors.error);
  });

  it("locked, selected, correct: resolves to success color with on-color text", () => {
    expect(resolveChoiceStyle("falo", "falo", "falo", false)).toEqual({
      variant: "correct",
      backgroundColor: colors.success,
      textColor: colors.background,
    });
  });

  it("locked, selected, wrong: resolves to error color with on-color text", () => {
    expect(resolveChoiceStyle("falas", "falo", "falas", false)).toEqual({
      variant: "wrong",
      backgroundColor: colors.error,
      textColor: colors.background,
    });
  });

  it("locked, unselected-but-correct (a wrong answer was picked): reveals correct color", () => {
    expect(resolveChoiceStyle("falo", "falo", "falas", false)).toEqual({
      variant: "correct",
      backgroundColor: colors.success,
      textColor: colors.background,
    });
  });

  it("locked, unselected, also-wrong distractor: stays default", () => {
    expect(resolveChoiceStyle("falam", "falo", "falas", false)).toEqual({
      variant: "default",
      backgroundColor: colors.surface,
      textColor: colors.text,
    });
  });

  describe("precedence: locked state always wins over pressed (UX-03)", () => {
    it("locked + selected + correct + pressed -> still success, never choicePressed", () => {
      const result = resolveChoiceStyle("falo", "falo", "falo", true);
      expect(result).toEqual({
        variant: "correct",
        backgroundColor: colors.success,
        textColor: colors.background,
      });
      expect(result.backgroundColor).not.toBe(colors.choicePressed);
    });

    it("locked + selected + wrong + pressed -> still error, never choicePressed", () => {
      const result = resolveChoiceStyle("falas", "falo", "falas", true);
      expect(result).toEqual({
        variant: "wrong",
        backgroundColor: colors.error,
        textColor: colors.background,
      });
      expect(result.backgroundColor).not.toBe(colors.choicePressed);
    });

    it("locked + unselected-but-correct + pressed -> still success", () => {
      const result = resolveChoiceStyle("falo", "falo", "falas", true);
      expect(result).toEqual({
        variant: "correct",
        backgroundColor: colors.success,
        textColor: colors.background,
      });
    });

    it("locked + unselected + also-wrong + pressed -> still default surface (pressed ignored once locked)", () => {
      const result = resolveChoiceStyle("falam", "falo", "falas", true);
      expect(result).toEqual({
        variant: "default",
        backgroundColor: colors.surface,
        textColor: colors.text,
      });
    });
  });
});
