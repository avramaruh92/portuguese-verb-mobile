import type { z } from "zod";

import { productFeedbackPayloadSchema } from "./schema";

export const SCREENS = ["setup", "quiz", "results"] as const;

export type ProductFeedbackScreen = (typeof SCREENS)[number];

export type ProductFeedbackCategory = "bug" | "idea" | "other";

export type ProductFeedbackPayload = z.infer<
  typeof productFeedbackPayloadSchema
>;

export type SubmitResult =
  | { status: "success"; data: unknown }
  | { status: "validation-error" }
  | { status: "server-error" }
  | { status: "network-error" };
