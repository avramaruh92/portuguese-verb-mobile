import { create } from "zustand";

interface QuizStoreState {
  status: "idle";
}

export const useQuizStore = create<QuizStoreState>(() => ({
  status: "idle",
}));
