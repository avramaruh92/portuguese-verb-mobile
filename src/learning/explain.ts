import type { Subject, Tense, Verb } from "../dataset/types";
import { subjectLabels, tenseLabels } from "../quiz/labels";
import type { FormMatch, LearningContent, MismatchCategory } from "./types";

function classify(
  matches: FormMatch[],
  correct: { tense: Tense; subject: Subject },
): { category: MismatchCategory; agreed: boolean } {
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
  return { category: allAgree ? first : "generic", agreed: allAgree };
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

  const { category, agreed } = classify(matches, correctAnswer);
  const template =
    category === "generic"
      ? learning.templates.generic
      : learning.templates[category];

  const context: Record<string, string> = {
    verb: verb.verb,
    correctAnswer:
      verb.conjugations[correctAnswer.tense][correctAnswer.subject],
    selectedAnswer,
    tenseLabel: tenseLabels[correctAnswer.tense],
    subjectLabel: subjectLabels[correctAnswer.subject],
  };

  if (agreed) {
    // noUncheckedIndexedAccess-safe: matches.length >= 1 is guaranteed by the
    // early return above, matching the categories[0]! convention in classify().
    const selectedMatch = matches[0]!;
    context.selectedTenseLabel = tenseLabels[selectedMatch.tense];
    context.selectedSubjectLabel = subjectLabels[selectedMatch.subject];
  }

  const interpolated = interpolate(template, context);

  const extraLines = [
    entry.tenseNotes?.[correctAnswer.tense],
    entry.subjectHints?.[correctAnswer.subject],
  ].filter((line): line is string => Boolean(line));

  return [interpolated, ...extraLines].join("\n");
}
