import type { Derivation, GeneratedPart, GeneratorConfig, Pattern } from "../types.js";
import { boundedVarietyPool, buildMinLenByRole, candidatePatterns } from "./selector.js";
import { resolvePattern } from "./resolver.js";

const MAX_SEG = 9;

type Choice = {
  j: number;
  pattern: Pattern;
  estimatedCost: number;
};

export function segmentDP(
  input: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): GeneratedPart[] | null {
  const rng = config.rng ?? Math.random;
  const n = input.length;

  // Pass 1: 推定コストで最適セグメントを計算
  const minLenByRole = buildMinLenByRole(patterns, config);

  const prefixCost: number[] = new Array(n + 1).fill(Infinity);
  const suffixCost: number[] = new Array(n + 1).fill(Infinity);
  prefixCost[0] = 0;
  suffixCost[n] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - MAX_SEG); j < i; j++) {
      const segment = input.slice(j, i);
      const candidates = candidatePatterns(segment, patterns, config, minLenByRole);
      if (candidates.length === 0) continue;

      const prev = prefixCost[j];
      if (prev === undefined || prev === Infinity) continue;

      const pool = boundedVarietyPool(candidates, minLenByRole);
      for (const p of pool) {
        const cost = prev + estimatedLen(p, minLenByRole);
        if (cost < (prefixCost[i] ?? Infinity)) prefixCost[i] = cost;
      }
    }
  }

  if ((prefixCost[n] ?? Infinity) === Infinity) return null;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j <= Math.min(n, i + MAX_SEG); j++) {
      const segment = input.slice(i, j);
      const candidates = candidatePatterns(segment, patterns, config, minLenByRole);
      if (candidates.length === 0) continue;

      const next = suffixCost[j];
      if (next === undefined || next === Infinity) continue;

      const pool = boundedVarietyPool(candidates, minLenByRole);
      for (const p of pool) {
        const cost = estimatedLen(p, minLenByRole) + next;
        if (cost < (suffixCost[i] ?? Infinity)) suffixCost[i] = cost;
      }
    }
  }

  const minCost = prefixCost[n]!;
  const maxCost = minCost + varietyBudget(minCost, config.difficulty);

  // Pass 2: 実解決しながらセグメントを選択
  const parts: GeneratedPart[] = [];
  let pos = 0;
  let usedCost = 0;

  while (pos < n) {
    const choice = selectNextChoice(
      input, pos, patterns, config, minLenByRole, suffixCost, usedCost, maxCost, rng,
    );
    if (choice === null) return null;

    // 選択パターンを DAG 解決
    const derivation = resolvePattern(choice.pattern, patterns, config, rng);
    const resolvedExpression = derivation.expression;

    parts.push({
      segment: input.slice(pos, choice.j),
      pattern: choice.pattern,
      resolvedExpression,
      derivation,
    });

    usedCost += resolvedExpression.length;
    pos = choice.j;
  }

  return parts;
}

function estimatedLen(p: Pattern, minLenByRole: Map<string, number>): number {
  let len = p.expression.length;
  for (const match of p.expression.matchAll(/@\{([^}]+)\}/g)) {
    const role = match[1];
    if (role === undefined) continue;
    const placeholder = match[0].length;
    const actual = minLenByRole.get(role) ?? 0;
    len += actual - placeholder;
  }
  return Math.max(1, len);
}

function selectNextChoice(
  input: string,
  pos: number,
  patterns: Pattern[],
  config: GeneratorConfig,
  minLenByRole: Map<string, number>,
  suffixCost: number[],
  usedCost: number,
  maxCost: number,
  rng: () => number,
): Choice | null {
  const choices: Array<Choice & { weight: number }> = [];

  for (let j = pos + 1; j <= Math.min(input.length, pos + MAX_SEG); j++) {
    const segment = input.slice(pos, j);
    const candidates = candidatePatterns(segment, patterns, config, minLenByRole);
    if (candidates.length === 0) continue;

    const tailCost = suffixCost[j];
    if (tailCost === undefined || tailCost === Infinity) continue;

    for (const pattern of boundedVarietyPool(candidates, minLenByRole)) {
      const eCost = estimatedLen(pattern, minLenByRole);
      if (usedCost + eCost + tailCost > maxCost) continue;
      choices.push({
        j,
        pattern,
        estimatedCost: eCost,
        weight: choiceWeight(eCost, segment, config.difficulty),
      });
    }
  }

  if (choices.length === 0) return null;

  const total = choices.reduce((s, c) => s + c.weight, 0);
  let target = rng() * total;
  for (const choice of choices) {
    target -= choice.weight;
    if (target <= 0) return choice;
  }
  return choices[choices.length - 1] ?? null;
}

function choiceWeight(exprCost: number, segment: string, difficulty: number): number {
  const level = explorationLevel(difficulty);
  const compact = 1 / Math.max(1, exprCost);
  const exploratory = exprCost / Math.max(1, segment.length * segment.length);
  return compact * (1 - level) + exploratory * level;
}

function varietyBudget(minCost: number, difficulty: number): number {
  const base = Math.max(24, Math.ceil(minCost * 0.25));
  const extra = Math.ceil(minCost * 8 * explorationLevel(difficulty));
  return base + extra;
}

function explorationLevel(difficulty: number): number {
  return Math.min(1, Math.max(0, (difficulty - 5) / 15));
}
