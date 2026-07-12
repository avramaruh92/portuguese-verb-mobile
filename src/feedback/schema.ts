import { z } from "zod";

import { TENSES, SUBJECTS, type Tense, type Subject } from "../dataset/types";

export const feedbackPayloadSchema = z.object({
  message: z.string().min(1),
  verb: z.string().min(1),
  tense: z.enum(TENSES as unknown as [Tense, ...Tense[]]),
  subject: z.enum(SUBJECTS as unknown as [Subject, ...Subject[]]),
  correctAnswer: z.string().min(1),
  selectedAnswer: z.string().min(1),
  appVersion: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});
