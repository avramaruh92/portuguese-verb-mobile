import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS, TENSES } from "../dataset/types";
import { verbs as localVerbs } from "../dataset/verbs";
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";

const QUESTIONS_PER_SESSION = 10;
const DISTRACTOR_COUNT = 3;

// Preterite/imperfect are the classic beginner confusion pair (D-01) — when the
// question tense is one of these, its pair is the top-priority tier-2 candidate.
// present_indicative/future intentionally have no entry (no special ordering, D-02).
const TENSE_PAIRS: Partial<Record<Tense, Tense>> = {
  preterite: "imperfect",
  imperfect: "preterite",
};

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

  // Tier 2: same-verb, same-subject, other-tense forms — the preterite/imperfect
  // pair is prioritized when the question tense is one of that pair (D-01/D-02).
  if (chosen.length < DISTRACTOR_COUNT) {
    const exclude = new Set([correctAnswer, ...chosen]);
    const otherTenses = TENSES.filter((t) => t !== tense);
    const pairedTense = TENSE_PAIRS[tense];
    const orderedTenses = pairedTense
      ? [pairedTense, ...shuffle(otherTenses.filter((t) => t !== pairedTense), random)]
      : shuffle(otherTenses, random);
    const sameVerbWrongTenseForms = [
      ...new Set(orderedTenses.map((t) => verb.conjugations[t][subject])),
    ];
    for (const form of sameVerbWrongTenseForms) {
      if (chosen.length >= DISTRACTOR_COUNT) break;
      if (exclude.has(form)) continue;
      chosen.push(form);
      exclude.add(form);
    }
  }

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
