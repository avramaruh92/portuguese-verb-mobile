import { FormMatchSchema, LearningContentSchema } from "../src/learning/schema";

const validPayload = {
  version: 1,
  templates: {
    wrongTense: "You used {selectedTenseLabel} instead of {tenseLabel}.",
    wrongSubject: "That form matches a different subject.",
    wrongTenseAndSubject: "Both the tense and subject are off here.",
    correctAnswerReveal: "The correct answer is {correctAnswer}.",
    generic: "Not quite — check the tense and subject.",
  },
  verbs: {
    falar: {
      irregularTenses: [],
      tenseNotes: { preterite: "Regular -ar preterite pattern." },
      subjectHints: { eu: "First-person singular ending -o." },
    },
  },
};

describe("FormMatchSchema", () => {
  it("accepts a valid tense/subject pair", () => {
    expect(
      FormMatchSchema.safeParse({ tense: "preterite", subject: "eles_elas" })
        .success,
    ).toBe(true);
  });

  it("rejects an invalid tense literal", () => {
    expect(
      FormMatchSchema.safeParse({ tense: "not_a_tense", subject: "eu" })
        .success,
    ).toBe(false);
  });

  it("rejects a missing subject", () => {
    expect(
      FormMatchSchema.safeParse({ tense: "preterite" }).success,
    ).toBe(false);
  });
});

describe("LearningContentSchema", () => {
  it("accepts a well-shaped payload", () => {
    expect(LearningContentSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a payload missing templates.generic", () => {
    const broken = JSON.parse(JSON.stringify(validPayload));
    delete broken.templates.generic;
    expect(LearningContentSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects the wrong version literal", () => {
    const broken = { ...validPayload, version: 2 };
    expect(LearningContentSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a verbs entry with an invalid tense literal in irregularTenses", () => {
    const broken = JSON.parse(JSON.stringify(validPayload));
    broken.verbs.falar.irregularTenses = ["not_a_tense"];
    expect(LearningContentSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts an unknown/extra key in verbs", () => {
    const withExtra = {
      ...validPayload,
      verbs: {
        ...validPayload.verbs,
        someUnknownVerb: { irregularTenses: [] },
      },
    };
    expect(LearningContentSchema.safeParse(withExtra).success).toBe(true);
  });
});
