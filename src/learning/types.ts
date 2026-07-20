import type { Subject, Tense } from "../dataset/types";

export interface FormMatch {
  tense: Tense;
  subject: Subject;
}

export type MismatchCategory =
  | "wrongTense"
  | "wrongSubject"
  | "wrongTenseAndSubject"
  | "generic";

export interface LearningTemplates {
  wrongTense: string;
  wrongSubject: string;
  wrongTenseAndSubject: string;
  correctAnswerReveal: string;
  generic: string;
}

export interface VerbLearningEntry {
  irregularTenses: Tense[];
  tenseNotes?: Partial<Record<Tense, string>>;
  subjectHints?: Partial<Record<Subject, string>>;
}

export interface LearningContent {
  version: 1;
  templates: LearningTemplates;
  verbs: Record<string, VerbLearningEntry>;
}
