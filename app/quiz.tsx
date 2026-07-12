import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { verbs } from "../src/dataset/verbs";

export default function Quiz() {
  const router = useRouter();
  const session = useQuizStore((s) => s.session);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const lockedChoice = useQuizStore((s) => s.lockedChoice);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const advance = useQuizStore((s) => s.advance);

  if (!session) return null;

  const question = session.questions[currentIndex];
  if (!question) return null;

  const currentVerb = verbs.find((v) => v.verb === question.verb);
  const total = session.questions.length;
  const progress = (currentIndex + 1) / total;

  function handleAdvance() {
    advance();
    const nextStatus = useQuizStore.getState().status;
    if (nextStatus === "completed") {
      router.replace("/results");
    }
  }

  function choiceStyle(choice: string, correctAnswer: string) {
    if (lockedChoice === null) {
      return { container: styles.choiceDefault, text: styles.choiceTextDefault };
    }
    const isSelected = choice === lockedChoice;
    const isCorrect = choice === correctAnswer;
    if (isSelected && isCorrect) {
      return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
    }
    if (isSelected && !isCorrect) {
      return { container: styles.choiceWrong, text: styles.choiceTextOnColor };
    }
    if (!isSelected && isCorrect && lockedChoice !== correctAnswer) {
      return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
    }
    return { container: styles.choiceDefault, text: styles.choiceTextDefault };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {total}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.verbHeading}>{question.verb}</Text>
        <Text style={styles.metaRow}>
          {currentVerb?.translation ?? ""} · {tenseLabels[question.tense]} ·{" "}
          {subjectLabels[question.subject]}
        </Text>
      </View>

      <View style={styles.choices}>
        {question.choices.map((choice) => {
          const style = choiceStyle(choice, question.correctAnswer);
          return (
            <Pressable
              key={choice}
              onPress={() => selectAnswer(choice)}
              style={[styles.choice, style.container]}
            >
              <Text style={[styles.choiceText, style.text]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleAdvance}
        style={[styles.nextButton, lockedChoice === null && styles.nextButtonHidden]}
        pointerEvents={lockedChoice === null ? "none" : "auto"}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  progressRow: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F2F2F7",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007AFF",
  },
  questionBlock: {
    marginBottom: 24,
  },
  verbHeading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  metaRow: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  choices: {
    gap: 12,
    marginBottom: 24,
  },
  choice: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  choiceDefault: {
    backgroundColor: "#F2F2F7",
  },
  choiceCorrect: {
    backgroundColor: "#34C759",
  },
  choiceWrong: {
    backgroundColor: "#FF3B30",
  },
  choiceText: {
    fontSize: 16,
    fontWeight: "400",
  },
  choiceTextDefault: {
    color: "#000000",
  },
  choiceTextOnColor: {
    color: "#FFFFFF",
  },
  nextButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonHidden: {
    opacity: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
