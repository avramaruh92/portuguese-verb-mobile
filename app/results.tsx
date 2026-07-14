import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { score } from "../src/quiz/scoring";
import { buildShareMessage } from "../src/quiz/share";

export default function Results() {
  const router = useRouter();
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
      <View style={styles.container}>
        {status === "error" && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        {unexpectedError ? (
          <Text style={styles.errorText}>{unexpectedError}</Text>
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
    <View style={styles.container}>
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
    paddingHorizontal: 16,
    paddingTop: 64,
    backgroundColor: "#FFFFFF",
  },
  scoreBlock: {
    alignItems: "center",
    marginBottom: 48,
  },
  scoreText: {
    fontSize: 56,
    fontWeight: "600",
    lineHeight: 62,
    color: "#000000",
    textAlign: "center",
  },
  scoreCaption: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8E8E93",
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FF3B30",
    marginBottom: 24,
    textAlign: "center",
  },
  actions: {
    gap: 16,
  },
  shareButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tryAgainButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  backButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
});
