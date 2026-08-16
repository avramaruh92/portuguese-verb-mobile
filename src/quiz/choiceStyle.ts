import { colors } from "../theme/tokens";

export type ChoiceVariant = "default" | "pressed" | "correct" | "wrong";

export interface ChoiceStyle {
  variant: ChoiceVariant;
  backgroundColor: string;
  textColor: string;
}

export function resolveChoiceStyle(
  choice: string,
  correctAnswer: string,
  lockedChoice: string | null,
  pressed: boolean,
): ChoiceStyle {
  if (lockedChoice !== null) {
    if (choice === lockedChoice && choice === correctAnswer) {
      return { variant: "correct", backgroundColor: colors.success, textColor: colors.background };
    }
    if (choice === lockedChoice && choice !== correctAnswer) {
      return { variant: "wrong", backgroundColor: colors.error, textColor: colors.background };
    }
    if (choice !== lockedChoice && choice === correctAnswer) {
      return { variant: "correct", backgroundColor: colors.success, textColor: colors.background };
    }
    return { variant: "default", backgroundColor: colors.surface, textColor: colors.text };
  }

  if (pressed) {
    return { variant: "pressed", backgroundColor: colors.choicePressed, textColor: colors.text };
  }

  return { variant: "default", backgroundColor: colors.surface, textColor: colors.text };
}
