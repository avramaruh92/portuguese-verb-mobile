import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";

interface ExplanationPanelProps {
  text: string;
}

export function ExplanationPanel({ text }: ExplanationPanelProps) {
  return (
    <View style={styles.container} testID="explanation-panel">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
