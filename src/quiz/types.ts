import type { Tense, Subject } from "../dataset/types";

export interface Triple {
  verb: string;
  tense: Tense;
  subject: Subject;
}

export interface Question extends Triple {
  choices: string[];
  correctAnswer: string;
}

export interface QuizSession {
  questions: Question[];
}

export type VerbMode = "regular_only" | "mixed" | "irregular_only";

export interface GenerateOptions {
  tenses: Tense[];
  verbMode: VerbMode;
}

export class InsufficientVerbsError extends Error {
  constructor(
    public readonly eligibleCount: number,
    public readonly required: number,
  ) {
    super(
      `Insufficient eligible questions: ${eligibleCount} available, ${required} required`,
    );
    this.name = "InsufficientVerbsError";
  }
}
