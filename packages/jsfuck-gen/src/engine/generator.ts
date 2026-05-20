import { computeActualDifficulty } from "../evaluator.js";
import { ALL_PATTERNS } from "../patterns/index.js";
import { patternTier } from "../difficulty.js";
import type { GeneratedPart, GenerateResult, GeneratorConfig } from "../types.js";
import { segmentDP } from "./dp.js";

export function generate(input: string, config: GeneratorConfig): GenerateResult {
  if (input.length === 0) {
    return {
      ok: true,
      output: "",
      expression: "[]+[]",
      parts: [],
      actualDifficulty: 1.0,
    };
  }

  const parts = segmentDP(input, ALL_PATTERNS, config);

  if (parts === null) {
    const unsupported: string[] = [];
    for (const ch of input) {
      const hasCandidates = ALL_PATTERNS.some((p) => {
        if (p.kind !== "jsfuck") return false;
        if (p.output !== ch) return false;
        if (config.strict && !p.pure) return false;
        return patternTier(p) <= config.difficulty;
      });
      if (!hasCandidates) unsupported.push(ch);
    }

    if (unsupported.length > 0) {
      return {
        ok: false,
        reason: "unsupported_chars",
        unsupportedChars: [...new Set(unsupported)],
      };
    }

    return { ok: false, reason: "generation_failed" };
  }

  const expression = partsToExpression(parts);
  const actualDifficulty = computeActualDifficulty(parts, ALL_PATTERNS);

  return {
    ok: true,
    output: input,
    expression,
    parts,
    actualDifficulty,
  };
}

function partsToExpression(parts: GeneratedPart[]): string {
  return parts.map((p) => `(${p.resolvedExpression})`).join("+");
}
