import { z } from "zod";

import { TENSES, SUBJECTS, type Tense, type Subject } from "../dataset/types";

const TenseEnum = z.enum(TENSES as unknown as [Tense, ...Tense[]]);
const SubjectEnum = z.enum(SUBJECTS as unknown as [Subject, ...Subject[]]);

export const FormMatchSchema = z.object({
  tense: TenseEnum,
  subject: SubjectEnum,
});

const VerbLearningEntrySchema = z.object({
  irregularTenses: z.array(TenseEnum),
  tenseNotes: z.partialRecord(TenseEnum, z.string().min(1)).optional(),
  subjectHints: z.partialRecord(SubjectEnum, z.string().min(1)).optional(),
});

export const LearningContentSchema = z.object({
  version: z.literal(1),
  templates: z.object({
    wrongTense: z.string().min(1),
    wrongSubject: z.string().min(1),
    wrongTenseAndSubject: z.string().min(1),
    correctAnswerReveal: z.string().min(1),
    generic: z.string().min(1),
  }),
  verbs: z.record(z.string(), VerbLearningEntrySchema),
});
