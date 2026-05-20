import { describe, expect, it } from "vitest";
import { computeActualDifficulty } from "../src/evaluator.js";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import type { Derivation, GeneratedPart } from "../src/types.js";

function makeDerivation(p: { id: string; expression: string; description?: string }): Derivation {
  return { patternId: p.id, expression: p.expression, description: p.description, deps: {} };
}

function makeParts(ids: string[]): GeneratedPart[] {
  const patternMap = new Map(ALL_PATTERNS.map((p) => [p.id, p]));
  return ids.map((id) => {
    const p = patternMap.get(id);
    if (!p) throw new Error(`Pattern not found: ${id}`);
    return {
      segment: p.output,
      pattern: p,
      resolvedExpression: p.expression,
      derivation: makeDerivation(p),
    };
  });
}

describe("computeActualDifficulty", () => {
  it("computes per-character average difficulty", () => {
    const parts = makeParts(["char_f", "char_a", "char_l"]);
    const d = computeActualDifficulty(parts, ALL_PATTERNS);
    expect(d).toBe(1);
  });

  it("returns approximately 1.0 for empty parts", () => {
    const d = computeActualDifficulty([], ALL_PATTERNS);
    expect(d).toBeCloseTo(1.0, 5);
  });

  it("higher tier produces higher actualDifficulty for same length", () => {
    const lowerParts = makeParts(["char_d"]);   // tier1
    const higherParts = makeParts(["char_g"]);  // tier3
    const d1 = computeActualDifficulty(lowerParts, ALL_PATTERNS);
    const d2 = computeActualDifficulty(higherParts, ALL_PATTERNS);
    expect(d2).toBeGreaterThan(d1);
  });
});
