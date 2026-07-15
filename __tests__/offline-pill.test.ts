import {
  isLocalSource,
  OFFLINE_PILL_TEXT,
} from "../src/components/OfflinePill";

describe("OfflinePill pure exports", () => {
  it("isLocalSource returns true only for 'local'", () => {
    expect(isLocalSource("local")).toBe(true);
    expect(isLocalSource("remote")).toBe(false);
    expect(isLocalSource(null)).toBe(false);
  });

  it("locks the exact D-03 copy string", () => {
    expect(OFFLINE_PILL_TEXT).toBe("Using saved content");
  });
});
