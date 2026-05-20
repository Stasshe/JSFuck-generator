import { describe, it, expect } from "vitest";
import { computeActualDifficulty } from "../src/evaluator.js";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import type { GeneratedPart } from "../src/types.js";

function makeParts(ids: string[]): GeneratedPart[] {
  const patternMap = new Map(ALL_PATTERNS.map((p) => [p.id, p]));
  return ids.map((id) => {
    const p = patternMap.get(id);
    if (!p) throw new Error(`Pattern not found: ${id}`);
    return { segment: p.output, pattern: p };
  });
}

describe("computeActualDifficulty", () => {
  it("returns value in 1~5 range", () => {
    const parts = makeParts(["char_f", "char_a", "char_l"]);
    const d = computeActualDifficulty(parts, ALL_PATTERNS);
    expect(d).toBeGreaterThanOrEqual(1.0);
    expect(d).toBeLessThanOrEqual(5.0);
  });

  it("returns 1.0 for empty parts", () => {
    const d = computeActualDifficulty([], ALL_PATTERNS);
    expect(d).toBe(1.0);
  });

  it("tier2 parts give higher difficulty than tier1 parts", () => {
    const tier1Parts = makeParts(["char_f", "char_a", "char_l", "char_s", "char_e"]);
    const tier2Parts = makeParts(["t2_g", "t2_h", "t2_k"]);
    const d1 = computeActualDifficulty(tier1Parts, ALL_PATTERNS);
    const d2 = computeActualDifficulty(tier2Parts, ALL_PATTERNS);
    expect(d2).toBeGreaterThan(d1);
  });
});
