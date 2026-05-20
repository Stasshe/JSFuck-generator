import { describe, expect, it } from "vitest";
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

  it("returns approximately 1.0 for empty parts", () => {
    const d = computeActualDifficulty([], ALL_PATTERNS);
    expect(d).toBeCloseTo(1.0, 5);
  });

  it("higher pattern difficulty produces higher actualDifficulty (all else equal)", () => {
    // Use patterns with no trapFor to isolate avgPatternDifficulty effect
    // char_d (tier1, diff=1.0) vs t2_bootstrap_g (tier2-like, diff=1.8)
    // Both have no trapFor entries targeting them
    const lowerParts = makeParts(["char_d"]); // diff 1.0, no trap hits
    const higherParts = makeParts(["t2_bootstrap_g"]); // diff 1.8, no trap hits
    const d1 = computeActualDifficulty(lowerParts, ALL_PATTERNS);
    const d2 = computeActualDifficulty(higherParts, ALL_PATTERNS);
    // avgPatternDifficulty contribution: 0.4*(1.8-1.0)=0.32 higher for tier2
    // structural depth also higher for t2_bootstrap_g
    expect(d2).toBeGreaterThan(d1);
  });
});
