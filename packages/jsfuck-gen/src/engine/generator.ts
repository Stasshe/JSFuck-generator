import { computeActualDifficulty } from "../evaluator.js";
import { ALL_PATTERNS } from "../patterns/index.js";
import {
  DIFFICULTY_ATTEMPTS,
  difficultyError,
  isDifficultyWithinTolerance,
} from "../difficulty.js";
import type { GeneratedPart, GenerateResult, GeneratorConfig } from "../types.js";
import { segmentDP } from "./dp.js";

export function generate(input: string, config: GeneratorConfig): GenerateResult {
  if (input.length === 0) {
    return {
      ok: true,
      output: "",
      expression: "[]+ []",
      parts: [],
      actualDifficulty: 1.0,
    };
  }

  let best: GenerateResult | null = null;
  let bestError = Infinity;

  for (let attempt = 0; attempt < DIFFICULTY_ATTEMPTS; attempt++) {
    const parts = segmentDP(input, ALL_PATTERNS, config);
    if (parts === null) continue;

    const expression = partsToExpression(parts);
    const actualDifficulty = computeActualDifficulty(parts, ALL_PATTERNS);
    const result: GenerateResult = {
      ok: true,
      output: input,
      expression,
      parts,
      actualDifficulty,
    };
    const error = difficultyError(actualDifficulty, config.difficulty);

    if (isDifficultyWithinTolerance(actualDifficulty, config.difficulty)) return result;
    if (error < bestError) {
      best = result;
      bestError = error;
    }
  }

  if (best !== null) return best;

  // Find which chars have no candidates at all for the current literal policy.
  const unsupported: string[] = [];
  for (const ch of input) {
    const hasCandidates = ALL_PATTERNS.some(
      (p) => p.output === ch && (config.allowLiteral || p.kind !== "literal"),
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

function partsToExpression(parts: GeneratedPart[]): string {
  // Wrap each part in parens to prevent ++ misparse when expressions start with +
  return parts.map((p) => `(${p.pattern.expression})`).join("+");
}
