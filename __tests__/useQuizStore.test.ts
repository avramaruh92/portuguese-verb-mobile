import { useQuizStore } from "../src/store/useQuizStore";
import * as engine from "../src/quiz/engine";
import { resolveVerbs } from "../src/dataset/source";
import { verbs as localVerbs } from "../src/dataset/verbs";
import type { Verb } from "../src/dataset/types";
import type { GenerateOptions } from "../src/quiz/types";

jest.mock("../src/dataset/source");

const mockedResolveVerbs = resolveVerbs as jest.MockedFunction<typeof resolveVerbs>;

const VALID_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative"],
  includeIrregular: false,
};

const ALL_TENSES_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative", "preterite", "imperfect", "future"],
  includeIrregular: false,
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

describe("useQuizStore", () => {
  beforeEach(() => {
    useQuizStore.getState().reset();
    mockedResolveVerbs.mockReset();
    mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local" });
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
  });

  it("startQuiz with insufficient verbs sets error status with the D-04 message and no session", async () => {
    await useQuizStore.getState().startQuiz({ tenses: [], includeIrregular: false });
    const state = useQuizStore.getState();
    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe(
      "Not enough verbs for that combination — try selecting more tenses or including irregulars.",
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
    mockedResolveVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], source: "remote" });
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
  });
});
