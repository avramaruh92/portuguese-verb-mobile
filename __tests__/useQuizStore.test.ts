import { useQuizStore } from "../src/store/useQuizStore";
import * as engine from "../src/quiz/engine";
import { resolveVerbs } from "../src/dataset/source";
import { verbs as localVerbs } from "../src/dataset/verbs";
import type { Verb } from "../src/dataset/types";
import type { GenerateOptions } from "../src/quiz/types";
import type { LearningContent } from "../src/learning/types";

jest.mock("../src/dataset/source");

const mockedResolveVerbs = resolveVerbs as jest.MockedFunction<typeof resolveVerbs>;

const VALID_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative"],
  verbMode: "regular_only",
};

const ALL_TENSES_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative", "preterite", "imperfect", "future"],
  verbMode: "regular_only",
};

const sampleRemoteVerb: Verb = {
  verb: "beber",
  translation: "to drink",
  isIrregular: false,
  conjugations: {
    present_indicative: {
      eu: "bebo",
      tu: "bebes",
      ele_ela: "bebe",
      nos: "bebemos",
      voces: "bebem",
      eles_elas: "bebem",
    },
    preterite: {
      eu: "bebi",
      tu: "bebeste",
      ele_ela: "bebeu",
      nos: "bebemos",
      voces: "beberam",
      eles_elas: "beberam",
    },
    imperfect: {
      eu: "bebia",
      tu: "bebias",
      ele_ela: "bebia",
      nos: "bebíamos",
      voces: "bebiam",
      eles_elas: "bebiam",
    },
    future: {
      eu: "beberei",
      tu: "beberás",
      ele_ela: "beberá",
      nos: "beberemos",
      voces: "beberão",
      eles_elas: "beberão",
    },
  },
};

const sampleLearning: LearningContent = {
  version: 1,
  templates: {
    wrongTense: "For {verb}, the correct tense is {tense}.",
    wrongSubject: "For {verb}, the correct subject is {subject}.",
    wrongTenseAndSubject: "For {verb}, the correct answer is {correctAnswer}.",
    correctAnswerReveal: "The correct answer is {correctAnswer}.",
    generic: "The correct answer is {correctAnswer}.",
  },
  verbs: {},
};

