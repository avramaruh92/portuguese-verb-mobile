import type { FormMatch } from "../learning/types";

export type Tense =
  | "present_indicative"
  | "preterite"
  | "imperfect"
  | "future";

export type Subject =
  | "eu"
  | "tu"
  | "ele_ela"
  | "nos"
  | "voces"
  | "eles_elas";

export const TENSES: readonly Tense[] = [
  "present_indicative",
  "preterite",
  "imperfect",
  "future",
];

export const SUBJECTS: readonly Subject[] = [
  "eu",
  "tu",
  "ele_ela",
  "nos",
  "voces",
  "eles_elas",
];

export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
  formIndex?: Record<string, FormMatch[]>;
}
