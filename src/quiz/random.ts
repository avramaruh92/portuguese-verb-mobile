export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    // noUncheckedIndexedAccess-safe: i and j are always valid indices by the loop invariant
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