describe("useQuizStore", () => {
  beforeEach(() => {
    useQuizStore.getState().reset();
    mockedResolveVerbs.mockReset();
    mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: undefined });
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

  it("startQuiz returns a Promise that callers can await", () => {
    const result = useQuizStore.getState().startQuiz(VALID_OPTIONS);
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it("startQuiz with valid options transitions to in-progress with a 10-question session", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const state = useQuizStore.getState();
    expect(state.status).toBe("in-progress");
    expect(state.session?.questions.length).toBe(10);
    expect(state.filters).toEqual(VALID_OPTIONS);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.verbs).toEqual(localVerbs);
    expect(state.learning).toBeUndefined();
  });

  it("startQuiz sets state.learning to the LearningContent resolved from resolveVerbs", async () => {
    mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: sampleLearning });
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const state = useQuizStore.getState();
    expect(state.learning).toEqual(sampleLearning);
    expect(state.verbs).toEqual(localVerbs);
  });

  it("startQuiz with insufficient verbs sets error status with the D-04 message and no session", async () => {
    await useQuizStore.getState().startQuiz({ tenses: [], verbMode: "regular_only" });
    const state = useQuizStore.getState();
    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe(
      "Not enough verbs for that combination — try selecting more tenses or a different verb mode.",
    );
    expect(state.session).toBeNull();
  });

  it("startQuiz re-throws unexpected errors", async () => {
    const spy = jest.spyOn(engine, "generate").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    await expect(useQuizStore.getState().startQuiz(VALID_OPTIONS)).rejects.toThrow("boom");
    spy.mockRestore();
  });

  it("startQuiz awaits resolveVerbs and feeds the resolved snapshot into generate", async () => {
    mockedResolveVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], source: "remote", learning: undefined });
    const spy = jest.spyOn(engine, "generate");
    await useQuizStore.getState().startQuiz(ALL_TENSES_OPTIONS);
    expect(spy).toHaveBeenCalledWith(ALL_TENSES_OPTIONS, undefined, [sampleRemoteVerb]);
    spy.mockRestore();
  });

  it("selectAnswer sets lockedChoice when unlocked", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("some-answer");
    expect(useQuizStore.getState().lockedChoice).toBe("some-answer");
  });

  it("selectAnswer is a no-op once locked", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("first");
    useQuizStore.getState().selectAnswer("second");
    expect(useQuizStore.getState().lockedChoice).toBe("first");
  });

  it("advance appends lockedChoice, increments currentIndex, resets lockedChoice", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("chosen-1");
    useQuizStore.getState().advance();
    const state = useQuizStore.getState();
    expect(state.answers).toEqual(["chosen-1"]);
    expect(state.currentIndex).toBe(1);
    expect(state.lockedChoice).toBeNull();
  });

  it("advance on the 10th question transitions status to completed", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    for (let i = 0; i < 10; i += 1) {
      useQuizStore.getState().selectAnswer(`choice-${i}`);
      useQuizStore.getState().advance();
    }
    const state = useQuizStore.getState();
    expect(state.status).toBe("completed");
    expect(state.session?.questions.length).toBe(10);
    expect(state.answers.length).toBe(10);
  });

  it("advance keeps status in-progress while questions remain", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    useQuizStore.getState().selectAnswer("choice-0");
    useQuizStore.getState().advance();
    expect(useQuizStore.getState().status).toBe("in-progress");
  });

  it("startQuiz called again produces a fresh session object", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const firstSession = useQuizStore.getState().session;
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    const secondSession = useQuizStore.getState().session;
    expect(secondSession).not.toBe(firstSession);
  });

  it("reset returns all state to initial values", async () => {
    mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: sampleLearning });
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
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
    expect(state.verbs).toEqual([]);
    expect(state.learning).toBeUndefined();
  });

  it("reset() after an in-progress, mutated quiz restores every field to a fresh initialState (end-quiz-early full-state-equality guard)", async () => {
    await useQuizStore.getState().startQuiz(VALID_OPTIONS);
    // Mutate session state so currentIndex/answers/lockedChoice diverge from initialState
    // before exiting — this is the "in-progress, abandoned mid-quiz" scenario.
    useQuizStore.getState().selectAnswer("choice-0");
    useQuizStore.getState().advance();
    useQuizStore.getState().selectAnswer("choice-1");

    const inProgressState = useQuizStore.getState();
    expect(inProgressState.status).toBe("in-progress");
    expect(inProgressState.session).not.toBeNull();
    expect(inProgressState.currentIndex).toBe(1);
    expect(inProgressState.answers).toEqual(["choice-0"]);
    expect(inProgressState.lockedChoice).toBe("choice-1");

    useQuizStore.getState().reset();

    const freshState = useQuizStore.getState();
    expect(freshState.status).toBe("idle");
    expect(freshState.filters).toBeNull();
    expect(freshState.session).toBeNull();
    expect(freshState.currentIndex).toBe(0);
    expect(freshState.answers).toEqual([]);
    expect(freshState.lockedChoice).toBeNull();
    expect(freshState.errorMessage).toBeNull();
  });

  describe("startQuiz dataset snapshot (FETCH-04)", () => {
    it("keeps an in-progress session's questions unchanged after resolveVerbs is re-pointed to a different dataset", async () => {
      mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: undefined });
      await useQuizStore.getState().startQuiz(ALL_TENSES_OPTIONS);
      const snapshotQuestions = useQuizStore.getState().session?.questions;
      expect(snapshotQuestions).toBeDefined();

      // Simulate a background refresh completing with a different dataset —
      // no new startQuiz call, so the in-progress session must be untouched.
      mockedResolveVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], source: "remote", learning: undefined });

      expect(useQuizStore.getState().session?.questions).toEqual(snapshotQuestions);
    });

    it("snapshots the dataset at call time — two startQuiz calls under different mocked datasets produce sessions drawn from their respective snapshots", async () => {
      mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: undefined });
      await useQuizStore.getState().startQuiz(ALL_TENSES_OPTIONS);
      const sessionA = useQuizStore.getState().session;

      mockedResolveVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], source: "remote", learning: undefined });
      await useQuizStore.getState().startQuiz(ALL_TENSES_OPTIONS);
      const sessionB = useQuizStore.getState().session;

      expect(sessionA?.questions).not.toEqual(sessionB?.questions);
      expect(sessionB?.questions.every((q) => q.verb === "beber")).toBe(true);
    });
  });
});
