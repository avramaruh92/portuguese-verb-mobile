import { buildShareMessage } from "../src/quiz/share";

describe("buildShareMessage", () => {
  it("builds message for a mid-range score", () => {
    expect(buildShareMessage(8, 10)).toBe(
      "I scored 8/10 on Lafa!",
    );
  });

  it("builds message for a zero score", () => {
    expect(buildShareMessage(0, 10)).toBe(
      "I scored 0/10 on Lafa!",
    );
  });

  it("builds message for a perfect score", () => {
    expect(buildShareMessage(10, 10)).toBe(
      "I scored 10/10 on Lafa!",
    );
  });
});
