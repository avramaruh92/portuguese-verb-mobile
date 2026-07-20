import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels, tenseGrammarNames } from "../src/quiz/labels";
import { ReportFeedbackModal } from "../src/feedback/ReportFeedbackModal";
import { colors, spacing, radius, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";
import { ExplanationPanel } from "../src/components/ExplanationPanel";
import { selectExplanation } from "../src/learning/explain";

export default function Quiz() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const session = useQuizStore((s) => s.session);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const lockedChoice = useQuizStore((s) => s.lockedChoice);
  const status = useQuizStore((s) => s.status);
  const verbs = useQuizStore((s) => s.verbs);
  const learning = useQuizStore((s) => s.learning);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const advance = useQuizStore((s) => s.advance);
  const reset = useQuizStore((s) => s.reset);
  const [reportVisible, setReportVisible] = useState(false);

  function confirmExit(onConfirm: () => void) {
    Alert.alert("Quit Quiz?", "Your progress will be lost.", [
      { text: "Keep Practicing", style: "cancel" },
      { text: "Quit Quiz", style: "destructive", onPress: onConfirm },
    ]);
  }

  function onConfirm() {
    reset();
    router.replace("/");
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (status !== "in-progress") return;
      e.preventDefault();
      confirmExit(onConfirm);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, status, reset, router]);

  function handleExitPress() {
    if (status !== "in-progress") return;
    confirmExit(onConfirm);
  }

  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const platform: "ios" | "android" = Platform.OS === "android" ? "android" : "ios";

  if (!session) return null;

  const question = session.questions[currentIndex];
  if (!question) return null;

  const currentVerb = verbs.find((v) => v.verb === question.verb);
  const explanation =
    lockedChoice !== null && lockedChoice !== question.correctAnswer && currentVerb
      ? selectExplanation(currentVerb, lockedChoice, question, learning)
      : undefined;
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
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <Pressable onPress={handleExitPress}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
      >
        <OfflinePill />
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
            {currentVerb?.translation ?? ""} · {tenseLabels[question.tense]}
            {tenseGrammarNames[question.tense]
              ? ` (${tenseGrammarNames[question.tense]})`
              : ""}{" "}
            · {subjectLabels[question.subject]}
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

        {explanation && <ExplanationPanel text={explanation} />}

        <Pressable
          onPress={handleAdvance}
          style={[styles.nextButton, lockedChoice === null && styles.nextButtonHidden]}
          pointerEvents={lockedChoice === null ? "none" : "auto"}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </Pressable>

        <Pressable
          onPress={() => setReportVisible(true)}
          style={[styles.reportButton, lockedChoice === null && styles.reportButtonHidden]}
          pointerEvents={lockedChoice === null ? "none" : "auto"}
        >
          <Text style={styles.reportButtonText}>Report a problem</Text>
        </Pressable>

        <ReportFeedbackModal
          visible={reportVisible}
          verb={question.verb}
          tense={question.tense}
          subject={question.subject}
          correctAnswer={question.correctAnswer}
          selectedAnswer={lockedChoice ?? ""}
          appVersion={appVersion}
          platform={platform}
          onClose={() => setReportVisible(false)}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  exitButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  progressRow: {
    marginBottom: spacing.lg,
  },
  progressText: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  questionBlock: {
    marginBottom: spacing.lg,
  },
  verbHeading: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    ...typography.body,
    color: colors.text,
  },
  choices: {
    gap: spacing.choiceGap,
    marginBottom: spacing.lg,
  },
  choice: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  choiceDefault: {
    backgroundColor: colors.surface,
  },
  choiceCorrect: {
    backgroundColor: colors.success,
  },
  choiceWrong: {
    backgroundColor: colors.error,
  },
  choiceText: {
    ...typography.body,
  },
  choiceTextDefault: {
    color: colors.text,
  },
  choiceTextOnColor: {
    color: colors.background,
  },
  nextButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonHidden: {
    opacity: 0,
  },
  nextButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
  reportButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  reportButtonHidden: {
    opacity: 0,
  },
  reportButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});
