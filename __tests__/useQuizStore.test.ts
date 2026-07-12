import { useQuizStore } from "../src/store/useQuizStore";
import * as engine from "../src/quiz/engine";

const VALID_OPTIONS = { tenses: ["present_indicative"], includeIrregular: false };

describe("useQuizStore", () => {
  beforeEach(() => {
    useQuizStore.getState().reset();
  });

  it("has the correct initial state", () => {
    const state = useQuizStore.getState();
    expect(state.status).toBe("idle");
    expect(state.session).toBeNull();
    expect(state.filters).toBeNull();
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.lockedChoice).toBeNull();
    expect(state.errorMessage).toBeNull();
  });

  it("startQuiz with valid options transitions to in-progress with a 10-question session", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const state = useQuizStore.getState();
    expect(state.status).toBe("in-progress");
    expect(state.session?.questions.length).toBe(10);
    expect(state.filters).toEqual(VALID_OPTIONS);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
  });

  it("startQuiz with insufficient verbs sets error status with the D-04 message and no session", () => {
    useQuizStore.getState().startQuiz({ tenses: [], includeIrregular: false });
    const state = useQuizStore.getState();
    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe(
      "Not enough verbs for that combination — try selecting more tenses or including irregulars.",
    );
    expect(state.session).toBeNull();
  });

  it("startQuiz re-throws unexpected errors", () => {
    const spy = jest.spyOn(engine, "generate").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => useQuizStore.getState().startQuiz(VALID_OPTIONS)).toThrow("boom");
    spy.mockRestore();
  });

  it("selectAnswer sets lockedChoice when unlocked", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("some-answer");
    expect(useQuizStore.getState().lockedChoice).toBe("some-answer");
  });

  it("selectAnswer is a no-op once locked", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("first");
    useQuizStore.getState().selectAnswer("second");
    expect(useQuizStore.getState().lockedChoice).toBe("first");
  });

  it("advance appends lockedChoice, increments currentIndex, resets lockedChoice", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("chosen-1");
    useQuizStore.getState().advance();
    const state = useQuizStore.getState();
    expect(state.answers).toEqual(["chosen-1"]);
    expect(state.currentIndex).toBe(1);
    expect(state.lockedChoice).toBeNull();
  });

  it("advance on the 10th question transitions status to completed", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    for (let i = 0; i < 10; i += 1) {
      useQuizStore.getState().selectAnswer(`choice-${i}`);
      useQuizStore.getState().advance();
    }
    const state = useQuizStore.getState();
    expect(state.status).toBe("completed");
    expect(state.session?.questions.length).toBe(10);
    expect(state.answers.length).toBe(10);
  });

  it("advance keeps status in-progress while questions remain", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("choice-0");
    useQuizStore.getState().advance();
    expect(useQuizStore.getState().status).toBe("in-progress");
  });

  it("startQuiz called again produces a fresh session object", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const firstSession = useQuizStore.getState().session;
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const secondSession = useQuizStore.getState().session;
    expect(secondSession).not.toBe(firstSession);
  });

  it("reset returns all state to initial values", () => {
    useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("choice-0");
    useQuizStore.getState().reset();
    const state = useQuizStore.getState();
    expect(state.status).toBe("idle");
    expect(state.session).toBeNull();
    expect(state.filters).toBeNull();
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.lockedChoice).toBeNull();
    expect(state.errorMessage).toBeNull();
  });
});
