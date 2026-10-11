import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";
import type { LearningContent } from "../learning/types";

export type VerbSource = "remote" | "local";

export interface ResolvedVerbs {
  verbs: Verb[];
  source: VerbSource;
  learning: LearningContent | undefined;
}

let cachedResult: Promise<ResolvedVerbs> | null = null;
// Source of the settled cachedResult (null while the first resolution is
// still pending). Lets resolveVerbs() decide synchronously whether a
// background remote retry is warranted.
let settledSource: VerbSource | null = null;
let refreshInFlight: Promise<void> | null = null;

async function resolve(): Promise<ResolvedVerbs> {
  try {
    const { verbs, learning } = await fetchRemoteVerbs();
    return { verbs, source: "remote" as const, learning };
  } catch {
    return { verbs: localVerbs, source: "local" as const, learning: undefined };
  }
}

function startInitialResolve(): Promise<ResolvedVerbs> {
  const pending = resolve().then((result) => {
    settledSource = result.source;
    return result;
  });
  cachedResult = pending;
  return pending;
}

// Stale-while-revalidate for the local fallback (Phase 36 WR-01): with a 15s
// content timeout, a cold-booting backend at launch would otherwise pin the
// bundled dataset for the whole process lifetime. When the cached result is
// "local", callers still get it immediately (no added blocking), but a single
// background retry is started; if it succeeds, the NEXT resolveVerbs() call
// gets remote content. A remote result is never re-fetched. In-progress
// sessions are unaffected because useQuizStore snapshots verbs/source at
// startQuiz (FETCH-04).
function refreshInBackground(): void {
  if (refreshInFlight) return;
  refreshInFlight = (async () => {
    try {
      const { verbs, learning } = await fetchRemoteVerbs();
      cachedResult = Promise.resolve({ verbs, source: "remote" as const, learning });
      settledSource = "remote";
    } catch {
      // Stay on the local fallback; a later resolveVerbs() call retries.
    } finally {
      refreshInFlight = null;
    }
  })();
}

export function prefetch(): void {
  if (!cachedResult) {
    startInitialResolve();
  }
}

export function resolveVerbs(): Promise<ResolvedVerbs> {
  if (!cachedResult) {
    return startInitialResolve();
  }
  if (settledSource === "local") {
    refreshInBackground();
  }
  return cachedResult;
}
