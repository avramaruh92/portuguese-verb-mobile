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

import { colors, radius, spacing, typography } from "../theme/tokens";
import { CATEGORY_OPTIONS } from "./categories";
import { buildProductFeedbackPayload } from "./payload";
import { submitProductFeedback } from "./submit";
import type {
  ProductFeedbackCategory,
  ProductFeedbackScreen,
  SubmitResult,
} from "./types";

type ModalState = "idle" | "submitting" | "success" | "error";

export type ProductFeedbackModalProps = {
  visible: boolean;
  screen: ProductFeedbackScreen;
  appVersion: string;
  platform: "ios" | "android";
  onClose: () => void;
};

export function ProductFeedbackModal({
  visible,
  screen,
  appVersion,
  platform,
  onClose,
}: ProductFeedbackModalProps) {
  const [category, setCategory] = useState<ProductFeedbackCategory>("bug");
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
      setCategory("bug");
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
      const payload = buildProductFeedbackPayload({
        category,
        message,
        screen,
        appVersion,
        platform,
      });
      const result = await submitProductFeedback(payload);
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
  const isSubmitDisabled = isSubmitting || message.trim().length === 0;

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onDismiss={onClose}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Send feedback</Text>

        <View style={styles.categoryList}>
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = option.value === category;
            return (
              <Pressable
                key={option.value}
                onPress={() => setCategory(option.value)}
                disabled={isSubmitting}
                style={[
                  styles.categoryOption,
                  isSelected && styles.categoryOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    isSelected && styles.categoryOptionTextSelected,
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
          placeholder="What's on your mind?"
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
          disabled={isSubmitDisabled}
          style={({ pressed }) => [
            styles.submitButton,
            isSubmitDisabled && styles.submitButtonDisabled,
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
  categoryList: {
    gap: spacing.choiceGap,
    marginBottom: spacing.lg,
  },
  categoryOption: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    ...typography.body,
    color: colors.text,
  },
  categoryOptionTextSelected: {
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
