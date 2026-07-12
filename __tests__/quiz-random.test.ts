import { shuffle } from "../src/quiz/random";

function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}

describe("shuffle", () => {
  it("returns an exact, deterministic permutation for a fixed RNG sequence", () => {
    const result = shuffle([1, 2, 3, 4, 5], mockRandom([0.9, 0.1, 0.5, 0.0]));
    expect(result).toEqual([3, 4, 2, 1, 5]);
  });

  it("returns a new array and leaves the input array unmutated", () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    const result = shuffle(input, mockRandom([0.9, 0.1, 0.5, 0.0]));
    expect(result).not.toBe(input);
    expect(input).toEqual(original);
  });

  it("produces a permutation with the same length and multiset of elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, mockRandom([0.2, 0.8, 0.4, 0.6]));
    expect(result.length).toBe(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("handles zero and one element edge cases", () => {
    expect(shuffle([], mockRandom([0.5]))).toEqual([]);
    expect(shuffle(["x"], mockRandom([0.5]))).toEqual(["x"]);
  });
});
