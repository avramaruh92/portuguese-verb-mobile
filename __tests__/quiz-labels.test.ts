import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { SUBJECTS, TENSES } from "../src/dataset/types";

describe("subjectLabels", () => {
  it("covers every Subject value with a non-empty label", () => {
    SUBJECTS.forEach((subject) => {
      expect(typeof subjectLabels[subject]).toBe("string");
      expect(subjectLabels[subject].length).toBeGreaterThan(0);
    });
  });

  it("maps ele_ela to the exact expected label", () => {
    expect(subjectLabels.ele_ela).toBe("ele/ela");
  });
});

describe("tenseLabels", () => {
  it("covers every Tense value with a non-empty label", () => {
    TENSES.forEach((tense) => {
      expect(typeof tenseLabels[tense]).toBe("string");
      expect(tenseLabels[tense].length).toBeGreaterThan(0);
    });
  });

  it("maps present_indicative to the exact expected label", () => {
    expect(tenseLabels.present_indicative).toBe("Present");
  });
});
