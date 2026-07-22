import { z } from "zod";

import { SCREENS, type ProductFeedbackScreen } from "./types";

export const productFeedbackPayloadSchema = z.object({
  category: z.enum(["bug", "idea", "other"]),
  message: z.string().min(1).max(2000),
  screen: z.enum(
    SCREENS as unknown as [ProductFeedbackScreen, ...ProductFeedbackScreen[]],
  ),
  appVersion: z.string().min(1).max(20),
  platform: z.enum(["ios", "android"]),
});
