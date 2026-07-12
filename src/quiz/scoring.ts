import type { QuizSession } from "./types";

export function score(
  session: QuizSession,
  answers: readonly (string | null)[],
): { correct: number; total: number } {
  const total = session.questions.length;
  const correct = session.questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
    0,
  );
  return { correct, total };
}
