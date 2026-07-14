import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { tenseLabels } from "../src/quiz/labels";
import { TENSES } from "../src/dataset/types";
import type { Tense } from "../src/dataset/types";

export default function Index() {
  const router = useRouter();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const status = useQuizStore((s) => s.status);
  const errorMessage = useQuizStore((s) => s.errorMessage);

  const [selectedTenses, setSelectedTenses] = useState<Tense[]>([]);
  const [includeIrregular, setIncludeIrregular] = useState(false);
  const [starting, setStarting] = useState(false);

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
    try {
      await startQuiz({ tenses: selectedTenses, includeIrregular });
      const nextStatus = useQuizStore.getState().status;
      if (nextStatus === "in-progress") {
        router.replace("/quiz");
      }
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Pressable
        onPress={handleStartQuiz}
        disabled={!canStart || starting}
        style={[styles.startButton, (!canStart || starting) && styles.startButtonDisabled]}
      >
        <Text style={styles.startButtonText}>
          {starting ? "Starting…" : "Start Quiz"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000000",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FF3B30",
    marginBottom: 24,
  },
  startButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
