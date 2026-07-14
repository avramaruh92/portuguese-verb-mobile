import { create } from "zustand";
import { generate } from "../quiz/engine";
import type { GenerateOptions, QuizSession } from "../quiz/types";
import { InsufficientVerbsError } from "../quiz/types";
import { resolveVerbs } from "../dataset/source";

type QuizStatus = "idle" | "error" | "in-progress" | "completed";

const INSUFFICIENT_VERBS_MESSAGE =
  "Not enough verbs for that combination — try selecting more tenses or including irregulars.";

interface QuizStoreState {
  status: QuizStatus;
  filters: GenerateOptions | null;
  session: QuizSession | null;
  currentIndex: number;
  answers: (string | null)[];
  lockedChoice: string | null;
  errorMessage: string | null;
  startQuiz: (options: GenerateOptions) => Promise<void>;
  selectAnswer: (choice: string) => void;
  advance: () => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as QuizStatus,
  filters: null,
  session: null,
  currentIndex: 0,
  answers: [] as (string | null)[],
  lockedChoice: null,
  errorMessage: null,
};

export const useQuizStore = create<QuizStoreState>((set, get) => ({
  ...initialState,

  startQuiz: async (options: GenerateOptions) => {
    try {
      const { verbs } = await resolveVerbs();
      const session = generate(options, undefined, verbs);
      set({
        status: "in-progress",
        filters: options,
        session,
        currentIndex: 0,
        answers: [],
        lockedChoice: null,
        errorMessage: null,
      });
    } catch (error) {
      if (error instanceof InsufficientVerbsError) {
        set({
          status: "error",
          errorMessage: INSUFFICIENT_VERBS_MESSAGE,
          session: null,
          filters: options,
          currentIndex: 0,
          answers: [],
          lockedChoice: null,
        });
        return;
      }
      throw error;
    }
  },

  selectAnswer: (choice: string) => {
    if (get().lockedChoice !== null) return;
    set({ lockedChoice: choice });
  },

  advance: () => {
    const { session, currentIndex, answers, lockedChoice } = get();
    if (!session) return;
    const nextAnswers = [...answers, lockedChoice];
    if (currentIndex + 1 >= session.questions.length) {
      set({ answers: nextAnswers, status: "completed" });
      return;
    }
    set({
      answers: nextAnswers,
      currentIndex: currentIndex + 1,
      lockedChoice: null,
    });
  },

  reset: () => {
    set({ ...initialState });
  },
}));
