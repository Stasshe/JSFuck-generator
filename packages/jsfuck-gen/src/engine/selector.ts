import { difficultyError, patternDifficulty } from "../difficulty.js";
import type { GeneratorConfig, Pattern } from "../types.js";
import { expandEquivalentPatterns } from "./equivalence.js";

export function candidatePatterns(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern[] {
  const baseCandidates = patterns.filter(
    (p) =>
      p.output === segment &&
      (config.allowLiteral || p.kind !== "literal"),
  );

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

  const pool = boundedVarietyPool(candidates, config.difficulty);
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] ?? pool[0]!;
}

export function boundedVarietyPool(candidates: Pattern[], targetDifficulty?: number): Pattern[] {
  const minLength = Math.min(...candidates.map((p) => p.expression.length));
  const maxLength = Math.max(minLength + 24, Math.ceil(minLength * 1.8));
  const compact = candidates.filter((p) => p.expression.length <= maxLength);

  if (targetDifficulty === undefined) return compact;

  const minError = Math.min(
    ...candidates.map((p) => difficultyError(patternDifficulty(p), targetDifficulty)),
  );
  const closestDifficulty = candidates.filter(
    (p) => difficultyError(patternDifficulty(p), targetDifficulty) === minError,
  );

  return uniquePatterns([...compact, ...closestDifficulty]);
}

function uniquePatterns(patterns: Pattern[]): Pattern[] {
  const seen = new Set<string>();
  const result: Pattern[] = [];

  for (const pattern of patterns) {
    const key = `${pattern.id}\0${pattern.expression}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(pattern);
  }

  return result;
}
