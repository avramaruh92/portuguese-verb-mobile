import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Subject, Tense } from "../dataset/types";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { buildFeedbackPayload } from "./payload";
import { FEEDBACK_REASONS } from "./reasons";
import { submitFeedback } from "./submit";
import type { FeedbackReason, SubmitResult } from "./types";

type ModalState = "idle" | "submitting" | "success" | "error";

export type ReportFeedbackModalProps = {
  visible: boolean;
  verb: string;
  tense: Tense;
  subject: Subject;
  correctAnswer: string;
  selectedAnswer: string;
  appVersion: string;
  platform: "ios" | "android";
  onClose: () => void;
};

export function ReportFeedbackModal({
  visible,
  verb,
  tense,
  subject,
  correctAnswer,
  selectedAnswer,
  appVersion,
  platform,
  onClose,
}: ReportFeedbackModalProps) {
  const [reason, setReason] = useState<FeedbackReason>("wrong_answer");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ModalState>("idle");
  const [lastStatus, setLastStatus] = useState<SubmitResult["status"] | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NOTE: React Compiler (app.json `experiments.reactCompiler`) forbids
  // reading/writing a ref's `.current` during render (react-hooks/refs), so
  // the "previous visible" tracker below uses useState, not useRef, per
  // React's documented "adjusting state when a prop changes" pattern. This
  // avoids react-hooks/set-state-in-effect by not resetting from an effect.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setReason("wrong_answer");
      setMessage("");
      setState("idle");
      setLastStatus(null);
    }
  }

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible]);

  async function handleSubmit() {
    try {
      setState("submitting");
      const payload = buildFeedbackPayload({
        verb,
        tense,
        subject,
        correctAnswer,
        selectedAnswer,
        reason,
        freeText: message,
        appVersion,
        platform,
      });
      const result = await submitFeedback(payload);
      if (result.status === "success") {
        setState("success");
        setLastStatus(result.status);
        timerRef.current = setTimeout(onClose, 1500);
      } else {
        setState("error");
        setLastStatus(result.status);
      }
    } catch {
      setState("error");
      setLastStatus("network-error");
    }
  }

  const isSubmitting = state === "submitting";
  const showRetry =
    state === "error" &&
    (lastStatus === "server-error" || lastStatus === "network-error");

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onDismiss={onClose}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Report a problem</Text>

        <View style={styles.reasonList}>
          {FEEDBACK_REASONS.map((option) => {
            const isSelected = option.value === reason;
            return (
              <Pressable
                key={option.value}
                onPress={() => setReason(option.value)}
                disabled={isSubmitting}
                style={[
                  styles.reasonOption,
                  isSelected && styles.reasonOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    isSelected && styles.reasonOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={!isSubmitting}
          placeholder="Add details (optional)"
          placeholderTextColor={colors.textSecondary}
          style={styles.textInput}
          multiline
        />

        {state === "success" ? (
          <Text style={styles.successText}>✓ Feedback sent — thank you!</Text>
        ) : null}

        {state === "error" ? (
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
            pressed && { backgroundColor: colors.pressed },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Submit feedback</Text>
          )}
        </Pressable>

        {showRetry ? (
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && { backgroundColor: colors.pressed },
            ]}
          >
            <Text style={styles.retryButtonText}>Retry submission</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  reasonList: {
    gap: spacing.choiceGap,
    marginBottom: spacing.lg,
  },
  reasonOption: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  reasonOptionSelected: {
    backgroundColor: colors.primary,
  },
  reasonOptionText: {
    ...typography.body,
    color: colors.text,
  },
  reasonOptionTextSelected: {
    color: colors.background,
  },
  textInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
  submitButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
  retryButton: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  retryButtonText: {
    ...typography.bodyStrong,
    color: colors.background,
  },
});
