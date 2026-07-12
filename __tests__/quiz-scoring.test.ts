import { score } from "../src/quiz/scoring";
import type { QuizSession } from "../src/quiz/types";

function buildSession(correctAnswers: string[]): QuizSession {
  return {
    questions: correctAnswers.map((correctAnswer, i) => ({
      verb: `verb${i}`,
      tense: "present_indicative",
      subject: "eu",
      choices: [correctAnswer, "wrong1", "wrong2", "wrong3"],
      correctAnswer,
    })),
  };
}

describe("score", () => {
  it("returns full marks when every answer matches the correctAnswer (all correct)", () => {
    const session = buildSession(["falo", "como", "bebo"]);
    expect(score(session, ["falo", "como", "bebo"])).toEqual({
      correct: 3,
      total: 3,
    });
  });

  it("returns zero correct when every answer differs (all wrong)", () => {
    const session = buildSession(["falo", "como", "bebo"]);
    expect(score(session, ["errado1", "errado2", "errado3"])).toEqual({
      correct: 0,
      total: 3,
    });
  });

  it("counts only the matching subset (mixed correct/incorrect)", () => {
    const session = buildSession(["falo", "como", "bebo", "vou"]);
    expect(score(session, ["falo", "errado", "bebo", "errado"])).toEqual({
      correct: 2,
      total: 4,
    });
  });

  it("counts a null answer as incorrect, not a crash", () => {
    const session = buildSession(["falo", "como"]);
    expect(score(session, ["falo", null])).toEqual({ correct: 1, total: 2 });
  });

  it("total always equals session.questions.length regardless of the answers array length", () => {
    const session = buildSession(["falo", "como", "bebo"]);
    expect(score(session, [])).toEqual({ correct: 0, total: 3 });
    expect(score(session, ["falo"])).toEqual({ correct: 1, total: 3 });
  });
});
