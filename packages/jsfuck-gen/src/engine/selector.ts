import { patternDifficulty } from "../difficulty.js";
import type { GeneratorConfig, Pattern } from "../types.js";

export function selectPattern(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern | null {
  const rng = config.rng ?? Math.random;

  const candidates = patterns.filter(
    (p) =>
      p.output === segment &&
      patternDifficulty(p) <= config.difficulty &&
      (config.allowLiteral || p.kind !== "literal"),
  );

  if (candidates.length === 0) return null;

  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx] ?? candidates[0]!;
}
