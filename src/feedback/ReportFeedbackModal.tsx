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

  useEffect(() => {
    if (visible) {
      setReason("wrong_answer");
      setMessage("");
      setState("idle");
      setLastStatus(null);
    }
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
          placeholderTextColor="#8E8E93"
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
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit feedback</Text>
          )}
        </Pressable>

        {showRetry ? (
          <Pressable onPress={handleSubmit} style={styles.retryButton}>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 24,
  },
  reasonList: {
    gap: 12,
    marginBottom: 24,
  },
  reasonOption: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  reasonOptionSelected: {
    backgroundColor: "#007AFF",
  },
  reasonOptionText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  reasonOptionTextSelected: {
    color: "#FFFFFF",
  },
  textInput: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#34C759",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#FF3B30",
    marginBottom: 16,
  },
  submitButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
