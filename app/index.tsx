import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { tenseLabels } from "../src/quiz/labels";
import { TENSES } from "../src/dataset/types";
import type { Tense } from "../src/dataset/types";
import { colors, radius, spacing, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const status = useQuizStore((s) => s.status);
  const errorMessage = useQuizStore((s) => s.errorMessage);

  const [selectedTenses, setSelectedTenses] = useState<Tense[]>([]);
  const [includeIrregular, setIncludeIrregular] = useState(false);
  const [starting, setStarting] = useState(false);
  const [unexpectedError, setUnexpectedError] = useState<string | null>(null);

  const allSelected = selectedTenses.length === TENSES.length;
  const canStart = selectedTenses.length > 0;

  function toggleTense(tense: Tense) {
    setSelectedTenses((prev) =>
      prev.includes(tense) ? prev.filter((t) => t !== tense) : [...prev, tense],
    );
  }

  function toggleAll() {
    setSelectedTenses(allSelected ? [] : [...TENSES]);
  }

  async function handleStartQuiz() {
    if (!canStart || starting) return;
    setStarting(true);
    setUnexpectedError(null);
    try {
      await startQuiz({ tenses: selectedTenses, includeIrregular });
      const nextStatus = useQuizStore.getState().status;
      if (nextStatus === "in-progress") {
        router.replace("/quiz");
      }
    } catch (error) {
      // surface unexpected errors instead of letting them become
      // unhandled promise rejections
      setUnexpectedError(String(error));
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: "" }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OfflinePill />
      <Text style={styles.heading}>Portuguese Verb Quiz</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select tenses</Text>
        <View style={styles.chipRow}>
          {TENSES.map((tense) => {
            const selected = selectedTenses.includes(tense);
            return (
              <Pressable
                key={tense}
                onPress={() => toggleTense(tense)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {tenseLabels[tense]}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={toggleAll}
            style={[styles.chip, allSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, allSelected && styles.chipTextSelected]}>
              All tenses
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.section, styles.toggleRow]}>
        <Text style={styles.toggleLabel}>Include irregular verbs</Text>
        <Switch value={includeIrregular} onValueChange={setIncludeIrregular} />
      </View>

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

      <Pressable
        onPress={handleStartQuiz}
        disabled={!canStart || starting}
        style={[styles.startButton, (!canStart || starting) && styles.startButtonDisabled]}
      >
        {starting ? <ActivityIndicator size="small" color={colors.background} /> : null}
        <Text style={styles.startButtonText}>
          {starting ? "Starting…" : "Start Quiz"}
        </Text>
      </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  heading: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.control,
    backgroundColor: colors.secondary,
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipText: {
    ...typography.body,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.background,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  toggleLabel: {
    ...typography.caption,
    color: colors.text,
  },
  errorBlock: {
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  startButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
});
