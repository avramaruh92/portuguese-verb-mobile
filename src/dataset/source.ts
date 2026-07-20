import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";
import type { LearningContent } from "../learning/types";

export type VerbSource = "remote" | "local";

let cachedResult: Promise<{
  verbs: Verb[];
  source: VerbSource;
  learning: LearningContent | undefined;
}> | null = null;

async function resolve(): Promise<{
  verbs: Verb[];
  source: VerbSource;
  learning: LearningContent | undefined;
}> {
  try {
    const { verbs, learning } = await fetchRemoteVerbs();
    return { verbs, source: "remote" as const, learning };
  } catch {
    return { verbs: localVerbs, source: "local" as const, learning: undefined };
  }
}

export function prefetch(): void {
  if (!cachedResult) {
    cachedResult = resolve();
  }
}

export function resolveVerbs(): Promise<{
  verbs: Verb[];
  source: VerbSource;
  learning: LearningContent | undefined;
}> {
  if (!cachedResult) {
    cachedResult = resolve();
  }
  return cachedResult;
}
