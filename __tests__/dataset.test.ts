import { verbs } from "../src/dataset/verbs";
import { validateDataset } from "../src/dataset/validate";
import { TENSES, SUBJECTS } from "../src/dataset/types";

describe("dataset validation", () => {
  it("every verb has the correct shape", () => {
    verbs.forEach((v) => {
      expect(v.verb.length).toBeGreaterThan(0);
      expect(v.translation.length).toBeGreaterThan(0);
      expect(typeof v.isIrregular).toBe("boolean");
      expect(Object.keys(v.conjugations).sort()).toEqual([...TENSES].sort());
      TENSES.forEach((tense) => {
        expect(Object.keys(v.conjugations[tense]).sort()).toEqual(
          [...SUBJECTS].sort(),
        );
      });
    });
  });

  it("has the expected count of seeded verbs with unique infinitives", () => {
    expect(verbs.length).toBe(4);
    expect(new Set(verbs.map((v) => v.verb)).size).toBe(verbs.length);
  });

  it("reports zero shape/completeness errors", () => {
    expect(validateDataset(verbs).errors).toEqual([]);
  });

  it("rejects a verb missing a conjugation cell (negative case)", () => {
    const broken = JSON.parse(JSON.stringify(verbs[0]));
    delete broken.conjugations.future.eles_elas;
    expect(validateDataset([broken]).valid).toBe(false);
  });

  it("matches the locked backend enums for Tense and Subject", () => {
    expect(TENSES).toEqual([
      "present_indicative",
      "preterite",
      "imperfect",
      "future",
    ]);
    expect(SUBJECTS).toEqual([
      "eu",
      "tu",
      "ele_ela",
      "nos",
      "voces",
      "eles_elas",
    ]);
  });
});
