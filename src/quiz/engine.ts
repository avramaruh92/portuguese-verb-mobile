import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS } from "../dataset/types";
import { verbs as localVerbs } from "../dataset/verbs";
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";

const QUESTIONS_PER_SESSION = 10;
const DISTRACTOR_COUNT = 3;

export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
  verbs: Verb[] = localVerbs,
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => {
    if (options.verbMode === "regular_only") return !v.isIrregular;
    if (options.verbMode === "irregular_only") return v.isIrregular;
    return true;
  });
  const pool: Triple[] = eligibleVerbs.flatMap((v) =>
    options.tenses.flatMap((tense) =>
      SUBJECTS.map((subject) => ({ verb: v.verb, tense, subject })),
    ),
  );
  const sampled = sampleTriples(pool, QUESTIONS_PER_SESSION, random);
  const questions = sampled.map((triple) => buildQuestion(triple, eligibleVerbs, random));
  return { questions };
}

export function sampleTriples(
  pool: readonly Triple[],
  count: number,
  random: () => number,
): Triple[] {
  if (pool.length < count) {
    throw new InsufficientVerbsError(pool.length, count);
  }
  return shuffle(pool, random).slice(0, count);
}

export function buildQuestion(
  triple: Triple,
  allVerbs: readonly Verb[],
  random: () => number,
): Question {
  const verb = allVerbs.find((v) => v.verb === triple.verb);
  if (!verb) {
    throw new Error(`Unknown verb "${triple.verb}" not found in provided verb list`);
  }
  const correctAnswer = verb.conjugations[triple.tense][triple.subject];
  const distractors = pickDistractors(verb, triple.tense, triple.subject, allVerbs, random);
  const choices = shuffle([correctAnswer, ...distractors], random);
  return { ...triple, choices, correctAnswer };
}

export function pickDistractors(
  verb: Verb,
  tense: Tense,
  subject: Subject,
  allVerbs: readonly Verb[],
  random: () => number,
): string[] {
  const correctAnswer = verb.conjugations[tense][subject];

  const otherSubjects = SUBJECTS.filter((s) => s !== subject);
  const sameVerbCandidates = [
    ...new Set(otherSubjects.map((s) => verb.conjugations[tense][s])),
  ].filter((form) => form !== correctAnswer);

  const shuffledSameVerb = shuffle(sameVerbCandidates, random);
  const chosen = shuffledSameVerb.slice(0, DISTRACTOR_COUNT);

  if (chosen.length < DISTRACTOR_COUNT) {
    const exclude = new Set([correctAnswer, ...chosen]);
    const otherVerbForms = allVerbs
      .filter((v) => v.verb !== verb.verb)
      .map((v) => v.conjugations[tense][subject]);
    const shuffledOtherForms = shuffle(otherVerbForms, random);
    for (const form of shuffledOtherForms) {
      if (chosen.length >= DISTRACTOR_COUNT) break;
      if (exclude.has(form)) continue;
      chosen.push(form);
      exclude.add(form);
    }
  }

  return chosen;
}
