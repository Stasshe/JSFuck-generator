import { patternTier } from "../difficulty.js";
import type { GeneratorConfig, Pattern } from "../types.js";
import { expandEquivalentPatterns } from "./equivalence.js";

export function candidatePatterns(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern[] {
  const baseCandidates = patterns.filter((p) => {
    if (p.output !== segment) return false;
    if (!config.allowLiteral && p.kind === "literal") return false;
    // config.difficulty is per-character target; compare against pattern tier
    return patternTier(p) <= config.difficulty;
  });

  return baseCandidates.flatMap((p) => [p, ...expandEquivalentPatterns(p)]);
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
