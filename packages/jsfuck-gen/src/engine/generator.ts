import type {
  GeneratorConfig,
  GenerateResult,
  GeneratedPart,
} from "../types.js";
import { ALL_PATTERNS } from "../patterns/index.js";
import { segmentDP } from "./dp.js";
import { computeActualDifficulty } from "../evaluator.js";

export function generate(
  input: string,
  config: GeneratorConfig,
): GenerateResult {
  if (input.length === 0) {
    return {
      ok: true,
      output: "",
      expression: "[]+ []",
      parts: [],
      totalCost: 0,
      actualDifficulty: 1.0,
    };
  }

  const parts = segmentDP(input, ALL_PATTERNS, config);

  if (parts === null) {
    // Find which chars have no candidates
    const unsupported: string[] = [];
    for (const ch of input) {
      const hasCandidates = ALL_PATTERNS.some(
        (p) =>
          p.output === ch &&
          p.difficulty <= config.difficulty &&
          (config.allowLiteral || p.kind !== "literal"),
      );
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
  const totalCost = parts.reduce((sum, p) => sum + p.pattern.cost, 0);
  const actualDifficulty = computeActualDifficulty(parts, ALL_PATTERNS);

  return {
    ok: true,
    output: input,
    expression,
    parts,
    totalCost,
    actualDifficulty,
  };
}

function partsToExpression(parts: GeneratedPart[]): string {
  return parts.map((p) => p.pattern.expression).join("+");
}
