import { patternDifficulty } from "../difficulty.js";
import type { GeneratorConfig, Pattern } from "../types.js";

export function candidatePatterns(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern[] {
  return patterns.filter(
    (p) =>
      p.output === segment &&
      patternDifficulty(p) <= config.difficulty &&
      (config.allowLiteral || p.kind !== "literal"),
  );
}

export function selectPattern(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern | null {
  const rng = config.rng ?? Math.random;
  const candidates = candidatePatterns(segment, patterns, config);

  if (candidates.length === 0) return null;

  const pool = boundedVarietyPool(candidates);
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] ?? pool[0]!;
}

export function boundedVarietyPool(candidates: Pattern[]): Pattern[] {
  const minLength = Math.min(...candidates.map((p) => p.expression.length));
  const maxLength = Math.max(minLength + 24, Math.ceil(minLength * 1.8));
  return candidates.filter((p) => p.expression.length <= maxLength);
}
