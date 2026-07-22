import { selectExplanation } from "../src/learning/explain";
import type { Verb } from "../src/dataset/types";
import type { LearningContent } from "../src/learning/types";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";

function buildVerb(): Verb {
  return {
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
    formIndex: {
      // "falas" = present_indicative/tu -- used as a wrongSubject case (same tense, different subject)
      falas: [{ tense: "present_indicative", subject: "tu" }],
      // "falei" = preterite/eu -- used as a wrongTense case (same subject, different tense)
      falei: [{ tense: "preterite", subject: "eu" }],
      // "falaram" = preterite/eles_elas -- used as a wrongTenseAndSubject case (different both)
      falaram: [{ tense: "preterite", subject: "eles_elas" }],
      // tied matches that AGREE on category (both wrongSubject: same tense as correct, different subject)
      "tied-agree": [
        { tense: "present_indicative", subject: "tu" },
        { tense: "present_indicative", subject: "nos" },
      ],
      // tied matches that DISAGREE on category (one wrongSubject, one wrongTense)
      "tied-disagree": [
        { tense: "present_indicative", subject: "tu" },
        { tense: "preterite", subject: "eu" },
      ],
      "no-matches": [],
    },
  };
}

function buildLearningContent(): LearningContent {
  return {
    version: 1,
    templates: {
      wrongTense:
        "In {tenseLabel}, the correct form of {verb} is '{correctAnswer}', not '{selectedAnswer}'.",
      wrongSubject:
        "For {subjectLabel} of {verb}, use '{correctAnswer}', not '{selectedAnswer}'.",
      wrongTenseAndSubject:
        "For {subjectLabel} in {tenseLabel}, {verb} is '{correctAnswer}', not '{selectedAnswer}'.",
      correctAnswerReveal: "The correct answer is '{correctAnswer}'.",
      generic: "For {verb}, the correct answer is '{correctAnswer}'.",
    },
    verbs: {
      falar: {
        irregularTenses: [],
      },
    },
  };
}

const correctSlot = {
  tense: "present_indicative" as const,
  subject: "eu" as const,
};

