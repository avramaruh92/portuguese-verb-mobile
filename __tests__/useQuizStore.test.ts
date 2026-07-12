import { useQuizStore } from "../src/store/useQuizStore";

describe("useQuizStore", () => {
  it("imports safely and exposes idle initial status", () => {
    expect(useQuizStore.getState().status).toBe("idle");
  });
});
