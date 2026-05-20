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
  const prefixCost: number[] = new Array(n + 1).fill(Infinity);
  const suffixCost: number[] = new Array(n + 1).fill(Infinity);
  prefixCost[0] = 0;
  suffixCost[n] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - MAX_SEG); j < i; j++) {
      const segment = input.slice(j, i);
      const candidates = candidatePatterns(segment, patterns, config);
      if (candidates.length === 0) continue;

      const previousCost = prefixCost[j];
      const currentCost = prefixCost[i];
      if (previousCost === undefined || currentCost === undefined) continue;

      const pool = boundedVarietyPool(candidates);
      for (const selected of pool) {
        const cost = previousCost + selected.expression.length;
        if (cost < prefixCost[i]!) prefixCost[i] = cost;
      }
    }
  }

  if (prefixCost[n] === Infinity) return null;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j <= Math.min(n, i + MAX_SEG); j++) {
      const segment = input.slice(i, j);
      const candidates = candidatePatterns(segment, patterns, config);
      if (candidates.length === 0) continue;

      const nextCost = suffixCost[j];
      if (nextCost === undefined) continue;

      const pool = boundedVarietyPool(candidates);
      for (const selected of pool) {
        const cost = selected.expression.length + nextCost;
        if (cost < suffixCost[i]!) suffixCost[i] = cost;
      }
    }
  }

  const maxCost = prefixCost[n]! + varietyBudget(prefixCost[n]!);
  const parts: GeneratedPart[] = [];
  let pos = 0;
  let usedCost = 0;

  while (pos < n) {
    const c = selectNextChoice(input, pos, patterns, config, suffixCost, usedCost, maxCost, rng);
    if (c == null) return null;
    parts.push({ segment: input.slice(pos, c.j), pattern: c.pattern });
    usedCost += c.pattern.expression.length;
    pos = c.j;
  }

  return parts;
}

function selectNextChoice(
  input: string,
  pos: number,
  patterns: Pattern[],
  config: GeneratorConfig,
  suffixCost: number[],
  usedCost: number,
  maxCost: number,
  rng: () => number,
): Choice | null {
  const choices: Array<Choice & { weight: number }> = [];

  for (let j = pos + 1; j <= Math.min(input.length, pos + MAX_SEG); j++) {
    const segment = input.slice(pos, j);
    const candidates = candidatePatterns(segment, patterns, config);
    if (candidates.length === 0) continue;

    const tailCost = suffixCost[j];
    if (tailCost === undefined || tailCost === Infinity) continue;

    for (const pattern of boundedVarietyPool(candidates)) {
      const expressionCost = pattern.expression.length;
      if (usedCost + expressionCost + tailCost > maxCost) continue;
      choices.push({
        j,
        pattern,
        weight: 1 / Math.max(1, expressionCost),
      });
    }
  }

  if (choices.length === 0) return null;

  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let target = rng() * totalWeight;
  for (const choice of choices) {
    target -= choice.weight;
    if (target <= 0) return choice;
  }

  return choices[choices.length - 1] ?? null;
}

function varietyBudget(minCost: number): number {
  return Math.max(24, Math.ceil(minCost * 0.25));
}