describe("selectExplanation", () => {
  it("returns the wrongSubject template for a single match with same tense, different subject", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.`,
    );
  });

  it("returns the wrongTense template for a single match with same subject, different tense", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "falei", correctSlot, learning);
    expect(result).toBe(
      `In ${tenseLabels.present_indicative}, the correct form of falar is 'falo', not 'falei'.`,
    );
  });

  it("returns the wrongTenseAndSubject template for a single match differing in both tense and subject", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "falaram", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} in ${tenseLabels.present_indicative}, falar is 'falo', not 'falaram'.`,
    );
  });

  it("returns the shared category template when tied matches agree on category", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "tied-agree", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'tied-agree'.`,
    );
  });

  it("falls back to the generic template when tied matches disagree on category", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(
      verb,
      "tied-disagree",
      correctSlot,
      learning,
    );
    expect(result).toBe("For falar, the correct answer is 'falo'.");
  });

  it("returns undefined when learning content is undefined", () => {
    const verb = buildVerb();
    const result = selectExplanation(verb, "falas", correctSlot, undefined);
    expect(result).toBeUndefined();
  });

  it("returns undefined when learning.verbs has no entry for this verb", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    delete (learning.verbs as Record<string, unknown>).falar;
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBeUndefined();
  });

  it("returns undefined when verb.formIndex is undefined (local-fallback verb)", () => {
    const verb = buildVerb();
    delete verb.formIndex;
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBeUndefined();
  });

  it("returns undefined when formIndex[selectedAnswer] has zero matches", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(
      verb,
      "no-matches",
      correctSlot,
      learning,
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined without throwing when selectedAnswer is not present in formIndex at all", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    expect(() =>
      selectExplanation(verb, "not-a-real-form", correctSlot, learning),
    ).not.toThrow();
    expect(
      selectExplanation(verb, "not-a-real-form", correctSlot, learning),
    ).toBeUndefined();
  });

  it("never mutates its inputs (pure function)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const verbSnapshot = JSON.stringify(verb);
    const learningSnapshot = JSON.stringify(learning);

    selectExplanation(verb, "falas", correctSlot, learning);
    selectExplanation(verb, "falei", correctSlot, learning);
    selectExplanation(verb, "tied-disagree", correctSlot, learning);
    selectExplanation(verb, "no-matches", correctSlot, learning);

    expect(JSON.stringify(verb)).toBe(verbSnapshot);
    expect(JSON.stringify(learning)).toBe(learningSnapshot);
  });

  // --- EXPL-05 / EXPL-06: selected-answer label interpolation (v0.4 template) ---

  it("interpolates the selected label alongside correct labels for the full v0.4 template (EXPL-05)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.templates.wrongSubject =
      "For {subjectLabel} of {verb}, use '{correctAnswer}', not '{selectedAnswer}' ({selectedSubjectLabel}).";
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas' (${subjectLabels.tu}).`,
    );
  });

  it("resolves selectedSubjectLabel for a single wrongSubject match (EXPL-06)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.templates.wrongSubject =
      "For {subjectLabel} of {verb}, use '{correctAnswer}', not '{selectedAnswer}' ({selectedSubjectLabel}).";
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas' (${subjectLabels.tu}).`,
    );
  });

  it("resolves selectedTenseLabel for a single wrongTense match (EXPL-06)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.templates.wrongTense =
      "In {tenseLabel}, the correct form of {verb} is '{correctAnswer}', not '{selectedAnswer}' ({selectedTenseLabel}).";
    const result = selectExplanation(verb, "falei", correctSlot, learning);
    expect(result).toBe(
      `In ${tenseLabels.present_indicative}, the correct form of falar is 'falo', not 'falei' (${tenseLabels.preterite}).`,
    );
  });

  it("resolves selected labels from matches[0] when tied matches agree on category (EXPL-06)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.templates.wrongSubject =
      "For {subjectLabel} of {verb}, use '{correctAnswer}', not '{selectedAnswer}' ({selectedSubjectLabel}).";
    const result = selectExplanation(verb, "tied-agree", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'tied-agree' (${subjectLabels.tu}).`,
    );
  });

  it("omits selected labels (D-02) when tied matches disagree on category (EXPL-06)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(
      verb,
      "tied-disagree",
      correctSlot,
      learning,
    );
    expect(result).toBe("For falar, the correct answer is 'falo'.");
  });

  // --- EXPL-07: tenseNotes/subjectHints appending ---

  it("appends tenseNotes and subjectHints as separate lines in order interpolated -> notes -> hints (EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      tenseNotes: { present_indicative: "Present tense note." },
      subjectHints: { eu: "Subject hint for eu." },
    };
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.\nPresent tense note.\nSubject hint for eu.`,
    );
  });

  it("appends exactly one line when only tenseNotes is present, no subjectHints (EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      tenseNotes: { present_indicative: "Present tense note." },
    };
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.\nPresent tense note.`,
    );
  });

  it("appends exactly one line when only subjectHints is present, no tenseNotes (EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      subjectHints: { eu: "Subject hint for eu." },
    };
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.\nSubject hint for eu.`,
    );
  });

  it("appends no extra lines when neither tenseNotes nor subjectHints is present (EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    const result = selectExplanation(verb, "falas", correctSlot, learning);
    expect(result).toBe(
      `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.`,
    );
  });

  it("appends notes/hints unconditionally for the generic/tied-disagree category too (D-04, EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      tenseNotes: { present_indicative: "Present tense note." },
      subjectHints: { eu: "Subject hint for eu." },
    };
    const result = selectExplanation(
      verb,
      "tied-disagree",
      correctSlot,
      learning,
    );
    expect(result).toBe(
      "For falar, the correct answer is 'falo'.\nPresent tense note.\nSubject hint for eu.",
    );
  });

  // --- EXPL-08: fail-closed contract preserved after the extension ---

  it("returns undefined (never a fabricated string) even when notes/hints would be present, if the match is missing (EXPL-08)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      tenseNotes: { present_indicative: "Present tense note." },
      subjectHints: { eu: "Subject hint for eu." },
    };
    const result = selectExplanation(
      verb,
      "no-matches",
      correctSlot,
      learning,
    );
    expect(result).toBeUndefined();
  });

  it("does not mutate learning or verb when notes/hints are appended (purity, EXPL-07)", () => {
    const verb = buildVerb();
    const learning = buildLearningContent();
    learning.verbs.falar = {
      irregularTenses: [],
      tenseNotes: { present_indicative: "Present tense note." },
      subjectHints: { eu: "Subject hint for eu." },
    };
    const verbSnapshot = JSON.stringify(verb);
    const learningSnapshot = JSON.stringify(learning);

    selectExplanation(verb, "falas", correctSlot, learning);

    expect(JSON.stringify(verb)).toBe(verbSnapshot);
    expect(JSON.stringify(learning)).toBe(learningSnapshot);
  });
});
