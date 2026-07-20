import type { Verb } from "../src/dataset/types";
import { verbs as localVerbs } from "../src/dataset/verbs";

jest.mock("../src/dataset/remote");

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

describe("resolveVerbs / prefetch", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("resolves { verbs: <remote>, source: 'remote' } when fetchRemoteVerbs resolves", async () => {
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], learning: undefined });

    const { resolveVerbs } = require("../src/dataset/source");

    const result = await resolveVerbs();

    expect(result).toEqual({ verbs: [sampleRemoteVerb], source: "remote", learning: undefined });
  });

  it("resolves { verbs: localVerbs, source: 'local' } when fetchRemoteVerbs rejects", async () => {
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockRejectedValue(new Error("network error"));

    const { resolveVerbs } = require("../src/dataset/source");

    const result = await resolveVerbs();

    expect(result).toEqual({ verbs: localVerbs, source: "local", learning: undefined });
  });

  it("never rejects regardless of the fetchRemoteVerbs failure mode", async () => {
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockRejectedValue(new Error("timeout"));

    const { resolveVerbs } = require("../src/dataset/source");

    await expect(resolveVerbs()).resolves.not.toThrow();
  });

  it("invokes fetchRemoteVerbs at most once across multiple resolveVerbs() calls", async () => {
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], learning: undefined });

    const { resolveVerbs } = require("../src/dataset/source");

    await resolveVerbs();
    await resolveVerbs();
    await resolveVerbs();

    expect(fetchRemoteVerbs).toHaveBeenCalledTimes(1);
  });

  it("prefetch() triggers resolution once without requiring the caller to await it", async () => {
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], learning: undefined });

    const { prefetch, resolveVerbs } = require("../src/dataset/source");

    prefetch();
    const result = await resolveVerbs();

    expect(fetchRemoteVerbs).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ verbs: [sampleRemoteVerb], source: "remote", learning: undefined });
  });

  it("flows a non-undefined learning value through resolveVerbs() when fetchRemoteVerbs resolves one", async () => {
    const sampleLearning = {
      version: 1 as const,
      templates: {
        wrongTense: "wrong tense",
        wrongSubject: "wrong subject",
        wrongTenseAndSubject: "wrong tense and subject",
        correctAnswerReveal: "correct answer reveal",
        generic: "generic",
      },
      verbs: {
        beber: { irregularTenses: [] },
      },
    };
    const { fetchRemoteVerbs } = require("../src/dataset/remote");
    fetchRemoteVerbs.mockResolvedValue({ verbs: [sampleRemoteVerb], learning: sampleLearning });

    const { resolveVerbs } = require("../src/dataset/source");

    const result = await resolveVerbs();

    expect(result).toEqual({ verbs: [sampleRemoteVerb], source: "remote", learning: sampleLearning });
  });
});
