import type { Subject, Tense, Verb } from "../dataset/types";
import { subjectLabels, tenseLabels } from "../quiz/labels";
import type { FormMatch, LearningContent, MismatchCategory } from "./types";

function classify(
  matches: FormMatch[],
  correct: { tense: Tense; subject: Subject },
): MismatchCategory {
  const categories = matches.map((match): MismatchCategory => {
    const sameTense = match.tense === correct.tense;
    const sameSubject = match.subject === correct.subject;
    if (sameTense && sameSubject) return "generic";
    if (sameSubject) return "wrongTense";
    if (sameTense) return "wrongSubject";
    return "wrongTenseAndSubject";
  });

  // noUncheckedIndexedAccess-safe: categories is derived 1:1 from matches, and
  // callers only invoke classify() after confirming matches.length >= 1.
  const first = categories[0]!;
  const allAgree = categories.every((category) => category === first);
  return allAgree ? first : "generic";
}

function interpolate(
  template: string,
  context: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (original, key: string) =>
    Object.prototype.hasOwnProperty.call(context, key)
      ? context[key]!
      : original,
  );
}

export function selectExplanation(
  verb: Verb,
  selectedAnswer: string,
  correctAnswer: { tense: Tense; subject: Subject },
  learning: LearningContent | undefined,
): string | undefined {
  if (!learning || !verb.formIndex) return undefined;

  const entry = learning.verbs[verb.verb];
  if (!entry) return undefined;

  const matches = verb.formIndex[selectedAnswer];
  if (!matches || matches.length === 0) return undefined;

  const category = classify(matches, correctAnswer);
  const template =
    category === "generic"
      ? learning.templates.generic
      : learning.templates[category];

  const context = {
    verb: verb.verb,
    correctAnswer:
      verb.conjugations[correctAnswer.tense][correctAnswer.subject],
    selectedAnswer,
    tenseLabel: tenseLabels[correctAnswer.tense],
    subjectLabel: subjectLabels[correctAnswer.subject],
  };

  return interpolate(template, context);
}
