import { subjectLabels, tenseLabels, tenseGrammarNames } from "../src/quiz/labels";
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

  it("maps preterite to the exact expected label", () => {
    expect(tenseLabels.preterite).toBe("Completed past");
  });

  it("maps imperfect to the exact expected label", () => {
    expect(tenseLabels.imperfect).toBe("Imperfect past");
  });
});

describe("tenseGrammarNames", () => {
  it("maps preterite and imperfect to their Portuguese grammar names", () => {
    expect(tenseGrammarNames.preterite).toBe("Pretérito perfeito");
    expect(tenseGrammarNames.imperfect).toBe("Pretérito imperfeito");
  });

  it("has no entry for present_indicative or future", () => {
    expect(tenseGrammarNames.present_indicative).toBeUndefined();
    expect(tenseGrammarNames.future).toBeUndefined();
  });
});
