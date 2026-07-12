import type { z } from "zod";

import { feedbackPayloadSchema } from "./schema";

export type FeedbackReason = "wrong_answer" | "typo" | "confusing" | "other";

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

export type SubmitResult =
  | { status: "success"; data: unknown }
  | { status: "validation-error" }
  | { status: "server-error" }
  | { status: "network-error" };
