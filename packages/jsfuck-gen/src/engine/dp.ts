import type { GeneratedPart, GeneratorConfig, Pattern } from "../types.js";
import { boundedVarietyPool, candidatePatterns } from "./selector.js";

const MAX_SEG = 8;

type Choice = {
  j: number;
  pattern: Pattern;
};

export function segmentDP(
  input: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): GeneratedPart[] | null {
  const rng = config.rng ?? Math.random;
  const n = input.length;
  const dp: number[] = new Array(n + 1).fill(Infinity);
  const choice: (Choice | null)[] = new Array(n + 1).fill(null);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - MAX_SEG); j < i; j++) {
      const segment = input.slice(j, i);
      const candidates = candidatePatterns(segment, patterns, config);
      if (candidates.length === 0) continue;

      const previousCost = dp[j];
      const currentCost = dp[i];
      if (previousCost === undefined || currentCost === undefined) continue;

      const pool = boundedVarietyPool(candidates);
      for (const selected of pool) {
        const cost = previousCost + scorePattern(selected, rng);
        if (cost < dp[i]!) {
          dp[i] = cost;
          choice[i] = { j, pattern: selected };
        }
      }
    }
  }

  if (dp[n] === Infinity) return null;

  // Reconstruct path
  const parts: GeneratedPart[] = [];
  let pos = n;
  while (pos > 0) {
    const c = choice[pos];
    if (c == null) return null;
    parts.push({ segment: input.slice(c.j, pos), pattern: c.pattern });
    pos = c.j;
  }
  parts.reverse();
  return parts;
}

function scorePattern(pattern: Pattern, rng: () => number): number {
  // Keep output compact, but add enough jitter that similarly priced patterns
  // do not collapse to the same expression every time.
  return pattern.expression.length + rng() * 12;
}
