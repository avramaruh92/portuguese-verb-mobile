import { useState } from "react";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { score } from "../src/quiz/scoring";
import { buildShareMessage } from "../src/quiz/share";
import { colors, radius, spacing, typography } from "../src/theme/tokens";

export default function Results() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useQuizStore((s) => s.session);
  const status = useQuizStore((s) => s.status);
  const errorMessage = useQuizStore((s) => s.errorMessage);
  const answers = useQuizStore((s) => s.answers);
  const filters = useQuizStore((s) => s.filters);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const [starting, setStarting] = useState(false);
  const [unexpectedError, setUnexpectedError] = useState<string | null>(null);

  if (!session) {
    // No completed session to show (fresh state, or Try Again failed) —
    // never render a blank screen, always give the user a way forward.
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: true, headerTitle: "" }} />
        {status === "error" && errorMessage ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        {unexpectedError ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{unexpectedError}</Text>
          </View>
        ) : null}
        <Pressable onPress={() => router.replace("/")} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </Pressable>
      </View>
    );
  }

  const { correct, total } = score(session, answers);

  async function handleShare() {
    try {
      await Share.share({ message: buildShareMessage(correct, total) });
    } catch {
      // Silently swallow share errors — screen stays interactive.
    }
  }

  async function handleTryAgain() {
    if (!filters) {
      router.replace("/");
      return;
    }
    if (starting) return;
    setStarting(true);
    setUnexpectedError(null);
    try {
      await startQuiz(filters);
      const nextStatus = useQuizStore.getState().status;
      if (nextStatus === "in-progress") {
        router.replace("/quiz");
      }
      // if nextStatus === "error" the component now re-renders the
      // fallback branch above instead of going blank
    } catch (error) {
      // surface unexpected errors instead of letting them become
      // unhandled promise rejections
      setUnexpectedError(String(error));
    } finally {
      setStarting(false);
    }
  }

  function handleBackToSetup() {
    router.replace("/");
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: true, headerTitle: "" }} />
      <View style={styles.scoreBlock}>
        <Text style={styles.scoreText}>
          {correct}/{total}
        </Text>
        <Text style={styles.scoreCaption}>correct out of {total} questions</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share Score</Text>
        </Pressable>

        <Pressable
          onPress={handleTryAgain}
          disabled={starting}
          style={styles.tryAgainButton}
        >
          {starting ? <ActivityIndicator size="small" color={colors.background} /> : null}
          <Text style={styles.tryAgainButtonText}>
            {starting ? "Starting…" : "Try Again"}
          </Text>
        </Pressable>

        <Pressable onPress={handleBackToSetup} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  scoreBlock: {
    alignItems: "center",
    marginBottom: spacing.xl2,
  },
  scoreText: {
    ...typography.display,
    color: colors.text,
    textAlign: "center",
  },
  scoreCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorBlock: {
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
  },
  actions: {
    gap: spacing.md,
  },
  shareButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
  tryAgainButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  tryAgainButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
  backButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
