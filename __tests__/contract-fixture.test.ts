import fs from "fs";
import path from "path";

import { validateDataset } from "../src/dataset/validate";
import { LearningContentSchema } from "../src/learning/schema";
import { fetchRemoteVerbs } from "../src/dataset/remote";

const raw = fs.readFileSync(
  path.join(__dirname, "fixtures/content-verbs-v0.4.sample.json"),
  "utf-8",
);
const fixture = JSON.parse(raw) as { verbs: any[]; learning: unknown };

describe("backend v0.4 contract fixture", () => {
  it("sanity: fixture has 50 verbs and a version-1 learning block", () => {
    expect(fixture.verbs).toHaveLength(50);
    expect((fixture.learning as { version: number }).version).toBe(1);
  });

  it("validateDataset accepts the fixture's verbs with zero errors", () => {
    const { valid, errors } = validateDataset(fixture.verbs);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it("LearningContentSchema accepts the fixture's learning block", () => {
    const result = LearningContentSchema.safeParse(fixture.learning);
    expect(result.success).toBe(true);
  });

  it("fetchRemoteVerbs parses the fixture through its full HTTP+validation path", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fixture,
    }) as unknown as typeof fetch;

    try {
      const result = await fetchRemoteVerbs();

      expect(result.verbs).toHaveLength(50);
      expect(result.learning).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
      jest.clearAllMocks();
    }
  });

  it("preserves accented and tied conjugation forms byte-for-byte", () => {
    const falar = fixture.verbs.find((v: { verb: string }) => v.verb === "falar");
    const por = fixture.verbs.find((v: { verb: string }) => v.verb === "pôr");

    expect(falar).toBeDefined();
    expect(por).toBeDefined();

    // Tied forms: "falam" is both voces and eles_elas in present_indicative
    expect(falar.formIndex.falam).toHaveLength(2);
    expect(falar.conjugations.present_indicative.voces).toBe("falam");
    expect(falar.conjugations.present_indicative.eles_elas).toBe("falam");

    // Accented forms
    expect(por.conjugations.preterite.ele_ela).toBe("pôs");
    expect(por.verb).toBe("pôr");
  });
});
