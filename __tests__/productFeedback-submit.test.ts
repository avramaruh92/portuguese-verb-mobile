import { submitProductFeedback } from "../src/productFeedback/submit";
import type { ProductFeedbackPayload } from "../src/productFeedback/types";

const samplePayload: ProductFeedbackPayload = {
  category: "bug",
  message: "Something is broken",
  screen: "quiz",
  appVersion: "1.0.0",
  platform: "ios",
};

describe("submitProductFeedback", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("returns success with data on a 201 response", async () => {
    const persistedRow = { id: "abc123", createdAt: "2026-07-13T00:00:00.000Z" };
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 201,
      json: async () => persistedRow,
    }) as unknown as typeof fetch;

    const result = await submitProductFeedback(samplePayload);

    expect(result).toEqual({ status: "success", data: persistedRow });
  });

  it("returns validation-error on a 400 response without carrying fields", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 400,
      json: async () => ({ error: "ValidationError", fields: { message: "required" } }),
    }) as unknown as typeof fetch;

    const result = await submitProductFeedback(samplePayload);

    expect(result).toEqual({ status: "validation-error" });
  });

  it("returns server-error on a 500 response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: async () => ({ error: "InternalServerError" }),
    }) as unknown as typeof fetch;

    const result = await submitProductFeedback(samplePayload);

    expect(result).toEqual({ status: "server-error" });
  });

  it("returns server-error on any other non-201 status (e.g. 418)", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 418,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const result = await submitProductFeedback(samplePayload);

    expect(result).toEqual({ status: "server-error" });
  });

  it("returns network-error when fetch rejects", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));

    const result = await submitProductFeedback(samplePayload);

    expect(result).toEqual({ status: "network-error" });
  });

  it("returns network-error when the request never resolves and the 90s timeout fires", async () => {
    jest.useFakeTimers();

    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        }),
    ) as unknown as typeof fetch;

    const resultPromise = submitProductFeedback(samplePayload);

    jest.advanceTimersByTime(90_000);

    const result = await resultPromise;

    expect(result).toEqual({ status: "network-error" });
  });

  it("calls fetch with the /product-feedback endpoint, POST, JSON headers/body, and abort signal", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 201,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await submitProductFeedback(samplePayload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/product-feedback"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload),
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
