import type { Pattern, GeneratedPart, GeneratorConfig } from "../types.js";
import { selectPattern, effectiveCost } from "./selector.js";

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
  const n = input.length;
  const dp: number[] = new Array(n + 1).fill(Infinity);
  const choice: (Choice | null)[] = new Array(n + 1).fill(null);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - MAX_SEG); j < i; j++) {
      const segment = input.slice(j, i);
      const selected = selectPattern(segment, patterns, config);
      if (selected === null) continue;

      const cost = dp[j] + effectiveCost(selected, config.strategy);
      if (cost < dp[i]) {
        dp[i] = cost;
        choice[i] = { j, pattern: selected };
      }
    }
  }

  if (dp[n] === Infinity) return null;

  // Reconstruct path
  const parts: GeneratedPart[] = [];
  let pos = n;
  while (pos > 0) {
    const c = choice[pos];
    if (c === null) return null;
    parts.push({ segment: input.slice(c.j, pos), pattern: c.pattern });
    pos = c.j;
  }
  parts.reverse();
  return parts;
}
