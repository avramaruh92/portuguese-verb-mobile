import { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { tenseLabels } from "../src/quiz/labels";
import { TENSES } from "../src/dataset/types";
import type { Tense } from "../src/dataset/types";
import type { VerbMode } from "../src/quiz/types";
import { colors, radius, spacing, typography } from "../src/theme/tokens";
import { LOCKUP_CONTENT_X0, LOCKUP_CONTENT_X1, LOCKUP_CONTENT_Y0, LOCKUP_CONTENT_Y1 } from "../src/theme/lockup";
import { OfflinePill } from "../src/components/OfflinePill";
import { ProductFeedbackModal } from "../src/productFeedback/ProductFeedbackModal";

const VERB_MODE_OPTIONS: { value: VerbMode; label: string }[] = [
  { value: "regular_only", label: "Regular only" },
  { value: "mixed", label: "Mixed" },
  { value: "irregular_only", label: "Irregular only" },
];

const LOCKUP_HEIGHT = 110;
const LOCKUP_CONTENT_WIDTH = LOCKUP_CONTENT_X1 - LOCKUP_CONTENT_X0;
const LOCKUP_CONTENT_HEIGHT = LOCKUP_CONTENT_Y1 - LOCKUP_CONTENT_Y0;
const LOCKUP_SCALE = LOCKUP_HEIGHT / LOCKUP_CONTENT_HEIGHT;
const LOCKUP_CROP_WIDTH = LOCKUP_CONTENT_WIDTH * LOCKUP_SCALE;
const LOCKUP_FULL_WIDTH = 1600 * LOCKUP_SCALE;
const LOCKUP_FULL_HEIGHT = 520 * LOCKUP_SCALE;
const LOCKUP_OFFSET_X = -LOCKUP_CONTENT_X0 * LOCKUP_SCALE;
const LOCKUP_OFFSET_Y = -LOCKUP_CONTENT_Y0 * LOCKUP_SCALE;

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const status = useQuizStore((s) => s.status);
  const errorMessage = useQuizStore((s) => s.errorMessage);

  const [selectedTenses, setSelectedTenses] = useState<Tense[]>([]);
  const [verbMode, setVerbMode] = useState<VerbMode>("regular_only");
  const [starting, setStarting] = useState(false);
  const [unexpectedError, setUnexpectedError] = useState<string | null>(null);
  const [productFeedbackVisible, setProductFeedbackVisible] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const platform: "ios" | "android" = Platform.OS === "android" ? "android" : "ios";

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
      await startQuiz({ tenses: selectedTenses, verbMode });
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
      <View
        style={styles.lockupCrop}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Lafa — Learn it. Say it."
      >
        <Image
          source={require("../assets/images/lafa-homepage-lockup.png")}
          style={{
            position: "absolute",
            width: LOCKUP_FULL_WIDTH,
            height: LOCKUP_FULL_HEIGHT,
            left: LOCKUP_OFFSET_X,
            top: LOCKUP_OFFSET_Y,
          }}
          resizeMode="stretch"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verb mode</Text>
        <View style={styles.chipRow}>
          {VERB_MODE_OPTIONS.map((opt) => {
            const selected = verbMode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setVerbMode(opt.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        style={({ pressed }) => [
          styles.startButton,
          (!canStart || starting) && styles.startButtonDisabled,
          pressed && { backgroundColor: colors.pressed },
        ]}
      >
        {starting ? <ActivityIndicator size="small" color={colors.background} /> : null}
        <Text style={styles.startButtonText}>
          {starting ? "Starting…" : "Start Quiz"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setProductFeedbackVisible(true)}
        style={styles.productFeedbackLink}
      >
        <Text style={styles.productFeedbackLinkText}>Help us improve</Text>
      </Pressable>

      <ProductFeedbackModal
        visible={productFeedbackVisible}
        screen="setup"
        appVersion={appVersion}
        platform={platform}
        onClose={() => setProductFeedbackVisible(false)}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: spacing.xl2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  lockupCrop: {
    width: LOCKUP_CROP_WIDTH,
    height: LOCKUP_HEIGHT,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: spacing.lg,
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
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.background,
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
    backgroundColor: colors.primary,
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
  productFeedbackLink: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  productFeedbackLinkText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: "center",
  },
});
