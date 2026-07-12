import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { score } from "../src/quiz/scoring";
import { buildShareMessage } from "../src/quiz/share";

export default function Results() {
  const router = useRouter();
  const session = useQuizStore((s) => s.session);
  const answers = useQuizStore((s) => s.answers);
  const filters = useQuizStore((s) => s.filters);
  const startQuiz = useQuizStore((s) => s.startQuiz);

  if (!session) return null;

  const { correct, total } = score(session, answers);

  async function handleShare() {
    try {
      await Share.share({ message: buildShareMessage(correct, total) });
    } catch {
      // Silently swallow share errors — screen stays interactive.
    }
  }

  function handleTryAgain() {
    if (!filters) {
      router.replace("/");
      return;
    }
    startQuiz(filters);
    const nextStatus = useQuizStore.getState().status;
    if (nextStatus === "in-progress") {
      router.replace("/quiz");
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

        <Pressable onPress={handleTryAgain} style={styles.tryAgainButton}>
          <Text style={styles.tryAgainButtonText}>Try Again</Text>
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
