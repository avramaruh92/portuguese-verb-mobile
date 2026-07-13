import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";

export type VerbSource = "remote" | "local";

let cachedResult: Promise<{ verbs: Verb[]; source: VerbSource }> | null = null;

async function resolve(): Promise<{ verbs: Verb[]; source: VerbSource }> {
  try {
    const remote = await fetchRemoteVerbs();
    return { verbs: remote, source: "remote" };
  } catch {
    return { verbs: localVerbs, source: "local" };
  }
}

export function prefetch(): void {
  if (!cachedResult) {
    cachedResult = resolve();
  }
}

export function resolveVerbs(): Promise<{ verbs: Verb[]; source: VerbSource }> {
  if (!cachedResult) {
    cachedResult = resolve();
  }
  return cachedResult;
}
