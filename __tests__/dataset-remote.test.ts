import { fetchRemoteVerbs } from "../src/dataset/remote";
import type { Verb } from "../src/dataset/types";

const sampleVerb: Verb = {
  verb: "falar",
  translation: "to speak",
  isIrregular: false,
  conjugations: {
    present_indicative: {
      eu: "falo",
      tu: "falas",
      ele_ela: "fala",
      nos: "falamos",
      voces: "falam",
      eles_elas: "falam",
    },
    preterite: {
      eu: "falei",
      tu: "falaste",
      ele_ela: "falou",
      nos: "falámos",
      voces: "falaram",
      eles_elas: "falaram",
    },
    imperfect: {
      eu: "falava",
      tu: "falavas",
      ele_ela: "falava",
      nos: "falávamos",
      voces: "falavam",
      eles_elas: "falavam",
    },
    future: {
      eu: "falarei",
      tu: "falarás",
      ele_ela: "falará",
      nos: "falaremos",
      voces: "falarão",
      eles_elas: "falarão",
    },
  },
};

describe("fetchRemoteVerbs", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("resolves the unwrapped Verb[] when payload.verbs passes validation on a well-shaped 200", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb] }),
    }) as unknown as typeof fetch;

    const result = await fetchRemoteVerbs();

    expect(result).toEqual([sampleVerb]);
  });

  it("rejects when response.ok is false (e.g. HTTP 500)", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "InternalServerError" }),
    }) as unknown as typeof fetch;

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects when fetch itself rejects (network error)", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects when payload.verbs is missing", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects when payload.verbs is not an array", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: "not-an-array" }),
    }) as unknown as typeof fetch;

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects when payload.verbs entries fail validateDataset even on HTTP 200", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [{ verb: "falar" }] }),
    }) as unknown as typeof fetch;

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });

  it("rejects when the 90s timeout fires and the AbortController aborts an unresolved request", async () => {
    jest.useFakeTimers();

    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        }),
    ) as unknown as typeof fetch;

    const resultPromise = fetchRemoteVerbs();
    const assertion = expect(resultPromise).rejects.toThrow();

    jest.advanceTimersByTime(90_000);

    await assertion;
  });
});
