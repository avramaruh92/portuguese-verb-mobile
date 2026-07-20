import { create } from "zustand";
import { generate } from "../quiz/engine";
import type { GenerateOptions, QuizSession } from "../quiz/types";
import { InsufficientVerbsError } from "../quiz/types";
import { resolveVerbs } from "../dataset/source";

type QuizStatus = "idle" | "error" | "in-progress" | "completed";

const INSUFFICIENT_VERBS_MESSAGE =
  "Not enough verbs for that combination — try selecting more tenses or a different verb mode.";

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

// Incrementing call token so that a stale (superseded) startQuiz call
// cannot overwrite state after a newer call has already started/finished —
// e.g. a double-tap where the first call's resolveVerbs() resolves last.
let startToken = 0;

export const useQuizStore = create<QuizStoreState>((set, get) => ({
  ...initialState,

  startQuiz: async (options: GenerateOptions) => {
    const token = ++startToken;
    try {
      const { verbs } = await resolveVerbs();
      if (token !== startToken) return; // superseded by a newer call
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
      if (token !== startToken) return; // superseded by a newer call
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
