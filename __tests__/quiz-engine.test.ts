import { generate, sampleTriples, buildQuestion, pickDistractors } from "../src/quiz/engine";
import { InsufficientVerbsError } from "../src/quiz/types";
import type { Triple } from "../src/quiz/types";
import { verbs } from "../src/dataset/verbs";
import type { Verb } from "../src/dataset/types";

function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}

describe("quiz engine", () => {
  describe("generate", () => {
    it("filter: restricts questions to the requested tense and excludes irregular verbs when regular_only", () => {
      const session = generate({ tenses: ["future"], verbMode: "regular_only" }, Math.random);
      expect(session.questions).toHaveLength(10);
      session.questions.forEach((q) => {
        expect(q.tense).toBe("future");
        const verb = verbs.find((v) => v.verb === q.verb);
        expect(verb).toBeDefined();
        expect(verb!.isIrregular).toBe(false);
      });
    });

    it("filter (mixed): allows irregular verbs to appear in the pool", () => {
      const session = generate(
        { tenses: ["present_indicative"], verbMode: "mixed" },
        Math.random,
      );
      expect(session.questions).toHaveLength(10);
      session.questions.forEach((q) => {
        expect(q.tense).toBe("present_indicative");
      });
    });

    it("filter (irregular_only): restricts every question's source verb to isIrregular === true", () => {
      const session = generate(
        { tenses: ["present_indicative"], verbMode: "irregular_only" },
        Math.random,
      );
      expect(session.questions).toHaveLength(10);
      session.questions.forEach((q) => {
        expect(q.tense).toBe("present_indicative");
        const verb = verbs.find((v) => v.verb === q.verb);
        expect(verb).toBeDefined();
        expect(verb!.isIrregular).toBe(true);
      });
    });

    it("filter (mixed): allows both regular and irregular verbs and keeps the requested tense", () => {
      const session = generate(
        { tenses: ["preterite"], verbMode: "mixed" },
        Math.random,
      );
      expect(session.questions).toHaveLength(10);
      session.questions.forEach((q) => {
        expect(q.tense).toBe("preterite");
      });
      const isIrregularFlags = new Set(
        session.questions.map((q) => {
          const verb = verbs.find((v) => v.verb === q.verb);
          return verb!.isIrregular;
        }),
      );
      expect(isIrregularFlags.size).toBeGreaterThanOrEqual(1);
    });

    it("irregular_only with an insufficient pool throws InsufficientVerbsError", () => {
      const singleIrregularVerb: Verb[] = [
        {
          verb: "custarSolo",
          translation: "custom solo verb",
          isIrregular: true,
          conjugations: {
            present_indicative: {
              eu: "s1",
              tu: "s2",
              ele_ela: "s3",
              nos: "s4",
              voces: "s5",
              eles_elas: "s6",
            },
            preterite: {
              eu: "s1",
              tu: "s2",
              ele_ela: "s3",
              nos: "s4",
              voces: "s5",
              eles_elas: "s6",
            },
            imperfect: {
              eu: "s1",
              tu: "s2",
              ele_ela: "s3",
              nos: "s4",
              voces: "s5",
              eles_elas: "s6",
            },
            future: {
              eu: "s1",
              tu: "s2",
              ele_ela: "s3",
              nos: "s4",
              voces: "s5",
              eles_elas: "s6",
            },
          },
        },
      ];
      expect(() =>
        generate(
          { tenses: ["future"], verbMode: "irregular_only" },
          Math.random,
          singleIrregularVerb,
        ),
      ).toThrow(InsufficientVerbsError);
    });

    it("duplicate: never produces a duplicate (verb, tense, subject) triple in a session", () => {
      const session = generate(
        { tenses: ["present_indicative", "preterite"], verbMode: "mixed" },
        Math.random,
      );
      const keys = session.questions.map((q) => `${q.verb}|${q.tense}|${q.subject}`);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.length).toBe(10);
    });

    it("same-verb repeat (D-07): sampleTriples does not dedupe by verb alone, only by the full triple", () => {
      // A pool of exactly 10 unique (verb, tense, subject) triples where "falar" deliberately
      // repeats across two different subjects. Since pool.length === count, sampleTriples
      // returns every entry (in shuffled order), proving same-verb repeats are never filtered.
      const pool: Triple[] = [
        { verb: "falar", tense: "future", subject: "eu" },
        { verb: "falar", tense: "future", subject: "tu" },
        { verb: "comer", tense: "future", subject: "eu" },
        { verb: "comer", tense: "future", subject: "tu" },
        { verb: "abrir", tense: "future", subject: "eu" },
        { verb: "abrir", tense: "future", subject: "tu" },
        { verb: "beber", tense: "future", subject: "eu" },
        { verb: "beber", tense: "future", subject: "tu" },
        { verb: "correr", tense: "future", subject: "eu" },
        { verb: "correr", tense: "future", subject: "tu" },
      ];
      const sampled = sampleTriples(pool, 10, mockRandom([0.1, 0.9, 0.3, 0.7, 0.5]));
      expect(sampled).toHaveLength(10);
      const verbCounts = new Map<string, number>();
      sampled.forEach((t) => {
        verbCounts.set(t.verb, (verbCounts.get(t.verb) ?? 0) + 1);
      });
      const hasRepeat = [...verbCounts.values()].some((count) => count > 1);
      expect(hasRepeat).toBe(true);
    });

    it("injected verbs (seam): generate() draws exclusively from a custom verbs param, overriding the bundled default", () => {
      const customVerbs: Verb[] = [
        {
          verb: "custarA",
          translation: "custom verb A",
          isIrregular: true,
          conjugations: {
            present_indicative: {
              eu: "a1",
              tu: "a2",
              ele_ela: "a3",
              nos: "a4",
              voces: "a5",
              eles_elas: "a6",
            },
            preterite: {
              eu: "a1",
              tu: "a2",
              ele_ela: "a3",
              nos: "a4",
              voces: "a5",
              eles_elas: "a6",
            },
            imperfect: {
              eu: "a1",
              tu: "a2",
              ele_ela: "a3",
              nos: "a4",
              voces: "a5",
              eles_elas: "a6",
            },
            future: {
              eu: "a1",
              tu: "a2",
              ele_ela: "a3",
              nos: "a4",
              voces: "a5",
              eles_elas: "a6",
            },
          },
        },
        {
          verb: "custarB",
          translation: "custom verb B",
          isIrregular: true,
          conjugations: {
            present_indicative: {
              eu: "b1",
              tu: "b2",
              ele_ela: "b3",
              nos: "b4",
              voces: "b5",
              eles_elas: "b6",
            },
            preterite: {
              eu: "b1",
              tu: "b2",
              ele_ela: "b3",
              nos: "b4",
              voces: "b5",
              eles_elas: "b6",
            },
            imperfect: {
              eu: "b1",
              tu: "b2",
              ele_ela: "b3",
              nos: "b4",
              voces: "b5",
              eles_elas: "b6",
            },
            future: {
              eu: "b1",
              tu: "b2",
              ele_ela: "b3",
              nos: "b4",
              voces: "b5",
              eles_elas: "b6",
            },
          },
        },
        {
          verb: "custarC",
          translation: "custom verb C",
          isIrregular: true,
          conjugations: {
            present_indicative: {
              eu: "c1",
              tu: "c2",
              ele_ela: "c3",
              nos: "c4",
              voces: "c5",
              eles_elas: "c6",
            },
            preterite: {
              eu: "c1",
              tu: "c2",
              ele_ela: "c3",
              nos: "c4",
              voces: "c5",
              eles_elas: "c6",
            },
            imperfect: {
              eu: "c1",
              tu: "c2",
              ele_ela: "c3",
              nos: "c4",
              voces: "c5",
              eles_elas: "c6",
            },
            future: {
              eu: "c1",
              tu: "c2",
              ele_ela: "c3",
              nos: "c4",
              voces: "c5",
              eles_elas: "c6",
            },
          },
        },
      ];
      const session = generate(
        { tenses: ["present_indicative", "preterite", "imperfect", "future"], verbMode: "mixed" },
        Math.random,
        customVerbs,
      );
      expect(session.questions).toHaveLength(10);
      const customVerbNames = new Set(customVerbs.map((v) => v.verb));
      session.questions.forEach((q) => {
        expect(customVerbNames.has(q.verb)).toBe(true);
      });
    });
  });

  describe("sampleTriples", () => {
    it("InsufficientVerbsError: throws when the eligible pool has fewer than the requested count", () => {
      const tinyPool: Triple[] = [
        { verb: "falar", tense: "future", subject: "eu" },
        { verb: "falar", tense: "future", subject: "tu" },
      ];
      expect(() => sampleTriples(tinyPool, 10, mockRandom([0]))).toThrow(InsufficientVerbsError);
      try {
        sampleTriples(tinyPool, 10, mockRandom([0]));
        throw new Error("expected sampleTriples to throw");
      } catch (err) {
        expect(err).toBeInstanceOf(InsufficientVerbsError);
        expect((err as InstanceType<typeof InsufficientVerbsError>).eligibleCount).toBe(2);
        expect((err as InstanceType<typeof InsufficientVerbsError>).required).toBe(10);
      }
    });

    it("does not throw InsufficientVerbsError for a single-tense, regular_only boundary pool (~228 triples)", () => {
      const session = generate({ tenses: ["future"], verbMode: "regular_only" }, Math.random);
      expect(session.questions).toHaveLength(10);
    });
  });

  describe("buildQuestion / pickDistractors", () => {
    const simpleVerbs: Verb[] = [
      {
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
      },
      {
        verb: "comer",
        translation: "to eat",
        isIrregular: false,
        conjugations: {
          present_indicative: {
            eu: "como",
            tu: "comes",
            ele_ela: "come",
            nos: "comemos",
            voces: "comem",
            eles_elas: "comem",
          },
          preterite: {
            eu: "comi",
            tu: "comeste",
            ele_ela: "comeu",
            nos: "comemos",
            voces: "comeram",
            eles_elas: "comeram",
          },
          imperfect: {
            eu: "comia",
            tu: "comias",
            ele_ela: "comia",
            nos: "comíamos",
            voces: "comiam",
            eles_elas: "comiam",
          },
          future: {
            eu: "comerei",
            tu: "comerás",
            ele_ela: "comerá",
            nos: "comeremos",
            voces: "comerão",
            eles_elas: "comerão",
          },
        },
      },
    ];

    it("distractor: buildQuestion returns 4 distinct choices, one matching the correct conjugation", () => {
      const triple: Triple = { verb: "falar", tense: "present_indicative", subject: "eu" };
      const question = buildQuestion(triple, simpleVerbs, Math.random);
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      expect(question.choices).toContain(question.correctAnswer);
      expect(question.correctAnswer).toBe("falo");
    });

    it("distractor dedupe/backfill: pickDistractors returns exactly 3 distinct strings even when same-verb forms collide", () => {
      // Synthetic verb whose present_indicative forms collide heavily for subject "eu":
      // tu === ele_ela, and nos === voces === eles_elas, leaving only 2 unique same-verb
      // distractor candidates (excluding the "eu" correct answer) before backfill.
      const collidingVerb: Verb = {
        verb: "colidir",
        translation: "to collide (synthetic test fixture)",
        isIrregular: false,
        conjugations: {
          present_indicative: {
            eu: "colidoCorrect",
            tu: "formaX",
            ele_ela: "formaX",
            nos: "formaY",
            voces: "formaY",
            eles_elas: "formaY",
          },
          preterite: {
            eu: "x",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
          imperfect: {
            eu: "x",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
          future: {
            eu: "x",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
        },
      };
      const allVerbs = [collidingVerb, ...simpleVerbs];
      const distractors = pickDistractors(
        collidingVerb,
        "present_indicative",
        "eu",
        allVerbs,
        Math.random,
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      expect(distractors).not.toContain("colidoCorrect");
    });

    const collidingVerbForTier2 = (): Verb => ({
      verb: "colidir",
      translation: "to collide (synthetic test fixture, tier 2)",
      isIrregular: false,
      conjugations: {
        present_indicative: {
          eu: "presCorrect",
          tu: "presCorrect",
          ele_ela: "presCorrect",
          nos: "presCorrect",
          voces: "presCorrect",
          eles_elas: "presCorrect",
        },
        preterite: {
          eu: "preteriteForm",
          tu: "preteriteForm",
          ele_ela: "preteriteForm",
          nos: "preteriteForm",
          voces: "preteriteForm",
          eles_elas: "preteriteForm",
        },
        imperfect: {
          eu: "imperfectForm",
          tu: "imperfectForm",
          ele_ela: "imperfectForm",
          nos: "imperfectForm",
          voces: "imperfectForm",
          eles_elas: "imperfectForm",
        },
        future: {
          eu: "futureForm",
          tu: "futureForm",
          ele_ela: "futureForm",
          nos: "futureForm",
          voces: "futureForm",
          eles_elas: "futureForm",
        },
      },
    });

    it("tier 2: preterite question prioritizes the same-verb imperfect form as the first tier-2 candidate consumed (D-01)", () => {
      const verb = collidingVerbForTier2();
      // Tier 1: all other-subject present... wait, tense is preterite so tier-1 candidates
      // are other-subject preterite forms, which all collide to "preteriteForm" (filtered as
      // correctAnswer) leaving 0 unique tier-1 candidates — tier 2 must supply all 3.
      const distractors = pickDistractors(verb, "preterite", "eu", [verb], mockRandom([0.5]));
      expect(distractors[0]).toBe("imperfectForm");
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
    });

    it("tier 2: imperfect question prioritizes the same-verb preterite form as the first tier-2 candidate consumed (D-01)", () => {
      const verb = collidingVerbForTier2();
      const distractors = pickDistractors(verb, "imperfect", "eu", [verb], mockRandom([0.5]));
      expect(distractors[0]).toBe("preteriteForm");
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
    });

    it("tier 2: present_indicative question has no forced pair ordering among other-tense forms (D-02)", () => {
      const verb = collidingVerbForTier2();
      const distractors = pickDistractors(
        verb,
        "present_indicative",
        "eu",
        [verb],
        mockRandom([0.5]),
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      expect(new Set(distractors)).toEqual(
        new Set(["preteriteForm", "imperfectForm", "futureForm"]),
      );
    });

    it("tier 2: candidates are deduped against the correct answer and already-chosen tier-1 forms (D-03)", () => {
      // Tier-1 fills 2 of 3 slots ("formaX", "formaY"); tier 2 must supply exactly 1 more
      // and never repeat the correct answer or the two tier-1 picks already chosen.
      const collidingVerb: Verb = {
        verb: "colidir2",
        translation: "to collide (synthetic test fixture, tier 2 dedupe)",
        isIrregular: false,
        conjugations: {
          present_indicative: {
            eu: "colidoCorrect",
            tu: "formaX",
            ele_ela: "formaX",
            nos: "formaY",
            voces: "formaY",
            eles_elas: "formaY",
          },
          preterite: {
            eu: "colidoCorrect",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
          imperfect: {
            eu: "formaX",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
          future: {
            eu: "newTier2Form",
            tu: "x",
            ele_ela: "x",
            nos: "x",
            voces: "x",
            eles_elas: "x",
          },
        },
      };
      const distractors = pickDistractors(
        collidingVerb,
        "present_indicative",
        "eu",
        [collidingVerb],
        mockRandom([0.5]),
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      expect(distractors).not.toContain("colidoCorrect");
      expect(distractors).toContain("newTier2Form");
    });

    function allCollisionVerb(name: string, correctForm: string): Verb {
      const allSubjects = {
        eu: correctForm,
        tu: correctForm,
        ele_ela: correctForm,
        nos: correctForm,
        voces: correctForm,
        eles_elas: correctForm,
      };
      return {
        verb: name,
        translation: `synthetic tier-3 fixture (${name})`,
        isIrregular: false,
        conjugations: {
          present_indicative: allSubjects,
          preterite: allSubjects,
          imperfect: allSubjects,
          future: allSubjects,
        },
      };
    }

    it("tier 3: same-conjugation-class cross-verb forms are consumed before other-class forms (D-04/D-05)", () => {
      // Source verb "falar" (class "ar") collides on all its own forms so tiers 1+2
      // are fully exhausted; the cross-verb pool has 2 same-class ("ar") verbs and
      // 2 other-class ("er") verbs with distinguishable literal forms.
      const source = allCollisionVerb("falar", "sourceCorrect");
      const sameClassA: Verb = { ...allCollisionVerb("andar", "sameA"), verb: "andar" };
      const sameClassB: Verb = { ...allCollisionVerb("nadar", "sameB"), verb: "nadar" };
      const otherClassA: Verb = { ...allCollisionVerb("comer", "otherA"), verb: "comer" };
      const otherClassB: Verb = { ...allCollisionVerb("beber", "otherB"), verb: "beber" };
      const allVerbsPool = [source, sameClassA, sameClassB, otherClassA, otherClassB];

      const distractors = pickDistractors(
        source,
        "present_indicative",
        "eu",
        allVerbsPool,
        mockRandom([0.5]),
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      // Both same-class forms must be present (consumed first); only one other-class form fills the 3rd slot.
      expect(distractors).toContain("sameA");
      expect(distractors).toContain("sameB");
      const otherClassCount = distractors.filter((d) => d === "otherA" || d === "otherB").length;
      expect(otherClassCount).toBe(1);
    });

    it("tier 3: a source verb with an unmatched conjugation class (pôr, ending 'ôr') still returns 3 valid distractors (Pitfall 1/4)", () => {
      const source = allCollisionVerb("pôr", "sourceCorrect");
      const otherA = allCollisionVerb("falar", "formA");
      const otherB = allCollisionVerb("comer", "formB");
      const otherC = allCollisionVerb("abrir", "formC");
      const allVerbsPool = [source, otherA, otherB, otherC];

      const distractors = pickDistractors(
        source,
        "present_indicative",
        "eu",
        allVerbsPool,
        mockRandom([0.5]),
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      expect(distractors).not.toContain("sourceCorrect");
    });

    it("tier 3: a small irregular_only-sized pool (4 verbs, mixed classes) still satisfies the 3-distractor invariant (Pitfall 3)", () => {
      const source = allCollisionVerb("ser", "sourceCorrect");
      const other1 = allCollisionVerb("estar", "form1");
      const other2 = allCollisionVerb("ter", "form2");
      const other3 = allCollisionVerb("ir", "form3");
      const allVerbsPool = [source, other1, other2, other3];

      const distractors = pickDistractors(
        source,
        "present_indicative",
        "eu",
        allVerbsPool,
        mockRandom([0.5]),
      );
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
    });

    it("shuffle: buildQuestion places correctAnswer at different indices under different mock RNG sequences, deterministically per sequence", () => {
      const triple: Triple = { verb: "falar", tense: "present_indicative", subject: "eu" };

      const rngA = mockRandom([0.1, 0.2, 0.3, 0.4, 0.9]);
      const questionA1 = buildQuestion(triple, simpleVerbs, mockRandom([0.1, 0.2, 0.3, 0.4, 0.9]));
      const questionA2 = buildQuestion(triple, simpleVerbs, mockRandom([0.1, 0.2, 0.3, 0.4, 0.9]));
      expect(questionA1.choices.indexOf(questionA1.correctAnswer)).toBe(
        questionA2.choices.indexOf(questionA2.correctAnswer),
      );
      expect(questionA1.choices).toEqual(questionA2.choices);

      const questionB = buildQuestion(triple, simpleVerbs, mockRandom([0.9, 0.8, 0.7, 0.6, 0.05]));
      const posA = questionA1.choices.indexOf(questionA1.correctAnswer);
      const posB = questionB.choices.indexOf(questionB.correctAnswer);
      expect(posA === posB && questionA1.choices.join(",") === questionB.choices.join(",")).toBe(
        false,
      );
      void rngA;
    });
  });
});
