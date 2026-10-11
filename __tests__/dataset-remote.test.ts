import { API_BASE_URL } from "../src/config/api";
import { fetchRemoteVerbs } from "../src/dataset/remote";
import type { Verb } from "../src/dataset/types";
import type { LearningContent } from "../src/learning/types";

const sampleLearningContent: LearningContent = {
  version: 1,
  templates: {
    wrongTense: "wrong tense template",
    wrongSubject: "wrong subject template",
    wrongTenseAndSubject: "wrong tense and subject template",
    correctAnswerReveal: "correct answer reveal template",
    generic: "generic template",
  },
  verbs: {
    falar: {
      irregularTenses: [],
    },
  },
};

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

  it("resolves { verbs, learning: undefined } when payload.verbs passes validation on a well-shaped 200", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb] }),
    }) as unknown as typeof fetch;

    const result = await fetchRemoteVerbs();

    expect(result).toEqual({ verbs: [sampleVerb], learning: undefined });
  });

  it("resolves { verbs, learning: <parsed> } when payload.learning is present and valid", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb], learning: sampleLearningContent }),
    }) as unknown as typeof fetch;

    const result = await fetchRemoteVerbs();

    expect(result).toEqual({ verbs: [sampleVerb], learning: sampleLearningContent });
  });

  it("resolves { verbs, learning: undefined } when payload.learning is present but malformed, without throwing", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb], learning: { version: 1 } }),
    }) as unknown as typeof fetch;

    const result = await fetchRemoteVerbs();

    expect(result).toEqual({ verbs: [sampleVerb], learning: undefined });
  });

  it("resolves { verbs, learning: undefined } when payload.learning is absent", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb] }),
    }) as unknown as typeof fetch;

    const result = await fetchRemoteVerbs();

    expect(result).toEqual({ verbs: [sampleVerb], learning: undefined });
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

  it("rejects when the 15s timeout fires and the AbortController aborts an unresolved request", async () => {
    jest.useFakeTimers();

    let capturedSignal: AbortSignal | undefined;
    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          capturedSignal = options?.signal;
          options?.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        }),
    ) as unknown as typeof fetch;

    const resultPromise = fetchRemoteVerbs();
    const assertion = expect(resultPromise).rejects.toThrow();

    jest.advanceTimersByTime(14_999);
    expect(capturedSignal?.aborted).toBe(false);

    jest.advanceTimersByTime(1);
    await assertion;
    expect(capturedSignal?.aborted).toBe(true);
  });

  // NET-03: iOS NSURLCache handles ETag/304 revalidation; the app must not
  // hand-send If-None-Match / Cache-Control / Pragma (backend handoff 2026-10-08).
  it("requests the Frankfurt content endpoint with no cache-busting headers or query params", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ verbs: [sampleVerb] }),
    }) as unknown as typeof fetch;

    await fetchRemoteVerbs();

    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(url).toBe(`${API_BASE_URL}/content/verbs`);
    expect(url).not.toContain("?");
    expect(Object.keys(init)).toEqual(["signal"]);
    expect(init.headers).toBeUndefined();
  });

  // dataset-source.test.ts already proves any rejection resolves source: "local".
  it("rejects on a raw 304 so the source layer falls back to local data", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 304,
      json: async () => {
        throw new Error("no body");
      },
    }) as unknown as typeof fetch;

    await expect(fetchRemoteVerbs()).rejects.toThrow();
  });
});
