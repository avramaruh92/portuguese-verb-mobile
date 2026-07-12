import { z } from "zod";

const SubjectConjugationsSchema = z.object({
  eu: z.string().min(1),
  tu: z.string().min(1),
  ele_ela: z.string().min(1),
  nos: z.string().min(1),
  voces: z.string().min(1),
  eles_elas: z.string().min(1),
});

const TenseConjugationsSchema = z.object({
  present_indicative: SubjectConjugationsSchema,
  preterite: SubjectConjugationsSchema,
  imperfect: SubjectConjugationsSchema,
  future: SubjectConjugationsSchema,
});

export const VerbSchema = z.object({
  verb: z.string().min(1),
  translation: z.string().min(1),
  isIrregular: z.boolean(),
  conjugations: TenseConjugationsSchema,
});

export function validateDataset(verbs: unknown[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  verbs.forEach((v, i) => {
    const result = VerbSchema.safeParse(v);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      errors.push(`verbs[${i}]: ${issues}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
